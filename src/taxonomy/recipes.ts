/**
 * Cycle 4 / Phase 3 — レシピ 60本
 *
 * 出どころ: aidlc-docs/inception/worldbuilding/crafted-goods.md
 *
 * ⚠ craftMultiplier を手で決めていない。**機械的な式で置いている。**
 *
 *     craftMultiplier = 1.30 + 0.25 × min(所要分 / 480, 2) + 0.15 × 贅沢さの順位
 *
 *   P3（Phase 2 §2）「加工倍率は所要時間**だけ**から決めない。贅沢さによる回転率の差を併せて入れる」
 *   への対応。時間だけで決めると `利益/時間` が全品一定になり
 *   「何を買ってどう売っても結局同じ」になる（Phase 1 §5 の警告）。
 *
 *   **式で置いているので、品ごとの手当ては1件も入っていない**（数値は調整しない方針）。
 *   すべて 1 より大きいので INV-6 を構造的に満たす。
 */

import type { RecipeDef } from './axes.js'

export const ALL_RECIPES: readonly RecipeDef[] = [

  // ── 食料 ──
  {
    id: 'recipe_buckwheat_flour', display: { name: '蕎麦粉をつくる' },
    outputItemId: 'buckwheat_flour', outputQuantity: 3,
    ingredients: [{ itemId: 'buckwheat', quantity: 3 }],
    durationMinutes: 240, craftMultiplier: 1.43,
  },
  {
    id: 'recipe_olive_oil', display: { name: 'オリーブ油をつくる' },
    outputItemId: 'olive_oil', outputQuantity: 2,
    ingredients: [{ itemId: 'olive', quantity: 5 }],
    durationMinutes: 480, craftMultiplier: 1.55,
  },
  {
    id: 'recipe_butter', display: { name: 'バターをつくる' },
    outputItemId: 'butter', outputQuantity: 2,
    ingredients: [{ itemId: 'sheep_milk', quantity: 4 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 480, craftMultiplier: 1.7,
  },
  {
    id: 'recipe_cheese', display: { name: 'チーズをつくる' },
    outputItemId: 'cheese', outputQuantity: 2,
    ingredients: [{ itemId: 'sheep_milk', quantity: 5 }, { itemId: 'salt', quantity: 2 }],
    durationMinutes: 1440, craftMultiplier: 1.95,
  },
  {
    id: 'recipe_salted_salmon', display: { name: '塩鮭をつくる' },
    outputItemId: 'salted_salmon', outputQuantity: 3,
    ingredients: [{ itemId: 'salmon', quantity: 2 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 480, craftMultiplier: 1.55,
  },
  {
    id: 'recipe_dried_meat', display: { name: '干し肉をつくる' },
    outputItemId: 'dried_meat', outputQuantity: 4,
    ingredients: [{ itemId: 'reindeer_meat', quantity: 2 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 1440, craftMultiplier: 1.8,
  },
  {
    id: 'recipe_strawberry_jam', display: { name: 'いちごのジャムをつくる' },
    outputItemId: 'strawberry_jam', outputQuantity: 2,
    ingredients: [{ itemId: 'strawberry', quantity: 4 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 480, craftMultiplier: 1.85,
  },
  {
    id: 'recipe_boiled_crab', display: { name: 'かにの塩ゆでをつくる' },
    outputItemId: 'boiled_crab', outputQuantity: 1,
    ingredients: [{ itemId: 'crab', quantity: 1 }, { itemId: 'salt', quantity: 1 }, { itemId: 'ice', quantity: 2 }],
    durationMinutes: 240, craftMultiplier: 1.73,
  },
  {
    id: 'recipe_mugwort_mochi', display: { name: 'よもぎ餅をつくる' },
    outputItemId: 'mugwort_mochi', outputQuantity: 4,
    ingredients: [{ itemId: 'rice', quantity: 2 }, { itemId: 'mugwort', quantity: 1 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 480, craftMultiplier: 1.85,
  },
  {
    id: 'recipe_strawberry_shaved_ice', display: { name: 'いちごのかき氷をつくる' },
    outputItemId: 'strawberry_shaved_ice', outputQuantity: 2,
    ingredients: [{ itemId: 'ice', quantity: 3 }, { itemId: 'strawberry', quantity: 1 }],
    durationMinutes: 30, craftMultiplier: 1.62,
  },
  {
    id: 'recipe_ice_cream', display: { name: 'アイスクリームをつくる' },
    outputItemId: 'ice_cream', outputQuantity: 3,
    ingredients: [{ itemId: 'sheep_milk', quantity: 2 }, { itemId: 'honey', quantity: 1 }, { itemId: 'ice', quantity: 3 }],
    durationMinutes: 240, craftMultiplier: 1.73,
  },
  {
    id: 'recipe_grilled_corn', display: { name: '焼きとうもろこしをつくる' },
    outputItemId: 'grilled_corn', outputQuantity: 2,
    ingredients: [{ itemId: 'corn', quantity: 2 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 240, craftMultiplier: 1.73,
  },
  {
    id: 'recipe_buckwheat_bread', display: { name: '蕎麦粉のパンをつくる' },
    outputItemId: 'buckwheat_bread', outputQuantity: 3,
    ingredients: [{ itemId: 'buckwheat_flour', quantity: 2 }, { itemId: 'honey', quantity: 1 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 720, craftMultiplier: 1.68,
  },
  {
    id: 'recipe_walnut_biscuit', display: { name: 'くるみのビスケットをつくる' },
    outputItemId: 'walnut_biscuit', outputQuantity: 4,
    ingredients: [{ itemId: 'buckwheat_flour', quantity: 2 }, { itemId: 'walnut', quantity: 2 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 480, craftMultiplier: 1.85,
  },
  {
    id: 'recipe_sardine_in_oil', display: { name: 'いわしのオイル漬けをつくる' },
    outputItemId: 'sardine_in_oil', outputQuantity: 3,
    ingredients: [{ itemId: 'sardine', quantity: 4 }, { itemId: 'olive_oil', quantity: 1 }, { itemId: 'salt', quantity: 1 }, { itemId: 'chili', quantity: 1 }],
    durationMinutes: 960, craftMultiplier: 1.95,
  },
  {
    id: 'recipe_bean_meat_soup', display: { name: '豆と干し肉のスープをつくる' },
    outputItemId: 'bean_meat_soup', outputQuantity: 3,
    ingredients: [{ itemId: 'dried_meat', quantity: 1 }, { itemId: 'broad_bean', quantity: 3 }, { itemId: 'enoki', quantity: 2 }, { itemId: 'kelp', quantity: 1 }],
    durationMinutes: 480, craftMultiplier: 1.55,
  },
  {
    id: 'recipe_crab_gratin', display: { name: 'かにのグラタンをつくる' },
    outputItemId: 'crab_gratin', outputQuantity: 2,
    ingredients: [{ itemId: 'boiled_crab', quantity: 1 }, { itemId: 'butter', quantity: 1 }, { itemId: 'buckwheat_flour', quantity: 1 }, { itemId: 'sheep_milk', quantity: 2 }],
    durationMinutes: 480, craftMultiplier: 1.85,
  },
  {
    id: 'recipe_salmon_rice_ball', display: { name: '鮭のおにぎりをつくる' },
    outputItemId: 'salmon_rice_ball', outputQuantity: 3,
    ingredients: [{ itemId: 'rice', quantity: 2 }, { itemId: 'salted_salmon', quantity: 1 }, { itemId: 'salt', quantity: 1 }],
    durationMinutes: 240, craftMultiplier: 1.43,
  },
  {
    id: 'recipe_salmon_sandwich', display: { name: '鮭のサンドイッチをつくる' },
    outputItemId: 'salmon_sandwich', outputQuantity: 2,
    ingredients: [{ itemId: 'buckwheat_bread', quantity: 1 }, { itemId: 'salted_salmon', quantity: 1 }, { itemId: 'rape_blossom', quantity: 1 }, { itemId: 'lemon', quantity: 1 }],
    durationMinutes: 240, craftMultiplier: 1.57,
  },
  {
    id: 'recipe_jam_bun', display: { name: 'ジャムパンをつくる' },
    outputItemId: 'jam_bun', outputQuantity: 2,
    ingredients: [{ itemId: 'buckwheat_bread', quantity: 1 }, { itemId: 'strawberry_jam', quantity: 1 }],
    durationMinutes: 240, craftMultiplier: 1.73,
  },

  // ── 飲みもの ──
  {
    id: 'recipe_mugwort_tea', display: { name: 'よもぎの茶をつくる' },
    outputItemId: 'mugwort_tea', outputQuantity: 2,
    ingredients: [{ itemId: 'mugwort', quantity: 2 }, { itemId: 'tea_leaf', quantity: 1 }],
    durationMinutes: 60, craftMultiplier: 1.48,
  },
  {
    id: 'recipe_mint_tea', display: { name: 'ミントの茶をつくる' },
    outputItemId: 'mint_tea', outputQuantity: 2,
    ingredients: [{ itemId: 'mint', quantity: 2 }, { itemId: 'tea_leaf', quantity: 1 }],
    durationMinutes: 60, craftMultiplier: 1.48,
  },
  {
    id: 'recipe_lemon_tea', display: { name: 'レモンの茶をつくる' },
    outputItemId: 'lemon_tea', outputQuantity: 2,
    ingredients: [{ itemId: 'tea_leaf', quantity: 2 }, { itemId: 'lemon', quantity: 1 }],
    durationMinutes: 60, craftMultiplier: 1.48,
  },
  {
    id: 'recipe_honey_lemon', display: { name: '蜂蜜レモンをつくる' },
    outputItemId: 'honey_lemon', outputQuantity: 2,
    ingredients: [{ itemId: 'lemon', quantity: 2 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 120, craftMultiplier: 1.51,
  },
  {
    id: 'recipe_grape_juice', display: { name: 'ぶどうの果汁をつくる' },
    outputItemId: 'grape_juice', outputQuantity: 2,
    ingredients: [{ itemId: 'grape', quantity: 4 }],
    durationMinutes: 120, craftMultiplier: 1.66,
  },
  {
    id: 'recipe_chilled_apple_water', display: { name: '冷たいりんご水をつくる' },
    outputItemId: 'chilled_apple_water', outputQuantity: 2,
    ingredients: [{ itemId: 'apple', quantity: 3 }, { itemId: 'ice', quantity: 2 }],
    durationMinutes: 60, craftMultiplier: 1.63,
  },
  {
    id: 'recipe_honey_milk', display: { name: '蜂蜜の乳をつくる' },
    outputItemId: 'honey_milk', outputQuantity: 2,
    ingredients: [{ itemId: 'sheep_milk', quantity: 2 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 40, craftMultiplier: 1.62,
  },
  {
    id: 'recipe_iced_mint_tea', display: { name: '冷たいミントの茶をつくる' },
    outputItemId: 'iced_mint_tea', outputQuantity: 2,
    ingredients: [{ itemId: 'mint_tea', quantity: 1 }, { itemId: 'ice', quantity: 2 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 30, craftMultiplier: 1.47,
  },
  {
    id: 'recipe_salted_lemon_water', display: { name: '塩レモン水をつくる' },
    outputItemId: 'salted_lemon_water', outputQuantity: 2,
    ingredients: [{ itemId: 'honey_lemon', quantity: 1 }, { itemId: 'salt', quantity: 1 }, { itemId: 'ice', quantity: 2 }],
    durationMinutes: 30, craftMultiplier: 1.32,
  },
  {
    id: 'recipe_grape_wine', display: { name: 'ぶどうの酒をつくる' },
    outputItemId: 'grape_wine', outputQuantity: 2,
    ingredients: [{ itemId: 'grape_juice', quantity: 2 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 1440, craftMultiplier: 2.1,
  },
  {
    id: 'recipe_strawberry_milk', display: { name: 'いちごの乳をつくる' },
    outputItemId: 'strawberry_milk', outputQuantity: 2,
    ingredients: [{ itemId: 'honey_milk', quantity: 1 }, { itemId: 'strawberry', quantity: 3 }],
    durationMinutes: 60, craftMultiplier: 1.63,
  },
  {
    id: 'recipe_chestnut_milk', display: { name: '栗の乳をつくる' },
    outputItemId: 'chestnut_milk', outputQuantity: 2,
    ingredients: [{ itemId: 'honey_milk', quantity: 1 }, { itemId: 'chestnut', quantity: 3 }],
    durationMinutes: 120, craftMultiplier: 1.66,
  },
  {
    id: 'recipe_iced_mint_milk_tea', display: { name: '冷たいミントの乳茶をつくる' },
    outputItemId: 'iced_mint_milk_tea', outputQuantity: 2,
    ingredients: [{ itemId: 'mint_tea', quantity: 1 }, { itemId: 'sheep_milk', quantity: 2 }, { itemId: 'ice', quantity: 2 }],
    durationMinutes: 40, craftMultiplier: 1.62,
  },
  {
    id: 'recipe_mulled_wine', display: { name: '温めたぶどうの酒をつくる' },
    outputItemId: 'mulled_wine', outputQuantity: 2,
    ingredients: [{ itemId: 'grape_wine', quantity: 1 }, { itemId: 'lemon', quantity: 1 }, { itemId: 'honey', quantity: 1 }],
    durationMinutes: 60, craftMultiplier: 1.63,
  },
  {
    id: 'recipe_iced_strawberry_milk', display: { name: '冷たいいちごの乳をつくる' },
    outputItemId: 'iced_strawberry_milk', outputQuantity: 2,
    ingredients: [{ itemId: 'strawberry_milk', quantity: 1 }, { itemId: 'ice', quantity: 2 }],
    durationMinutes: 30, craftMultiplier: 1.62,
  },

  // ── 衣類 ──
  {
    id: 'recipe_wool_yarn', display: { name: '毛糸をつくる' },
    outputItemId: 'wool_yarn', outputQuantity: 2,
    ingredients: [{ itemId: 'wool', quantity: 3 }],
    durationMinutes: 180, craftMultiplier: 1.39,
  },
  {
    id: 'recipe_cotton_yarn', display: { name: '木綿糸をつくる' },
    outputItemId: 'cotton_yarn', outputQuantity: 2,
    ingredients: [{ itemId: 'cotton', quantity: 3 }],
    durationMinutes: 180, craftMultiplier: 1.39,
  },
  {
    id: 'recipe_wool_felt', display: { name: '羊毛のフェルトをつくる' },
    outputItemId: 'wool_felt', outputQuantity: 1,
    ingredients: [{ itemId: 'wool', quantity: 2 }, { itemId: 'rabbit_fur', quantity: 1 }],
    durationMinutes: 300, craftMultiplier: 1.46,
  },
  {
    id: 'recipe_antler_belt', display: { name: '角留めの革帯をつくる' },
    outputItemId: 'antler_belt', outputQuantity: 2,
    ingredients: [{ itemId: 'reindeer_hide', quantity: 2 }, { itemId: 'reindeer_antler', quantity: 1 }, { itemId: 'persimmon', quantity: 1 }],
    durationMinutes: 240, craftMultiplier: 1.57,
  },
  {
    id: 'recipe_canvas', display: { name: '木綿の帆布をつくる' },
    outputItemId: 'canvas', outputQuantity: 1,
    ingredients: [{ itemId: 'cotton_yarn', quantity: 3 }, { itemId: 'persimmon', quantity: 2 }, { itemId: 'pumice', quantity: 1 }],
    durationMinutes: 480, craftMultiplier: 1.55,
  },
  {
    id: 'recipe_wool_scarf', display: { name: '毛糸の襟巻きをつくる' },
    outputItemId: 'wool_scarf', outputQuantity: 1,
    ingredients: [{ itemId: 'wool_yarn', quantity: 2 }, { itemId: 'grape', quantity: 1 }],
    durationMinutes: 300, craftMultiplier: 1.61,
  },
  {
    id: 'recipe_felt_hat', display: { name: 'フェルトの帽子をつくる' },
    outputItemId: 'felt_hat', outputQuantity: 1,
    ingredients: [{ itemId: 'wool_felt', quantity: 1 }, { itemId: 'wool_yarn', quantity: 1 }, { itemId: 'walnut', quantity: 1 }, { itemId: 'gull_feather', quantity: 2 }],
    durationMinutes: 480, craftMultiplier: 1.7,
  },
  {
    id: 'recipe_cotton_shirt', display: { name: '木綿のシャツをつくる' },
    outputItemId: 'cotton_shirt', outputQuantity: 1,
    ingredients: [{ itemId: 'cotton_yarn', quantity: 4 }, { itemId: 'reindeer_antler', quantity: 2 }],
    durationMinutes: 480, craftMultiplier: 1.55,
  },
  {
    id: 'recipe_leather_sandals', display: { name: '革のサンダルをつくる' },
    outputItemId: 'leather_sandals', outputQuantity: 2,
    ingredients: [{ itemId: 'reindeer_hide', quantity: 2 }, { itemId: 'cotton_yarn', quantity: 1 }, { itemId: 'beeswax', quantity: 1 }],
    durationMinutes: 480, craftMultiplier: 1.55,
  },
  {
    id: 'recipe_fur_lined_gloves', display: { name: '毛皮裏の革手袋をつくる' },
    outputItemId: 'fur_lined_gloves', outputQuantity: 2,
    ingredients: [{ itemId: 'reindeer_hide', quantity: 2 }, { itemId: 'rabbit_fur', quantity: 1 }, { itemId: 'wool_yarn', quantity: 1 }],
    durationMinutes: 480, craftMultiplier: 1.55,
  },
  {
    id: 'recipe_fur_lined_coat', display: { name: '毛皮裏の外套をつくる' },
    outputItemId: 'fur_lined_coat', outputQuantity: 1,
    ingredients: [{ itemId: 'wool_felt', quantity: 2 }, { itemId: 'rabbit_fur', quantity: 2 }, { itemId: 'reindeer_antler', quantity: 3 }, { itemId: 'olive', quantity: 1 }],
    durationMinutes: 960, craftMultiplier: 1.8,
  },
  {
    id: 'recipe_canvas_sun_hat', display: { name: '帆布の日よけ帽子をつくる' },
    outputItemId: 'canvas_sun_hat', outputQuantity: 1,
    ingredients: [{ itemId: 'canvas', quantity: 1 }, { itemId: 'cotton_yarn', quantity: 1 }, { itemId: 'mugwort', quantity: 2 }],
    durationMinutes: 720, craftMultiplier: 1.68,
  },
  {
    id: 'recipe_canvas_apron', display: { name: '帆布の前掛けをつくる' },
    outputItemId: 'canvas_apron', outputQuantity: 1,
    ingredients: [{ itemId: 'canvas', quantity: 1 }, { itemId: 'wool_yarn', quantity: 1 }, { itemId: 'reindeer_antler', quantity: 2 }],
    durationMinutes: 720, craftMultiplier: 1.68,
  },
  {
    id: 'recipe_waxed_raincoat', display: { name: '蜜蝋引きの合羽をつくる' },
    outputItemId: 'waxed_raincoat', outputQuantity: 1,
    ingredients: [{ itemId: 'canvas', quantity: 2 }, { itemId: 'beeswax', quantity: 3 }, { itemId: 'reindeer_antler', quantity: 2 }],
    durationMinutes: 720, craftMultiplier: 1.68,
  },
  {
    id: 'recipe_leather_satchel', display: { name: '革の肩掛け鞄をつくる' },
    outputItemId: 'leather_satchel', outputQuantity: 1,
    ingredients: [{ itemId: 'reindeer_hide', quantity: 3 }, { itemId: 'canvas', quantity: 1 }, { itemId: 'antler_belt', quantity: 1 }, { itemId: 'beeswax', quantity: 1 }],
    durationMinutes: 720, craftMultiplier: 1.82,
  },

  // ── 道具 ──
  {
    id: 'recipe_rope', display: { name: '縄をつくる' },
    outputItemId: 'rope', outputQuantity: 3,
    ingredients: [{ itemId: 'rice_straw', quantity: 3 }],
    durationMinutes: 120, craftMultiplier: 1.36,
  },
  {
    id: 'recipe_file', display: { name: 'やすりをつくる' },
    outputItemId: 'file', outputQuantity: 2,
    ingredients: [{ itemId: 'pumice', quantity: 2 }, { itemId: 'pine', quantity: 1 }],
    durationMinutes: 180, craftMultiplier: 1.54,
  },
  {
    id: 'recipe_broom', display: { name: 'ほうきをつくる' },
    outputItemId: 'broom', outputQuantity: 2,
    ingredients: [{ itemId: 'rice_straw', quantity: 2 }, { itemId: 'bamboo', quantity: 1 }],
    durationMinutes: 180, craftMultiplier: 1.39,
  },
  {
    id: 'recipe_brush', display: { name: '筆をつくる' },
    outputItemId: 'brush', outputQuantity: 3,
    ingredients: [{ itemId: 'rabbit_fur', quantity: 1 }, { itemId: 'bamboo', quantity: 1 }],
    durationMinutes: 240, craftMultiplier: 1.57,
  },
  {
    id: 'recipe_candle', display: { name: 'ろうそくをつくる' },
    outputItemId: 'candle', outputQuantity: 4,
    ingredients: [{ itemId: 'beeswax', quantity: 3 }, { itemId: 'cotton', quantity: 1 }],
    durationMinutes: 180, craftMultiplier: 1.39,
  },
  {
    id: 'recipe_umbrella', display: { name: '傘をつくる' },
    outputItemId: 'umbrella', outputQuantity: 1,
    ingredients: [{ itemId: 'bamboo', quantity: 2 }, { itemId: 'cotton', quantity: 3 }, { itemId: 'sunflower_seed', quantity: 2 }],
    durationMinutes: 360, craftMultiplier: 1.49,
  },
  {
    id: 'recipe_basket', display: { name: 'かごをつくる' },
    outputItemId: 'basket', outputQuantity: 2,
    ingredients: [{ itemId: 'birch', quantity: 2 }, { itemId: 'rope', quantity: 1 }],
    durationMinutes: 360, craftMultiplier: 1.49,
  },
  {
    id: 'recipe_wooden_bowl', display: { name: '木の椀をつくる' },
    outputItemId: 'wooden_bowl', outputQuantity: 2,
    ingredients: [{ itemId: 'driftwood', quantity: 2 }, { itemId: 'file', quantity: 1 }, { itemId: 'olive', quantity: 1 }],
    durationMinutes: 480, craftMultiplier: 1.55,
  },
  {
    id: 'recipe_comb', display: { name: '櫛をつくる' },
    outputItemId: 'comb', outputQuantity: 2,
    ingredients: [{ itemId: 'reindeer_antler', quantity: 1 }, { itemId: 'file', quantity: 1 }, { itemId: 'walnut', quantity: 1 }],
    durationMinutes: 600, craftMultiplier: 1.76,
  },
  {
    id: 'recipe_fishing_rod', display: { name: '釣りざおをつくる' },
    outputItemId: 'fishing_rod', outputQuantity: 1,
    ingredients: [{ itemId: 'bamboo', quantity: 2 }, { itemId: 'rope', quantity: 1 }, { itemId: 'gull_feather', quantity: 1 }],
    durationMinutes: 600, craftMultiplier: 1.76,
  },
  // ══════ 2026-09-07 追加 — 宿題B の10品ぶん ══════
  // craftMultiplier は既存と同じ式で機械的に置いている（品ごとの手当ては無い）:
  //   1.30 + 0.25 × min(所要分 / 480, 2) + 0.15 × 贅沢さの順位（10品とも `日用` なので順位0）
  {
    id: 'recipe_straw_mat', display: { name: '稲わらのむしろをつくる' },
    outputItemId: 'straw_mat', outputQuantity: 2,
    ingredients: [{ itemId: 'rice_straw', quantity: 4 }, { itemId: 'rope', quantity: 1 }],
    durationMinutes: 180, craftMultiplier: 1.39,
  },
  {
    id: 'recipe_pine_barrel', display: { name: '松の桶をつくる' },
    outputItemId: 'pine_barrel', outputQuantity: 2,
    ingredients: [{ itemId: 'pine', quantity: 3 }, { itemId: 'rope', quantity: 1 }],
    durationMinutes: 480, craftMultiplier: 1.55,
  },
  {
    id: 'recipe_drying_net', display: { name: '竹の干し網をつくる' },
    outputItemId: 'drying_net', outputQuantity: 2,
    ingredients: [{ itemId: 'bamboo', quantity: 2 }, { itemId: 'rope', quantity: 2 }],
    durationMinutes: 240, craftMultiplier: 1.43,
  },
  {
    id: 'recipe_canvas_sack', display: { name: '帆布の袋をつくる' },
    outputItemId: 'canvas_sack', outputQuantity: 3,
    ingredients: [{ itemId: 'canvas', quantity: 1 }, { itemId: 'rope', quantity: 2 }],
    durationMinutes: 240, craftMultiplier: 1.43,
  },
  {
    id: 'recipe_bamboo_fan', display: { name: '竹の団扇をつくる' },
    outputItemId: 'bamboo_fan', outputQuantity: 3,
    ingredients: [{ itemId: 'bamboo', quantity: 1 }, { itemId: 'gull_feather', quantity: 2 }],
    durationMinutes: 120, craftMultiplier: 1.36,
  },
  {
    id: 'recipe_bamboo_blind', display: { name: '竹の簾をつくる' },
    outputItemId: 'bamboo_blind', outputQuantity: 2,
    ingredients: [{ itemId: 'bamboo', quantity: 3 }, { itemId: 'rope', quantity: 1 }],
    durationMinutes: 240, craftMultiplier: 1.43,
  },
  {
    id: 'recipe_pine_firewood', display: { name: '松の薪をつくる' },
    outputItemId: 'pine_firewood', outputQuantity: 4,
    ingredients: [{ itemId: 'pine', quantity: 2 }],
    durationMinutes: 60, craftMultiplier: 1.33,
  },
  {
    id: 'recipe_wool_rug', display: { name: '羊毛の敷物をつくる' },
    outputItemId: 'wool_rug', outputQuantity: 1,
    ingredients: [{ itemId: 'wool_felt', quantity: 2 }, { itemId: 'rope', quantity: 1 }],
    durationMinutes: 480, craftMultiplier: 1.55,
  },
  {
    id: 'recipe_bamboo_flask', display: { name: '竹の水筒をつくる' },
    outputItemId: 'bamboo_flask', outputQuantity: 2,
    ingredients: [{ itemId: 'bamboo', quantity: 2 }, { itemId: 'beeswax', quantity: 1 }],
    durationMinutes: 240, craftMultiplier: 1.43,
  },
  {
    id: 'recipe_carrying_basket', display: { name: '背負い籠をつくる' },
    outputItemId: 'carrying_basket', outputQuantity: 1,
    ingredients: [{ itemId: 'basket', quantity: 1 }, { itemId: 'rope', quantity: 1 }, { itemId: 'cotton_yarn', quantity: 1 }],
    durationMinutes: 300, craftMultiplier: 1.46,
  },
] as const

export const RECIPES_BY_OUTPUT: ReadonlyMap<string, RecipeDef> =
  new Map(ALL_RECIPES.map(r => [r.outputItemId, r]))
