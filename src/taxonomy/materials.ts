import type { ItemId } from './axes.js'
import type { RecipeDef } from './axes.js'

/**
 * 「戻るまでに要る素材」を出す（#33）。
 *
 * 素材は**採れる島でしか買えず**、島を出ると **30日戻らない。**
 * いまは出てから初めて足りないと分かるので、**島にいるうちに見せる**ための計算。
 *
 * ⚠ **ここは純粋。**Phaser も現在地も知らない。島で絞るのは呼ぶ側の仕事。
 */

export interface MaterialNeed {
  /** その素材を（間接にでも）要するレシピの本数。**画面に出すのはこれ** */
  readonly recipes: number
  /**
   * 渡したレシピを**1回ずつ**作るのに要る数。
   *
   * ⚠ **画面に出さないこと。**誰も1回ずつは作らないので、
   *   「必要数」として出すと嘘になる（実測で綿 214個・稲わら 150個）。
   *   issue #33 の「最適解を教えない」にも反する。測るとき用に持っているだけ。
   */
  readonly quantity: number
}

/**
 * その品を**素材まで**展開する。
 *
 * ⚠ **展開に使うのは「作れるレシピ」だけ。**作り方を知らない品は**買うしかない**ので、
 *   そこで止めて「要るもの」に数える。**これが実際の不足と一致する。**
 *   全レシピで展開すると、知らない品まで「作れば済む」ことになって不足が消える。
 *
 * 戻り値は「素材 → 要る数」。
 */
export function expandToMaterials(
  itemId: ItemId,
  recipes: readonly RecipeDef[],
): Map<ItemId, number> {
  const byOutput = new Map<ItemId, RecipeDef>()
  for (const r of recipes) byOutput.set(r.outputItemId, r)
  return expand(itemId, byOutput, new Set())
}

function expand(
  itemId: ItemId,
  byOutput: Map<ItemId, RecipeDef>,
  onPath: Set<ItemId>,
): Map<ItemId, number> {
  const recipe = byOutput.get(itemId)
  // 作れない品 ＝ 買うしかない品。ここが葉になる。
  // ⚠ `onPath` は保険。tier はレシピから導出されるので輪はできないはずだが、
  //   データを手で足したときに無限に潜らないようにする
  if (!recipe || onPath.has(itemId)) return new Map([[itemId, 1]])

  const next = new Set(onPath).add(itemId)
  const out = new Map<ItemId, number>()
  for (const ing of recipe.ingredients) {
    for (const [id, n] of expand(ing.itemId, byOutput, next)) {
      out.set(id, (out.get(id) ?? 0) + n * ing.quantity)
    }
  }
  return out
}

/**
 * 渡したレシピ群が要する素材を、**本数と数**の両方で数える。
 *
 * `recipes` には**解禁済みのレシピ**を渡す。解禁は `everHeld`（手に入れたことがある品）で
 * 進むので、**プレイヤー自身の行動からすでに出ている**（新しい記録を足さない ＝ セーブが変わらない）。
 */
export function materialNeeds(recipes: readonly RecipeDef[]): Map<ItemId, MaterialNeed> {
  const byOutput = new Map<ItemId, RecipeDef>()
  for (const r of recipes) byOutput.set(r.outputItemId, r)

  const recipeCount = new Map<ItemId, number>()
  const quantity = new Map<ItemId, number>()
  for (const r of recipes) {
    for (const [id, n] of expand(r.outputItemId, byOutput, new Set())) {
      recipeCount.set(id, (recipeCount.get(id) ?? 0) + 1)
      quantity.set(id, (quantity.get(id) ?? 0) + n)
    }
  }

  const out = new Map<ItemId, MaterialNeed>()
  for (const [id, recipesNeeding] of recipeCount) {
    out.set(id, { recipes: recipesNeeding, quantity: quantity.get(id) ?? 0 })
  }
  return out
}
