/**
 * Cycle 4 / Phase 3 — 導出（INV-3）
 *
 * ここにあるものは ItemDef に**書かない**。関数で出す。
 *   - tier          … ALL_RECIPES から
 *   - 売値           … tier1 は基準値から、tier2以上は材料から積み上げ
 *   - 何から作れるか / 何に使えるか
 *
 * 判定（INV-3）: ItemDef の型に tier / price のフィールドが存在しないこと。→ axes.ts
 */

import type { ItemDef, ItemId, Luxury, RecipeDef } from './axes.js'
import { ALL_ITEMS, getItem } from './items.js'
import { ALL_RECIPES, RECIPES_BY_OUTPUT } from './recipes.js'

// ─── tier ─────────────────────────────────────────────
/**
 * tier とは加工の深さである。`tier = 1 + max(材料の tier)`、レシピを持たない品は 1。
 *
 * 絶対値なので、レシピを足しても既存品の tier は動かない（INV-1）。
 * ただし「既存品を**出力**とするレシピを新たに与える」のは追加ではなく**変更**であり、
 * tier が動くのは正しい（INV-1 が明示的に区別している側）。
 */
export function tier(
  itemId: ItemId,
  recipesByOutput: ReadonlyMap<string, RecipeDef> = RECIPES_BY_OUTPUT,
  seen: ReadonlySet<ItemId> = new Set(),
): number {
  if (seen.has(itemId)) {
    throw new Error(`Recipe cycle detected at: ${itemId}`)
  }
  const recipe = recipesByOutput.get(itemId)
  if (!recipe) return 1

  const next = new Set(seen).add(itemId)
  const maxIngredientTier = Math.max(
    ...recipe.ingredients.map(ing => tier(ing.itemId, recipesByOutput, next)),
  )
  return 1 + maxIngredientTier
}

// ─── 売値 ─────────────────────────────────────────────
/**
 * 贅沢さの倍率（P1）。tier1 の売値 = 基準値 × これ × 品ごとの補正。
 * ⚠ 数値は一度置いたもので、調整していない（Q3 = A）。
 */
const LUXURY_PRICE: Record<Luxury, number> = { 日用: 1.0, 上等: 1.5, 贅沢: 2.4 }

/**
 * 贅沢さによる回転率（P3 の受け皿）。
 *
 * ⚠ **これが無いと `利益/時間` が全品一定になる**（Phase 1 §5 の警告）。
 *   加工倍率を所要時間だけから決めてはならない、というのはこの係数を必ず併せる、という意味。
 *   日用は速く捌け、贅沢はゆっくりしか捌けない。
 */
const LUXURY_TURNOVER: Record<Luxury, number> = { 日用: 1.0, 上等: 0.7, 贅沢: 0.45 }

export function luxuryTurnover(item: ItemDef): number {
  return LUXURY_TURNOVER[item.luxury]
}

// ─── 加工利益（2026-09-07 改訂。旧 P2「Σ材料の売値 × 加工倍率」を置き換えた）──
/**
 * 加工利益の係数。**利益は材料費と切り離す。**
 *
 * ```
 * 売値 = 材料費 + 加工利益
 * 加工利益 P = PROFIT_SCALE × 所要分^PROFIT_EXPONENT × 贅沢さの利益係数
 * ```
 *
 * ## なぜ変えたか
 *
 * 旧式は `Σ材料の売値 × 加工倍率` で、**利益が材料費に比例していた。**
 * そのため「**高価な材料に短い仕上げを1回足す**」のが常に最強になった
 * （冷たいミントの茶: 材料費364 → 売値536。15分で +172）。
 *
 * 実測: 稼ぎ密度の開き **57倍**、上位5品が**全部 7.5〜15分の冷たい飲みもの**。
 * さらに**利益の開きが186倍**あるのに升目の幅は6倍しかなく、
 * 2資源（時間・升目）のパレートフロンティアに**72品中2品しか乗っていなかった。**
 *
 * ## なぜこの形か
 *
 * 利益を材料費から切り離すと、利益の幅は `所要分^α` だけで決まる。
 * 所要分の幅は48倍なので `48^0.6 ≈ 10倍` に縮み、**升目の幅6倍と釣り合う桁になる。**
 *
 * `α < 1` なので:
 * - 所要が長いほど**利益額**は増える
 * - ただし**時間あたり利益**は逓減する
 *
 * → **短時間加工＝時間効率がよい／長時間加工＝1回の利益額が大きい**、という役割分担ができる。
 *
 * ## 実測（72レシピ）
 *
 * | | 旧式 | この式 |
 * |---|---|---|
 * | 利益の開き | 186倍 | 約10倍 |
 * | フロンティア | **2品** | **14品** |
 * | 層 | — | **日用・上等・贅沢の3層すべて** |
 * | 時間軸の開き | 57倍 | 5.1倍 |
 * | 升目軸の開き | 93倍 | 8.9倍 |
 *
 * ⚠ **贅沢の利益係数は 1.7 が要る。**回転率 0.45 を補えないと贅沢がフロンティアから消える。
 * ⚠ **数値（α・係数・PROFIT_SCALE）はまだ調整していない。**
 *   条件別に最適品が入れ替わるかの確認は別途。
 */
const PROFIT_EXPONENT = 0.6

/** 利益額の目盛り。旧式の利益の中央値に合わせて置いた（経済の規模を保つため） */
const PROFIT_SCALE = 5.6

/**
 * 贅沢さの利益係数。**回転率（LUXURY_TURNOVER）と対になっている。**
 *
 *   日用: 利益は小さいがよく売れる ／ 贅沢: 利益は大きいが売れにくい
 *
 * ⚠ 旧 LUXURY_PRICE（1.0 / 1.5 / 2.4）より**圧縮している。**
 *   価格差が大きすぎると、贅沢品が利益・回転の両方で勝ってしまう。
 */
const LUXURY_PROFIT: Record<Luxury, number> = { 日用: 0.9, 上等: 1.1, 贅沢: 1.7 }

/** 1回の加工で生む利益（出力1個あたり）。材料費を含まない */
export function craftProfit(recipe: RecipeDef, item: ItemDef): number {
  const minutesPerUnit = recipe.durationMinutes / recipe.outputQuantity
  return PROFIT_SCALE * Math.pow(minutesPerUnit, PROFIT_EXPONENT) * LUXURY_PROFIT[item.luxury]
}

/**
 * 売値。
 *   tier1     : 基準値 × 贅沢さの倍率（P1）
 *   tier2以上 : **材料費 ＋ 加工利益**（材料費と利益を分ける）
 *
 * 手書きは tier1 の基準値だけ。新レシピを足すと売値が自動で付く（INV-5 に強い）。
 *
 * **INV-6（作った品は材料より高い）は定義から自明。**加工利益が常に正なので
 * `売値 × 出力数 = Σ材料 + 利益×出力数 > Σ材料`。
 * 旧式では「加工倍率 > 1」に依存していた。
 */
export function salePrice(
  itemId: ItemId,
  recipesByOutput: ReadonlyMap<string, RecipeDef> = RECIPES_BY_OUTPUT,
  lookup: (id: ItemId) => ItemDef = getItem,
  seen: ReadonlySet<ItemId> = new Set(),
): number {
  if (seen.has(itemId)) {
    throw new Error(`Recipe cycle detected at: ${itemId}`)
  }
  const item = lookup(itemId)
  const recipe = recipesByOutput.get(itemId)

  if (!recipe) {
    if (item.basePrice === undefined) {
      throw new Error(`tier1 item has no basePrice: ${itemId}`)
    }
    return Math.round(item.basePrice * LUXURY_PRICE[item.luxury])
  }

  if (item.basePrice !== undefined) {
    throw new Error(`tier2+ item must not have basePrice (price is derived): ${itemId}`)
  }

  const next = new Set(seen).add(itemId)
  const ingredientTotal = recipe.ingredients.reduce(
    (sum, ing) => sum + salePrice(ing.itemId, recipesByOutput, lookup, next) * ing.quantity,
    0,
  )
  const materialCost = ingredientTotal / recipe.outputQuantity
  return Math.round(materialCost + craftProfit(recipe, item))
}

/**
 * 配置の効き目を乗せた実売値。
 *
 * ⚠ **倍率は利益部分にだけ乗る。材料費には乗らない。**
 *   売値全体に乗せると、**高価な材料の品ほど配置ボーナスの絶対額も大きくなり**、
 *   また高価格品が有利になる（旧式で起きていたことの再発）。
 *
 * ```
 * 実売値 = 材料費 + 加工利益 × 値段の倍率
 * ```
 *
 * これで「**加工すれば最低限は黒字。大きく儲けるには配置を考える**」という形になる。
 * tier1（レシピを持たない品）は利益部分が無いので、そのまま倍率を掛ける。
 */
export function finalPrice(
  itemId: ItemId,
  priceModifier: number,
  recipesByOutput: ReadonlyMap<string, RecipeDef> = RECIPES_BY_OUTPUT,
  lookup: (id: ItemId) => ItemDef = getItem,
): number {
  const item = lookup(itemId)
  const recipe = recipesByOutput.get(itemId)
  if (!recipe) return Math.round(salePrice(itemId, recipesByOutput, lookup) * priceModifier)

  const ingredientTotal = recipe.ingredients.reduce(
    (sum, ing) => sum + salePrice(ing.itemId, recipesByOutput, lookup) * ing.quantity,
    0,
  )
  const materialCost = ingredientTotal / recipe.outputQuantity
  return Math.round(materialCost + craftProfit(recipe, item) * priceModifier)
}

/** レシピ1回分の材料費（売値ベース） */
export function ingredientCost(
  recipe: RecipeDef,
  recipesByOutput: ReadonlyMap<string, RecipeDef> = RECIPES_BY_OUTPUT,
  lookup: (id: ItemId) => ItemDef = getItem,
): number {
  return recipe.ingredients.reduce(
    (sum, ing) => sum + salePrice(ing.itemId, recipesByOutput, lookup) * ing.quantity,
    0,
  )
}

/**
 * 仕入れ値。
 *
 * U2 の成立条件 (a)「**買う方が高い**」— 作れば安く、買えば高い（時間を金で買う）。
 *
 * ```
 * 買値 = 材料費 + 加工利益 × 割増
 * ```
 *
 * ⚠ **割増は加工利益にだけ掛かる。材料費には掛からない**（売値と同じ扱い）。
 *   旧式は `材料費 × 加工倍率 × 1.25` で**材料費に比例**していたため、
 *   「余分に払う金 ÷ 節約できる時間」が **144倍**散っていた（issue #36）。
 *   買っているのは時間なのに、対価が材料費で決まっていた。
 *
 * ⚠ **買った品は、素で売ると必ず損をする**（買値 > 売値）。
 *   **配置の効き目が割増を超えたときだけ得になる。**
 *   つまり「買う」は**時間を金で買い、配置で回収する**選択になる。
 */
const TIER1_PURCHASE_RATE = 0.5
const CRAFTED_PURCHASE_MARKUP = 1.25

export function purchasePrice(
  itemId: ItemId,
  recipesByOutput: ReadonlyMap<string, RecipeDef> = RECIPES_BY_OUTPUT,
  lookup: (id: ItemId) => ItemDef = getItem,
): number {
  const recipe = recipesByOutput.get(itemId)
  if (!recipe) {
    return Math.round(salePrice(itemId, recipesByOutput, lookup) * TIER1_PURCHASE_RATE)
  }
  const item = lookup(itemId)
  const perUnitCost = ingredientCost(recipe, recipesByOutput, lookup) / recipe.outputQuantity
  return Math.round(perUnitCost + craftProfit(recipe, item) * CRAFTED_PURCHASE_MARKUP)
}

// ─── レシピ由来の導出（INV-3: 型に持たない） ─────────────
export function recipeFor(itemId: ItemId): RecipeDef | undefined {
  return RECIPES_BY_OUTPUT.get(itemId)
}

/** その品が材料として使われるレシピ（＝何に使えるか） */
export function usedIn(itemId: ItemId): readonly RecipeDef[] {
  return ALL_RECIPES.filter(r => r.ingredients.some(ing => ing.itemId === itemId))
}

/** 升目をいくつ占めるか（かたち・大きさ。場所の制約を作る） */
export function cellCount(item: ItemDef): number {
  return item.shape.reduce((sum, row) => sum + row.filter(c => c === 1).length, 0)
}

/** 全品のダンプ（INV-1 の判定に使う。導出値を含む） */
export function dumpAll(
  items: readonly ItemDef[] = ALL_ITEMS,
  recipesByOutput: ReadonlyMap<string, RecipeDef> = RECIPES_BY_OUTPUT,
): Record<string, Record<string, unknown>> {
  const lookup = (id: ItemId): ItemDef => {
    const found = items.find(i => i.id === id)
    if (!found) throw new Error(`Item not found: ${id}`)
    return found
  }
  const out: Record<string, Record<string, unknown>> = {}
  for (const item of items) {
    out[item.id] = {
      mainKind: item.mainKind,
      origin: item.origin,
      luxury: item.luxury,
      suitedLand: item.suitedLand,
      cells: cellCount(item),
      tier: tier(item.id, recipesByOutput),
      salePrice: salePrice(item.id, recipesByOutput, lookup),
      purchasePrice: purchasePrice(item.id, recipesByOutput, lookup),
    }
  }
  return out
}
