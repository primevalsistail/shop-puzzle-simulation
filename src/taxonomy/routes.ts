import type { ItemId, RecipeDef } from './axes.js'
import type { IslandName } from './islands.js'
import { purchasePrice, finalPrice } from './derive.js'
import { speedMultiplier } from './craft.js'
import { expandToMaterials, craftMinutes } from './materials.js'

/**
 * 儲け方の3ルートを、**1本のレシピについて金額で出す**（#23）。
 *
 * 設計としては3ルートが成立しているのに、**遊んでいる側にそれが見えていない。**
 * 「手間をかけるほど儲かる」という構造に気づけないので、金額で並べて見せる。
 *
 * 関係は `derive.ts` が1行で持っている:
 *
 * ```
 * 作る利益 − 転売利益 ＝ 加工利益 × 買値率      … 買値率が正である限り常に正
 * ```
 *
 * ⚠ **新しい仕組みを足していない。**いまあるデータから出しているだけ。
 * ⚠ **これは目安。**実際の売上は配置の効き目と島の需要で変わる。
 * ⚠ **強化の利益率は `margin` で通す**（#76。持ち物一覧と同じ `finalPrice` を経由する）。
 *   **渡さないと、強化を買うほど一覧とずれていく。**
 *   **3ルートとも同じ倍率を通るので「作る > 転売」の順序は変わらない。**
 */
export interface RouteValues {
  /** ① 材料を買って、そのまま売る */
  readonly resell: number
  /** ② 材料を買って、作って売る */
  readonly craft: number
  /** ③ 材料も自分で作って、作って売る。作れる材料が無ければ `craft` と同じ */
  readonly deepCraft: number
  /** ② にかかる分 */
  readonly minutes: number
  /** ③ にかかる分（材料を作る時間も足す） */
  readonly deepMinutes: number
  /** ③ が ② と別の道になるか（作れる材料があるか） */
  readonly hasDeeper: boolean
}

/**
 * `recipe` を**1回**まわしたときの3ルート。
 *
 * `craftable` には**解禁済みのレシピ**を渡す。作り方を知らない材料は買うしかないので、
 * そこで展開が止まり、③ の金額が**いま実際にできること**と一致する。
 */
export function routeValues(
  recipe: RecipeDef,
  craftable: readonly RecipeDef[],
  at?: IslandName,
  /**
   * 値段の強化の倍率（#76）。**既定は 1 ＝ 強化なし。**
   *
   * ⚠ **持ち物一覧と揃えるために要る。**一覧は `finalPrice(id, margin)` を出しているので、
   *   ここだけ素の売値のままだと**強化を買うほど3ルートの数字がずれていく。**
   * ⚠ **倍率は粗利にだけ乗る**（`finalPrice` の中の話）。売値全体に乗せると生売りが不当に強くなる。
   *   3ルートとも同じ倍率を通るので、**「作る > 転売」の順序は変わらない。**
   */
  margin = 1,
  /**
   * 主人公の手際（#53）。**既定は無限大＝速さの倍率が下限に張り付く…ではなく、**
   * `undefined` のとき**手際を見ない素の分数**を返す（従来どおり）。
   *
   * ⚠ **画面に出すなら渡すこと。**渡さないと、行が**手際を掛ける前の分数**を出し、
   *   **実際と最大3倍ずれる**（#53 で実測）。**時間は値段なので、間違えると払う額を間違える。**
   */
  skill?: number,
): RouteValues {
  const speedOf = skill === undefined
    ? () => 1
    : (id: ItemId) => speedMultiplier(id, skill)
  const revenue = finalPrice(recipe.outputItemId, margin) * recipe.outputQuantity

  let directCost = 0
  let resell = 0
  let deepCost = 0
  let deeperMinutes = 0
  let hasDeeper = false

  for (const ing of recipe.ingredients) {
    const buy = purchasePrice(ing.itemId, at)
    directCost += buy * ing.quantity
    // ① 買った材料をそのまま売る
    resell += (finalPrice(ing.itemId, margin) - buy) * ing.quantity

    // ③ その材料も自分で作るなら、素材まで潜って買値を積む
    // ⚠ **材料側を展開する**こと。このレシピ自身が `craftable` に無くても成り立つ
    const mats = expandToMaterials(ing.itemId, craftable)
    let matCost = 0
    for (const [id, n] of mats) matCost += purchasePrice(id, at) * n
    deepCost += matCost * ing.quantity

    const extra = craftMinutes(ing.itemId, craftable, speedOf)
    if (extra > 0) hasDeeper = true
    deeperMinutes += extra * ing.quantity
  }

  return {
    resell: Math.round(resell),
    craft: Math.round(revenue - directCost),
    deepCraft: Math.round(revenue - deepCost),
    minutes: Math.round(recipe.durationMinutes * speedOf(recipe.outputItemId)),
    deepMinutes: Math.round(recipe.durationMinutes + deeperMinutes),
    hasDeeper,
  }
}

/** その品を材料に使うレシピがあるか（① で終わりではないことの印） */
export function isIngredient(itemId: ItemId, recipes: readonly RecipeDef[]): boolean {
  return recipes.some(r => r.ingredients.some(i => i.itemId === itemId))
}
