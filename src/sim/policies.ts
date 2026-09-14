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

import type { ItemDef, ItemId, RecipeDef } from '../taxonomy/axes.js'
import { cellCount, ingredientCost, salePrice, tier } from '../taxonomy/derive.js'
import { craftMinutes } from '../taxonomy/craft.js'
import type { BuyOrder, Policy, SimContext } from './SimWorld.js'

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

export const POLICIES: Record<string, Policy> = {
  resell: resellAll,
  shallow: shallowCraft,
  deep: deepCraft,
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
