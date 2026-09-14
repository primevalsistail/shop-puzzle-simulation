/**
 * 実アイテム **161品**（素材55 ＋ 加工品106）
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
 * ⚠ **`display.reading`（検索用の読み）も手で書くデータ**（#65）。**全161品に必ず置く。**
 *   ひらがなだけ（カタカナの品も `あすぱらがす` のようにひらがなで書く）。**画面には出さない。**
 *   判定は `invariants.test.ts`「検索用の読み（#65）」。
 */

import type { ItemDef } from './axes.js'

export const ALL_ITEMS: readonly ItemDef[] = [
  // ══════ 素材（tier1）55品 ══════

  // ── ハルヴェラ島（春） ──
  {
    id: 'takenoko', display: { name: 'たけのこ', reading: 'たけのこ' },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1], [1]], basePrice: 28,
    originReason: '掘った日に食べないと固くなる、春の芽',
  },
  {
    id: 'asparagus', display: { name: 'アスパラガス', reading: 'あすぱらがす' },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1], [1]], basePrice: 26,
    originReason: '根株から立ち上がる若い芽そのものを摘む',
  },
  {
    id: 'snap_pea', display: { name: 'さやえんどう', reading: 'さやえんどう' },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 22,
    originReason: 'さやが柔らかい若いうちだけ摘む',
  },
  {
    id: 'broad_bean', display: { name: 'そら豆', reading: 'そらまめ' },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1]], basePrice: 24,
    originReason: '実が若く水気を含んでいる短い期間が採り時',
  },
  {
    id: 'strawberry', display: { name: 'いちご', reading: 'いちご' },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 35,
    originReason: '花が咲いて実がつくのが春',
  },
  {
    id: 'rape_blossom', display: { name: '菜の花', reading: 'なのはな' },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 20,
    originReason: 'つぼみがほどける直前の茎ごと摘む',
  },
  {
    id: 'mugwort', display: { name: 'よもぎ', reading: 'よもぎ' },
    mainKind: '食料', origin: 'ハルヴェラ', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 18,
    originReason: '地面から出たばかりの若葉だけを摘む',
  },
  {
    id: 'tea_leaf', display: { name: '茶の葉', reading: 'ちゃのは' },
    mainKind: '飲みもの', origin: 'ハルヴェラ', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 40,
    originReason: '枝先に出る新芽だけを摘む',
  },
  {
    id: 'wool', display: { name: '羊毛', reading: 'ようもう' },
    mainKind: '衣類', origin: 'ハルヴェラ', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]], basePrice: 32,
    originReason: '毛を刈るのは春。一年分をまとめて刈る',
  },
  {
    id: 'bamboo', display: { name: '竹', reading: 'たけ' },
    mainKind: '道具', origin: 'ハルヴェラ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]], basePrice: 26,
    originReason: 'たけのこが育ったもの。旬は生きものに付く',
  },
  {
    id: 'sheep_milk', display: { name: '羊の乳', reading: 'ひつじのちち' },
    mainKind: '飲みもの', origin: 'ハルヴェラ', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 30,
    originReason: '羊毛と同じ羊から。子が生まれて乳が出はじめるのが春',
  },
  // ⚠ **#89 で足した素材。**鉄鉱石（#87）と同じく **island-goods.md §2-B**
  //   （土地から掘り出すものには PO が島を指名して産地を付ける）で島を決めている。
  //   **`なし` に落とすと U4 でどの島の商人にも並び、この系統から航海の理由が消える。**
  //   ⚠ **旬の話は書かない。**旬では島が決まらないから指名で決めた、という品である。
  {
    id: 'clay', display: { name: '粘土', reading: 'ねんど' },
    mainKind: '道具', origin: 'ハルヴェラ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]], basePrice: 14,
    originReason: '川べりの土を掘って採る。旬では島が決まらないので、島は指名で決めた',
  },

  // ── リナツィア島（夏） ──
  {
    id: 'fig', display: { name: 'いちじく', reading: 'いちじく' },
    mainKind: '食料', origin: 'リナツィア', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 38,
    originReason: '実が柔らかく熟して甘くなるのは暑さが続くころ',
  },
  {
    id: 'watermelon', display: { name: 'すいか', reading: 'すいか' },
    mainKind: '食料', origin: 'リナツィア', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]], basePrice: 34,
    originReason: '高温と強い日ざしで甘みが乗る、暑い盛りの実',
  },
  {
    id: 'corn', display: { name: 'とうもろこし', reading: 'とうもろこし' },
    mainKind: '食料', origin: 'リナツィア', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1], [1], [1]], basePrice: 20,
    originReason: '高温と長い日照で一気に育つ',
  },
  {
    id: 'eggplant', display: { name: 'なす', reading: 'なす' },
    mainKind: '食料', origin: 'リナツィア', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 22,
    originReason: '高温を好み、実がつやよく次々になる',
  },
  {
    id: 'chili', display: { name: 'とうがらし', reading: 'とうがらし' },
    mainKind: '食料', origin: 'リナツィア', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1]], basePrice: 30,
    originReason: '暑さで実が色づき辛みが強くなる',
  },
  {
    id: 'sunflower_seed', display: { name: 'ひまわりの種', reading: 'ひまわりのたね' },
    mainKind: '食料', origin: 'リナツィア', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 24,
    originReason: '花が開くのが真夏で、種が詰まるのはその直後',
  },
  {
    id: 'honey', display: { name: '蜂蜜', reading: 'はちみつ' },
    mainKind: '食料', origin: 'リナツィア', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1]], basePrice: 55,
    originReason: '花が咲きそろって蜂がいちばん蜜を溜め込む時期',
  },
  {
    id: 'mint', display: { name: 'ミント', reading: 'みんと' },
    mainKind: '飲みもの', origin: 'リナツィア', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1]], basePrice: 26,
    originReason: '暑さで葉がよく茂り、香りがもっとも強くなる',
  },
  {
    id: 'beeswax', display: { name: '蜜蝋', reading: 'みつろう' },
    mainKind: '道具', origin: 'リナツィア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 34,
    originReason: '蜂蜜と同じ巣から採れる。旬は生きものに付く',
  },
  // ⚠ **麻・藍は #86 で足した素材**（それまでは「無くても成立している」として置いていなかった）。
  //   置いていなかったのは**商品として扱わない**という判断であって、**世界に無い**ではない。
  //   産地は既存の規則どおり「その品が一般的にどの季節のイメージか」だけで決めている。
  {
    id: 'hemp', display: { name: '麻', reading: 'あさ' },
    mainKind: '衣類', origin: 'リナツィア', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]], basePrice: 28,
    originReason: '丈が伸びきる真夏に刈り取る',
  },
  {
    id: 'indigo', display: { name: '藍', reading: 'あい' },
    mainKind: '道具', origin: 'リナツィア', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1]], basePrice: 26,
    originReason: '葉がもっとも濃く茂る真夏に刈る',
  },

  // ⚠ **#87 で足した素材。金属の素材はこれが最初の1品。**
  //   ⚠ **旬では島が決まらない品**なので、産地は **island-goods.md §2-B**
  //   （土地から掘り出すものには PO が島を指名して産地を付ける）に沿って付けている。
  //   **`なし` に落とすと U4 でどの島の商人にも並び、この系統から航海の理由が消える。**
  {
    id: 'iron_ore', display: { name: '鉄鉱石', reading: 'てつこうせき' },
    mainKind: '道具', origin: 'リナツィア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]], basePrice: 30,
    originReason: '岩の剥き出た丘を掘って採る。旬では島が決まらないので、島は指名で決めた',
  },

  // ── ノアキータ島（秋） ──
  {
    id: 'chestnut', display: { name: '栗', reading: 'くり' },
    mainKind: '食料', origin: 'ノアキータ', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 30,
    originReason: 'いがが割れて実が自然に落ちる',
  },
  {
    id: 'persimmon', display: { name: '柿', reading: 'かき' },
    mainKind: '食料', origin: 'ノアキータ', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 28,
    originReason: '寒暖差で渋が抜けて色づき、熟す',
  },
  {
    id: 'grape', display: { name: 'ぶどう', reading: 'ぶどう' },
    mainKind: '食料', origin: 'ノアキータ', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[0, 1], [1, 1]], basePrice: 35,
    originReason: '日が短くなり寒暖差が出る時期に糖が乗って熟す',
  },
  {
    id: 'apple', display: { name: 'りんご', reading: 'りんご' },
    mainKind: '食料', origin: 'ノアキータ', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 30,
    originReason: '夜の冷えで色と甘みが入り、霜の前に穫る',
  },
  {
    id: 'sweet_potato', display: { name: 'さつまいも', reading: 'さつまいも' },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]], basePrice: 18,
    originReason: '霜に当たると傷むため、霜の前に掘り上げる',
  },
  {
    id: 'rice', display: { name: '米', reading: 'こめ' },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]], basePrice: 16,
    originReason: '穂が垂れ、水を落として刈り取る',
  },
  {
    id: 'buckwheat', display: { name: '蕎麦の実', reading: 'そばのみ' },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 15,
    originReason: '実が黒く熟して脱粒する',
  },
  {
    // ⚠ **#86 で足した素材。**旬は米・蕎麦の実と同じ「実り」＝秋。
    //   ノアキータの性格が「熟したもの・実ったもの。木の実と穀」なので、穀はここに乗る。
    id: 'wheat', display: { name: '小麦', reading: 'こむぎ' },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]], basePrice: 16,
    originReason: '穂が黄金に実って刈り取る',
  },
  {
    id: 'walnut', display: { name: 'くるみ', reading: 'くるみ' },
    mainKind: '食料', origin: 'ノアキータ', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 32,
    originReason: '外皮が裂けて殻ごと落ちる',
  },
  {
    id: 'salmon', display: { name: '鮭', reading: 'さけ' },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1, 1, 1]], basePrice: 45,
    originReason: '産卵のために群れが川へ戻る。この時期だけ岸で獲れる',
  },
  {
    id: 'cotton', display: { name: '綿', reading: 'わた' },
    mainKind: '衣類', origin: 'ノアキータ', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]], basePrice: 30,
    originReason: '実がはじけて綿毛が露出する',
  },
  {
    id: 'olive', display: { name: 'オリーブ', reading: 'おりーぶ' },
    mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 34,
    originReason: '実を摘むのは秋',
  },
  {
    id: 'rice_straw', display: { name: '稲わら', reading: 'いなわら' },
    mainKind: '道具', origin: 'ノアキータ', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1]], basePrice: 12,
    originReason: '米と同じ株から採れる。旬は生きものに付く',
  },

  // ── ミフユリア島（冬） ──
  {
    id: 'ice', display: { name: '氷', reading: 'こおり' },
    mainKind: '飲みもの', origin: 'ミフユリア', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]], basePrice: 20,
    originReason: '水が凍りつく土地でしか切り出せない。島の気候そのものが商品',
  },
  {
    id: 'reindeer_meat', display: { name: 'トナカイの肉', reading: 'となかいのにく' },
    mainKind: '食料', origin: 'ミフユリア', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]], basePrice: 55,
    originReason: '雪を掘って苔を食む獣。雪の消えない土地でこそ群れが養える',
  },
  {
    id: 'reindeer_antler', display: { name: 'トナカイの角', reading: 'となかいのつの' },
    mainKind: '道具', origin: 'ミフユリア', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 0], [1, 1]], basePrice: 40,
    originReason: '同じ獣から落ちる角',
  },
  {
    id: 'reindeer_hide', display: { name: 'トナカイの革', reading: 'となかいのかわ' },
    mainKind: '衣類', origin: 'ミフユリア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1], [1, 1]], basePrice: 48,
    originReason: '肉・角と同じ獣から。旬は生きものに付く',
  },
  {
    id: 'rabbit_fur', display: { name: 'うさぎの毛皮', reading: 'うさぎのけがわ' },
    mainKind: '衣類', origin: 'ミフユリア', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1, 1]], basePrice: 42,
    originReason: '寒さの中でこそ毛が白く厚く密になる',
  },
  {
    id: 'enoki', display: { name: 'えのきたけ', reading: 'えのきたけ' },
    mainKind: '食料', origin: 'ミフユリア', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 22,
    originReason: '凍りつく倒木や雪の下に出る菌。寒さが発生の条件',
  },
  {
    id: 'pine', display: { name: '松', reading: 'まつ' },
    mainKind: '道具', origin: 'ミフユリア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1]], basePrice: 24,
    originReason: '雪の重みと凍てつきに耐えて緑を保つ針葉樹',
  },
  {
    id: 'birch', display: { name: '白樺', reading: 'しらかば' },
    mainKind: '道具', origin: 'ミフユリア', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1]], basePrice: 26,
    originReason: '寒さの厳しい土地にだけ純林を作る木',
  },
  {
    id: 'kelp', display: { name: '昆布', reading: 'こんぶ' },
    mainKind: '食料', origin: 'ミフユリア', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1], [1]], basePrice: 20,
    originReason: '冷たい海でしか大きく育たない海藻',
  },
  {
    id: 'crab', display: { name: 'かに', reading: 'かに' },
    mainKind: '食料', origin: 'ミフユリア', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[0, 1], [1, 1]], basePrice: 60,
    originReason: '冷たく深い海にだけ棲み、身が詰まるのが寒さの底',
  },
  {
    id: 'lemon', display: { name: 'レモン', reading: 'れもん' },
    mainKind: '食料', origin: 'ミフユリア', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 28,
    originReason: '実が熟すのは冬。冬の柑橘',
  },

  // ── 海（産地なし・通年） ──
  {
    id: 'tuna', display: { name: 'まぐろ', reading: 'まぐろ' },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1, 1]], basePrice: 55,
    originReason: '一つの海域に留まらず外洋を回遊し続ける',
  },
  {
    id: 'sardine', display: { name: 'いわし', reading: 'いわし' },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1]], basePrice: 18,
    originReason: '群れが絶えず移動し、産卵の時期も群れごとにずれる',
  },
  {
    id: 'squid', display: { name: 'いか', reading: 'いか' },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1], [1]], basePrice: 30,
    originReason: '種類ごとに寄る時期が違い、外洋を漂うものが多い',
  },
  {
    id: 'salt', display: { name: '塩', reading: 'しお' },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1]], basePrice: 14,
    originReason: '海がある限りいつでも採れる。どの島の岸でも同じ',
  },
  {
    id: 'driftwood', display: { name: '流木', reading: 'りゅうぼく' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1, 1]], basePrice: 10,
    originReason: '波任せで流れ着く。いつ来るとも、どこから来たとも決まっていない',
  },
  {
    id: 'pumice', display: { name: '軽石', reading: 'かるいし' },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]], basePrice: 12,
    originReason: '海面を漂って流れてくる石',
  },
  {
    id: 'gull_feather', display: { name: 'かもめの羽根', reading: 'かもめのはね' },
    mainKind: '道具', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1]], basePrice: 16,
    originReason: 'かもめは季節を問わず船について回る',
  },

  // ══════ 加工品（tier2以上）106品 ══════
  // 産地はすべて `なし`。**加工品は旬を持たないため**（island-goods.md §2）。
  // 「主材料の産地」を採らなかった理由は crafted-goods.md §5 を見ること。

  // ── 食料 ──
  {
    id: 'buckwheat_flour', display: { name: '蕎麦粉', reading: 'そばこ' },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'olive_oil', display: { name: 'オリーブ油', reading: 'おりーぶゆ' },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'butter', display: { name: 'バター', reading: 'ばたー' },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'cheese', display: { name: 'チーズ', reading: 'ちーず' },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'salted_salmon', display: { name: '塩鮭', reading: 'しおざけ' },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'dried_meat', display: { name: '干し肉', reading: 'ほしにく' },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'strawberry_jam', display: { name: 'いちごのジャム', reading: 'いちごのじゃむ' },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'boiled_crab', display: { name: 'かにの塩ゆで', reading: 'かにのしおゆで' },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[0, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'mugwort_mochi', display: { name: 'よもぎ餅', reading: 'よもぎもち' },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'strawberry_shaved_ice', display: { name: 'いちごのかき氷', reading: 'いちごのかきごおり' },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'ice_cream', display: { name: 'アイスクリーム', reading: 'あいすくりーむ' },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'grilled_corn', display: { name: '焼きとうもろこし', reading: 'やきとうもろこし' },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'buckwheat_bread', display: { name: '蕎麦粉のパン', reading: 'そばこのぱん' },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'walnut_biscuit', display: { name: 'くるみのビスケット', reading: 'くるみのびすけっと' },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'sardine_in_oil', display: { name: 'いわしのオイル漬け', reading: 'いわしのおいるづけ' },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'bean_meat_soup', display: { name: '豆と干し肉のスープ', reading: 'まめとほしにくのすーぷ' },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'crab_gratin', display: { name: 'かにのグラタン', reading: 'かにのぐらたん' },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'salmon_rice_ball', display: { name: '鮭のおにぎり', reading: 'さけのおにぎり' },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'salmon_sandwich', display: { name: '鮭のサンドイッチ', reading: 'さけのさんどいっち' },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'jam_bun', display: { name: 'ジャムパン', reading: 'じゃむぱん' },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ⚠ **#86。パンは足さない。**「蕎麦粉のパン」が既にあり、同じ形になる。
  //   小麦でしか出ない方向（**つながる粉＝麺**）だけを足した。
  {
    id: 'wheat_flour', display: { name: '小麦粉', reading: 'こむぎこ' },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'udon', display: { name: 'うどん', reading: 'うどん' },
    mainKind: '食料', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 飲みもの ──
  {
    id: 'mugwort_tea', display: { name: 'よもぎの茶', reading: 'よもぎのちゃ' },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'mint_tea', display: { name: 'ミントの茶', reading: 'みんとのちゃ' },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'lemon_tea', display: { name: 'レモンの茶', reading: 'れもんのちゃ' },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'honey_lemon', display: { name: '蜂蜜レモン', reading: 'はちみつれもん' },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'grape_juice', display: { name: 'ぶどうの果汁', reading: 'ぶどうのかじゅう' },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'chilled_apple_water', display: { name: '冷たいりんご水', reading: 'つめたいりんごすい' },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'honey_milk', display: { name: '蜂蜜の乳', reading: 'はちみつのちち' },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'iced_mint_tea', display: { name: '冷たいミントの茶', reading: 'つめたいみんとのちゃ' },
    mainKind: '飲みもの', origin: 'なし', luxury: '上等', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'salted_lemon_water', display: { name: '塩レモン水', reading: 'しおれもんすい' },
    mainKind: '飲みもの', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'grape_wine', display: { name: 'ぶどうの酒', reading: 'ぶどうのさけ' },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'strawberry_milk', display: { name: 'いちごの乳', reading: 'いちごのちち' },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'chestnut_milk', display: { name: '栗の乳', reading: 'くりのちち' },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'iced_mint_milk_tea', display: { name: '冷たいミントの乳茶', reading: 'つめたいみんとのちちちゃ' },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'mulled_wine', display: { name: '温めたぶどうの酒', reading: 'あたためたぶどうのさけ' },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'iced_strawberry_milk', display: { name: '冷たいいちごの乳', reading: 'つめたいいちごのちち' },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ **#87 で足した魔法の品（4品）。**ここと「衣類」「道具」に分かれて置いてある。
  //   ⚠ **棚に並ぶ売り物であって、プレイヤーが使うものではない。効き目を定義しない**
  //   （island-goods.md §0-C ／ world.md「魔法の扱い」）。**データにも文書にも効き目を書かない。**
  //   ⚠ **値打ちの出どころは「材料」「所要分」「贅沢さ」の3つだけ。**
  //   **「魔法だから高い」という4つ目を作っていない** —— 高い品になっているのは、
  //   高い材料（蜂蜜・トナカイの角・羊毛のフェルト・染料）を使い、所要分を伸ばし、`贅沢さ` を上げたから。
  //   ⚠ **軸も欄も1つも増やしていない。**主種類は既存の4つ、`ItemDef` のキー数も既存と同じ。
  //   ⚠ **向く土地はすべて `どこでも`。**「土地を選ばないもの」であって、取りこぼしではない
  //   （axes.ts の `どこでも` の定義）。魔法の品は気候に答える品ではない。
  {
    id: 'magic_potion', display: { name: '魔法の薬', reading: 'まほうのくすり' },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 衣類 ──
  {
    id: 'wool_yarn', display: { name: '毛糸', reading: 'けいと' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'cotton_yarn', display: { name: '木綿糸', reading: 'もめんいと' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ **#86 の麻の系統**（麻 → 麻糸 → 麻布 → 染めの麻布 → 麻の上着）。
  //   crafted-goods.md §7「暑い土地向けは3品で深さが出ていない（麻を足さない判断の帰結）」への答え。
  //   ⚠ **麻糸は `どこでも`。**糸そのものは用途が一つに定まらない（木綿糸と同じ扱い）。
  //   **布から先が `暑い土地`**（熱を逃がす布、という定義そのもの）。
  {
    id: 'hemp_yarn', display: { name: '麻糸', reading: 'あさいと' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'hemp_cloth', display: { name: '麻布', reading: 'あさぬの' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wool_felt', display: { name: '羊毛のフェルト', reading: 'ようもうのふぇると' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'antler_belt', display: { name: '角留めの革帯', reading: 'つのどめのかわおび' },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'canvas', display: { name: '木綿の帆布', reading: 'もめんのはんぷ' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wool_scarf', display: { name: '毛糸の襟巻き', reading: 'けいとのえりまき' },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'felt_hat', display: { name: 'フェルトの帽子', reading: 'ふぇるとのぼうし' },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[0, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'cotton_shirt', display: { name: '木綿のシャツ', reading: 'もめんのしゃつ' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'leather_sandals', display: { name: '革のサンダル', reading: 'かわのさんだる' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'fur_lined_gloves', display: { name: '毛皮裏の革手袋', reading: 'けがわうらのかわてぶくろ' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'fur_lined_coat', display: { name: '毛皮裏の外套', reading: 'けがわうらのがいとう' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'canvas_sun_hat', display: { name: '帆布の日よけ帽子', reading: 'はんぷのひよけぼうし' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'canvas_apron', display: { name: '帆布の前掛け', reading: 'はんぷのまえかけ' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'waxed_raincoat', display: { name: '蜜蝋引きの合羽', reading: 'みつろうびきのかっぱ' },
    mainKind: '衣類', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'leather_satchel', display: { name: '革の肩掛け鞄', reading: 'かわのかたかけかばん' },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ **色を品目数の軸にしない**（#86 の PO 明示）。
  //   染めた品は**この2品だけ**で、**名前に色を持たせていない。**
  //   「藍染めの布」「紅花染めの布」と分けると、色の数だけ品目が増える＝水増しになる。
  {
    id: 'dyed_hemp_cloth', display: { name: '染めの麻布', reading: 'そめのあさぬの' },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '暑い土地',
    shape: [[1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'hemp_jacket', display: { name: '麻の上着', reading: 'あさのうわぎ' },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ **#87 の魔法の品**（注記は `magic_potion` にまとめてある）。
  //   **「フェルトの帽子」「帆布の日よけ帽子」とは別の品。**どの名前も他方を含んでおらず
  //   （island-goods.md §0-B の1段目に当たらない）、りんご／柿／ぶどうと同じ並びの関係にある。
  {
    id: 'magic_hat', display: { name: '魔法の帽子', reading: 'まほうのぼうし' },
    mainKind: '衣類', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[0, 1, 0], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 道具 ──
  {
    id: 'rope', display: { name: '縄', reading: 'なわ' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'file', display: { name: 'やすり', reading: 'やすり' },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'broom', display: { name: 'ほうき', reading: 'ほうき' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'brush', display: { name: '筆', reading: 'ふで' },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'candle', display: { name: 'ろうそく', reading: 'ろうそく' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'umbrella', display: { name: '傘', reading: 'かさ' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'basket', display: { name: 'かご', reading: 'かご' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wooden_bowl', display: { name: '木の椀', reading: 'きのわん' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[0, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'comb', display: { name: '櫛', reading: 'くし' },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'fishing_rod', display: { name: '釣りざお', reading: 'つりざお' },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ **染料は1品だけ**（#86）。**色ごとに分けない。**
  //   `RECIPES_BY_OUTPUT` は出力1つにレシピ1本なので、
  //   **「染料」という品が1つである限り、色を増やしても品目は増えない**という形になっている。
  {
    id: 'dye', display: { name: '染料', reading: 'せんりょう' },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ **#87 の魔法の品**（注記は `magic_potion` にまとめてある）。
  //   **主種類は `道具`。**「手に持って使うもの」なのでここに入る（武器と同じ扱い方 ／ §0-A）。
  //   ⚠ **魔法のためのタグも主種類も足していない。**読む規則が無いタグを作らない（§0-A）。
  {
    id: 'magic_wand', display: { name: '魔法の杖', reading: 'まほうのつえ' },
    mainKind: '道具', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'warding_charm', display: { name: '魔よけのお守り', reading: 'まよけのおまもり' },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ **#87 の武器（剣・槍・斧）と、その手前の 鉄。**
  //   **主種類は `道具`**（「手に持って使うもの」）。
  //   ⚠ **武器のためのタグも主種類も足していない**（§0-A）。
  //   **「武器である」ことは品名がすでに言っている。**読む規則が無いタグを作らない。
  //   ⚠ **値打ちの出どころは「材料」「所要分」「贅沢さ」の3つだけ。**
  //   新しい倍率も例外も作っていない。売値は既存の式のまま derive.ts が積む。
  //   ⚠ **鉄鉱石 → 鉄 は §0-B の包含に当たらない**（材料と加工品は包含ではない。麻 と 麻糸 と同じ）。
  //   ⚠ `向く土地` は4品とも `どこでも`。**武器は気候に答える品ではない**（axes.ts の定義）。
  {
    id: 'iron', display: { name: '鉄', reading: 'てつ' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'axe', display: { name: '斧', reading: 'おの' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1], [0, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'spear', display: { name: '槍', reading: 'やり' },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'sword', display: { name: '剣', reading: 'けん' },
    mainKind: '道具', origin: 'なし', luxury: '贅沢', suitedLand: 'どこでも',
    shape: [[1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ **#89 金属で開いた品（包丁・はさみ・鍋・釘）。**#87 で入った **鉄**（tier3）から伸ばしている。
  //   **主種類は `道具`**（「手に持って使うもの」）。**金属のためのタグも主種類も足していない。**
  //   ⚠ **値打ちの出どころは「材料」「所要分」「贅沢さ」の3つだけ。**
  //   新しい倍率も例外も作っていない。売値は既存の式のまま derive.ts が積む。
  //   ⚠ **`向く土地` は4品とも `どこでも`。**気候に答える品ではないので `どこでも`
  //   （axes.ts の「用途が一つに定まらないもの」側）。**取りこぼしではない。**
  {
    id: 'kitchen_knife', display: { name: '包丁', reading: 'ほうちょう' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'shears', display: { name: 'はさみ', reading: 'はさみ' },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'iron_pot', display: { name: '鍋', reading: 'なべ' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'nail', display: { name: '釘', reading: 'くぎ' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ **#89 粘土で開いた品（皿・壺）。**粘土（ハルヴェラ）を **松の薪**（ミフユリアの松から）で焼く。
  //   鉄と同じく**2島を回らないと作れない**ので、指名した産地が航海の理由として効いている。
  //   ⚠ **「器」を品名にしていない** —— 複数の品を含む語だから（island-goods.md §0-B）。
  //   **皿・壺のように、1つの品を指す名前だけを置く。**
  //   ⚠ `皿` は `木の椀` を含まない（椀と皿は別物）。`壺` も `松の桶` を含まない。
  //   **どちらも §0-B の1段目に当たらない**ので、りんご／柿／ぶどうと同じ並びの関係になる。
  {
    id: 'clay_plate', display: { name: '皿', reading: 'さら' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ⚠ `壺` の `向く土地` だけ `実りの土地`。axes.ts が「蓄える」の**手段**（塩・容れ物）を
  //   この値に入れているため。**蓄えた結果（保存食）ではない**ので、定義どおりに当たる。
  {
    id: 'clay_jar', display: { name: '壺', reading: 'つぼ' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
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
    id: 'straw_mat', display: { name: '稲わらのむしろ', reading: 'いなわらのむしろ' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'pine_barrel', display: { name: '松の桶', reading: 'まつのおけ' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'drying_net', display: { name: '竹の干し網', reading: 'たけのほしあみ' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'canvas_sack', display: { name: '帆布の袋', reading: 'はんぷのふくろ' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 暑い土地（熱を逃がす／冷たさを与える）──
  {
    id: 'bamboo_fan', display: { name: '竹の団扇', reading: 'たけのうちわ' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'bamboo_blind', display: { name: '竹の簾', reading: 'たけのすだれ' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '暑い土地',
    shape: [[1], [1], [1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 寒い土地（熱を守る／熱を与える）──
  {
    id: 'pine_firewood', display: { name: '松の薪', reading: 'まつのまき' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wool_rug', display: { name: '羊毛の敷物', reading: 'ようもうのしきもの' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── 温暖な土地（外で過ごす時間の長い暮らし／持ち歩くために作られた形）──
  {
    id: 'bamboo_flask', display: { name: '竹の水筒', reading: 'たけのすいとう' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1], [1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'carrying_basket', display: { name: '背負い籠', reading: 'せおいかご' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '温暖な土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  // ── `実りの土地` の母数を埋める2品 ──
  // `温暖な土地` に「生のまま食べるもの」を明記して6品が移った結果、
  // 需要4行が 18:16:32:9 = 3.56倍 に開いた。**薄い側（実りの土地）を品で埋める。**
  // ⚠ 書き手は「4行の比を3倍以内に収める」ことを知った状態で足している。独立ではない。
  {
    id: 'straw_bale', display: { name: '稲わらの俵', reading: 'いなわらのたわら' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'bamboo_sieve', display: { name: '竹のざる', reading: 'たけのざる' },
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
    id: 'sweets_assortment', display: { name: '菓子の詰め合わせ', reading: 'かしのつめあわせ' },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'voyage_lunch', display: { name: '旅の弁当', reading: 'たびのべんとう' },
    mainKind: '食料', origin: 'なし', luxury: '上等', suitedLand: '温暖な土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'flask_mulled_wine', display: { name: '水筒詰めの温め酒', reading: 'すいとうづめのあたためざけ' },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'winter_outfit', display: { name: '冬の装い一式', reading: 'ふゆのよそおいいっしき' },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'sun_outfit', display: { name: '日よけの装い一式', reading: 'ひよけのよそおいいっしき' },
    mainKind: '衣類', origin: 'なし', luxury: '上等', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'harvest_hamper', display: { name: '帆布張りの収穫かご', reading: 'はんぷばりのしゅうかくかご' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'ice_barrel', display: { name: 'フェルト張りの氷入れ', reading: 'ふぇるとばりのこおりいれ' },
    mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: '暑い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── tier6 ── 一式に上物を重ねる段
  {
    id: 'feast_hamper', display: { name: 'もてなしの籠盛り', reading: 'もてなしのかごもり' },
    mainKind: '食料', origin: 'なし', luxury: '贅沢', suitedLand: '温暖な土地',
    shape: [[1, 1], [1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'wine_gift_set', display: { name: '酒の贈りもの一式', reading: 'さけのおくりものいっしき' },
    mainKind: '飲みもの', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'winter_finery', display: { name: '冬の晴れ着一式', reading: 'ふゆのはれぎいっしき' },
    mainKind: '衣類', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1, 1], [1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'peddler_kit', display: { name: '行商の荷ごしらえ一式', reading: 'ぎょうしょうのにごしらえいっしき' },
    mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: '実りの土地',
    shape: [[1, 1], [1, 1], [1, 1], [1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },

  // ── tier7 ── 終点。**2品だけ**（4段では底が見え、10段では序盤に心が折れる、の折衷）
  {
    id: 'grand_outfit', display: { name: '晴れの装い一式', reading: 'はれのよそおいいっしき' },
    mainKind: '衣類', origin: 'なし', luxury: '贅沢', suitedLand: '寒い土地',
    shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
    originReason: '船倉で作る品。旬を持たないので産地なし',
  },
  {
    id: 'celebration_hamper', display: { name: '祝いの籠盛り', reading: 'いわいのかごもり' },
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
