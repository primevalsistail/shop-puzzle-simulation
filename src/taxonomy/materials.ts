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
   * 渡したレシピを**1回ずつ**作るのに要る数（出来高 `outputQuantity` 個ぶん）。
   *
   * ⚠ **画面に出さないこと。**誰も1回ずつは作らないので、
   *   「必要数」として出すと嘘になる（実測で綿 94.8個・稲わら 47.3個）。
   *   issue #33 の「最適解を教えない」にも反する。**費用の計算と測定のためだけ**に持つ。
   * ⚠ **端数が出る**（1回で2個できるレシピを3個ぶん使う、など）。整数と思って表示しない。
   */
  readonly quantity: number
}

/**
 * その品**1個**を作るのに要る素材を出す。
 *
 * ⚠ **展開に使うのは「作れるレシピ」だけ。**作り方を知らない品は**買うしかない**ので、
 *   そこで止めて「要るもの」に数える。**これが実際の不足と一致する。**
 *   全レシピで展開すると、知らない品まで「作れば済む」ことになって不足が消える。
 *
 * ⚠ **1回の加工は `outputQuantity` 個できる**（92本中64本が2個以上）。
 *   割らずに数えると**要る素材を最大4倍に見積もる。**
 *   端数は丸めない —— 3個要るのに1回で2個できるなら、**材料は1.5回ぶん**として扱う。
 *   （実際には2回まわして1個余るが、**余りは次に使える**ので、費用としては1.5回ぶんが正しい）
 *
 * 戻り値は「素材 → 1個あたりに要る数」。
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
  // ⚠ **1回で `outputQuantity` 個できる。**割らないと段ごとに最大4倍に膨らむ
  const perUnit = recipe.outputQuantity > 0 ? recipe.outputQuantity : 1
  for (const ing of recipe.ingredients) {
    for (const [id, n] of expand(ing.itemId, byOutput, next)) {
      out.set(id, (out.get(id) ?? 0) + (n * ing.quantity) / perUnit)
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
    // `expand` は1個あたりなので、1回ぶんに戻す
    const perRun = r.outputQuantity > 0 ? r.outputQuantity : 1
    for (const [id, n] of expand(r.outputItemId, byOutput, new Set())) {
      recipeCount.set(id, (recipeCount.get(id) ?? 0) + 1)
      quantity.set(id, (quantity.get(id) ?? 0) + n * perRun)
    }
  }

  const out = new Map<ItemId, MaterialNeed>()
  for (const [id, recipesNeeding] of recipeCount) {
    out.set(id, { recipes: recipesNeeding, quantity: quantity.get(id) ?? 0 })
  }
  return out
}

/**
 * その品**1個**を作るのに要る合計時間（分）。**材料を自分で作る時間も足す。**
 *
 * ⚠ **深く作るほど取り分が増えるが、時間も増える。**取り分だけ見せると、
 *   「材料も自分で作る」が**ただ得な選択に見えてしまう。**#23 はこの2つを並べて出す。
 *
 * 作れない品（買うしかない品）は 0 分。
 */
export function craftMinutes(
  itemId: ItemId,
  recipes: readonly RecipeDef[],
  /**
   * 品ごとの速さの倍率（**手際**）。既定は 1 ＝ 手際を見ない素の値（#53）。
   *
   * ⚠ **画面に出すなら必ず渡すこと。**渡さないと、工房の行が
   *   **手際を掛ける前の分数**を出し、**実際と最大3倍ずれる**（#53 で実測）。
   * ⚠ **関数で受けるのは `craft.ts` を読まないため。**あちらは `recipes.ts` を読むので、
   *   ここから読むと輪になる。
   */
  speedOf: (id: ItemId) => number = () => 1,
): number {
  const byOutput = new Map<ItemId, RecipeDef>()
  for (const r of recipes) byOutput.set(r.outputItemId, r)
  return minutesOf(itemId, byOutput, new Set(), speedOf)
}

function minutesOf(
  itemId: ItemId,
  byOutput: Map<ItemId, RecipeDef>,
  onPath: Set<ItemId>,
  speedOf: (id: ItemId) => number,
): number {
  const recipe = byOutput.get(itemId)
  if (!recipe || onPath.has(itemId)) return 0

  const next = new Set(onPath).add(itemId)
  // ⚠ **段ごとに掛ける。**深い段ほど手際の効きが違うので、合計に一度だけ掛けると合わない
  let total = recipe.durationMinutes * speedOf(recipe.outputItemId)
  for (const ing of recipe.ingredients) {
    total += minutesOf(ing.itemId, byOutput, next, speedOf) * ing.quantity
  }
  return total / (recipe.outputQuantity > 0 ? recipe.outputQuantity : 1)
}
