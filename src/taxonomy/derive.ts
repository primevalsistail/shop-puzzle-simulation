/**
 * Cycle 4 / Phase 3 — 導出（INV-3）
 *
 * ここにあるものは ItemDef に**書かない**。関数で出す。
 *   - tier          … ALL_RECIPES から
 *   - 売値           … tier1 は基準値から、tier2以上は材料から積み上げ
 *   - 何から作れるか / 何に使えるか
 *   - 材料を遡った産地 … ALL_RECIPES ＋ 素材の産地から（#37）
 *
 * 判定（INV-3）: ItemDef の型に tier / price のフィールドが存在しないこと。→ axes.ts
 */

import type { ItemDef, ItemId, Luxury, Origin, RecipeDef } from './axes.js'
import type { IslandName } from './islands.js'
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
 * ⚠ 数値は一度置いたもので、調整していない。
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

// ─── 加工利益 ─────────────────────────────────────────
/**
 * 加工利益の係数。**利益は材料費と切り離す。**
 *
 * ```
 * 売値 = 材料費 + 加工利益
 * 加工利益 P = PROFIT_SCALE × 所要分^PROFIT_EXPONENT × 贅沢さの利益係数
 * ```
 *
 * **利益を材料費から切り離すのが要。**比例させると「高価な材料に短い仕上げを1回足す」が
 * 常に最強になり、実測で利益の開きが186倍まで開く。切り離すと利益の幅は `所要分^α` だけで決まり、
 * 所要分の幅48倍が `48^0.6 ≈ 10倍` に縮んで、**升目の幅6倍と釣り合う桁になる。**
 *
 * `α < 1` なので:
 * - 所要が長いほど**利益額**は増える
 * - ただし**時間あたり利益**は逓減する
 *
 * → **短時間加工＝時間効率がよい／長時間加工＝1回の利益額が大きい**、という役割分担ができる。
 *
 * ⚠ **贅沢の利益係数は 1.7 が要る。**回転率 0.45 を補えないと、贅沢が
 *   2資源（時間・升目）のパレートフロンティアから消える。
 * ⚠ **数値（α・係数・PROFIT_SCALE）は調整していない。**
 */
const PROFIT_EXPONENT = 0.6

/** 利益額の目盛り */
const PROFIT_SCALE = 5.6

/**
 * 贅沢さの利益係数。**回転率（LUXURY_TURNOVER）と対になっている。**
 *
 *   日用: 利益は小さいがよく売れる ／ 贅沢: 利益は大きいが売れにくい
 *
 * ⚠ **価格差を広げすぎないこと。**広げると贅沢品が利益・回転の両方で勝ってしまう。
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
 *   売値全体に乗せると、**高価な材料の品ほど配置ボーナスの絶対額も大きくなり**、高価格品が有利になる。
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
  // tier1 も「倍率は粗利にだけ乗る」に揃える。
  // ⚠ 売値全体に乗せると、**値段の強化が生売りだけを不当に強くする**（倍率2倍で 2.0倍 vs 3.1倍）。
  if (!recipe) {
    const sale = salePrice(itemId, recipesByOutput, lookup)
    const cost = sale * PURCHASE_RATE
    return Math.round(cost + (sale - cost) * priceModifier)
  }

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
 * 仕入れ値。**その島の中で率は2つだけ**（素の `PURCHASE_RATE` と、産地割引を掛けたもの）。
 *
 * ## なぜ率を1本に保つのか
 *
 * これだけで「**買ってそのまま売っても薄利で成立。ただし材料を買って作るほうが儲かる**」が
 * 自動的に成立する。式で1行:
 *
 * ```
 * 作る利益 − 転売利益 ＝ 加工利益 × 買値率     … 買値率が正である限り常に正
 * ```
 *
 * 実測で **4島 ＋ 割引なし の5通り × 全レシピすべてが「作る > 転売」**。
 * 例外条件も、tier ごとの場合分けも要らない（`ItemRegistry.test.ts` が常時見ている）。
 *
 * さらに**連鎖を1段深くするごとに、その段の「加工利益 × 買値率」が上乗せされる**ので、
 * **深く作るほど取り分が増える** —— 深さの報酬がここから出る
 * （蕎麦粉のパン: 転売 +50 ／ 材料を買って作る +106 ／ 材料も自分で作る **+124**）。
 *
 * ## 率を高めに置く理由（薄利にする）
 *
 * **薄利にするほど「どこで売るか」が効く。**売値S・需要1.3倍の島で売ったときの、仕入れに対する利益率:
 *
 * | 買値 | 普通の島 | 需要1.3倍の島 | 差 |
 * |---|---|---|---|
 * | 0.5S | 100% | 160% | 1.6倍 |
 * | **0.7S** | **43%** | **86%** | **2.0倍** |
 *
 * そして上の式のとおり、**率を上げるほど「作る」の優位も大きくなる**（優位 ＝ 加工利益 × 率）。
 *
 * ⚠ **品ごとに散らさない。**散らすと「何を買うか」と「どこで売るか」の2つの理由が混ざって
 *   読めなくなる。**差は需要表（islands.ts）と、下の産地割引に持たせる。**
 */
/** 全品共通。**tier による場合分けは無い** */
export const PURCHASE_RATE = 0.7

/**
 * **産地の島にいるときだけ掛かる割引**（段4-6）。`買値 = 売値 × PURCHASE_RATE × これ`。
 *
 * ## なぜ品ごとの例外を1つも書かずに済むか
 *
 * **産地を持つのは tier1 の一部だけで、加工品はすべて産地が `なし`**（旬を持たないため。#22）。
 * 産地と現在地の一致でしか割り引かないので、**割引は素材にしか当たらない。**
 * 「tier を見る」「加工品を除く」といった条件をどこにも書いていないのに、
 * **加工が転売に食われない**が成り立つ。その担保はこの1行ではなく `items.ts` のデータの形にある。
 *
 * ## 「作る > 転売」の符号は、割引で強くなる（弱くならない）
 *
 * レシピの出力は必ず tier2以上 ＝ 産地 `なし` なので、**転売側の買値は割引を受けない。**
 * 一方、材料側は産地の島で安くなる。
 *
 * ```
 * 作る利益 − 転売利益 ＝ 加工利益 × 買値率 ＋ (割り引かれた材料費の差)   … 割引が無い場合に一致
 * ```
 *
 * 実測: 割引 0.8 のもとで **4島 × 全レシピすべてで「作る > 転売」**
 * （→ aidlc-docs/construction/plans/stage4-price-gradient-result.md）。
 *
 * ⚠ **材料を遡った産地（`originReach`・#37）はここに効かせない。**効かせると加工品にも割引が乗り、
 *   上の「転売側の買値は割引を受けない」が崩れて**作る > 転売**の符号が保証できなくなる。
 * ⚠ **仮置き。#61 で測り直す。**「産地では2割引き」以上の根拠は無い。
 * ⚠ 島ごとに別の値を持たせないこと。持たせた瞬間に「どの島が得か」が需要表と二重になる。
 */
export const ORIGIN_DISCOUNT = 0.8

/**
 * 仕入れ値。`at` にいまいる島を渡すと、**その島を産地とする品だけ**割引が乗る。
 *
 * `at` を省くと割引なしの素の買値（一覧・ダンプ・不変条件の検査が使う）。
 */
export function purchasePrice(
  itemId: ItemId,
  at?: IslandName,
  recipesByOutput: ReadonlyMap<string, RecipeDef> = RECIPES_BY_OUTPUT,
  lookup: (id: ItemId) => ItemDef = getItem,
): number {
  const rate = PURCHASE_RATE * (isAtOrigin(itemId, at, lookup) ? ORIGIN_DISCOUNT : 1)
  return Math.round(salePrice(itemId, recipesByOutput, lookup) * rate)
}

/**
 * いまいる島がその品の産地か。
 *
 * ⚠ **品に島の名前を書き足してはいない。**`産地` は元からある軸（axes.ts 軸3）で、
 *   ここがやるのは値の一致を見ることだけ。評価器の D2・`stockedByIslandMerchant` と同じ形。
 */
export function isAtOrigin(
  itemId: ItemId,
  at: IslandName | undefined,
  lookup: (id: ItemId) => ItemDef = getItem,
): boolean {
  if (at === undefined) return false
  return lookup(itemId).origin === at
}

// ─── 材料を遡った産地（#37） ───────────────────────────
/**
 * **材料をすべて遡って、行き着く島が1つに定まる品は、その島の産。**
 * 2島以上が混ざる品と、島に行き着かない品（材料がすべて `なし`）は `なし`。
 *
 * これが無いと **R5・D2 だけが自分で作った品に当たらない。**隣接ボーナス6本のうち
 * R1〜R4・R6 は主種類・贅沢さ・tier を見るので作った品にも効くが、R5・D2 は産地を見ており、
 * **加工品は全品 `産地なし`**（旬を持たないため。#22）。**作り込むほどこの2本だけが消えていた。**
 *
 * ⚠ **「行き着く島の集合が交わるか」では見ない。**集合で見るとほとんどの加工品が当たり、
 *   ボーナスではなく**常にかかる下駄**になる。R5 の設計目標「並べ方で客足が動く幅は最大2倍」
 *   が壊れる（→ `rules.ts` の `SAME_ORIGIN_RULE`）。**1つに定まるときだけ**にすると
 *   結果が集合ではなく**1つの産地の値**になるので、**条件言語に「含む」を足す必要も無い。**
 *   評価器は今までどおり産地どうしを突き合わせるだけでよい。
 *
 * ⚠ **1段上の材料だけを見ない。必ず素材まで遡る。**
 *   例: 包丁 ＝ 鉄（2島が混ざる）＋ 白樺（ミフユリア）。1段上だけ見ると
 *   「島を持つ材料はミフユリアだけ」に見えるが、鉄が2島に行き着くので**包丁は `なし`**。
 *
 * ⚠ **`なし` の材料は島を足さないだけで、島を消さない。**
 *   例: バター ＝ 羊の乳（ハルヴェラ）＋ 塩（`なし`）→ **ハルヴェラ**。
 *
 * ⚠ **売値・仕入れ値には効かせない。**`salePrice` ／ `purchasePrice` ／ `isAtOrigin` は
 *   品に書いてある産地のままにする。効かせると INV-1「既存の品の属性が動かない」に触れ、
 *   さらに産地割引（`ORIGIN_DISCOUNT`）が加工品に乗って**作るより転売が得**になりうる。
 *   **効くのは R5・D2 の評価だけ**（evaluate.ts）。
 *
 * ⚠ **ItemDef に書き足さない**（INV-3。主材料を選んで書く形は #21・#22 で却下済み）。
 *
 * 実測（161品）: 素材48品はそのまま ＋ 加工品106品のうち**26品**が1島に定まり、
 * **当たるのは 74品**（ノアキータ12 ／ ハルヴェラ5 ／ リナツィア5 ／ ミフユリア4）。
 */
export function originReach(
  item: ItemDef,
  recipesByOutput: ReadonlyMap<string, RecipeDef> = RECIPES_BY_OUTPUT,
  lookup: (id: ItemId) => ItemDef = getItem,
): Origin {
  const reached = reachedIslands(item, recipesByOutput, lookup, new Set())
  return reached.size === 1 ? [...reached][0] : 'なし'
}

/**
 * その品が行き着く島の集合。**素材の産地だけを数え、`なし` は数えない。**
 *
 * ⚠ 循環したレシピは `tier` と同じく**その場で落とす**（黙って `なし` を返さない）。
 */
function reachedIslands(
  item: ItemDef,
  recipesByOutput: ReadonlyMap<string, RecipeDef>,
  lookup: (id: ItemId) => ItemDef,
  seen: ReadonlySet<ItemId>,
): Set<Origin> {
  if (seen.has(item.id)) {
    throw new Error(`Recipe cycle detected at: ${item.id}`)
  }
  const recipe = recipesByOutput.get(item.id)
  if (!recipe) return item.origin === 'なし' ? new Set() : new Set([item.origin])

  const next = new Set(seen).add(item.id)
  const reached = new Set<Origin>()
  for (const ing of recipe.ingredients) {
    for (const o of reachedIslands(lookup(ing.itemId), recipesByOutput, lookup, next)) {
      reached.add(o)
    }
  }
  return reached
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
      originReach: originReach(item, recipesByOutput, lookup),
      salePrice: salePrice(item.id, recipesByOutput, lookup),
      purchasePrice: purchasePrice(item.id, undefined, recipesByOutput, lookup),
    }
  }
  return out
}
