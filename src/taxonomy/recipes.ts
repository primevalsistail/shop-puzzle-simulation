/**
 * レシピ **92本**
 *
 * ⚠ **#86 で7本足した**（小麦粉・うどん ／ 麻糸・麻布・染めの麻布・麻の上着 ／ 染料）。
 *
 * 出どころ: aidlc-docs/inception/worldbuilding/crafted-goods.md
 *
 * ⚠ **このファイルに価格の情報は無い。**売値は derive.ts が出す:
 *
 *     売値（tier2以上） = 材料費 ＋ 加工利益
 *     加工利益          = 5.6 × (所要分/出力数)^0.6 × 贅沢さの利益係数
 *
 *   **INV-6（作った品は材料より高い）は、加工利益が常に正であることから定義的に成立する。**
 *   根拠は derive.ts:122 の `craftProfit`。
 *
 *   ⚠ **このファイルに価格の手書き数値を置かないこと。**利益を材料費に比例させると
 *   「高価な材料に短い仕上げを足す」が常に最強になる。
 *
 * ⚠ `durationMinutes` は **ゲーム内時間**であり、実時間の待ちではない（#25）。
 *   **上限は 480分**（実データの最大値も480）。起きている時間は 1080分/日 しかなく、
 *   #25 Q3=B で「その日のうちに終わらない加工は着手できない」と決めたため、
 *   1440分のレシピは着手不能になっていた（チーズ・干し肉・ぶどうの酒）。
 *   Phase 3 当時の 1440分 から尺度を縮めてある。
 *
 *   実際の所要時間はさらに手際で伸び縮みする（craft.ts の S−D 方式）:
 *     所要 = durationMinutes × clamp(2^((D − S) / 5), 0.25, 4.0)
 *
 * ⚠ 数値（所要時間・出力数）は一度置いたもので、調整していない。
 */

import type { RecipeDef } from './axes.js'

export const ALL_RECIPES: readonly RecipeDef[] = [

  // ── 食料 ──
  {
    id: 'recipe_buckwheat_flour', display: { name: '蕎麦粉をつくる' },
    outputItemId: 'buckwheat_flour', outputQuantity: 3,
    ingredients: [{ itemId: 'buckwheat', quantity: 3 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_olive_oil', display: { name: 'オリーブ油をつくる' },
    outputItemId: 'olive_oil', outputQuantity: 2,
    ingredients: [{ itemId: 'olive', quantity: 5 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_butter', display: { name: 'バターをつくる' },
    outputItemId: 'butter', outputQuantity: 2,
    ingredients: [{ itemId: 'sheep_milk', quantity: 4 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_cheese', display: { name: 'チーズをつくる' },
    outputItemId: 'cheese', outputQuantity: 2,
    ingredients: [{ itemId: 'sheep_milk', quantity: 5 }, { itemId: 'salt', quantity: 2 }],
    durationMinutes: 480,
  },
  {
    id: 'recipe_salted_salmon', display: { name: '塩鮭をつくる' },
    outputItemId: 'salted_salmon', outputQuantity: 3,
    ingredients: [{ itemId: 'salmon', quantity: 2 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_dried_meat', display: { name: '干し肉をつくる' },
    outputItemId: 'dried_meat', outputQuantity: 4,
    ingredients: [{ itemId: 'reindeer_meat', quantity: 2 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 480,
  },
  {
    id: 'recipe_strawberry_jam', display: { name: 'いちごのジャムをつくる' },
    outputItemId: 'strawberry_jam', outputQuantity: 2,
    ingredients: [{ itemId: 'strawberry', quantity: 4 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_boiled_crab', display: { name: 'かにの塩ゆでをつくる' },
    outputItemId: 'boiled_crab', outputQuantity: 1,
    ingredients: [{ itemId: 'crab', quantity: 1 }, { itemId: 'salt', quantity: 1 }, { itemId: 'ice', quantity: 2 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_mugwort_mochi', display: { name: 'よもぎ餅をつくる' },
    outputItemId: 'mugwort_mochi', outputQuantity: 4,
    ingredients: [{ itemId: 'rice', quantity: 2 }, { itemId: 'mugwort', quantity: 1 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_strawberry_shaved_ice', display: { name: 'いちごのかき氷をつくる' },
    outputItemId: 'strawberry_shaved_ice', outputQuantity: 2,
    ingredients: [{ itemId: 'ice', quantity: 3 }, { itemId: 'strawberry', quantity: 1 }],
    durationMinutes: 15,
  },
  {
    id: 'recipe_ice_cream', display: { name: 'アイスクリームをつくる' },
    outputItemId: 'ice_cream', outputQuantity: 3,
    ingredients: [{ itemId: 'sheep_milk', quantity: 2 }, { itemId: 'honey', quantity: 1 }, { itemId: 'ice', quantity: 3 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_grilled_corn', display: { name: '焼きとうもろこしをつくる' },
    outputItemId: 'grilled_corn', outputQuantity: 2,
    ingredients: [{ itemId: 'corn', quantity: 2 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_buckwheat_bread', display: { name: '蕎麦粉のパンをつくる' },
    outputItemId: 'buckwheat_bread', outputQuantity: 3,
    ingredients: [{ itemId: 'buckwheat_flour', quantity: 2 }, { itemId: 'honey', quantity: 1 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 300,
  },
  {
    id: 'recipe_walnut_biscuit', display: { name: 'くるみのビスケットをつくる' },
    outputItemId: 'walnut_biscuit', outputQuantity: 4,
    ingredients: [{ itemId: 'buckwheat_flour', quantity: 2 }, { itemId: 'walnut', quantity: 2 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_sardine_in_oil', display: { name: 'いわしのオイル漬けをつくる' },
    outputItemId: 'sardine_in_oil', outputQuantity: 3,
    ingredients: [{ itemId: 'sardine', quantity: 4 }, { itemId: 'olive_oil', quantity: 1 }, { itemId: 'salt', quantity: 1 }, { itemId: 'chili', quantity: 1 }],
    durationMinutes: 360,
  },
  {
    id: 'recipe_bean_meat_soup', display: { name: '豆と干し肉のスープをつくる' },
    outputItemId: 'bean_meat_soup', outputQuantity: 3,
    ingredients: [{ itemId: 'dried_meat', quantity: 1 }, { itemId: 'broad_bean', quantity: 3 }, { itemId: 'enoki', quantity: 2 }, { itemId: 'kelp', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_crab_gratin', display: { name: 'かにのグラタンをつくる' },
    outputItemId: 'crab_gratin', outputQuantity: 2,
    ingredients: [{ itemId: 'boiled_crab', quantity: 1 }, { itemId: 'butter', quantity: 1 }, { itemId: 'buckwheat_flour', quantity: 1 }, { itemId: 'sheep_milk', quantity: 2 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_salmon_rice_ball', display: { name: '鮭のおにぎりをつくる' },
    outputItemId: 'salmon_rice_ball', outputQuantity: 3,
    ingredients: [{ itemId: 'rice', quantity: 2 }, { itemId: 'salted_salmon', quantity: 1 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_salmon_sandwich', display: { name: '鮭のサンドイッチをつくる' },
    outputItemId: 'salmon_sandwich', outputQuantity: 2,
    ingredients: [{ itemId: 'buckwheat_bread', quantity: 1 }, { itemId: 'salted_salmon', quantity: 1 }, { itemId: 'rape_blossom', quantity: 1 }, { itemId: 'lemon', quantity: 1 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_jam_bun', display: { name: 'ジャムパンをつくる' },
    outputItemId: 'jam_bun', outputQuantity: 2,
    ingredients: [{ itemId: 'buckwheat_bread', quantity: 1 }, { itemId: 'strawberry_jam', quantity: 1 }],
    durationMinutes: 90,
  },

  // ⚠ **#86。**小麦粉は蕎麦粉と同じ形（穀 ×3 → 粉）で置いた。**新しい倍率は作っていない。**
  //   パンは足さない（蕎麦粉のパンが既にある）。小麦でしか出ない方向＝**つながる粉＝麺**だけを足す。
  {
    id: 'recipe_wheat_flour', display: { name: '小麦粉をつくる' },
    outputItemId: 'wheat_flour', outputQuantity: 3,
    ingredients: [{ itemId: 'wheat', quantity: 3 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_udon', display: { name: 'うどんをつくる' },
    outputItemId: 'udon', outputQuantity: 3,
    ingredients: [{ itemId: 'wheat_flour', quantity: 2 }, { itemId: 'salt', quantity: 1 }, { itemId: 'kelp', quantity: 1 }],
    durationMinutes: 180,
  },

  // ── 飲みもの ──
  {
    id: 'recipe_mugwort_tea', display: { name: 'よもぎの茶をつくる' },
    outputItemId: 'mugwort_tea', outputQuantity: 2,
    ingredients: [{ itemId: 'mugwort', quantity: 2 }, { itemId: 'tea_leaf', quantity: 1 }],
    durationMinutes: 30,
  },
  {
    id: 'recipe_mint_tea', display: { name: 'ミントの茶をつくる' },
    outputItemId: 'mint_tea', outputQuantity: 2,
    ingredients: [{ itemId: 'mint', quantity: 2 }, { itemId: 'tea_leaf', quantity: 1 }],
    durationMinutes: 30,
  },
  {
    id: 'recipe_lemon_tea', display: { name: 'レモンの茶をつくる' },
    outputItemId: 'lemon_tea', outputQuantity: 2,
    ingredients: [{ itemId: 'tea_leaf', quantity: 2 }, { itemId: 'lemon', quantity: 1 }],
    durationMinutes: 30,
  },
  {
    id: 'recipe_honey_lemon', display: { name: '蜂蜜レモンをつくる' },
    outputItemId: 'honey_lemon', outputQuantity: 2,
    ingredients: [{ itemId: 'lemon', quantity: 2 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 45,
  },
  {
    id: 'recipe_grape_juice', display: { name: 'ぶどうの果汁をつくる' },
    outputItemId: 'grape_juice', outputQuantity: 2,
    ingredients: [{ itemId: 'grape', quantity: 4 }],
    durationMinutes: 45,
  },
  {
    id: 'recipe_chilled_apple_water', display: { name: '冷たいりんご水をつくる' },
    outputItemId: 'chilled_apple_water', outputQuantity: 2,
    ingredients: [{ itemId: 'apple', quantity: 3 }, { itemId: 'ice', quantity: 2 }],
    durationMinutes: 30,
  },
  {
    id: 'recipe_honey_milk', display: { name: '蜂蜜の乳をつくる' },
    outputItemId: 'honey_milk', outputQuantity: 2,
    ingredients: [{ itemId: 'sheep_milk', quantity: 2 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 20,
  },
  {
    id: 'recipe_iced_mint_tea', display: { name: '冷たいミントの茶をつくる' },
    outputItemId: 'iced_mint_tea', outputQuantity: 2,
    ingredients: [{ itemId: 'mint_tea', quantity: 1 }, { itemId: 'ice', quantity: 2 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 15,
  },
  {
    id: 'recipe_salted_lemon_water', display: { name: '塩レモン水をつくる' },
    outputItemId: 'salted_lemon_water', outputQuantity: 2,
    ingredients: [{ itemId: 'honey_lemon', quantity: 1 }, { itemId: 'salt', quantity: 1 }, { itemId: 'ice', quantity: 2 }],
    durationMinutes: 15,
  },
  {
    id: 'recipe_grape_wine', display: { name: 'ぶどうの酒をつくる' },
    outputItemId: 'grape_wine', outputQuantity: 2,
    ingredients: [{ itemId: 'grape_juice', quantity: 2 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 480,
  },
  {
    id: 'recipe_strawberry_milk', display: { name: 'いちごの乳をつくる' },
    outputItemId: 'strawberry_milk', outputQuantity: 2,
    ingredients: [{ itemId: 'honey_milk', quantity: 1 }, { itemId: 'strawberry', quantity: 3 }],
    durationMinutes: 30,
  },
  {
    id: 'recipe_chestnut_milk', display: { name: '栗の乳をつくる' },
    outputItemId: 'chestnut_milk', outputQuantity: 2,
    ingredients: [{ itemId: 'honey_milk', quantity: 1 }, { itemId: 'chestnut', quantity: 3 }],
    durationMinutes: 45,
  },
  {
    id: 'recipe_iced_mint_milk_tea', display: { name: '冷たいミントの乳茶をつくる' },
    outputItemId: 'iced_mint_milk_tea', outputQuantity: 2,
    ingredients: [{ itemId: 'mint_tea', quantity: 1 }, { itemId: 'sheep_milk', quantity: 2 }, { itemId: 'ice', quantity: 2 }],
    durationMinutes: 20,
  },
  {
    id: 'recipe_mulled_wine', display: { name: '温めたぶどうの酒をつくる' },
    outputItemId: 'mulled_wine', outputQuantity: 2,
    ingredients: [{ itemId: 'grape_wine', quantity: 1 }, { itemId: 'lemon', quantity: 1 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 30,
  },
  {
    id: 'recipe_iced_strawberry_milk', display: { name: '冷たいいちごの乳をつくる' },
    outputItemId: 'iced_strawberry_milk', outputQuantity: 2,
    ingredients: [{ itemId: 'strawberry_milk', quantity: 1 }, { itemId: 'ice', quantity: 2 }],
    durationMinutes: 15,
  },

  // ── 衣類 ──
  {
    id: 'recipe_wool_yarn', display: { name: '毛糸をつくる' },
    outputItemId: 'wool_yarn', outputQuantity: 2,
    ingredients: [{ itemId: 'wool', quantity: 3 }],
    durationMinutes: 60,
  },
  {
    id: 'recipe_cotton_yarn', display: { name: '木綿糸をつくる' },
    outputItemId: 'cotton_yarn', outputQuantity: 2,
    ingredients: [{ itemId: 'cotton', quantity: 3 }],
    durationMinutes: 60,
  },
  // ⚠ **#86 の麻の系統。**糸は木綿糸と同じ形（繊維 ×3 → 糸 ×2 / 60分）で置いた。
  {
    id: 'recipe_hemp_yarn', display: { name: '麻糸をつくる' },
    outputItemId: 'hemp_yarn', outputQuantity: 2,
    ingredients: [{ itemId: 'hemp', quantity: 3 }],
    durationMinutes: 60,
  },
  {
    id: 'recipe_hemp_cloth', display: { name: '麻布をつくる' },
    outputItemId: 'hemp_cloth', outputQuantity: 2,
    ingredients: [{ itemId: 'hemp_yarn', quantity: 3 }, { itemId: 'pumice', quantity: 1 }],
    durationMinutes: 150,
  },
  {
    id: 'recipe_wool_felt', display: { name: '羊毛のフェルトをつくる' },
    outputItemId: 'wool_felt', outputQuantity: 1,
    ingredients: [{ itemId: 'wool', quantity: 2 }, { itemId: 'rabbit_fur', quantity: 1 }],
    durationMinutes: 120,
  },
  {
    id: 'recipe_antler_belt', display: { name: '角留めの革帯をつくる' },
    outputItemId: 'antler_belt', outputQuantity: 2,
    ingredients: [{ itemId: 'reindeer_hide', quantity: 2 }, { itemId: 'reindeer_antler', quantity: 1 }, { itemId: 'persimmon', quantity: 1 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_canvas', display: { name: '木綿の帆布をつくる' },
    outputItemId: 'canvas', outputQuantity: 1,
    ingredients: [{ itemId: 'cotton_yarn', quantity: 3 }, { itemId: 'persimmon', quantity: 2 }, { itemId: 'pumice', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_wool_scarf', display: { name: '毛糸の襟巻きをつくる' },
    outputItemId: 'wool_scarf', outputQuantity: 1,
    ingredients: [{ itemId: 'wool_yarn', quantity: 2 }, { itemId: 'grape', quantity: 1 }],
    durationMinutes: 120,
  },
  {
    id: 'recipe_felt_hat', display: { name: 'フェルトの帽子をつくる' },
    outputItemId: 'felt_hat', outputQuantity: 1,
    ingredients: [{ itemId: 'wool_felt', quantity: 1 }, { itemId: 'wool_yarn', quantity: 1 }, { itemId: 'walnut', quantity: 1 }, { itemId: 'gull_feather', quantity: 2 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_cotton_shirt', display: { name: '木綿のシャツをつくる' },
    outputItemId: 'cotton_shirt', outputQuantity: 1,
    ingredients: [{ itemId: 'cotton_yarn', quantity: 4 }, { itemId: 'reindeer_antler', quantity: 2 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_leather_sandals', display: { name: '革のサンダルをつくる' },
    outputItemId: 'leather_sandals', outputQuantity: 2,
    ingredients: [{ itemId: 'reindeer_hide', quantity: 2 }, { itemId: 'cotton_yarn', quantity: 1 }, { itemId: 'beeswax', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_fur_lined_gloves', display: { name: '毛皮裏の革手袋をつくる' },
    outputItemId: 'fur_lined_gloves', outputQuantity: 2,
    ingredients: [{ itemId: 'reindeer_hide', quantity: 2 }, { itemId: 'rabbit_fur', quantity: 1 }, { itemId: 'wool_yarn', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_fur_lined_coat', display: { name: '毛皮裏の外套をつくる' },
    outputItemId: 'fur_lined_coat', outputQuantity: 1,
    ingredients: [{ itemId: 'wool_felt', quantity: 2 }, { itemId: 'rabbit_fur', quantity: 2 }, { itemId: 'reindeer_antler', quantity: 3 }, { itemId: 'olive', quantity: 1 }],
    durationMinutes: 360,
  },
  {
    id: 'recipe_canvas_sun_hat', display: { name: '帆布の日よけ帽子をつくる' },
    outputItemId: 'canvas_sun_hat', outputQuantity: 1,
    ingredients: [{ itemId: 'canvas', quantity: 1 }, { itemId: 'cotton_yarn', quantity: 1 }, { itemId: 'mugwort', quantity: 2 }],
    durationMinutes: 300,
  },
  {
    id: 'recipe_canvas_apron', display: { name: '帆布の前掛けをつくる' },
    outputItemId: 'canvas_apron', outputQuantity: 1,
    ingredients: [{ itemId: 'canvas', quantity: 1 }, { itemId: 'wool_yarn', quantity: 1 }, { itemId: 'reindeer_antler', quantity: 2 }],
    durationMinutes: 300,
  },
  {
    id: 'recipe_waxed_raincoat', display: { name: '蜜蝋引きの合羽をつくる' },
    outputItemId: 'waxed_raincoat', outputQuantity: 1,
    ingredients: [{ itemId: 'canvas', quantity: 2 }, { itemId: 'beeswax', quantity: 3 }, { itemId: 'reindeer_antler', quantity: 2 }],
    durationMinutes: 300,
  },
  {
    id: 'recipe_leather_satchel', display: { name: '革の肩掛け鞄をつくる' },
    outputItemId: 'leather_satchel', outputQuantity: 1,
    ingredients: [{ itemId: 'reindeer_hide', quantity: 3 }, { itemId: 'canvas', quantity: 1 }, { itemId: 'antler_belt', quantity: 1 }, { itemId: 'beeswax', quantity: 1 }],
    durationMinutes: 300,
  },
  // ⚠ **染めは1本だけ**（#86）。色ごとにレシピを分けない。
  {
    id: 'recipe_dyed_hemp_cloth', display: { name: '麻布を染める' },
    outputItemId: 'dyed_hemp_cloth', outputQuantity: 1,
    ingredients: [{ itemId: 'hemp_cloth', quantity: 1 }, { itemId: 'dye', quantity: 1 }],
    durationMinutes: 120,
  },
  {
    // ⚠ **暑い土地の終点（tier5）。**染めの麻布（tier4）が段を決めている。
    id: 'recipe_hemp_jacket', display: { name: '麻の上着をしたてる' },
    outputItemId: 'hemp_jacket', outputQuantity: 1,
    ingredients: [{ itemId: 'dyed_hemp_cloth', quantity: 1 }, { itemId: 'hemp_yarn', quantity: 2 }, { itemId: 'reindeer_antler', quantity: 1 }],
    durationMinutes: 180,
  },

  // ── 道具 ──
  {
    id: 'recipe_rope', display: { name: '縄をつくる' },
    outputItemId: 'rope', outputQuantity: 3,
    ingredients: [{ itemId: 'rice_straw', quantity: 3 }],
    durationMinutes: 45,
  },
  {
    id: 'recipe_file', display: { name: 'やすりをつくる' },
    outputItemId: 'file', outputQuantity: 2,
    ingredients: [{ itemId: 'pumice', quantity: 2 }, { itemId: 'pine', quantity: 1 }],
    durationMinutes: 60,
  },
  {
    id: 'recipe_broom', display: { name: 'ほうきをつくる' },
    outputItemId: 'broom', outputQuantity: 2,
    ingredients: [{ itemId: 'rice_straw', quantity: 2 }, { itemId: 'bamboo', quantity: 1 }],
    durationMinutes: 60,
  },
  {
    id: 'recipe_brush', display: { name: '筆をつくる' },
    outputItemId: 'brush', outputQuantity: 3,
    ingredients: [{ itemId: 'rabbit_fur', quantity: 1 }, { itemId: 'bamboo', quantity: 1 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_candle', display: { name: 'ろうそくをつくる' },
    outputItemId: 'candle', outputQuantity: 4,
    ingredients: [{ itemId: 'beeswax', quantity: 3 }, { itemId: 'cotton', quantity: 1 }],
    durationMinutes: 60,
  },
  {
    id: 'recipe_umbrella', display: { name: '傘をつくる' },
    outputItemId: 'umbrella', outputQuantity: 1,
    ingredients: [{ itemId: 'bamboo', quantity: 2 }, { itemId: 'cotton', quantity: 3 }, { itemId: 'sunflower_seed', quantity: 2 }],
    durationMinutes: 150,
  },
  {
    id: 'recipe_basket', display: { name: 'かごをつくる' },
    outputItemId: 'basket', outputQuantity: 2,
    ingredients: [{ itemId: 'birch', quantity: 2 }, { itemId: 'rope', quantity: 1 }],
    durationMinutes: 150,
  },
  {
    id: 'recipe_wooden_bowl', display: { name: '木の椀をつくる' },
    outputItemId: 'wooden_bowl', outputQuantity: 2,
    ingredients: [{ itemId: 'driftwood', quantity: 2 }, { itemId: 'file', quantity: 1 }, { itemId: 'olive', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_comb', display: { name: '櫛をつくる' },
    outputItemId: 'comb', outputQuantity: 2,
    ingredients: [{ itemId: 'reindeer_antler', quantity: 1 }, { itemId: 'file', quantity: 1 }, { itemId: 'walnut', quantity: 1 }],
    durationMinutes: 240,
  },
  {
    id: 'recipe_fishing_rod', display: { name: '釣りざおをつくる' },
    outputItemId: 'fishing_rod', outputQuantity: 1,
    ingredients: [{ itemId: 'bamboo', quantity: 2 }, { itemId: 'rope', quantity: 1 }, { itemId: 'gull_feather', quantity: 1 }],
    durationMinutes: 240,
  },
  // ⚠ **材料は藍だけ**（#86）。蕎麦粉・オリーブ油と同じ「素材1つを寝かせて絞る」形で、
  //   **新しい倍率も例外も作っていない。**
  {
    id: 'recipe_dye', display: { name: '染料をつくる' },
    outputItemId: 'dye', outputQuantity: 2,
    ingredients: [{ itemId: 'indigo', quantity: 4 }],
    durationMinutes: 240,
  },
  // ══════ 道具の10品 ══════
  {
    id: 'recipe_straw_mat', display: { name: '稲わらのむしろをつくる' },
    outputItemId: 'straw_mat', outputQuantity: 2,
    ingredients: [{ itemId: 'rice_straw', quantity: 4 }, { itemId: 'rope', quantity: 1 }],
    durationMinutes: 60,
  },
  {
    id: 'recipe_pine_barrel', display: { name: '松の桶をつくる' },
    outputItemId: 'pine_barrel', outputQuantity: 2,
    ingredients: [{ itemId: 'pine', quantity: 3 }, { itemId: 'rope', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_drying_net', display: { name: '竹の干し網をつくる' },
    outputItemId: 'drying_net', outputQuantity: 2,
    ingredients: [{ itemId: 'bamboo', quantity: 2 }, { itemId: 'rope', quantity: 2 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_canvas_sack', display: { name: '帆布の袋をつくる' },
    outputItemId: 'canvas_sack', outputQuantity: 3,
    ingredients: [{ itemId: 'canvas', quantity: 1 }, { itemId: 'rope', quantity: 2 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_bamboo_fan', display: { name: '竹の団扇をつくる' },
    outputItemId: 'bamboo_fan', outputQuantity: 3,
    ingredients: [{ itemId: 'bamboo', quantity: 1 }, { itemId: 'gull_feather', quantity: 2 }],
    durationMinutes: 45,
  },
  {
    id: 'recipe_bamboo_blind', display: { name: '竹の簾をつくる' },
    outputItemId: 'bamboo_blind', outputQuantity: 2,
    ingredients: [{ itemId: 'bamboo', quantity: 3 }, { itemId: 'rope', quantity: 1 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_pine_firewood', display: { name: '松の薪をつくる' },
    outputItemId: 'pine_firewood', outputQuantity: 4,
    ingredients: [{ itemId: 'pine', quantity: 2 }],
    durationMinutes: 30,
  },
  {
    id: 'recipe_wool_rug', display: { name: '羊毛の敷物をつくる' },
    outputItemId: 'wool_rug', outputQuantity: 1,
    ingredients: [{ itemId: 'wool_felt', quantity: 2 }, { itemId: 'rope', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_bamboo_flask', display: { name: '竹の水筒をつくる' },
    outputItemId: 'bamboo_flask', outputQuantity: 2,
    ingredients: [{ itemId: 'bamboo', quantity: 2 }, { itemId: 'beeswax', quantity: 1 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_carrying_basket', display: { name: '背負い籠をつくる' },
    outputItemId: 'carrying_basket', outputQuantity: 1,
    ingredients: [{ itemId: 'basket', quantity: 1 }, { itemId: 'rope', quantity: 1 }, { itemId: 'cotton_yarn', quantity: 1 }],
    durationMinutes: 120,
  },
  // ── `実りの土地` の母数を埋める2本 ──
  {
    id: 'recipe_straw_bale', display: { name: '稲わらの俵をつくる' },
    outputItemId: 'straw_bale', outputQuantity: 2,
    ingredients: [{ itemId: 'rice_straw', quantity: 4 }, { itemId: 'rope', quantity: 2 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_bamboo_sieve', display: { name: '竹のざるをつくる' },
    outputItemId: 'bamboo_sieve', outputQuantity: 3,
    ingredients: [{ itemId: 'bamboo', quantity: 3 }, { itemId: 'rope', quantity: 1 }],
    durationMinutes: 45,
  },

  // ══════ tier5〜7（段5）13本 ══════
  //
  // ⚠ **材料はすべて既成の品。**素材も軸も足していない。
  //   深い段がやっているのは「**すでに作った品を組み上げて一式にする**」ことだけ。
  //
  // ⚠ **所要時間の上限を 300分に置いた。**深い品ほど難易度 D = tier×5 が高く、
  //   `craft.ts` の着手条件（D <= 手際 + 8）をぎりぎり満たす手際では
  //   所要が `2^(8/5) ≈ 3.03倍` に伸びる。起きている時間は 1080分/日 しかないので、
  //   **素の所要が 356分を超えると、着手できるようになった手際では着手できない**
  //   （`CraftingSystem.fitsInToday`）。300分なら 909分で収まる。
  //
  // ⚠ **仮置き。#61 で測り直す。**所要時間・出力数のどれにも実測の裏づけは無い。

  // ── tier5 ──
  {
    id: 'recipe_sweets_assortment', display: { name: '菓子の詰め合わせをつくる' },
    outputItemId: 'sweets_assortment', outputQuantity: 1,
    ingredients: [{ itemId: 'jam_bun', quantity: 2 }, { itemId: 'walnut_biscuit', quantity: 2 }, { itemId: 'canvas_sack', quantity: 1 }],
    durationMinutes: 120,
  },
  {
    id: 'recipe_voyage_lunch', display: { name: '旅の弁当をつくる' },
    outputItemId: 'voyage_lunch', outputQuantity: 2,
    ingredients: [{ itemId: 'salmon_sandwich', quantity: 1 }, { itemId: 'dried_meat', quantity: 1 }, { itemId: 'basket', quantity: 1 }],
    durationMinutes: 90,
  },
  {
    id: 'recipe_flask_mulled_wine', display: { name: '水筒詰めの温め酒をつくる' },
    outputItemId: 'flask_mulled_wine', outputQuantity: 2,
    ingredients: [{ itemId: 'mulled_wine', quantity: 1 }, { itemId: 'bamboo_flask', quantity: 2 }, { itemId: 'beeswax', quantity: 1 }],
    durationMinutes: 60,
  },
  {
    id: 'recipe_winter_outfit', display: { name: '冬の装い一式をそろえる' },
    outputItemId: 'winter_outfit', outputQuantity: 1,
    // ⚠ **革の肩掛け鞄（tier4）が段を1つ上げている。**外套・襟巻き・手袋はどれも tier3 なので、
    //   この3点だけでは `1 + max(材料の tier)` が 4 にしかならない。
    //   一式に「持って出るもの」を1つ入れることで、外出の装いとしても揃う。
    ingredients: [{ itemId: 'fur_lined_coat', quantity: 1 }, { itemId: 'wool_scarf', quantity: 1 }, { itemId: 'fur_lined_gloves', quantity: 1 }, { itemId: 'leather_satchel', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_sun_outfit', display: { name: '日よけの装い一式をそろえる' },
    outputItemId: 'sun_outfit', outputQuantity: 1,
    ingredients: [{ itemId: 'canvas_sun_hat', quantity: 1 }, { itemId: 'cotton_shirt', quantity: 1 }, { itemId: 'leather_sandals', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_harvest_hamper', display: { name: '帆布張りの収穫かごをつくる' },
    outputItemId: 'harvest_hamper', outputQuantity: 1,
    ingredients: [{ itemId: 'carrying_basket', quantity: 1 }, { itemId: 'canvas', quantity: 1 }, { itemId: 'rope', quantity: 2 }],
    durationMinutes: 150,
  },
  {
    id: 'recipe_ice_barrel', display: { name: 'フェルト張りの氷入れをつくる' },
    outputItemId: 'ice_barrel', outputQuantity: 1,
    ingredients: [{ itemId: 'canvas_sack', quantity: 1 }, { itemId: 'pine_barrel', quantity: 1 }, { itemId: 'wool_felt', quantity: 1 }],
    durationMinutes: 150,
  },

  // ── tier6 ──
  {
    id: 'recipe_feast_hamper', display: { name: 'もてなしの籠盛りをつくる' },
    outputItemId: 'feast_hamper', outputQuantity: 1,
    ingredients: [{ itemId: 'sweets_assortment', quantity: 1 }, { itemId: 'voyage_lunch', quantity: 1 }, { itemId: 'boiled_crab', quantity: 1 }],
    durationMinutes: 240,
  },
  {
    id: 'recipe_wine_gift_set', display: { name: '酒の贈りもの一式をそろえる' },
    outputItemId: 'wine_gift_set', outputQuantity: 1,
    ingredients: [{ itemId: 'flask_mulled_wine', quantity: 2 }, { itemId: 'grape_wine', quantity: 1 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 180,
  },
  {
    id: 'recipe_winter_finery', display: { name: '冬の晴れ着一式をそろえる' },
    outputItemId: 'winter_finery', outputQuantity: 1,
    ingredients: [{ itemId: 'winter_outfit', quantity: 1 }, { itemId: 'felt_hat', quantity: 1 }, { itemId: 'rabbit_fur', quantity: 2 }],
    durationMinutes: 300,
  },
  {
    id: 'recipe_peddler_kit', display: { name: '行商の荷ごしらえ一式をそろえる' },
    outputItemId: 'peddler_kit', outputQuantity: 1,
    ingredients: [{ itemId: 'harvest_hamper', quantity: 1 }, { itemId: 'straw_bale', quantity: 2 }, { itemId: 'rope', quantity: 2 }],
    durationMinutes: 240,
  },

  // ── tier7 ── 終点
  {
    id: 'recipe_grand_outfit', display: { name: '晴れの装い一式をそろえる' },
    outputItemId: 'grand_outfit', outputQuantity: 1,
    ingredients: [{ itemId: 'winter_finery', quantity: 1 }, { itemId: 'comb', quantity: 1 }, { itemId: 'antler_belt', quantity: 1 }],
    durationMinutes: 300,
  },
  {
    id: 'recipe_celebration_hamper', display: { name: '祝いの籠盛りをつくる' },
    outputItemId: 'celebration_hamper', outputQuantity: 1,
    ingredients: [{ itemId: 'feast_hamper', quantity: 1 }, { itemId: 'wine_gift_set', quantity: 1 }, { itemId: 'canvas_sack', quantity: 1 }],
    durationMinutes: 300,
  },
] as const

export const RECIPES_BY_OUTPUT: ReadonlyMap<string, RecipeDef> =
  new Map(ALL_RECIPES.map(r => [r.outputItemId, r]))
