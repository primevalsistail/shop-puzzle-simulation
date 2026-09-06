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

/**
 * 売値。
 *   tier1     : 基準値 × 贅沢さの倍率（P1）
 *   tier2以上 : (Σ 材料の売値) × 加工倍率（P2）— 加工倍率 > 1 である限り INV-6 を構造的に満たす
 *
 * 手書きは tier1 の基準値だけ。新レシピを足すと売値が自動で付く（INV-5 に強い）。
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
  return Math.round((ingredientTotal * recipe.craftMultiplier) / recipe.outputQuantity)
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
 * tier1 は素直に売値より安く仕入れる。tier2以上は材料費より高い値が付く。
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
  const perUnitCost = ingredientCost(recipe, recipesByOutput, lookup) / recipe.outputQuantity
  return Math.round(perUnitCost * recipe.craftMultiplier * CRAFTED_PURCHASE_MARKUP)
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
