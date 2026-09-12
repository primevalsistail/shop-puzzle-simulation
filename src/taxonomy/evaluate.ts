/**
 * Cycle 4 / Phase 3 — 規則評価器
 *
 * 出典: aidlc-docs/inception/application-design/cycle4-phase2-axes.md §5
 *
 * ここが Phase 3 の「殴る」対象。条件言語で書いた規則が実際に評価できるかを見る。
 */

import type { ItemDef, ItemId } from './axes.js'
import { luxuryRank } from './axes.js'
import type { IslandName } from './islands.js'
import { getItem } from './items.js'
import { tier } from './derive.js'
import type {
  Condition, Effect, EffectKind, PairRule, Predicate, UnlockRule,
} from './rules.js'
import {
  combine, DEMAND_RULES, FOREIGN_ORIGIN_RULE, PAIR_RULES,
  SAME_ORIGIN_RULE, shopWideWeight, SIGNATURE_PAIRS, UNLOCK_RULES,
} from './rules.js'

// ─── 評価の文脈 ───────────────────────────────────────
export interface GameState {
  readonly 現在地: IslandName
  /** 品ごとの累計販売数（U2 の解禁条件） */
  readonly 累計販売数: ReadonlyMap<ItemId, number>
}

export interface EvalContext {
  readonly item: ItemDef
  readonly state: GameState
}

// ─── 条件の評価 ───────────────────────────────────────
function compare(op: string, a: number, b: number): boolean {
  switch (op) {
    case '==': return a === b
    case '!=': return a !== b
    case '>=': return a >= b
    case '<=': return a <= b
    case '>':  return a > b
    case '<':  return a < b
    default: throw new Error(`Unknown operator: ${op}`)
  }
}

function compareValue(op: string, a: string, b: string): boolean {
  if (op === '==') return a === b
  if (op === '!=') return a !== b
  throw new Error(`Operator ${op} is not allowed on an unordered axis`)
}

function evalPredicate(p: Predicate, ctx: EvalContext): boolean {
  if ('axis' in p) {
    switch (p.axis) {
      case '主種類':   return compareValue(p.op, ctx.item.mainKind, p.value)
      case '産地':     return compareValue(p.op, ctx.item.origin, p.value)
      case '向く土地': return compareValue(p.op, ctx.item.suitedLand, p.value)
      case '贅沢さ':   return compare(p.op, luxuryRank(ctx.item.luxury), luxuryRank(p.value))
      case 'tier':     return compare(p.op, tier(ctx.item.id), p.value)
    }
  }
  switch (p.metric) {
    case '累計販売数': return compare(p.op, ctx.state.累計販売数.get(ctx.item.id) ?? 0, p.value)
    case '現在地':     return compareValue(p.op, ctx.state.現在地, p.value)
  }
}

export function evalCondition(c: Condition, ctx: EvalContext): boolean {
  if ('kind' in c) {
    switch (c.kind) {
      case 'かつ':   return c.of.every(x => evalCondition(x, ctx))
      case 'または': return c.of.some(x => evalCondition(x, ctx))
      case 'でない': return !evalCondition(c.of, ctx)
    }
  }
  return evalPredicate(c, ctx)
}

// ─── 盤面（船倉） ─────────────────────────────────────
export interface Placement {
  readonly slotId: string
  readonly itemId: ItemId
  /** 左上基準点 */
  readonly x: number
  readonly y: number
}

function occupiedCells(p: Placement, lookup: (id: ItemId) => ItemDef): string[] {
  const shape = lookup(p.itemId).shape
  const cells: string[] = []
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1) cells.push(`${p.x + c},${p.y + r}`)
    }
  }
  return cells
}

/** 升目が辺で接している2つの区画を、すべて列挙する */
export function adjacentPairs(
  placements: readonly Placement[],
  lookup: (id: ItemId) => ItemDef = getItem,
): [Placement, Placement][] {
  const cellsOf = new Map(placements.map(p => [p.slotId, new Set(occupiedCells(p, lookup))]))
  const pairs: [Placement, Placement][] = []

  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = cellsOf.get(placements[i].slotId)!
      const b = cellsOf.get(placements[j].slotId)!
      let touching = false
      for (const cell of a) {
        const [cx, cy] = cell.split(',').map(Number)
        if (b.has(`${cx + 1},${cy}`) || b.has(`${cx - 1},${cy}`) ||
            b.has(`${cx},${cy + 1}`) || b.has(`${cx},${cy - 1}`)) {
          touching = true
          break
        }
      }
      if (touching) pairs.push([placements[i], placements[j]])
    }
  }
  return pairs
}

// ─── 効き目の集約 ─────────────────────────────────────
export interface Modifiers {
  readonly 売れやすさ: number
  readonly 値段: number
  readonly 集客: number
}

export interface EvaluationResult {
  /** 品（区画）ごとの倍率。`その品` の効き目を集めたもの */
  readonly perSlot: ReadonlyMap<string, Modifiers>
  /**
   * 店全体に効く倍率。すべての区画に等しくかかる。
   * **置いてある区画数で割った平均**なので、区画を増やしても濃くならない（→ rules.ts の注記）
   */
  readonly shopWide: Modifiers
  /** どの規則が効いたか（判定と説明のため） */
  readonly firedRules: readonly string[]
}

const NEUTRAL: Modifiers = { 売れやすさ: 1, 値段: 1, 集客: 1 }

class Accumulator {
  private readonly buckets = new Map<EffectKind, number[]>()
  add(kind: EffectKind, multiplier: number): void {
    const list = this.buckets.get(kind) ?? []
    list.push(multiplier)
    this.buckets.set(kind, list)
  }
  /**
   * 合成は**加算**（Q5）: `1 + Σ(mᵢ − 1) / divisor`。
   * 区画ごとは `divisor = 1`（合計）、**店全体は置いてある区画数で割る**（平均）。
   * → `rules.ts` の `shopWideWeight` の注記
   */
  resolve(divisor = 1): Modifiers {
    return {
      売れやすさ: combine(this.buckets.get('売れやすさ') ?? [], divisor),
      値段:       combine(this.buckets.get('値段') ?? [], divisor),
      集客:       combine(this.buckets.get('集客') ?? [], divisor),
    }
  }
}

function applyPairRule(
  rule: PairRule,
  a: Placement, b: Placement,
  state: GameState,
  lookup: (id: ItemId) => ItemDef,
): [Placement, Placement][] {
  const ctxA = { item: lookup(a.itemId), state }
  const ctxB = { item: lookup(b.itemId), state }
  const hits: [Placement, Placement][] = []
  // 甲乙は順不同で当てる（隣り合わせに向きはない）
  if (evalCondition(rule.甲, ctxA) && evalCondition(rule.乙, ctxB)) hits.push([a, b])
  if (evalCondition(rule.甲, ctxB) && evalCondition(rule.乙, ctxA)) hits.push([b, a])
  return hits
}

/**
 * 船倉の状態から、区画ごとの倍率と店全体の倍率を出す。
 *
 * ⚠ **規則は適用範囲を宣言しない。**発火した効き目は**その品の tier で按分**され、
 *   一部が店全体へ、残りがその区画へ行く（方針5・A案 → rules.ts `shopWideWeight`）。
 */
export function evaluate(
  placements: readonly Placement[],
  state: GameState,
  lookup: (id: ItemId) => ItemDef = getItem,
  /**
   * 辺で接している2区画の組。
   *
   * ⚠ 既定の `adjacentPairs` は品の**回転前**のかたちで隣接を出す。`Placement` は回転を持たないため。
   *   盤面が回転を持つ側（`FloorGrid`）は、実際の占有升目で出した組をここへ渡すこと（#30）。
   */
  pairs: readonly [Placement, Placement][] = adjacentPairs(placements, lookup),
): EvaluationResult {
  const perSlotAcc = new Map<string, Accumulator>()
  const shopAcc = new Accumulator()
  const fired: string[] = []

  const accFor = (slotId: string): Accumulator => {
    const found = perSlotAcc.get(slotId)
    if (found) return found
    const created = new Accumulator()
    perSlotAcc.set(slotId, created)
    return created
  }

  /**
   * 発火した効き目を **その品の tier で按分**して積む（方針5・A案）。
   *
   * `e = multiplier − 1` を `w = shopWideWeight(tier)` で割り、
   * `e × w` を店全体へ、`e × (1 − w)` をその区画へ。
   * **tier1 は 90% が店全体（薄く広く）／tier7 は 90% がその区画（濃く狭く）。**
   */
  const put = (effect: Effect, slotId: string, ruleId: string, itemId: ItemId): void => {
    const e = effect.multiplier - 1
    const w = shopWideWeight(tier(itemId))
    shopAcc.add(effect.kind, 1 + e * w)
    accFor(slotId).add(effect.kind, 1 + e * (1 - w))
    fired.push(ruleId)
  }

  // ── 単体にかかる規則（島の需要 D1 / よその島 D2） ──
  for (const p of placements) {
    const ctx = { item: lookup(p.itemId), state }
    accFor(p.slotId)
    for (const rule of DEMAND_RULES) {
      if (evalCondition(rule.condition, ctx)) put(rule.effect, p.slotId, rule.id, p.itemId)
    }
    // D2 は「産地 != 現在地」。軸どうしの比較なので条件言語では書けず、ここで持つ（→ rules.ts の申し送り）
    if (evalCondition(FOREIGN_ORIGIN_RULE.condition, ctx) && ctx.item.origin !== state.現在地) {
      put(FOREIGN_ORIGIN_RULE.effect, p.slotId, FOREIGN_ORIGIN_RULE.id, p.itemId)
    }
  }

  // ── 取り合わせ 層1（隣接） ──
  for (const [a, b] of pairs) {
    for (const rule of PAIR_RULES) {
      for (const [target] of applyPairRule(rule, a, b, state, lookup)) {
        put(rule.effect, target.slotId, rule.id, target.itemId)
      }
    }
    // R5「同じ島の産」。値の一致を見るので、条件（産地 != なし）に加えて評価器が突き合わせる
    const ia = lookup(a.itemId)
    const ib = lookup(b.itemId)
    const okA = evalCondition(SAME_ORIGIN_RULE.甲, { item: ia, state })
    const okB = evalCondition(SAME_ORIGIN_RULE.乙, { item: ib, state })
    if (okA && okB && ia.origin === ib.origin) {
      put(SAME_ORIGIN_RULE.effect, a.slotId, SAME_ORIGIN_RULE.id, a.itemId)
    }
  }

  // ── 取り合わせ 層2（名物コンビ）。既定は空。全部消しても上の結果は変わらない（INV-4） ──
  for (const [a, b] of pairs) {
    for (const rule of SIGNATURE_PAIRS) {
      const match =
        (a.itemId === rule.甲 && b.itemId === rule.乙) ||
        (b.itemId === rule.甲 && a.itemId === rule.乙)
      if (match) put(rule.effect, a.slotId, rule.id, a.itemId)
    }
  }

  const perSlot = new Map<string, Modifiers>()
  for (const p of placements) {
    perSlot.set(p.slotId, perSlotAcc.get(p.slotId)?.resolve() ?? NEUTRAL)
  }
  // 店全体ぶんは**置いてある区画数で割る**。区画が増えても濃くならない（→ rules.ts の注記）
  const shopWide = shopAcc.resolve(Math.max(placements.length, 1))
  return { perSlot, shopWide, firedRules: fired }
}

/** 区画の最終倍率 ＝ その品の倍率 × 店全体の倍率 */
export function finalModifiers(result: EvaluationResult, slotId: string): Modifiers {
  const own = result.perSlot.get(slotId) ?? NEUTRAL
  return {
    売れやすさ: own.売れやすさ * result.shopWide.売れやすさ,
    値段:       own.値段 * result.shopWide.値段,
    集客:       own.集客 * result.shopWide.集客,
  }
}

// ─── 入荷解禁 ─────────────────────────────────────────
/**
 * その島の商人が並べる品を出す。
 *
 * **場所の条件（どこで並ぶか）はここが持つ。**規則データ（UNLOCK_RULES）が持つのは
 * **解禁の条件（そもそも並ぶか）＝ U1・U2 だけ**。
 *
 *   U3「島の商人はその島を産地とする品を並べる」… 産地と現在地の**一致**
 *   U4「産地を持たない品はどの島でも並ぶ」    … 産地 == なし
 *
 * どちらも**軸どうしの比較**を要求し、条件言語にそれが無いので書けない（→ issue #31）。
 * **規則データに置くと嘘になる**ので置いていない。
 *
 * ⚠ U1・U2 は **IDで名指し**して拾っている。**U3 を足しても無視される。**
 */
export function stockedByIslandMerchant(
  items: readonly ItemDef[],
  state: GameState,
  rules: readonly UnlockRule[] = UNLOCK_RULES,
): readonly ItemDef[] {
  return items.filter(item => {
    const isLocal = item.origin === state.現在地   // U3（場所の条件。規則データには無い）
    const isSeaborne = item.origin === 'なし'      // U4（同上）
    if (!isLocal && !isSeaborne) return false
    return passesStockGates(item, state, rules)
  })
}

/**
 * 入荷解禁（U1・U2）を通るか。**場所の条件（U3・U4）は見ない。**
 *
 * ⚠ 評価器は `r.id === 'U1'` と**IDで名指し**して拾う（`rules.ts` の注記）。
 *   規則を足しても、ここに名前を書かないかぎり無視される。
 */
export function passesStockGates(
  item: ItemDef,
  state: GameState,
  rules: readonly UnlockRule[] = UNLOCK_RULES,
): boolean {
  const ctx = { item, state }
  const passesTierGate = rules.some(r => r.id === 'U1' && evalCondition(r.condition, ctx))
  const passesSalesGate = rules.some(r => r.id === 'U2' && evalCondition(r.condition, ctx))
  return passesTierGate || passesSalesGate
}

/**
 * その品が売れたことで、**新しく商人に並ぶようになったか**（#60）。
 *
 * 段4-4 で「作れるようになった」は知らせているのに、**買えるようになったほうは静かだった。**
 *
 * ⚠ **しきい値（100）をここに書き写さないこと。**それは規則データの中の値で、
 *   書き写すと**規則を変えたときに知らせだけが古い数のまま**になる。
 *   だから**売る前と売った後で規則そのものを評価し、通り方が変わったかを見る。**
 *
 * ⚠ **覚えるものを足していない。**「前回の品揃え」を持たずに済むのは、
 *   進む解禁が **U2（その品を一定数売る）ただ1つ**だからである
 *   （U1 は `tier == 1` で、進まない）。**U1・U2 以外が進むようになったらここを見直す。**
 */
export function becameBuyable(
  item: ItemDef,
  island: IslandName,
  soldBefore: number,
  soldAfter: number,
  rules: readonly UnlockRule[] = UNLOCK_RULES,
): boolean {
  const passesAt = (sold: number): boolean =>
    passesStockGates(item, { 現在地: island, 累計販売数: new Map([[item.id, sold]]) }, rules)
  return !passesAt(soldBefore) && passesAt(soldAfter)
}
