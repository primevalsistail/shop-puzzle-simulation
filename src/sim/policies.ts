/**
 * 方針 —— **何を仕入れ、何を作り、どう並べるか。**
 *
 * ⚠ **差し替えられること**（`Policy`）。比べられないと測る意味が無いので、
 *   **「全部転売」「浅い品だけ作る」「深い品を作る」の3つ**を最低限として置く。
 *
 * ⚠ **値段・所要分・取り分の式はここに1つも無い。**
 *   `derive.ts`（売値・材料費・升目）と `craft.ts`（手際を掛けた所要分）を呼ぶだけ。
 *   **並べ替えの基準に何を選ぶか**が方針であって、数の出どころは本番と同じである。
 */

import type { ItemDef, ItemId, Origin, RecipeDef } from '../taxonomy/axes.js'
import { luxuryRank } from '../taxonomy/axes.js'
import {
  RESCUE_ITEM_ID, cellCount, ingredientCost, originReach, salePrice, tier,
} from '../taxonomy/derive.js'
import { craftMinutes } from '../taxonomy/craft.js'
import { axisValue, evalCondition } from '../taxonomy/evaluate.js'
import type { GameState } from '../taxonomy/evaluate.js'
import { SET_RULES } from '../taxonomy/rules.js'
import type { SetRule } from '../taxonomy/rules.js'
import type { GridCell } from '../types/index.js'
import type { BuyOrder, LayoutTools, Policy, SimContext } from './SimWorld.js'

/**
 * 「深い品を作る」が狙うレシピの本数。
 *
 * ⚠ **実装から読める数ではない。**1本だけだと材料が切れた日に何も作れず、
 *   多すぎると浅い品を作るのと変わらなくなる、という理由で置いた**方針のつまみ**。
 */
const DEEP_GOALS = 3

// ── 並べ替えの基準 ────────────────────────────────────

/**
 * 転売の取り分 ÷ 升目。
 *
 * ⚠ **1個あたりで見ない。****効いている資源は棚の升目**（1升あたりの捌ける数は品で変わらない）で、
 *   かたちの大きい品は同じ取り分でも場所を食う。
 */
function resellMarginPerCell(item: ItemDef, ctx: SimContext): number {
  const gain = ctx.registry.salePriceOf(item.id) - ctx.registry.purchasePriceOf(item.id, ctx.island)
  return gain / Math.max(1, cellCount(item))
}

/** 売値 ÷ 升目。陳列の順に使う */
function salePerCell(ctx: SimContext, id: ItemId): number {
  return ctx.registry.salePriceOf(id) / Math.max(1, cellCount(ctx.registry.getItem(id)))
}

/**
 * 1分あたりの加工の取り分。
 *
 * ⚠ **所要分は手際を掛けたあと**（`craft.ts` の `craftMinutes`）。
 *   素の `durationMinutes` で割ると **tier3以上で2倍以上ずれる**（#53）。
 */
function craftProfitPerMinute(recipe: RecipeDef, skill: number): number {
  const revenue = salePrice(recipe.outputItemId) * recipe.outputQuantity
  const minutes = craftMinutes(recipe.outputItemId, skill)
  return (revenue - ingredientCost(recipe)) / Math.max(1, minutes)
}

/** 持っている品を、升目あたりの売値が高い順に。**どの方針も並べ方は同じ** */
function displayByValue(ctx: SimContext): ItemId[] {
  return ctx.registry.getAllItems()
    .filter(i => ctx.inventory.getQuantity(i.id) > 0)
    .map(i => i.id)
    .sort((a, b) => salePerCell(ctx, b) - salePerCell(ctx, a))
}

/** この島の商人が並べている品を、転売の取り分が高い順に */
function byResellValue(ctx: SimContext): ItemDef[] {
  return [...ctx.stocked].sort((a, b) => resellMarginPerCell(b, ctx) - resellMarginPerCell(a, ctx))
}

// ── 3つの方針 ─────────────────────────────────────────

/** ① 全部転売。**一度も作らない** */
export const resellAll: Policy = {
  name: '全部転売',
  buyTargets(ctx) {
    return byResellValue(ctx).slice(0, ctx.shelfKinds).map(i => ({ id: i.id, qty: ctx.stockTarget }))
  },
  craftTargets: () => [],
  displayTargets: displayByValue,
}

/** ② 浅い品だけ作る。**tier2 まで** */
export const shallowCraft: Policy = {
  name: '浅い品だけ作る',
  buyTargets: ctx => craftBuyTargets(ctx, shallowRecipes(ctx)),
  craftTargets: shallowRecipes,
  displayTargets: displayByValue,
}

/** ③ 深い品を作る。**いま開いているうちで一番深い品を狙い、その材料も自分で作る** */
export const deepCraft: Policy = {
  name: '深い品を作る',
  buyTargets: ctx => craftBuyTargets(ctx, deepRecipes(ctx)),
  craftTargets: deepRecipes,
  displayTargets: displayByValue,
}

// ── 中身 ──────────────────────────────────────────────

function shallowRecipes(ctx: SimContext): RecipeDef[] {
  const skill = ctx.upgrades.skill()
  return ctx.recipeUnlocks.unlockedRecipes()
    .filter(r => tier(r.outputItemId) === 2)
    .sort((a, b) => craftProfitPerMinute(b, skill) - craftProfitPerMinute(a, skill))
}

function deepRecipes(ctx: SimContext): RecipeDef[] {
  const unlocked = ctx.recipeUnlocks.unlockedRecipes()
  if (unlocked.length === 0) return []
  const skill = ctx.upgrades.skill()
  const byOutput = new Map(unlocked.map(r => [r.outputItemId, r]))
  const deepest = Math.max(...unlocked.map(r => tier(r.outputItemId)))

  const goals = unlocked
    .filter(r => tier(r.outputItemId) === deepest)
    .sort((a, b) => craftProfitPerMinute(b, skill) - craftProfitPerMinute(a, skill))
    .slice(0, DEEP_GOALS)

  // 目標に要るレシピを、解禁済みの範囲で遡って集める
  const need = new Map<string, RecipeDef>()
  const walk = (recipe: RecipeDef): void => {
    if (need.has(recipe.id)) return
    need.set(recipe.id, recipe)
    for (const ing of recipe.ingredients) {
      const sub = byOutput.get(ing.itemId)
      if (sub) walk(sub)
    }
  }
  for (const goal of goals) walk(goal)

  // ⚠ **深い段から順に回す。**浅い段から回すと、**その日の加工枠を浅い品が食い尽くし、
  //   深い段に着く前に時間が尽きる**（実測: 400日回して tier3 止まり）。
  //   深い段は材料が無ければ `canCraft` が偽になって黙って飛ぶので、
  //   **作れる日は深い段が先、作れない日は浅い段が枠を使う**という形になる
  return [...need.values()].sort((a, b) => tier(b.outputItemId) - tier(a.outputItemId))
}

/**
 * 作る方針の仕入れ。**順がそのまま金の使い道の優先順**になる。
 *
 *   ① 作りたいものの材料（この島で買えるぶん）
 *   ② まだ一度も手にしたことのない品を1つずつ —— **レシピが開くのはこれ**
 *      （`RecipeUnlocks`: 材料を1つ残らず手にしたことがあること）
 *   ③ 残りは棚を埋める転売品
 */
function craftBuyTargets(ctx: SimContext, recipes: readonly RecipeDef[]): BuyOrder[] {
  const out: BuyOrder[] = []
  const seen = new Set<ItemId>()
  const push = (id: ItemId, qty: number): void => {
    if (seen.has(id)) return
    seen.add(id)
    out.push({ id, qty })
  }

  const here = new Set(ctx.stocked.map(i => i.id))
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      if (here.has(ing.itemId)) push(ing.itemId, ctx.stockTarget)
    }
  }
  for (const item of ctx.stocked) {
    if (!ctx.inventory.hasEverHeld(item.id)) push(item.id, 1)
  }
  for (const item of byResellValue(ctx).slice(0, ctx.shelfKinds)) {
    push(item.id, ctx.stockTarget)
  }
  return out
}

// ── ④ 取り合わせを狙う（作業1-b） ────────────────────
/**
 * **仕入れ・加工・改装は「浅い品だけ作る」とまったく同じ。並べ方だけが違う。**
 *
 * ⚠ **そうでないと何が効いたか分からない**（計画の受入条件）。
 *   `buyTargets` と `craftTargets` は `shallowCraft` の関数をそのまま指している。
 *
 * 狙うのは `rules.ts` の `SET_RULES` のうち **`adjacent: true` のもの**（R1〜R6）。
 * **`adjacent: false`（S1・S2）は盤面に置いてあれば当たる**ので、置き方では動かせない。
 */
export const comboCraft: Policy = {
  name: '取り合わせを狙う',
  buyTargets: shallowCraft.buyTargets,
  craftTargets: shallowCraft.craftTargets,
  displayTargets: displayByValue,
  arrange: arrangeForSets,
}

/**
 * 隣り合わせの規則。
 *
 * ⚠ **規則を名前で名指ししない**（#59 で `r.id === 'U1'` を解いたのと同じ理由）。
 *   `rules.ts` に1本足せば、この方針は何も変えずにそれも狙う。
 */
const ADJACENT_RULES = SET_RULES.filter(r => r.adjacent && r.members.length === 2)

/**
 * 2つの品を隣り合わせたときに増える効き目の合計（`multiplier − 1` の和）。**負にもなる**（R4）。
 *
 * ⚠ **甲乙を両向きに当てる。**`members` は順序のある列で、効き目は**先頭に当たった品**にかかる
 *   （`rules.ts`）。R4 で日用品が値下がりしないのはこの向きのおかげなので、
 *   **片向きだけ見ると R4 を避けられない。**
 * ⚠ **`組ごとに1回` の規則（R5）は、両向き当たっても1回だけ**（`matchAdjacent` と同じ扱い）。
 * ⚠ **倍率に重みを付けていない。**`集客` を重く見るような係数は置かず、
 *   **規則が持っている `multiplier` の差**（R5 の 0.6 対 R3 の 0.1）にそのまま従う。
 */
function pairScore(a: ItemDef, b: ItemDef, state: GameState): number {
  let score = 0
  for (const rule of ADJACENT_RULES) {
    if (!agrees(rule, a, b)) continue
    const gain = rule.effect.multiplier - 1
    const 甲がa = matches(rule, 0, a, state) && matches(rule, 1, b, state)
    const 甲がb = matches(rule, 0, b, state) && matches(rule, 1, a, state)
    if (甲がa) score += gain
    if (甲がb && !(rule.組ごとに1回 && 甲がa)) score += gain
  }
  return score
}

/** `members` の1件に当たるか。**判定は本番の `evalCondition`**（写していない） */
function matches(rule: SetRule, index: number, item: ItemDef, state: GameState): boolean {
  const member = rule.members[index]
  if (typeof member === 'string') return item.id === member
  const key = `${rule.id}|${index}|${item.id}|${state.現在地}`
  const cached = MATCH_MEMO.get(key)
  if (cached !== undefined) return cached
  const value = evalCondition(member, { item, state })
  MATCH_MEMO.set(key, value)
  return value
}
const MATCH_MEMO = new Map<string, boolean>()

/**
 * `揃える` の軸の値が一致しているか。
 *
 * ⚠ **軸の引き当ては本番の `axisValue`**（`evaluate.ts`。2026-09-15 に写しをやめて export した）。
 *   **`産地` は「材料を遡った産地」**（`originReach`。#37）で、ここを `item.origin` にすると
 *   **加工品が全部 `なし` になって R5 が素材にしか当たらなくなる。**
 */
function agrees(rule: SetRule, a: ItemDef, b: ItemDef): boolean {
  if (!rule.揃える) return true
  return axisValue(rule.揃える, a) === axisValue(rule.揃える, b)
}

/** `originReach` は毎回レシピを遡るので、品ごとに1度だけ引く */
function originOf(item: ItemDef): Origin {
  const cached = ORIGIN_MEMO.get(item.id)
  if (cached !== undefined) return cached
  const value = originReach(item)
  ORIGIN_MEMO.set(item.id, value)
  return value
}
const ORIGIN_MEMO = new Map<ItemId, Origin>()

/**
 * 並べる。**品ごとに、隣から得られる効き目がいちばん大きい升目を選ぶ。**
 *
 * ⚠ **同点なら左上が勝つ**（走査の順）。詰まって置かれるので、次の品も隣を得やすい。
 * ⚠ **回転しない。**既定の並べ方と条件を揃えるため。
 */
function arrangeForSets(ctx: SimContext, tools: LayoutTools, order: readonly ItemId[]): void {
  for (const id of groupedOrder(ctx, order)) {
    if (ctx.inventory.getQuantity(id) <= 0) continue
    const item = ctx.registry.getItem(id)
    let best: GridCell | null = null
    let bestScore = -Infinity
    for (let y = 0; y < tools.size.height; y++) {
      for (let x = 0; x < tools.size.width; x++) {
        const cell = { x, y }
        if (!tools.canPlace(id, cell)) continue
        let score = 0
        for (const neighbor of tools.neighborsOf(id, cell)) {
          score += pairScore(item, ctx.registry.getItem(neighbor), ctx.state)
        }
        if (score > bestScore) {
          bestScore = score
          best = cell
        }
      }
    }
    if (best) tools.place(id, best)
  }
}

/**
 * 置く順。**同じ産地の品をひと固まりにする** —— R5（`集客 ×1.6`）が
 * **`揃える: '産地'` を持つ**ので、産地が混ざると隣り合っても当たらない。
 *
 * - 固まりの順は**升目あたりの売値の合計**が大きいほうから（場所は先に埋まるほうが広い）
 * - ⚠ **産地 `なし` はいちばん後ろ。**R5 が当たらないので、固まりを割る側に置かない
 * - 固まりの中は**贅沢さの高い順** —— R2（上等どうし）と R3（日用どうし）が当たり、
 *   ⚠ **R4（贅沢の隣に日用 → `値段 ×0.85`）が起きない。**間に `上等` が挟まる
 */
function groupedOrder(ctx: SimContext, order: readonly ItemId[]): ItemId[] {
  const groups = new Map<Origin, ItemId[]>()
  for (const id of order) {
    const origin = originOf(ctx.registry.getItem(id))
    const list = groups.get(origin) ?? []
    list.push(id)
    groups.set(origin, list)
  }
  const valueOf = (ids: readonly ItemId[]): number =>
    ids.reduce((sum, id) => sum + salePerCell(ctx, id), 0)

  const sorted = [...groups.entries()].sort((a, b) => {
    if ((a[0] === 'なし') !== (b[0] === 'なし')) return a[0] === 'なし' ? 1 : -1
    return valueOf(b[1]) - valueOf(a[1])
  })

  const out: ItemId[] = []
  for (const [, ids] of sorted) {
    out.push(...ids.sort((a, b) => {
      const byLuxury = luxuryRank(ctx.registry.getItem(b).luxury)
        - luxuryRank(ctx.registry.getItem(a).luxury)
      return byLuxury !== 0 ? byLuxury : salePerCell(ctx, b) - salePerCell(ctx, a)
    }))
  }
  return out
}

// ── ⑤ 救済の品だけで稼ぐ（計画 `rescue-and-no-gameover.md` の受入条件5） ──
/**
 * **ただで買える救済の品だけを、買えるだけ買って並べる。**
 *
 * ⚠ **これが「最良の稼ぎ方」になっていないことを見るためだけの方針である。**
 *   救済の品は**買値0・売値5**なので、**上限が無ければ盤面を埋めるのが最適解になる**
 *   （`RescueSupply` の注記）。**加工の稼ぎを超えないこと**を、
 *   `shallow` ／ `deep` と同じ条件で回して比べる。
 *
 * ⚠ **改装も納品も止めていない。**止めると「救済だけで遊んだ人」ではなく
 *   「何もしない人」を測ることになる。**違うのは何を買い、何を並べるかだけ。**
 */
export const rescueOnly: Policy = {
  name: '救済の品だけ',
  // ⚠ **個数は `stockTarget` を素通し。**買える数は `RescueSupply` の1日の上限が決める
  buyTargets: ctx => [{ id: RESCUE_ITEM_ID, qty: ctx.stockTarget }],
  craftTargets: () => [],
  // ⚠ **並べるのも救済の品だけ。**手持ちの初期在庫を並べると、何が稼いだのか分からなくなる
  displayTargets: ctx => (ctx.inventory.getQuantity(RESCUE_ITEM_ID) > 0 ? [RESCUE_ITEM_ID] : []),
}

/** `--policy=` で指す名前。⚠ **並びがそのまま `--policy=all` の順になる** */
export const POLICIES: Record<string, Policy> = {
  resell: resellAll,
  shallow: shallowCraft,
  deep: deepCraft,
  combo: comboCraft,
  rescue: rescueOnly,
}
