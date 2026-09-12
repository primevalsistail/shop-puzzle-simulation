/**
 * 実アイテム **145品**（素材53 ＋ 加工品92）
 *
 * ⚠ **#86 で 麻・藍・小麦 の3素材と、そこから伸びる加工品7品を足した**（135品 → 145品）。
 *   足さなかった理由は「無くても成立している」だったが、それは**商品として扱わない**という判断で
 *   あって、**世界に無い**ではなかった（→ worldbuilding/world.md §8）。
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
 *
 * ⚠ **`display.reading`（検索用の読み）も手で書くデータ**（#65）。**全145品に必ず置く。**
 *   ひらがなだけ（カタカナの品も `あすぱらがす` のようにひらがなで書く）。**画面には出さない。**
 *   判定は `invariants.test.ts`「検索用の読み（#65）」。
 */

import type { ItemDef } from './axes.js'

export const ALL_ITEMS: readonly ItemDef[] = [
  // ══════ 素材（tier1）53品 ══════

  // ── ハルヴェラ島（春） ──
  {
    id: 'takenoko', display: { name: 'たけのこ', reading: 'たけのこ', color: 0xee424e },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1], [1]], basePrice: 28,
    originReason: '掘った日に食べないと固くなる、春の芽',
  },
  {
    id: 'asparagus', display: { name: 'アスパラガス', reading: 'あすぱらがす', color: 0xe7483a },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1], [1]], basePrice: 26,
    originReason: '根株から立ち上がる若い芽そのものを摘む',
  },
  {
    id: 'snap_pea', display: { name: 'さやえんどう', reading: 'さやえんどう', color: 0xca7b4e },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 22,
    originReason: 'さやが柔らかい若いうちだけ摘む',
  },
  {
    id: 'broad_bean', display: { name: 'そら豆', reading: 'そらまめ', color: 0xb2575e },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1]], basePrice: 24,
    originReason: '実が若く水気を含んでいる短い期間が採り時',
  },
  {
    id: 'strawberry', display: { name: 'いちご', reading: 'いちご', color: 0xef6527 },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 35,
    originReason: '花が咲いて実がつくのが春',
  },
  {
    id: 'rape_blossom', display: { name: '菜の花', reading: 'なのはな', color: 0xd27143 },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 20,
    originReason: 'つぼみがほどける直前の茎ごと摘む',
  },
  {
    id: 'mugwort', display: { name: 'よもぎ', reading: 'よもぎ', color: 0xcd7f52 },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 18,
    originReason: '地面から出たばかりの若葉だけを摘む',
  },
  {
    id: 'tea_leaf', display: { name: '茶の葉', reading: 'ちゃのは', color: 0x49a896 },
    mainKind: '飲みもの', origin: 'ハルヴェラ', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 40,
    originReason: '枝先に出る新芽だけを摘む',
  },
  {
    id: 'wool', display: { name: '羊毛', reading: 'ようもう', color: 0xad6096 },
    mainKind: '衣類', origin: 'ハルヴェラ', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]], basePrice: 32,
    originReason: '毛を刈るのは春。一年分をまとめて刈る',
  },
  {
    id: 'bamboo', display: { name: '竹', reading: 'たけ', color: 0xb17e2b },
    mainKind: '道具', origin: 'ハルヴェラ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]], basePrice: 26,
    originReason: 'たけのこが育ったもの。旬は生きものに付く',
  },
  {
    id: 'sheep_milk', display: { name: '羊の乳', reading: 'ひつじのちち', color: 0x479e99 },
    mainKind: '飲みもの', origin: 'ハルヴェラ', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 30,
    originReason: '羊毛と同じ羊から。子が生まれて乳が出はじめるのが春',
  },

  // ── リナツィア島（夏） ──
  {
    id: 'fig', display: { name: 'いちじく', reading: 'いちじく', color: 0xc54a52 },
    mainKind: '食料', origin: 'リナツィア', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 38,
    originReason: '実が柔らかく熟して甘くなるのは暑さが続くころ',
  },
  {
    id: 'watermelon', display: { name: 'すいか', reading: 'すいか', color: 0xdc4e21 },
    mainKind: '食料', origin: 'リナツィア', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]], basePrice: 34,
    originReason: '高温と強い日ざしで甘みが乗る、暑い盛りの実',
  },
  {
    id: 'corn', display: { name: 'とうもろこし', reading: 'とうもろこし', color: 0xb75c3f },
    mainKind: '食料', origin: 'リナツィア', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1], [1], [1]], basePrice: 20,
    originReason: '高温と長い日照で一気に育つ',
  },
  {
    id: 'eggplant', display: { name: 'なす', reading: 'なす', color: 0xc04648 },
    mainKind: '食料', origin: 'リナツィア', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 22,
    originReason: '高温を好み、実がつやよく次々になる',
  },
  {
    id: 'chili', display: { name: 'とうがらし', reading: 'とうがらし', color: 0xc46822 },
    mainKind: '食料', origin: 'リナツィア', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1]], basePrice: 30,
    originReason: '暑さで実が色づき辛みが強くなる',
  },
  {
    id: 'sunflower_seed', display: { name: 'ひまわりの種', reading: 'ひまわりのたね', color: 0xd95a3c },
    mainKind: '食料', origin: 'リナツィア', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 24,
    originReason: '花が開くのが真夏で、種が詰まるのはその直後',
  },
  {
    id: 'honey', display: { name: '蜂蜜', reading: 'はちみつ', color: 0xc45c5f },
    mainKind: '食料', origin: 'リナツィア', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1]], basePrice: 55,
    originReason: '花が咲きそろって蜂がいちばん蜜を溜め込む時期',
  },
  {
    id: 'mint', display: { name: 'ミント', reading: 'みんと', color: 0x4ba3a8 },
    mainKind: '飲みもの', origin: 'リナツィア', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1]], basePrice: 26,
    originReason: '暑さで葉がよく茂り、香りがもっとも強くなる',
  },
  {
    id: 'beeswax', display: { name: '蜜蝋', reading: 'みつろう', color: 0x9c8a32 },
    mainKind: '道具', origin: 'リナツィア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 34,
    originReason: '蜂蜜と同じ巣から採れる。旬は生きものに付く',
  },
  // ⚠ **麻・藍は #86 で足した素材**（それまでは「無くても成立している」として置いていなかった）。
  //   置いていなかったのは**商品として扱わない**という判断であって、**世界に無い**ではない。
  //   産地は既存の規則どおり「その品が一般的にどの季節のイメージか」だけで決めている。
  {
    id: 'hemp', display: { name: '麻', reading: 'あさ', color: 0x4e9b3e },
    mainKind: '衣類', origin: 'リナツィア', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]], basePrice: 28,
    originReason: '丈が伸びきる真夏に刈り取る',
  },
  {
    id: 'indigo', display: { name: '藍', reading: 'あい', color: 0x2b3f8f },
    mainKind: '道具', origin: 'リナツィア', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1]], basePrice: 26,
    originReason: '葉がもっとも濃く茂る真夏に刈る',
  },

  // ── ノアキータ島（秋） ──
  {
    id: 'chestnut', display: { name: '栗', reading: 'くり', color: 0xe25740 },
    mainKind: '食料', origin: 'ノアキータ', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 30,
    originReason: 'いがが割れて実が自然に落ちる',
  },
  {
    id: 'persimmon', display: { name: '柿', reading: 'かき', color: 0xdf5e4e },
    mainKind: '食料', origin: 'ノアキータ', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 28,
    originReason: '寒暖差で渋が抜けて色づき、熟す',
  },
  {
    id: 'grape', display: { name: 'ぶどう', reading: 'ぶどう', color: 0xd17954 },
    mainKind: '食料', origin: 'ノアキータ', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[0, 1], [1, 1]], basePrice: 35,
    originReason: '日が短くなり寒暖差が出る時期に糖が乗って熟す',
  },
  {
    id: 'apple', display: { name: 'りんご', reading: 'りんご', color: 0xc0504e },
    mainKind: '食料', origin: 'ノアキータ', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 30,
    originReason: '夜の冷えで色と甘みが入り、霜の前に穫る',
  },
  {
    id: 'sweet_potato', display: { name: 'さつまいも', reading: 'さつまいも', color: 0xba6453 },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]], basePrice: 18,
    originReason: '霜に当たると傷むため、霜の前に掘り上げる',
  },
  {
    id: 'rice', display: { name: '米', reading: 'こめ', color: 0xc76a5c },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]], basePrice: 16,
    originReason: '穂が垂れ、水を落として刈り取る',
  },
  {
    id: 'buckwheat', display: { name: '蕎麦の実', reading: 'そばのみ', color: 0xd24e53 },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 15,
    originReason: '実が黒く熟して脱粒する',
  },
  {
    // ⚠ **#86 で足した素材。**旬は米・蕎麦の実と同じ「実り」＝秋。
    //   ノアキータの性格が「熟したもの・実ったもの。木の実と穀」なので、穀はここに乗る。
    id: 'wheat', display: { name: '小麦', reading: 'こむぎ', color: 0xe6b31e },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]], basePrice: 16,
    originReason: '穂が黄金に実って刈り取る',
  },
  {
    id: 'walnut', display: { name: 'くるみ', reading: 'くるみ', color: 0xd0544e },
    mainKind: '食料', origin: 'ノアキータ', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 32,
    originReason: '外皮が裂けて殻ごと落ちる',
  },
  {
    id: 'salmon', display: { name: '鮭', reading: 'さけ', color: 0xbe6b56 },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1, 1, 1]], basePrice: 45,
    originReason: '産卵のために群れが川へ戻る。この時期だけ岸で獲れる',
  },
  {
    id: 'cotton', display: { name: '綿', reading: 'わた', color: 0xa97f9a },
    mainKind: '衣類', origin: 'ノアキータ', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]], basePrice: 30,
    originReason: '実がはじけて綿毛が露出する',
  },
  {
    id: 'olive', display: { name: 'オリーブ', reading: 'おりーぶ', color: 0xe2642b },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 34,
    originReason: '実を摘むのは秋',
  },
  {
    id: 'rice_straw', display: { name: '稲わら', reading: 'いなわら', color: 0x7a6f29 },
    mainKind: '道具', origin: 'ノアキータ', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1]], basePrice: 12,
    originReason: '米と同じ株から採れる。旬は生きものに付く',
  },

  // ── ミフユリア島（冬） ──
  {
    id: 'ice', display: { name: '氷', reading: 'こおり', color: 0x38749f },
    mainKind: '飲みもの', origin: 'ミフユリア', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]], basePrice: 20,
    originReason: '水が凍りつく土地でしか切り出せない。島の気候そのものが商品',
  },
  {
    id: 'reindeer_meat', display: { name: 'トナカイの肉', reading: 'となかいのにく', color: 0xc86847 },
    mainKind: '食料', origin: 'ミフユリア', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]], basePrice: 55,
    originReason: '雪を掘って苔を食む獣。雪の消えない土地でこそ群れが養える',
  },
  {
    id: 'reindeer_antler', display: { name: 'トナカイの角', reading: 'となかいのつの', color: 0x796c26 },
    mainKind: '道具', origin: 'ミフユリア', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 0], [1, 1]], basePrice: 40,
    originReason: '同じ獣から落ちる角',
  },
  {
    id: 'reindeer_hide', display: { name: 'トナカイの革', reading: 'となかいのかわ', color: 0xa784b4 },
    mainKind: '衣類', origin: 'ミフユリア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1], [1, 1]], basePrice: 48,
    originReason: '肉・角と同じ獣から。旬は生きものに付く',
  },
  {
    id: 'rabbit_fur', display: { name: 'うさぎの毛皮', reading: 'うさぎのけがわ', color: 0x948ea7 },
    mainKind: '衣類', origin: 'ミフユリア', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1, 1]], basePrice: 42,
    originReason: '寒さの中でこそ毛が白く厚く密になる',
  },
  {
    id: 'enoki', display: { name: 'えのきたけ', reading: 'えのきたけ', color: 0xcd6845 },
    mainKind: '食料', origin: 'ミフユリア', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 22,
    originReason: '凍りつく倒木や雪の下に出る菌。寒さが発生の条件',
  },
  {
    id: 'pine', display: { name: '松', reading: 'まつ', color: 0x84702b },
    mainKind: '道具', origin: 'ミフユリア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1]], basePrice: 24,
    originReason: '雪の重みと凍てつきに耐えて緑を保つ針葉樹',
  },
  {
    id: 'birch', display: { name: '白樺', reading: 'しらかば', color: 0x7c5a42 },
    mainKind: '道具', origin: 'ミフユリア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1]], basePrice: 26,
    originReason: '寒さの厳しい土地にだけ純林を作る木',
  },
  {
    id: 'kelp', display: { name: '昆布', reading: 'こんぶ', color: 0xb27352 },
    mainKind: '食料', origin: 'ミフユリア', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1], [1]], basePrice: 20,
    originReason: '冷たい海でしか大きく育たない海藻',
  },
  {
    id: 'crab', display: { name: 'かに', reading: 'かに', color: 0xcd6158 },
    mainKind: '食料', origin: 'ミフユリア', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[0, 1], [1, 1]], basePrice: 60,
    originReason: '冷たく深い海にだけ棲み、身が詰まるのが寒さの底',
  },
  {
    id: 'lemon', display: { name: 'レモン', reading: 'れもん', color: 0xd44958 },
    mainKind: '食料', origin: 'ミフユリア', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 28,
    originReason: '実が熟すのは冬。冬の柑橘',
  },

  // ── 海（産地なし・通年） ──
  {
    id: 'tuna', display: { name: 'まぐろ', reading: 'まぐろ', color: 0xbb5548 },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1, 1]], basePrice: 55,
    originReason: '一つの海域に留まらず外洋を回遊し続ける',
  },
  {
    id: 'sardine', display: { name: 'いわし', reading: 'いわし', color: 0xcd7952 },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 18,
    originReason: '群れが絶えず移動し、産卵の時期も群れごとにずれる',
  },
  {
    id: 'squid', display: { name: 'いか', reading: 'いか', color: 0xdf7529 },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 30,
    originReason: '種類ごとに寄る時期が違い、外洋を漂うものが多い',
  },
  {
    id: 'salt', display: { name: '塩', reading: 'しお', color: 0xe7605b },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1]], basePrice: 14,
    originReason: '海がある限りいつでも採れる。どの島の岸でも同じ',
  },
  {
    id: 'driftwood', display: { name: '流木', reading: 'りゅうぼく', color: 0x778b4b },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1, 1]], basePrice: 10,
    originReason: '波任せで流れ着く。いつ来るとも、どこから来たとも決まっていない',
  },
  {
    id: 'pumice', display: { name: '軽石', reading: 'かるいし', color: 0x928520 },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 12,
    originReason: '海面を漂って流れてくる石',
  },
  {
    id: 'gull_feather', display: { name: 'かもめの羽根', reading: 'かもめのはね', color: 0x8a6545 },
    mainKind: '道具', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1]], basePrice: 16,
    originReason: 'かもめは季節を問わず船について回る',
  },

  // ══════ 加工品（tier2以上）92品 ══════
  // 産地はすべて `なし`。**加工品は旬を持たないため**（island-goods.md §2）。
  // 「主材料の産地」を採らなかった理由は crafted-goods.md §5 を見ること。

  // ── 食料 ──
  {
    id: 'buckwheat_flour', display: { name: '蕎麦粉', reading: 'そばこ', color: 0xd36657 },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'olive_oil', display: { name: 'オリーブ油', reading: 'おりーぶゆ', color: 0xbc5e2e },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'butter', display: { name: 'バター', reading: 'ばたー', color: 0xe85848 },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'cheese', display: { name: 'チーズ', reading: 'ちーず', color: 0xb3512e },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'salted_salmon', display: { name: '塩鮭', reading: 'しおざけ', color: 0xdb6e4d },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'dried_meat', display: { name: '干し肉', reading: 'ほしにく', color: 0xed6321 },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'strawberry_jam', display: { name: 'いちごのジャム', reading: 'いちごのじゃむ', color: 0xe34f2c },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'boiled_crab', display: { name: 'かにの塩ゆで', reading: 'かにのしおゆで', color: 0xe64b23 },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[0, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'mugwort_mochi', display: { name: 'よもぎ餅', reading: 'よもぎもち', color: 0xcd5834 },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'strawberry_shaved_ice', display: { name: 'いちごのかき氷', reading: 'いちごのかきごおり', color: 0xe14c5e },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'ice_cream', display: { name: 'アイスクリーム', reading: 'あいすくりーむ', color: 0xdb7646 },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'grilled_corn', display: { name: '焼きとうもろこし', reading: 'やきとうもろこし', color: 0xdb7523 },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'buckwheat_bread', display: { name: '蕎麦粉のパン', reading: 'そばこのぱん', color: 0xcd473c },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'walnut_biscuit', display: { name: 'くるみのビスケット', reading: 'くるみのびすけっと', color: 0xcd4c51 },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'sardine_in_oil', display: { name: 'いわしのオイル漬け', reading: 'いわしのおいるづけ', color: 0xc46d2e },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'bean_meat_soup', display: { name: '豆と干し肉のスープ', reading: 'まめとほしにくのすーぷ', color: 0xb27c24 },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'crab_gratin', display: { name: 'かにのグラタン', reading: 'かにのぐらたん', color: 0xc97f52 },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'salmon_rice_ball', display: { name: '鮭のおにぎり', reading: 'さけのおにぎり', color: 0xcc725f },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'salmon_sandwich', display: { name: '鮭のサンドイッチ', reading: 'さけのさんどいっち', color: 0xe55c58 },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'jam_bun', display: { name: 'ジャムパン', reading: 'じゃむぱん', color: 0xb0623f },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ⚠ **#86。パンは足さない。**「蕎麦粉のパン」が既にあり、同じ形になる。
  //   小麦でしか出ない方向（**つながる粉＝麺**）だけを足した。
  {
    id: 'wheat_flour', display: { name: '小麦粉', reading: 'こむぎこ', color: 0xefc96f },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'udon', display: { name: 'うどん', reading: 'うどん', color: 0xf5efd8 },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 飲みもの ──
  {
    id: 'mugwort_tea', display: { name: 'よもぎの茶', reading: 'よもぎのちゃ', color: 0x6087af },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'mint_tea', display: { name: 'ミントの茶', reading: 'みんとのちゃ', color: 0x2e8ab7 },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'lemon_tea', display: { name: 'レモンの茶', reading: 'れもんのちゃ', color: 0x3d70cd },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'honey_lemon', display: { name: '蜂蜜レモン', reading: 'はちみつれもん', color: 0x50acb4 },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'grape_juice', display: { name: 'ぶどうの果汁', reading: 'ぶどうのかじゅう', color: 0x6588b7 },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'chilled_apple_water', display: { name: '冷たいりんご水', reading: 'つめたいりんごすい', color: 0x5476ab },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'honey_milk', display: { name: '蜂蜜の乳', reading: 'はちみつのちち', color: 0x3fa493 },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'iced_mint_tea', display: { name: '冷たいミントの茶', reading: 'つめたいみんとのちゃ', color: 0x60adcf },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'salted_lemon_water', display: { name: '塩レモン水', reading: 'しおれもんすい', color: 0x538e99 },
    mainKind: '飲みもの', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'grape_wine', display: { name: 'ぶどうの酒', reading: 'ぶどうのさけ', color: 0x4f81cf },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'strawberry_milk', display: { name: 'いちごの乳', reading: 'いちごのちち', color: 0x4e91af },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'chestnut_milk', display: { name: '栗の乳', reading: 'くりのちち', color: 0x489592 },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'iced_mint_milk_tea', display: { name: '冷たいミントの乳茶', reading: 'つめたいみんとのちちちゃ', color: 0x6172ab },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'mulled_wine', display: { name: '温めたぶどうの酒', reading: 'あたためたぶどうのさけ', color: 0x559ea4 },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'iced_strawberry_milk', display: { name: '冷たいいちごの乳', reading: 'つめたいいちごのちち', color: 0x447ea4 },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 衣類 ──
  {
    id: 'wool_yarn', display: { name: '毛糸', reading: 'けいと', color: 0xa689ba },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'cotton_yarn', display: { name: '木綿糸', reading: 'もめんいと', color: 0x7b4fba },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ **#86 の麻の系統**（麻 → 麻糸 → 麻布 → 染めの麻布 → 麻の上着）。
  //   crafted-goods.md §7「暑い土地向けは3品で深さが出ていない（麻を足さない判断の帰結）」への答え。
  //   ⚠ **麻糸は `どこでも`。**糸そのものは用途が一つに定まらない（木綿糸と同じ扱い）。
  //   **布から先が `暑い土地`**（熱を逃がす布、という定義そのもの）。
  {
    id: 'hemp_yarn', display: { name: '麻糸', reading: 'あさいと', color: 0x8fc47a },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'hemp_cloth', display: { name: '麻布', reading: 'あさぬの', color: 0xb9cf8e },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wool_felt', display: { name: '羊毛のフェルト', reading: 'ようもうのふぇると', color: 0x7662ca },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'antler_belt', display: { name: '角留めの革帯', reading: 'つのどめのかわおび', color: 0x936a9c },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'canvas', display: { name: '木綿の帆布', reading: 'もめんのはんぷ', color: 0x867baf },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wool_scarf', display: { name: '毛糸の襟巻き', reading: 'けいとのえりまき', color: 0xa879bc },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'felt_hat', display: { name: 'フェルトの帽子', reading: 'ふぇるとのぼうし', color: 0x8485b8 },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[0, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'cotton_shirt', display: { name: '木綿のシャツ', reading: 'もめんのしゃつ', color: 0x805895 },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'leather_sandals', display: { name: '革のサンダル', reading: 'かわのさんだる', color: 0x7d6eca },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'fur_lined_gloves', display: { name: '毛皮裏の革手袋', reading: 'けがわうらのかわてぶくろ', color: 0x7188b0 },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'fur_lined_coat', display: { name: '毛皮裏の外套', reading: 'けがわうらのがいとう', color: 0x97779c },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'canvas_sun_hat', display: { name: '帆布の日よけ帽子', reading: 'はんぷのひよけぼうし', color: 0xa982a2 },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'canvas_apron', display: { name: '帆布の前掛け', reading: 'はんぷのまえかけ', color: 0x9865ca },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'waxed_raincoat', display: { name: '蜜蝋引きの合羽', reading: 'みつろうびきのかっぱ', color: 0xa38895 },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'leather_satchel', display: { name: '革の肩掛け鞄', reading: 'かわのかたかけかばん', color: 0x9474b6 },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ **色を品目数の軸にしない**（#86 の PO 明示）。
  //   染めた品は**この2品だけ**で、**名前に色を持たせていない。**
  //   「藍染めの布」「紅花染めの布」と分けると、色の数だけ品目が増える＝水増しになる。
  {
    id: 'dyed_hemp_cloth', display: { name: '染めの麻布', reading: 'そめのあさぬの', color: 0x3f4fbf },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '暑い土地',
    shape: [[1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'hemp_jacket', display: { name: '麻の上着', reading: 'あさのうわぎ', color: 0x6a7fe8 },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 道具 ──
  {
    id: 'rope', display: { name: '縄', reading: 'なわ', color: 0xaa6b2e },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'file', display: { name: 'やすり', reading: 'やすり', color: 0x838a2f },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'broom', display: { name: 'ほうき', reading: 'ほうき', color: 0xaa711b },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'brush', display: { name: '筆', reading: 'ふで', color: 0x766637 },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'candle', display: { name: 'ろうそく', reading: 'ろうそく', color: 0x8d6417 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'umbrella', display: { name: '傘', reading: 'かさ', color: 0x898425 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'basket', display: { name: 'かご', reading: 'かご', color: 0xae6416 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wooden_bowl', display: { name: '木の椀', reading: 'きのわん', color: 0xa38134 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[0, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'comb', display: { name: '櫛', reading: 'くし', color: 0xa57243 },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'fishing_rod', display: { name: '釣りざお', reading: 'つりざお', color: 0x848f27 },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ **染料は1品だけ**（#86）。**色ごとに分けない。**
  //   `RECIPES_BY_OUTPUT` は出力1つにレシピ1本なので、
  //   **「染料」という品が1つである限り、色を増やしても品目は増えない**という形になっている。
  {
    id: 'dye', display: { name: '染料', reading: 'せんりょう', color: 0x3a2f7a },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ══════ 道具 10品 ══════
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
    id: 'straw_mat', display: { name: '稲わらのむしろ', reading: 'いなわらのむしろ', color: 0xc2a34a },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'pine_barrel', display: { name: '松の桶', reading: 'まつのおけ', color: 0x9a6b3f },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'drying_net', display: { name: '竹の干し網', reading: 'たけのほしあみ', color: 0x8fa35b },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'canvas_sack', display: { name: '帆布の袋', reading: 'はんぷのふくろ', color: 0xd8c9a3 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 暑い土地（熱を逃がす／冷たさを与える）──
  {
    id: 'bamboo_fan', display: { name: '竹の団扇', reading: 'たけのうちわ', color: 0xa8c05a },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'bamboo_blind', display: { name: '竹の簾', reading: 'たけのすだれ', color: 0x7f9d3e },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 寒い土地（熱を守る／熱を与える）──
  {
    id: 'pine_firewood', display: { name: '松の薪', reading: 'まつのまき', color: 0x8b5a2b },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wool_rug', display: { name: '羊毛の敷物', reading: 'ようもうのしきもの', color: 0xd9cfc0 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 温暖な土地（外で過ごす時間の長い暮らし／持ち歩くために作られた形）──
  {
    id: 'bamboo_flask', display: { name: '竹の水筒', reading: 'たけのすいとう', color: 0x93b04d },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'carrying_basket', display: { name: '背負い籠', reading: 'せおいかご', color: 0xb07b34 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ── `実りの土地` の母数を埋める2品 ──
  // `温暖な土地` に「生のまま食べるもの」を明記して6品が移った結果、
  // 需要4行が 18:16:32:9 = 3.56倍 に開いた。**薄い側（実りの土地）を品で埋める。**
  // ⚠ 書き手は「4行の比を3倍以内に収める」ことを知った状態で足している。独立ではない。
  {
    id: 'straw_bale', display: { name: '稲わらの俵', reading: 'いなわらのたわら', color: 0xbf9a3c },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'bamboo_sieve', display: { name: '竹のざる', reading: 'たけのざる', color: 0x9fb257 },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ══════ tier5〜7（段5）13品 ══════
  //
  // **作り込みを7段まで伸ばす**（`rules.ts` の `MAX_TIER = 7`。理由は
  // aidlc-docs/construction/plans/max-tier-review.md — ペルソナ4人の評価で決めた値であり、
  // 利益や効率から出した値ではない）。
  //
  // ⚠ **素材も軸も1つも足していない。**使ったのは既存の50素材と既存の4軸だけで、
  //   深い段は「**すでに作った品を組み上げて一式にする**」ことだけで出している。
  //   crafted-goods.md §7 の限界（金属が無い・粘土が無い・卵と小麦が無い）はそのまま。
  //
  // ⚠ **先細りにしてある**（#86 の追加後: tier4=11品 → tier5=8 → tier6=4 → tier7=2）。
  //   深いほど品数は少なく、1品が占める升は大きい（3.64升 → 5.75 → 7.50 → 9.00）。
  //   ⚠ **麻の系統（#86）は tier4 に1品・tier5 に1品を足しており、この段の品はここだけに無い。**
  //   （麻の品は主種類ごとの並びのほうに置いてある）
  //   9升は最大盤面 13×10=130升の 7%。**1品で盤面を食い潰さない。**
  //
  // ⚠ 産地はすべて `なし`。加工品は旬を持たないため（#22 / island-goods.md §2）。
  //
  // ⚠ **書き手は需要4行の母数を知った状態で `向く土地` を選んでいる。独立ではない。**
  //   手順は「定義文から素直に導ける値を置く → そのあとに数える」を踏んだが、
  //   `どこでも` を1品も置かなかったのは**深い品でも島を選ぶ理由を残すため**という判断が入っている
  //   （`どこでも` は需要表4行のどれにも当たらないので、置くと D1 が効かなくなる）。
  //   **評価は別セッションで行うこと。**

  // ── tier5 ── すでに作った品を「一式」「詰め合わせ」に組み上げる段
  {
    id: 'sweets_assortment', display: { name: '菓子の詰め合わせ', reading: 'かしのつめあわせ', color: 0xd9a05b },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'voyage_lunch', display: { name: '旅の弁当', reading: 'たびのべんとう', color: 0xc08a4a },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'flask_mulled_wine', display: { name: '水筒詰めの温め酒', reading: 'すいとうづめのあたためざけ', color: 0x7a4e86 },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'winter_outfit', display: { name: '冬の装い一式', reading: 'ふゆのよそおいいっしき', color: 0x8d7f6e },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'sun_outfit', display: { name: '日よけの装い一式', reading: 'ひよけのよそおいいっしき', color: 0xe0cf9a },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'harvest_hamper', display: { name: '帆布張りの収穫かご', reading: 'はんぷばりのしゅうかくかご', color: 0xbb9a5f },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'ice_barrel', display: { name: 'フェルト張りの氷入れ', reading: 'ふぇるとばりのこおりいれ', color: 0x9fbdd0 },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── tier6 ── 一式に上物を重ねる段
  {
    id: 'feast_hamper', display: { name: 'もてなしの籠盛り', reading: 'もてなしのかごもり', color: 0xd08b4f },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1, 1], [1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wine_gift_set', display: { name: '酒の贈りもの一式', reading: 'さけのおくりものいっしき', color: 0x6b4a90 },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'winter_finery', display: { name: '冬の晴れ着一式', reading: 'ふゆのはれぎいっしき', color: 0xa38a94 },
    mainKind: '衣類', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'peddler_kit', display: { name: '行商の荷ごしらえ一式', reading: 'ぎょうしょうのにごしらえいっしき', color: 0xa8873f },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── tier7 ── 終点。**2品だけ**（4段では底が見え、10段では序盤に心が折れる、の折衷）
  {
    id: 'grand_outfit', display: { name: '晴れの装い一式', reading: 'はれのよそおいいっしき', color: 0x8e6f9e },
    mainKind: '衣類', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'celebration_hamper', display: { name: '祝いの籠盛り', reading: 'いわいのかごもり', color: 0xc9703f },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
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
