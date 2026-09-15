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
 * 贅沢さによる回転率（P3 の受け皿）。**日用は速く捌け、贅沢はゆっくりしか捌けない。**
 *
 * ⚠ **旧い理由づけ（「これが無いと `利益/時間` が全品一定になる」。Phase 1 §5）は、
 *   2026-09-15 に消えた。**加工利益から時間が抜けたので、`利益/時間` はもう
 *   この係数とは関係なく品ごとに散る。**いま残っている理由はこちら**:
 *   **`LUXURY_PROFIT`（贅沢 1.7）と対で、「利益が大きい＝売れにくい」を作っている。**
 *   片方だけ消すと、贅沢品が利益と回転の両方で勝つ。
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
 * 売値     = 材料費 ＋ 加工利益
 * 加工利益 = PROFIT_SCALE × 升数^CELL_EXPONENT × 格の倍率
 * ```
 *
 * ⚠ **加工時間も tier も出力数も入らない**（PO 2026-09-15。計画 `price-model-rework.md`）。
 *
 * ## なぜ時間を外したか
 *
 * **ペルソナ4人全員が「時間は値段の理由にならない」と言った。**時間は `craft.ts` が
 * 1日の枠を削る形で既に払わせている。値段にも入れると、**同じ1つのつまみが
 * 「その日に何個作れるか」と「1個いくらか」の両方を動かす**ことになる。
 *
 * ## ⚠ なぜ tier を入れないか（二重計上になるから）
 *
 * **深さは、もう材料費が運んでいる。**材料費は下の段の売値の積み上げで、
 * **T7 の材料費には T2〜T6 の加工利益が全部入っている。**
 * さらに **tier と升数の相関は r = 0.659**（実測。T1〜T2 は 2.1升、T5 は 5.8、T7 は 9.0）なので、
 * **tier に係数を付けると、升数と材料費で既に払っているものを3度目に払うことになる。**
 *
 * ## ⚠ 出力数が値段から消えた帰結
 *
 * **「1回に4個できる品」は、1個あたりの値打ちが下がらなくなった。**
 * **まとめて作れることは、値打ちではなく生産の速さの利点になる**（PO 確認済み）。
 * ⚠ **材料費の側は今までどおり `outputQuantity` で割る**（1個あたりの材料費なので正しい）。
 */

/**
 * 升数の指数。**1 より少しだけ大きい。**
 *
 * ⚠ **旧 `PROFIT_EXPONENT`（0.6）とは意味が違う。**あれは**分**の指数で、
 *   **長いほど時間あたりが逓減する**ための 1 未満だった。これは**升**の指数で、
 *   **大きいほど升あたりが少しだけ増える**ための 1 超えである。向きが逆なので、
 *   **名前を変えてある**（`price-model-rework.md`）。
 *
 * ## なぜ「比例ちょうど」ではないか
 *
 * **1升あたりが同じなら、大きい品は「同じ単価で、置きにくいだけ」。**
 * 必ず小さい品に負け、かたちの意味が消える。**上乗せは欲ではなく、置きにくさへの対価。**
 *
 * ## ⚠ どこまで上げられるか（両側から挟まれている）
 *
 * `invariants.test.ts` の「盤面の総額」が**両向きに**留めている。
 * 4×4（16升）の盤面と 3×3（9升）の大きい品で:
 *
 * | | 式 | 条件 |
 * |---|---|---|
 * | **下限** | 混ぜた盤面 > 小さい品だけ ⟺ `9^k > 9` | **k > 1** |
 * | **上限** | 大きい品だけ（7升が死ぬ）< 小さい品だけ ⟺ `9^k < 16` | **k < 1.262** |
 *
 * **1.2 はこの幅の上寄り**で、いちばん大きい品でも**升あたりの上乗せは `9^0.2 = 1.552倍`**。
 * ⚠ **1.262 を超えると「大きい品だけ」に一本化して、かたちの意味が消える**（経営シム好き）。
 *   `invariants.test.ts` の「盤面の総額」が両向きに留めているので、**超えたら落ちる。**
 *
 * ⚠ **1.1 から上げた**（段4 の置き直し 2026-09-15 ／ `stage4-rebalance-160-200.md`）。
 *   **大きい升の品ほど取り分が増える**ようにしたのは、方針5「低tier は少ない升＋薄い全体ボーナス／
 *   高tier は大きい升＋濃い個別ボーナス」の**升の側**を、値段でも裏打ちするため。
 *   ⚠ **これは tier ではなく升数に効かせている**（2重計上しない。`questions-tier-in-price.md`）。
 */
const CELL_EXPONENT = 1.2

/**
 * 利益額の目盛り。
 *
 * ⚠ **5.5 → 9.0 に上げた**（段4 の置き直し 2026-09-15 ／ `stage4-rebalance-160-200.md`）。
 *   **これが到達日を決めるほぼ唯一のつまみ。**目標 2,000,000 への到達日（測る道具・種7/11）:
 *
 * | 遊び方 | 5.5・k=1.1 | **9.0・k=1.2** |
 * |---|---|---|
 * | 取り合わせを狙う | 180 | **147 / 149** |
 * | 浅い品だけ作る | 260 | **197 / 197** |
 * | 深い品を作る | 297 | **236 / 232** |
 * | 全部転売 | 329 | **329 / 335（動かない）** |
 *
 * ⚠ **`全部転売` が動かないのは正しい。**tier1 の売値は `basePrice × LUXURY_PRICE` で、
 *   ここを1つも通らない。**加工しない遊び方に 層1 の水準が効かない**のは、
 *   方針3「購入と**加工**をベース」がそのまま出た形である。
 *
 * ⚠ **以前ここには「全106レシピの加工利益の中央値を、作り替える前（20.19）に合わせてある」
 *   と書いてあった**（底が 分 15〜480 → 升 1〜9 に変わったときの引き継ぎ値。5.54 → 5.5）。
 *   **あれは作り替えの前後をつなぐための値で、遊びの狙いから出た値ではない。**
 *   **いまの 9.0 は到達日から決めている。**
 */
const PROFIT_SCALE = 9.0

/**
 * 格（贅沢さ）の利益係数。**回転率（LUXURY_TURNOVER）と対になっている。**
 *
 *   日用: 利益は小さいがよく売れる ／ 贅沢: 利益は大きいが売れにくい
 *
 * ⚠ **価格差を広げすぎないこと。**広げると贅沢品が利益・回転の両方で勝ってしまう。
 */
const LUXURY_PROFIT: Record<Luxury, number> = { 日用: 0.9, 上等: 1.1, 贅沢: 1.7 }

/**
 * 1回の加工で生む利益（出力1個あたり）。材料費を含まない。
 *
 * ⚠ **引数にレシピを取らない。**時間も出力数も入らなくなったので、
 *   **レシピを見る理由が1つも無い。**残すと「そのうち何かに使う」で戻ってくる。
 */
export function craftProfit(item: ItemDef): number {
  return PROFIT_SCALE * Math.pow(cellCount(item), CELL_EXPONENT) * LUXURY_PROFIT[item.luxury]
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
  return Math.round(materialCost + craftProfit(item))
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
  // ⚠ **救済の品（買値0）もここは `PURCHASE_RATE` のまま。**ここを実際の買値に替えると、
  //   **救済の品だけ売値の全部が粗利になって倍率がまるごと乗る**（5レン → 倍率2倍で 10レン）。
  //   **店に並べたくないものを、並べ方で伸ばせるようにしない。**
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
  return Math.round(materialCost + craftProfit(item) * priceModifier)
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
 * ⚠ **例外がひとつある** —— **救済の品（`isRescueItem`）だけは買値0。**
 *   **率が3つ目に増えたのではない**（率ではなく、品を1つ名指しした例外である）。
 *   **数えるなら「率2つ ＋ 名指しの例外1品」。**下の `isRescueItem` に理由を書いた。
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
/** 全品共通。**tier による場合分けは無い**（例外は下の `isRescueItem` 1品だけ） */
export const PURCHASE_RATE = 0.7

/**
 * **ただで買える救済の品**（PO 判断 2026-09-15「ただで買えてすごい安く売れるもの」）。
 *
 * ⚠ **ここが唯一の例外の置き場所。**「買値 = 売値 × `PURCHASE_RATE` × 産地割引」は
 *   **全品一律**が売りで、その一律さが「作る > 転売」を式1行で保証している
 *   （上の注記）。**詰みを無くすにはただで買える品が要る**ので、
 *   **率を1つ増やすのではなく、品を1つ名指しして 0 にする。**
 *
 * ⚠ **品ごとに散らさないこと。**「この品は安い」「あの品は高い」を足し始めると、
 *   **何を買うか**の理由が需要表（`islands.ts`）と産地割引の外にも散る。
 *   **救済はゲームの仕掛けであって、値段の決まり方ではない。**
 * ⚠ **`isRescueItem` が真の品を増やさない。**増やすなら
 *   「救済の品は1つ」という前提から見直すこと。**1品なら棚の1区画ぶんしか稼げない**
 *   （`PlacementManager.isDisplayed`）が、**増やすとそのぶん天井も上がる。**
 * ⚠ **符号は崩れない。**この品を材料とするレシピは1本も無いので、
 *   **転売側の買値にも材料費にも現れない**（`ItemRegistry.test.ts` が4島 × 全レシピで見ている）。
 */
export const RESCUE_ITEM_ID: ItemId = 'sand'

/** その品が救済の品か。**買値0 の例外はこの1本だけ**（`purchasePrice`） */
export function isRescueItem(itemId: ItemId): boolean {
  return itemId === RESCUE_ITEM_ID
}

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
  // ⚠ **例外はここ1行だけ**（`isRescueItem` の注記）。**産地割引より先に見る**ので、
  //   島によって 0 が 0 でなくなることは無い
  if (isRescueItem(itemId)) return 0
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
 *   が壊れる（→ `rules.ts` の `SET_RULES` の R5）。**1つに定まるときだけ**にすると
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
