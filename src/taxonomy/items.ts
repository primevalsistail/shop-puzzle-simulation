/**
 * Cycle 4 / Phase 3 — 実アイテム 122品（素材50 ＋ 加工品72）
 *
 * 内訳の変遷: Phase 3 で 110品（素材50＋加工品60）。
 *   2026-09-07 の宿題B で **道具10品**を追加（素材は1つも足していない）→ 120品。
 *   同日 `生鮮` の決着で `実りの土地` に **2品**追加 → **122品**。
 *
 * **このファイルは生成物ではなく、手で保守するデータである。**
 *
 * 出どころ:
 *   素材   … aidlc-docs/inception/worldbuilding/materials.md
 *   加工品 … aidlc-docs/inception/worldbuilding/crafted-goods.md
 *   産地の規則 … island-goods.md §2「その品が一般的にどの季節のイメージか」
 *   贅沢さ・向く土地 … 別セッションが振ったもの（起こす者と評価する者を分ける方針による）
 *
 * ⚠ 配分を均していない。主種類・産地・贅沢さ・向く土地がどう散ったかを数えるのは
 *   **評価セッションの仕事**であり、書き手は調整しない。
 *
 * ⚠ 数値（basePrice）は一度置いたもので、調整していない。
 */

import type { ItemDef } from './axes.js'

export const ALL_ITEMS: readonly ItemDef[] = [
  // ══════ 素材（tier1）50品 ══════

  // ── ハルヴェラ島（春） ──
  {
    id: 'takenoko', display: { name: 'たけのこ', color: 0xee424e },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1], [1]], basePrice: 28,
    originReason: '掘った日に食べないと固くなる、春の芽',
  },
  {
    id: 'asparagus', display: { name: 'アスパラガス', color: 0xe7483a },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1], [1]], basePrice: 26,
    originReason: '根株から立ち上がる若い芽そのものを摘む',
  },
  {
    id: 'snap_pea', display: { name: 'さやえんどう', color: 0xca7b4e },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 22,
    originReason: 'さやが柔らかい若いうちだけ摘む',
  },
  {
    id: 'broad_bean', display: { name: 'そら豆', color: 0xb2575e },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1]], basePrice: 24,
    originReason: '実が若く水気を含んでいる短い期間が採り時',
  },
  {
    id: 'strawberry', display: { name: 'いちご', color: 0xef6527 },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 35,
    originReason: '花が咲いて実がつくのが春',
  },
  {
    id: 'rape_blossom', display: { name: '菜の花', color: 0xd27143 },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 20,
    originReason: 'つぼみがほどける直前の茎ごと摘む',
  },
  {
    id: 'mugwort', display: { name: 'よもぎ', color: 0xcd7f52 },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 18,
    originReason: '地面から出たばかりの若葉だけを摘む',
  },
  {
    id: 'tea_leaf', display: { name: '茶の葉', color: 0x49a896 },
    mainKind: '飲みもの', origin: 'ハルヴェラ', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 40,
    originReason: '枝先に出る新芽だけを摘む',
  },
  {
    id: 'wool', display: { name: '羊毛', color: 0xad6096 },
    mainKind: '衣類', origin: 'ハルヴェラ', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]], basePrice: 32,
    originReason: '毛を刈るのは春。一年分をまとめて刈る',
  },
  {
    id: 'bamboo', display: { name: '竹', color: 0xb17e2b },
    mainKind: '道具', origin: 'ハルヴェラ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]], basePrice: 26,
    originReason: 'たけのこが育ったもの。旬は生きものに付く',
  },
  {
    id: 'sheep_milk', display: { name: '羊の乳', color: 0x479e99 },
    mainKind: '飲みもの', origin: 'ハルヴェラ', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 30,
    originReason: '羊毛と同じ羊から。子が生まれて乳が出はじめるのが春',
  },

  // ── リナツィア島（夏） ──
  {
    id: 'fig', display: { name: 'いちじく', color: 0xc54a52 },
    mainKind: '食料', origin: 'リナツィア', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 38,
    originReason: '実が柔らかく熟して甘くなるのは暑さが続くころ',
  },
  {
    id: 'watermelon', display: { name: 'すいか', color: 0xdc4e21 },
    mainKind: '食料', origin: 'リナツィア', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]], basePrice: 34,
    originReason: '高温と強い日ざしで甘みが乗る、暑い盛りの実',
  },
  {
    id: 'corn', display: { name: 'とうもろこし', color: 0xb75c3f },
    mainKind: '食料', origin: 'リナツィア', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1], [1], [1]], basePrice: 20,
    originReason: '高温と長い日照で一気に育つ',
  },
  {
    id: 'eggplant', display: { name: 'なす', color: 0xc04648 },
    mainKind: '食料', origin: 'リナツィア', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 22,
    originReason: '高温を好み、実がつやよく次々になる',
  },
  {
    id: 'chili', display: { name: 'とうがらし', color: 0xc46822 },
    mainKind: '食料', origin: 'リナツィア', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1]], basePrice: 30,
    originReason: '暑さで実が色づき辛みが強くなる',
  },
  {
    id: 'sunflower_seed', display: { name: 'ひまわりの種', color: 0xd95a3c },
    mainKind: '食料', origin: 'リナツィア', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 24,
    originReason: '花が開くのが真夏で、種が詰まるのはその直後',
  },
  {
    id: 'honey', display: { name: '蜂蜜', color: 0xc45c5f },
    mainKind: '食料', origin: 'リナツィア', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1]], basePrice: 55,
    originReason: '花が咲きそろって蜂がいちばん蜜を溜め込む時期',
  },
  {
    id: 'mint', display: { name: 'ミント', color: 0x4ba3a8 },
    mainKind: '飲みもの', origin: 'リナツィア', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1]], basePrice: 26,
    originReason: '暑さで葉がよく茂り、香りがもっとも強くなる',
  },
  {
    id: 'beeswax', display: { name: '蜜蝋', color: 0x9c8a32 },
    mainKind: '道具', origin: 'リナツィア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 34,
    originReason: '蜂蜜と同じ巣から採れる。旬は生きものに付く',
  },

  // ── ノアキータ島（秋） ──
  {
    id: 'chestnut', display: { name: '栗', color: 0xe25740 },
    mainKind: '食料', origin: 'ノアキータ', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 30,
    originReason: 'いがが割れて実が自然に落ちる',
  },
  {
    id: 'persimmon', display: { name: '柿', color: 0xdf5e4e },
    mainKind: '食料', origin: 'ノアキータ', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 28,
    originReason: '寒暖差で渋が抜けて色づき、熟す',
  },
  {
    id: 'grape', display: { name: 'ぶどう', color: 0xd17954 },
    mainKind: '食料', origin: 'ノアキータ', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[0, 1], [1, 1]], basePrice: 35,
    originReason: '日が短くなり寒暖差が出る時期に糖が乗って熟す',
  },
  {
    id: 'apple', display: { name: 'りんご', color: 0xc0504e },
    mainKind: '食料', origin: 'ノアキータ', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 30,
    originReason: '夜の冷えで色と甘みが入り、霜の前に穫る',
  },
  {
    id: 'sweet_potato', display: { name: 'さつまいも', color: 0xba6453 },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]], basePrice: 18,
    originReason: '霜に当たると傷むため、霜の前に掘り上げる',
  },
  {
    id: 'rice', display: { name: '米', color: 0xc76a5c },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]], basePrice: 16,
    originReason: '穂が垂れ、水を落として刈り取る',
  },
  {
    id: 'buckwheat', display: { name: '蕎麦の実', color: 0xd24e53 },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 15,
    originReason: '実が黒く熟して脱粒する',
  },
  {
    id: 'walnut', display: { name: 'くるみ', color: 0xd0544e },
    mainKind: '食料', origin: 'ノアキータ', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 32,
    originReason: '外皮が裂けて殻ごと落ちる',
  },
  {
    id: 'salmon', display: { name: '鮭', color: 0xbe6b56 },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1, 1, 1]], basePrice: 45,
    originReason: '産卵のために群れが川へ戻る。この時期だけ岸で獲れる',
  },
  {
    id: 'cotton', display: { name: '綿', color: 0xa97f9a },
    mainKind: '衣類', origin: 'ノアキータ', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]], basePrice: 30,
    originReason: '実がはじけて綿毛が露出する',
  },
  {
    id: 'olive', display: { name: 'オリーブ', color: 0xe2642b },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 34,
    originReason: '実を摘むのは秋',
  },
  {
    id: 'rice_straw', display: { name: '稲わら', color: 0x7a6f29 },
    mainKind: '道具', origin: 'ノアキータ', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1]], basePrice: 12,
    originReason: '米と同じ株から採れる。旬は生きものに付く',
  },

  // ── ミフユリア島（冬） ──
  {
    id: 'ice', display: { name: '氷', color: 0x38749f },
    mainKind: '飲みもの', origin: 'ミフユリア', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]], basePrice: 20,
    originReason: '水が凍りつく土地でしか切り出せない。島の気候そのものが商品',
  },
  {
    id: 'reindeer_meat', display: { name: 'トナカイの肉', color: 0xc86847 },
    mainKind: '食料', origin: 'ミフユリア', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]], basePrice: 55,
    originReason: '雪を掘って苔を食む獣。雪の消えない土地でこそ群れが養える',
  },
  {
    id: 'reindeer_antler', display: { name: 'トナカイの角', color: 0x796c26 },
    mainKind: '道具', origin: 'ミフユリア', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 0], [1, 1]], basePrice: 40,
    originReason: '同じ獣から落ちる角',
  },
  {
    id: 'reindeer_hide', display: { name: 'トナカイの革', color: 0xa784b4 },
    mainKind: '衣類', origin: 'ミフユリア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1], [1, 1]], basePrice: 48,
    originReason: '肉・角と同じ獣から。旬は生きものに付く',
  },
  {
    id: 'rabbit_fur', display: { name: 'うさぎの毛皮', color: 0x948ea7 },
    mainKind: '衣類', origin: 'ミフユリア', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1, 1]], basePrice: 42,
    originReason: '寒さの中でこそ毛が白く厚く密になる',
  },
  {
    id: 'enoki', display: { name: 'えのきたけ', color: 0xcd6845 },
    mainKind: '食料', origin: 'ミフユリア', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 22,
    originReason: '凍りつく倒木や雪の下に出る菌。寒さが発生の条件',
  },
  {
    id: 'pine', display: { name: '松', color: 0x84702b },
    mainKind: '道具', origin: 'ミフユリア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1]], basePrice: 24,
    originReason: '雪の重みと凍てつきに耐えて緑を保つ針葉樹',
  },
  {
    id: 'birch', display: { name: '白樺', color: 0x7c5a42 },
    mainKind: '道具', origin: 'ミフユリア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1]], basePrice: 26,
    originReason: '寒さの厳しい土地にだけ純林を作る木',
  },
  {
    id: 'kelp', display: { name: '昆布', color: 0xb27352 },
    mainKind: '食料', origin: 'ミフユリア', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1], [1]], basePrice: 20,
    originReason: '冷たい海でしか大きく育たない海藻',
  },
  {
    id: 'crab', display: { name: 'かに', color: 0xcd6158 },
    mainKind: '食料', origin: 'ミフユリア', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[0, 1], [1, 1]], basePrice: 60,
    originReason: '冷たく深い海にだけ棲み、身が詰まるのが寒さの底',
  },
  {
    id: 'lemon', display: { name: 'レモン', color: 0xd44958 },
    mainKind: '食料', origin: 'ミフユリア', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 28,
    originReason: '実が熟すのは冬。冬の柑橘',
  },

  // ── 海（産地なし・通年） ──
  {
    id: 'tuna', display: { name: 'まぐろ', color: 0xbb5548 },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1, 1]], basePrice: 55,
    originReason: '一つの海域に留まらず外洋を回遊し続ける',
  },
  {
    id: 'sardine', display: { name: 'いわし', color: 0xcd7952 },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 18,
    originReason: '群れが絶えず移動し、産卵の時期も群れごとにずれる',
  },
  {
    id: 'squid', display: { name: 'いか', color: 0xdf7529 },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 30,
    originReason: '種類ごとに寄る時期が違い、外洋を漂うものが多い',
  },
  {
    id: 'salt', display: { name: '塩', color: 0xe7605b },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1]], basePrice: 14,
    originReason: '海がある限りいつでも採れる。どの島の岸でも同じ',
  },
  {
    id: 'driftwood', display: { name: '流木', color: 0x778b4b },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1, 1]], basePrice: 10,
    originReason: '波任せで流れ着く。いつ来るとも、どこから来たとも決まっていない',
  },
  {
    id: 'pumice', display: { name: '軽石', color: 0x928520 },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 12,
    originReason: '海面を漂って流れてくる石',
  },
  {
    id: 'gull_feather', display: { name: 'かもめの羽根', color: 0x8a6545 },
    mainKind: '道具', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1]], basePrice: 16,
    originReason: 'かもめは季節を問わず船について回る',
  },

  // ══════ 加工品（tier2以上）60品 ══════
  // 産地はすべて `なし`。**加工品は旬を持たないため**（island-goods.md §2）。
  // 「主材料の産地」を採らなかった理由は crafted-goods.md §5 を見ること。

  // ── 食料 ──
  {
    id: 'buckwheat_flour', display: { name: '蕎麦粉', color: 0xd36657 },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'olive_oil', display: { name: 'オリーブ油', color: 0xbc5e2e },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'butter', display: { name: 'バター', color: 0xe85848 },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'cheese', display: { name: 'チーズ', color: 0xb3512e },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'salted_salmon', display: { name: '塩鮭', color: 0xdb6e4d },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'dried_meat', display: { name: '干し肉', color: 0xed6321 },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'strawberry_jam', display: { name: 'いちごのジャム', color: 0xe34f2c },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'boiled_crab', display: { name: 'かにの塩ゆで', color: 0xe64b23 },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[0, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'mugwort_mochi', display: { name: 'よもぎ餅', color: 0xcd5834 },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'strawberry_shaved_ice', display: { name: 'いちごのかき氷', color: 0xe14c5e },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'ice_cream', display: { name: 'アイスクリーム', color: 0xdb7646 },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'grilled_corn', display: { name: '焼きとうもろこし', color: 0xdb7523 },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'buckwheat_bread', display: { name: '蕎麦粉のパン', color: 0xcd473c },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'walnut_biscuit', display: { name: 'くるみのビスケット', color: 0xcd4c51 },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'sardine_in_oil', display: { name: 'いわしのオイル漬け', color: 0xc46d2e },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'bean_meat_soup', display: { name: '豆と干し肉のスープ', color: 0xb27c24 },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'crab_gratin', display: { name: 'かにのグラタン', color: 0xc97f52 },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'salmon_rice_ball', display: { name: '鮭のおにぎり', color: 0xcc725f },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'salmon_sandwich', display: { name: '鮭のサンドイッチ', color: 0xe55c58 },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'jam_bun', display: { name: 'ジャムパン', color: 0xb0623f },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 飲みもの ──
  {
    id: 'mugwort_tea', display: { name: 'よもぎの茶', color: 0x6087af },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'mint_tea', display: { name: 'ミントの茶', color: 0x2e8ab7 },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'lemon_tea', display: { name: 'レモンの茶', color: 0x3d70cd },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'honey_lemon', display: { name: '蜂蜜レモン', color: 0x50acb4 },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'grape_juice', display: { name: 'ぶどうの果汁', color: 0x6588b7 },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'chilled_apple_water', display: { name: '冷たいりんご水', color: 0x5476ab },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'honey_milk', display: { name: '蜂蜜の乳', color: 0x3fa493 },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'iced_mint_tea', display: { name: '冷たいミントの茶', color: 0x60adcf },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'salted_lemon_water', display: { name: '塩レモン水', color: 0x538e99 },
    mainKind: '飲みもの', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'grape_wine', display: { name: 'ぶどうの酒', color: 0x4f81cf },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'strawberry_milk', display: { name: 'いちごの乳', color: 0x4e91af },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'chestnut_milk', display: { name: '栗の乳', color: 0x489592 },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'iced_mint_milk_tea', display: { name: '冷たいミントの乳茶', color: 0x6172ab },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'mulled_wine', display: { name: '温めたぶどうの酒', color: 0x559ea4 },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'iced_strawberry_milk', display: { name: '冷たいいちごの乳', color: 0x447ea4 },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 衣類 ──
  {
    id: 'wool_yarn', display: { name: '毛糸', color: 0xa689ba },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'cotton_yarn', display: { name: '木綿糸', color: 0x7b4fba },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wool_felt', display: { name: '羊毛のフェルト', color: 0x7662ca },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'antler_belt', display: { name: '角留めの革帯', color: 0x936a9c },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'canvas', display: { name: '木綿の帆布', color: 0x867baf },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wool_scarf', display: { name: '毛糸の襟巻き', color: 0xa879bc },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'felt_hat', display: { name: 'フェルトの帽子', color: 0x8485b8 },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[0, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'cotton_shirt', display: { name: '木綿のシャツ', color: 0x805895 },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'leather_sandals', display: { name: '革のサンダル', color: 0x7d6eca },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'fur_lined_gloves', display: { name: '毛皮裏の革手袋', color: 0x7188b0 },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'fur_lined_coat', display: { name: '毛皮裏の外套', color: 0x97779c },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'canvas_sun_hat', display: { name: '帆布の日よけ帽子', color: 0xa982a2 },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'canvas_apron', display: { name: '帆布の前掛け', color: 0x9865ca },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'waxed_raincoat', display: { name: '蜜蝋引きの合羽', color: 0xa38895 },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'leather_satchel', display: { name: '革の肩掛け鞄', color: 0x9474b6 },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 道具 ──
  {
    id: 'rope', display: { name: '縄', color: 0xaa6b2e },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'file', display: { name: 'やすり', color: 0x838a2f },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'broom', display: { name: 'ほうき', color: 0xaa711b },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'brush', display: { name: '筆', color: 0x766637 },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'candle', display: { name: 'ろうそく', color: 0x8d6417 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'umbrella', display: { name: '傘', color: 0x898425 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'basket', display: { name: 'かご', color: 0xae6416 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wooden_bowl', display: { name: '木の椀', color: 0xa38134 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[0, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'comb', display: { name: '櫛', color: 0xa57243 },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'fishing_rod', display: { name: '釣りざお', color: 0x848f27 },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ══════ 2026-09-07 追加 — 宿題B（Phase 3 の評価が指摘した穴を埋める）10品 ══════
  //
  // ⚠ 埋めたのは2つの穴。どちらも**定義文から素直に導けるもの**だけを出した。
  //   1. `実りの土地` が 5品しかない（束ねる・容れる・蓄える**手段**）
  //   2. `道具` 19品のうち `寒い土地`・`暑い土地`・`温暖な土地` が **0**
  //      → 値を足すと切り方の混在になるので、**気候に答えられる道具を品として足す**方で埋めた
  //
  // ⚠ すべて tier2 以上（＝加工品）。気候は「何が育つか」しか決めないので、
  //   かたちになった道具はどの島も産さない（item-system.md §2 #23）。よって産地はすべて `なし`。
  //
  // ⚠ **書き手は L2 の線（4行の比が3倍以内）を知った状態で選んでいる。独立ではない。**
  //   手順は「定義文から候補を出す → そのあとに数える」を踏んだが、
  //   **Phase 4 の評価は別セッションで行うこと。**

  // ── 実りの土地（多すぎる収穫を捌く手段）──
  {
    id: 'straw_mat', display: { name: '稲わらのむしろ', color: 0xc2a34a },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'pine_barrel', display: { name: '松の桶', color: 0x9a6b3f },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'drying_net', display: { name: '竹の干し網', color: 0x8fa35b },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'canvas_sack', display: { name: '帆布の袋', color: 0xd8c9a3 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 暑い土地（熱を逃がす／冷たさを与える）──
  {
    id: 'bamboo_fan', display: { name: '竹の団扇', color: 0xa8c05a },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'bamboo_blind', display: { name: '竹の簾', color: 0x7f9d3e },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 寒い土地（熱を守る／熱を与える）──
  {
    id: 'pine_firewood', display: { name: '松の薪', color: 0x8b5a2b },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wool_rug', display: { name: '羊毛の敷物', color: 0xd9cfc0 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 温暖な土地（外で過ごす時間の長い暮らし／持ち歩くために作られた形）──
  {
    id: 'bamboo_flask', display: { name: '竹の水筒', color: 0x93b04d },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'carrying_basket', display: { name: '背負い籠', color: 0xb07b34 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ── 2026-09-07 追加 — `実りの土地` の母数を埋める2品 ──
  // `温暖な土地` に「生のまま食べるもの」を明記して6品が移った結果、
  // 需要4行が 18:16:32:9 = 3.56倍 に開いた。**薄い側（実りの土地）を品で埋める。**
  // ⚠ 書き手は「4行の比を3倍以内に収める」ことを知った状態で足している。独立ではない。
  {
    id: 'straw_bale', display: { name: '稲わらの俵', color: 0xbf9a3c },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'bamboo_sieve', display: { name: '竹のざる', color: 0x9fb257 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
] as const

export const ITEMS_BY_ID: ReadonlyMap<string, ItemDef> =
  new Map(ALL_ITEMS.map(i => [i.id, i]))

export function getItem(id: string): ItemDef {
  const item = ITEMS_BY_ID.get(id)
  if (!item) throw new Error(`Item not found: ${id}`)
  return item
}
