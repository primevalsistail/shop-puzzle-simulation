/**
 * Cycle 4 / Phase 3 — 条件言語と規則
 *
 * 出典: aidlc-docs/inception/application-design/cycle4-phase2-axes.md §2（規則）§5（条件言語）
 *
 * INV-4「規則はアイテムを知らない」の判定条件:
 *   (1) 層1・島の需要・入荷解禁の規則型に ItemId が現れないこと  → 型で担保（下記）
 *   (2) 層2を空配列にしてもテストが通ること                      → SIGNATURE_PAIRS = [] が既定
 */

import type { ItemId, Luxury, MainKind, Origin, SuitedLand } from './axes.js'
import type { IslandName } from './islands.js'
import { DEMAND_TABLE } from './islands.js'

// ═══ 条件言語 ═════════════════════════════════════════
export type OrderedOp = '>=' | '<=' | '>' | '<'
export type EqOp = '==' | '!='

/**
 * アイテム述語。**順序演算子を使えるのは tier と 贅沢さ だけ**（Phase 2 §5）。
 * 主種類・産地・向く土地には順序がないので、型で `==` `!=` に縛る。
 */
export type ItemPredicate =
  | { readonly axis: '主種類';   readonly op: EqOp; readonly value: MainKind }
  | { readonly axis: '産地';     readonly op: EqOp; readonly value: Origin }
  | { readonly axis: '向く土地'; readonly op: EqOp; readonly value: SuitedLand }
  | { readonly axis: '贅沢さ';   readonly op: EqOp | OrderedOp; readonly value: Luxury }
  | { readonly axis: 'tier';     readonly op: EqOp | OrderedOp; readonly value: number }

/**
 * 状態述語。ゲームの状態を見る。
 * `この品` は指示子であって ID ではない — 規則は自分が今どの品に当たっているかだけを知る。
 */
export type StatePredicate =
  | { readonly metric: '累計販売数'; readonly target: 'この品'; readonly op: EqOp | OrderedOp; readonly value: number }
  | { readonly metric: '現在地';     readonly op: EqOp; readonly value: IslandName }

export type Predicate = ItemPredicate | StatePredicate

export type Condition =
  | Predicate
  | { readonly kind: 'かつ';   readonly of: readonly Condition[] }
  | { readonly kind: 'または'; readonly of: readonly Condition[] }
  | { readonly kind: 'でない'; readonly of: Condition }

// ═══ 効き目 — 種類3 × 適用範囲2 ══════════════════════
export type EffectKind = '売れやすさ' | '値段' | '集客'
/** `店全体` は現行コードに無い**新しい機構**（Phase 2 §5） */
export type EffectScope = 'その品' | '店全体'

export interface Effect {
  readonly kind: EffectKind
  readonly scope: EffectScope
  readonly multiplier: number
}

/**
 * 効き目の合成は**加算**（Q5）。`1 + Σ(mᵢ − 1)`。例: 1.1 と 1.1 → 1.2。
 * **上限は設けない**（上限値はバランス調整の数値であり Q3 = A と衝突する）。
 */
export function combine(multipliers: readonly number[]): number {
  return 1 + multipliers.reduce((sum, m) => sum + (m - 1), 0)
}

// ═══ 規則の形 ═════════════════════════════════════════

/**
 * 取り合わせ 層1（条件規則）。**ItemId が型に現れない**（INV-4）。
 *
 * ⚠ **効き目は「甲」にだけかかる。**甲と乙は順不同で当てるが、当たった側（甲）が効果を受ける。
 *   R4「奮発する品の隣に暮らしの品を置くと**値が下がる**」で、日用品まで値下がりしないのはこのため。
 *   R1「食べものと飲みものは隣り合うと売れやすい」は、**食べものの側が**売れやすくなる、と読む。
 *   両方に効かせたい規則は、甲と乙を入れ替えたものをもう1本書く（機構は足さない）。
 */
export interface PairRule {
  readonly id: string
  readonly description: string
  readonly 甲: Condition
  readonly 乙: Condition
  readonly effect: Effect
}

/** 取り合わせ 層2（名物コンビ）。ID を書いてよい唯一の場所。**全部消しても成立する** */
export interface SignaturePairRule {
  readonly id: string
  readonly 甲: ItemId
  readonly 乙: ItemId
  readonly effect: Effect
}

/** 島の需要 ／ その他の条件規則。**ItemId が型に現れない** */
export interface ConditionRule {
  readonly id: string
  readonly description: string
  readonly condition: Condition
  readonly effect: Effect
}

/** 入荷解禁。**ItemId が型に現れない** */
export type StockedBy = '島の商人' | '行商人バレン'
export interface UnlockRule {
  readonly id: string
  readonly description: string
  readonly condition: Condition
  readonly stockedBy: StockedBy
}

/** 客の好み。**Cycle 5 で書く。器だけ用意する**（データは空） */
export interface CustomerPreferenceRule {
  readonly id: string
  readonly customerType: string
  readonly condition: Condition
  readonly multiplier: number
}

// ═══ 規則データ ═══════════════════════════════════════

const item = <P extends ItemPredicate>(p: P): P => p
const かつ = (...of: Condition[]): Condition => ({ kind: 'かつ', of })

/** 取り合わせ 層1（R1〜R6）。倍率は Phase 3 で一度置いたもので、調整していない（Q3 = A） */
export const PAIR_RULES: readonly PairRule[] = [
  {
    id: 'R1', description: '食べものと飲みものは隣り合うと売れやすい',
    甲: item({ axis: '主種類', op: '==', value: '食料' }),
    乙: item({ axis: '主種類', op: '==', value: '飲みもの' }),
    effect: { kind: '売れやすさ', scope: 'その品', multiplier: 1.2 },
  },
  {
    id: 'R2', description: '奮発する品どうしを並べると値が上がる（見栄えが立つ）',
    甲: item({ axis: '贅沢さ', op: '>=', value: '上等' }),
    乙: item({ axis: '贅沢さ', op: '>=', value: '上等' }),
    effect: { kind: '値段', scope: 'その品', multiplier: 1.15 },
  },
  {
    id: 'R3', description: '暮らしの品どうしを並べるとまとめて売れる',
    甲: item({ axis: '贅沢さ', op: '==', value: '日用' }),
    乙: item({ axis: '贅沢さ', op: '==', value: '日用' }),
    effect: { kind: '売れやすさ', scope: 'その品', multiplier: 1.1 },
  },
  {
    id: 'R4', description: '奮発する品の隣に暮らしの品を置くと値が下がる（安く見える）',
    甲: item({ axis: '贅沢さ', op: '==', value: '贅沢' }),
    乙: item({ axis: '贅沢さ', op: '==', value: '日用' }),
    effect: { kind: '値段', scope: 'その品', multiplier: 0.85 },
  },
  {
    id: 'R6', description: '加工の深い品の隣にその系統の浅い品を置くと売れやすい（手仕事が見える）',
    甲: item({ axis: 'tier', op: '>=', value: 3 }),
    乙: item({ axis: 'tier', op: '==', value: 1 }),
    effect: { kind: '売れやすさ', scope: 'その品', multiplier: 1.15 },
  },
]

/**
 * R5 だけ範囲が `店全体`。同じ島の産の品を並べると店全体に人が寄る（島の棚ができる）。
 *
 * ⚠ **この規則は素材（tier1）50品にしか効かない。**加工品70品はすべて産地が `なし` だから
 *   （旬を持たないため。#22）。**加工が進むほど効かなくなる**（Phase 3 の評価が指摘）。
 *   効かせるには「材料を遡った産地の**集合**」を導出する必要があり、
 *   条件言語に「含む」が要る＝規則の書き方が一段複雑になる。**採らないと決めた**（→ issue #37）。
 */
export const SAME_ORIGIN_RULE: PairRule = {
  id: 'R5', description: '同じ島の産の品を並べると店全体に人が寄る（島の棚ができる）',
  // 「同じ島」は値の一致であって特定の島ではないので、評価器が甲乙の産地を突き合わせる。
  // 条件式には「産地が `なし` でないこと」だけを書く（海のものは島の棚を作らない）。
  甲: item({ axis: '産地', op: '!=', value: 'なし' }),
  乙: item({ axis: '産地', op: '!=', value: 'なし' }),
  effect: { kind: '集客', scope: '店全体', multiplier: 1.1 },
}

/**
 * 層2（名物コンビ）。**空が既定。**
 * INV-4 の判定条件「層2を全部消しても成立すること」を常時テストする状態にしてある。
 */
export const SIGNATURE_PAIRS: readonly SignaturePairRule[] = []

/** 島の需要（D1）。islands.ts の需要表4行から機械的に作る。**調整はあの4行に集まる** */
export const DEMAND_RULES: readonly ConditionRule[] = DEMAND_TABLE.map(row => ({
  id: `D1_${row.island}`,
  description: `${row.suitedLand}に向く品は${row.island}で売れやすい`,
  condition: かつ(
    item({ axis: '向く土地', op: '==', value: row.suitedLand }),
    { metric: '現在地', op: '==', value: row.island },
  ),
  effect: { kind: '売れやすさ', scope: 'その品', multiplier: row.multiplier },
}))

/**
 * D2 — よその島の産の品は目に留まりやすい。産地と現在地の突き合わせは評価器が行う。
 *
 * ⚠ R5 と同じく**素材（tier1）50品にしか効かない**（→ issue #37）。
 */
export const FOREIGN_ORIGIN_RULE: ConditionRule = {
  id: 'D2', description: 'よその島の産の品は目に留まりやすい',
  condition: item({ axis: '産地', op: '!=', value: 'なし' }),
  effect: { kind: '売れやすさ', scope: 'その品', multiplier: 1.15 },
}

/**
 * 入荷**解禁**（U1・U2）。ItemId を書かない。
 *
 * ⚠ **ここが持つのは「そもそも並ぶか」だけ。**「どこで並ぶか」＝**場所の条件**は
 *   evaluate.ts の `stockedByIslandMerchant` が持つ（産地 == 現在地 ／ 産地 == なし）。
 *
 *   場所の条件は**軸どうしの比較**（`産地 == 現在地`）を要求するが、
 *   条件言語にそれが無いため書けない（→ issue #31）。
 *
 *   **2026-09-07 まで、書けないはずの U4「産地を持たない品はどの島でも並ぶ」が
 *   ここにデータとして置かれていた。**評価器は同じことを `isSeaborne` として再実装しており、
 *   `U4.condition` も `U4.stockedBy` も**一度も読まれていなかった**（Phase 3 の評価が指摘）。
 *   **規則データが嘘をつくよりは持たないほうがよい**ので削除した。
 *   U3「島の商人はその島を産地とする品を並べる」も同じ理由でここには無い。
 *
 * ⚠ 評価器は `r.id === 'U1'` と**IDで名指し**して拾う。**U3 を足しても無視される。**
 *   データ駆動にするには条件言語の拡張（#31）が要るため、いまは名指しのままにしてある。
 */
export const UNLOCK_RULES: readonly UnlockRule[] = [
  {
    // 加工品はすべて産地が `なし`（旬を持たないため）。U4「産地を持たない品はどの島でも並ぶ」と
    // 組み合わさるので、ここを tier<=2 にすると tier2 の加工品が最初から買えてしまい、
    // 「作るしかなかった品」という U2 の前提が崩れる。**素材だけが商人の店先に並ぶ。**
    id: 'U1', description: '加工の深い品は序盤には並ばない（並ぶのは素材だけ）',
    condition: item({ axis: 'tier', op: '==', value: 1 }),
    stockedBy: '島の商人',
  },
  {
    id: 'U2', description: 'その品を一定数売ると、作るしかなかった品が買えるようになる（買う方が高い）',
    condition: かつ(
      item({ axis: 'tier', op: '>=', value: 2 }),
      { metric: '累計販売数', target: 'この品', op: '>=', value: 100 },
    ),
    stockedBy: '島の商人',
  },
]

/**
 * U3「島の商人は、その島を産地とする品を並べる」は、産地と現在地の**一致**を見る規則。
 * 条件言語には「産地 == 現在地」という**軸どうしの比較**が無いので、評価器が持つ（evaluate.ts）。
 * → Phase 3 の申し送り。条件言語に足すかどうかは Phase 4 以降の判断
 */

/** 客の好み。**Cycle 5 で書く。**器だけ用意し、データは空のままにする */
export const CUSTOMER_PREFERENCE_RULES: readonly CustomerPreferenceRule[] = []
