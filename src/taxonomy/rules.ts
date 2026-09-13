/**
 * Cycle 4 / Phase 3 — 条件言語と規則
 *
 * 出典: aidlc-docs/inception/application-design/cycle4-phase2-axes.md §2（規則）§5（条件言語）
 *
 * INV-4「規則はアイテムを知らない」の判定条件:
 *   (1) 層1・島の需要・入荷解禁の規則型に ItemId が現れないこと  → 型で担保（下記）
 *   (2) 層2を空配列にしてもテストが通ること                      → SIGNATURE_SETS = [] が既定
 */

import type { ItemId, Luxury, MainKind, Origin, SuitedLand } from './axes.js'
import type { IslandName } from './islands.js'
import { DEMAND_TABLE } from './islands.js'

// ═══ 条件言語 ═════════════════════════════════════════
export type OrderedOp = '>=' | '<=' | '>' | '<'
export type EqOp = '==' | '!='

/**
 * アイテム述語。**順序演算子を使えるのは tier と 贅沢さ だけ**（Phase 2 §5）。
 * 主種類・産地・向く土地には順序がないので、型で `==` `!=` に縛る。
 */
export type ItemPredicate =
  | { readonly axis: '主種類';   readonly op: EqOp; readonly value: MainKind }
  /**
   * ⚠ **`産地` は「材料を遡った産地」を見る**（#37。`derive.ts` の `originReach()`）。
   *   **`ItemDef.origin` に書いてある値ではない。**加工品も、材料が1島に定まれば当たる。
   */
  | { readonly axis: '産地';     readonly op: EqOp; readonly value: Origin }
  | { readonly axis: '向く土地'; readonly op: EqOp; readonly value: SuitedLand }
  | { readonly axis: '贅沢さ';   readonly op: EqOp | OrderedOp; readonly value: Luxury }
  | { readonly axis: 'tier';     readonly op: EqOp | OrderedOp; readonly value: number }

/**
 * 状態述語。ゲームの状態を見る。
 * `この品` は指示子であって ID ではない — 規則は自分が今どの品に当たっているかだけを知る。
 */
export type StatePredicate =
  | { readonly metric: '累計販売数'; readonly target: 'この品'; readonly op: EqOp | OrderedOp; readonly value: number }
  | { readonly metric: '現在地';     readonly op: EqOp; readonly value: IslandName }

export type Predicate = ItemPredicate | StatePredicate

export type Condition =
  | Predicate
  | { readonly kind: 'かつ';   readonly of: readonly Condition[] }
  | { readonly kind: 'または'; readonly of: readonly Condition[] }
  | { readonly kind: 'でない'; readonly of: Condition }

// ═══ 効き目 — 種類3 ══════════════════════════════════
export type EffectKind = '売れやすさ' | '値段' | '集客'

export interface Effect {
  readonly kind: EffectKind
  readonly multiplier: number
}

/**
 * 効き目の合成は**加算**（Q5）。`1 + Σ(mᵢ − 1)`。例: 1.1 と 1.1 → 1.2。
 * `divisor` を渡すと**平均**になる（店全体ぶんがこれを使う。下記 `shopWideWeight` の注記）。
 */
export function combine(multipliers: readonly number[], divisor = 1): number {
  return 1 + multipliers.reduce((sum, m) => sum + (m - 1), 0) / divisor
}

// ═══ tier による按分（方針5・A案） ═══════════════════

/**
 * **作り込みの深さの上限。**段5 でここまで品を増やす（いまある品は tier4 まで）。
 *
 * ⚠ **7 はプレイヤーの感覚から決めた値で、利益や効率から出した値ではない。**
 * ペルソナ4人に聞いた（→ aidlc-docs/construction/plans/max-tier-review.md）:
 *
 *   - **4段では底が見える。**「もう先が無い」と分かった瞬間に続ける気持ちが切れる（4人とも）
 *   - **上限なしは不安になる。**終わりが決まっていないと、自分がどこにいるか分からない（4人とも）
 *   - 7段2人・10段2人で割れた。**失敗の向きが違うだけ**で、
 *     10 を推す側は「底が見えること」を、7 を推す側は「遠すぎて心が折れること」を恐れている
 *
 * **7 を採った理由**: 浅すぎの失敗は**終盤**に起きるが、深すぎの失敗は**序盤**に起きる。
 * 序盤に折れるほうが致命的。**7 → 10 は後から足せるが、10 → 7 は削ることになる。**
 *
 * PO 決定（2026-09-12）: 「後で拡張もありうるが、**ファーストスコープとしては7段**」
 * 「**エンディングまでに届かないのは意図どおり**」（＝方針4「作り残しがあるのが正常」は維持）
 */
export const MAX_TIER = 7

/**
 * **規則が出した効き目を、その品の tier で「店全体ぶん」と「その品ぶん」に割る。**
 *
 * 出典: 方針5「低tier＝薄い全体ボーナス／高tier＝濃い個別ボーナス」＋ PO のグラフ
 * （tier1 で 90:10 ／ tier4 で 50:50 ／ tier7 で 10:90。**端でも0にせず10残す**）。
 * この3点を通る直線は1本しかない。**品ごとの表は作らない。**
 *
 * ⚠ **規則が `scope` を宣言する形は廃止した。**適用範囲は品の tier から導出する。
 */
export function shopWideWeight(itemTier: number): number {
  const t = Math.min(Math.max(itemTier, 1), MAX_TIER)
  return 0.9 - (t - 1) * (0.8 / (MAX_TIER - 1))
}

/**
 * ⚠ **店全体ぶんは「合計」ではなく「置いてある区画数で割った平均」で積む。**
 *
 * 合計にすると、**店全体ぶんはすべての区画に掛かる**ので、効果の総量が区画数の**2乗**で伸びる。
 * 実測（13×10・130区画）で **値段が65倍**まで飛んだ。按分の比が意味を持たなくなる。
 *
 * 平均にすると区画数に依らず（30区画でも130区画でも 1.28〜1.30）、
 * **全体チャネルと個別チャネルの総量がちょうど釣り合う。**釣り合う割り方はこれ1つしかない。
 * 上限という調整値も要らなくなる（→ `SHOP_ATTRACTION_CAP` は廃止）。
 */

// ═══ 規則の形 ═════════════════════════════════════════

/**
 * 取り合わせ／セット。**層1（軸の条件）も層2（名物コンビ）も同棚セットも、この1つの形で書く。**
 *
 * ⚠ **`members` は順序のある列である。効き目は先頭（甲）に当たった品にかかる。**
 *   **集合にすると甲乙の非対称が消える** —— R4「奮発する品の隣に暮らしの品を置くと**値が下がる**」で、
 *   **日用品まで値下がりしないのはこの順序のおかげ**である。
 *   R1「食べものと飲みものは隣り合うと売れやすい」も、**食べものの側が**売れやすくなる、と読む。
 *   両方に効かせたい規則は、甲と乙を入れ替えたものをもう1本書く（機構は足さない）。
 *
 * ⚠ **`scope` は置かない。**適用範囲は品の tier から按分される（段3 で廃止 → `shopWideWeight`）。
 */
export type SetMember =
  /** 軸の条件（層1・同棚セット）。**ItemId が現れない**（INV-4） */
  | Condition
  /** 品ID（層2・名物コンビ）。**ID を書いてよいのはここだけ** */
  | ItemId

export interface SetRule {
  readonly id: string
  readonly description: string
  /**
   * 揃える対象。**順序のある列**で、先頭が甲。
   * ⚠ **`adjacent: true` の規則は2件（甲・乙）で書く。**隣り合わせに3件目は無い（評価器が落とす）。
   */
  readonly members: readonly SetMember[]
  /** `true` = 隣り合っていること ／ `false` = **同じ棚（盤面）にあればよい**（#59） */
  readonly adjacent: boolean
  /**
   * **揃えた品どうしで値が一致していなければならない軸**（省略すると突き合わせない）。
   *
   * ⚠ **値の一致であって特定の値ではない**ので条件式には書けない。突き合わせは評価器が行う。
   *   分界は「**集合の判定は評価器、条件は規則データ**」のままで、条件言語は一段も複雑にしていない。
   * ⚠ **`産地` を指すと「材料を遡った産地」で突き合わせる**（#37。条件式の `産地` と同じ値）。
   */
  readonly 揃える?: ItemPredicate['axis']
  /**
   * ⚠ **既定（省略時）は「当たった品それぞれが甲になり、それぞれに1回ずつ効く」。**
   *   R2「奮発する品どうしを並べる」で両方の値が上がるのはこのため。
   *
   *   `true` にすると**組ごとに1回だけ**、最初に当たった品に効く。⚠ **R5 がこれ。**
   *   R5 は「**島の棚が1つできる**」という規則なので、向きを変えて二重には数えない。
   *   両向きに数えると**店全体の集客がそのまま倍**になり、段3 の実測
   *   （同じ島の産で敷き詰めて 1.98倍／置いた目標は「並べ方で客足が動く幅は最大2倍」）が壊れる。
   */
  readonly 組ごとに1回?: boolean
  readonly effect: Effect
}

/** 島の需要 ／ その他の条件規則。**ItemId が型に現れない** */
export interface ConditionRule {
  readonly id: string
  readonly description: string
  readonly condition: Condition
  readonly effect: Effect
}

/** 入荷解禁。**ItemId が型に現れない** */
export type StockedBy = '島の商人' | '行商人バレン'
export interface UnlockRule {
  readonly id: string
  readonly description: string
  readonly condition: Condition
  readonly stockedBy: StockedBy
}

/** 客の好み。**Cycle 5 で書く。器だけ用意する**（データは空） */
export interface CustomerPreferenceRule {
  readonly id: string
  readonly customerType: string
  readonly condition: Condition
  readonly multiplier: number
}

// ═══ 規則データ ═══════════════════════════════════════

const item = <P extends ItemPredicate>(p: P): P => p
const かつ = (...of: Condition[]): Condition => ({ kind: 'かつ', of })

/**
 * 取り合わせ 層1。**R1〜R6（隣接）と S1・S2（同棚）が同じ器に入っている。**
 * ⚠ 倍率は一度置いたもので、調整していない（→ #61 で測り直す）。
 */
export const SET_RULES: readonly SetRule[] = [
  {
    id: 'R1', description: '食べものと飲みものは隣り合うと売れやすい',
    members: [
      item({ axis: '主種類', op: '==', value: '食料' }),
      item({ axis: '主種類', op: '==', value: '飲みもの' }),
    ],
    adjacent: true,
    effect: { kind: '売れやすさ', multiplier: 1.2 },
  },
  {
    id: 'R2', description: '奮発する品どうしを並べると値が上がる（見栄えが立つ）',
    members: [
      item({ axis: '贅沢さ', op: '>=', value: '上等' }),
      item({ axis: '贅沢さ', op: '>=', value: '上等' }),
    ],
    adjacent: true,
    effect: { kind: '値段', multiplier: 1.15 },
  },
  {
    id: 'R3', description: '暮らしの品どうしを並べるとまとめて売れる',
    members: [
      item({ axis: '贅沢さ', op: '==', value: '日用' }),
      item({ axis: '贅沢さ', op: '==', value: '日用' }),
    ],
    adjacent: true,
    effect: { kind: '売れやすさ', multiplier: 1.1 },
  },
  {
    id: 'R4', description: '奮発する品の隣に暮らしの品を置くと値が下がる（安く見える）',
    // ⚠ **効き目が当たるのは甲（贅沢）だけ。**乙（日用）は値下がりしない。
    //   `members` が順序のある列であることが、この非対称を持っている唯一の場所。
    members: [
      item({ axis: '贅沢さ', op: '==', value: '贅沢' }),
      item({ axis: '贅沢さ', op: '==', value: '日用' }),
    ],
    adjacent: true,
    effect: { kind: '値段', multiplier: 0.85 },
  },
  /**
   * R5 だけ効き目が `集客`。同じ島の産の品を並べると店全体に人が寄る（島の棚ができる）。
   *
   * ⚠ **「同じ島」は値の一致であって特定の島ではない**ので、条件式には
   *   「産地が `なし` でないこと」だけを書き、突き合わせは `揃える: '産地'` で評価器に渡す
   *   （海のものは島の棚を作らない）。
   *
   * ⚠ **産地は「材料を遡った産地」で当てる**（#37。derive.ts `originReach`）。
   *   品に書いてある産地のままだと、**加工品106品はすべて `なし`**（旬を持たないため。#22）で
   *   **この規則が素材にしか効かず、作り込むほど消えていった。**
   *
   *   **材料をすべて遡って行き着く島が1つに定まる品だけ**、その島の産として当てる。
   *   **2島以上が混ざる品は当てない**（実測: 加工品106品のうち1島に定まるのは26品）。
   *   当たるのは **74/161品**（以前は 48/161）。
   *
   * ⚠ **「行き着く島の集合が交わるか」では当てない。**ほとんどの品が当たって
   *   ボーナスではなく**常にかかる下駄**になり、下の設計目標（並べ方で客足が動く幅は最大2倍）が壊れる。
   *   1つに定まるときだけにすると結果が**1つの産地の値**になるので、
   *   **条件言語に「含む」を足さずに済む**（規則の書き方は一段も複雑にならない）。
   *
   * ⚠ **効くのはここと D2 だけ。**品に書いてある産地を見る側 —— 商人の場所の条件（U3・U4）と
   *   産地割引（`ORIGIN_DISCOUNT`）—— は**動かしていない。**売値も動いていない。
   */
  {
    id: 'R5', description: '同じ島の産の品を並べると店全体に人が寄る（島の棚ができる）',
    members: [
      item({ axis: '産地', op: '!=', value: 'なし' }),
      item({ axis: '産地', op: '!=', value: 'なし' }),
    ],
    adjacent: true,
    揃える: '産地',
    // ⚠ **甲乙が同じ条件なので、放っておくと1組で2回効く。**下の実測は片向きで測った値
    組ごとに1回: true,
    /**
     * ⚠ **1.1 → 1.6 に上げた（段3）。**店全体ぶんを平均で積むようにしたので、
     *   同じ倍率のままだと敷き詰めても **1.16倍**にしかならず、集客という効き目が死ぬ。
     *
     *   **PO の指定は「客足を増やすボーナスはあってよい。ただし8倍は大きすぎる」。**
     *   置いた目標は**並べ方で客足が動く幅を最大2倍**。1.6 での実測:
     *   同じ島の産で敷き詰めて **1.98倍** ／ tier1 を雑に並べて 1.32倍 ／ 島の棚なしで 1.00倍。
     *   （以前は最大8.0倍で、しかも 9×8 以降は上限に貼り付いて**並べ方で動かなかった**）
     *
     * ⚠ **上の実測は #37 より前のもの。**当たる品が 48 → **74品**に増えた（加工品26品が加わった）が、
     *   加工品を並べた盤面では測っていない。
     * ⚠ **この値は段6 で測り直す（#61）。**
     */
    effect: { kind: '集客', multiplier: 1.6 },
  },
  {
    id: 'R6', description: '加工の深い品の隣にその系統の浅い品を置くと売れやすい（手仕事が見える）',
    members: [
      item({ axis: 'tier', op: '>=', value: 3 }),
      item({ axis: 'tier', op: '==', value: 1 }),
    ],
    adjacent: true,
    effect: { kind: '売れやすさ', multiplier: 1.15 },
  },

  /**
   * ── 同棚セット（S1・S2。#59） ────────────────────────
   *
   * **隣り合っていなくても、盤面に置いてあれば効く。**`adjacent: false` がその宣言。
   *
   * ⚠ **倍率は隣接のボーナスより低くする**（PO 指定 2026-09-14「低めでよい」）。
   *   **このゲームは在庫の置き方で遊ぶもので、位置を問わないボーナスを強くすると、
   *   そこを考えなくてよくなる。**
   *
   * **1.05 を置いた理由は2つ。**
   *   1. 隣接でいちばん弱いのが R3 の 1.1。**その半分**に置いた
   *   2. ⚠ **同棚は「当たった品すべて」に効く。**隣は最大4つまでしか触れないが、
   *      同棚には上限が無いので、**同じ倍率でも総量は同棚のほうが大きくなる**
   *
   * **1.05 での実測**（同棚を外した盤面と比べた、区画あたりの平均倍率）:
   *   - 雑多に19品 …… 売れやすさ 1.182 → **1.204** ／ 値段 1.350 → **1.389**
   *   - 上等以上ばかり25品 … 売れやすさ 1.155 → **1.180** ／ 値段 1.624 → **1.682**
   *   **隣接ぶんを1割も動かしていない。**位置を決めるのは今までどおり R1〜R6 である。
   *
   * ⚠ **品IDを名指ししない**（層1 なので INV-4 が掛かる）。**軸の条件だけで書く。**
   * ⚠ **この値は段6 で測り直す（#61）。**
   */
  {
    id: 'S1', description: '奮発する品が3つ揃うと、店構えが良く見えて値が付く（離れていてよい）',
    members: [
      item({ axis: '贅沢さ', op: '>=', value: '上等' }),
      item({ axis: '贅沢さ', op: '>=', value: '上等' }),
      item({ axis: '贅沢さ', op: '>=', value: '上等' }),
    ],
    adjacent: false,
    effect: { kind: '値段', multiplier: 1.05 },
  },
  {
    id: 'S2', description: '同じ土地に向く品が3つ揃うと、その土地の客が目当てに来る（離れていてよい）',
    // 「同じ土地」は値の一致なので `揃える` に渡す（R5 と同じ作り）。
    // `どこでも` は土地を選ばない品なので、揃えても「その土地の客」にならない。条件で落とす
    members: [
      item({ axis: '向く土地', op: '!=', value: 'どこでも' }),
      item({ axis: '向く土地', op: '!=', value: 'どこでも' }),
      item({ axis: '向く土地', op: '!=', value: 'どこでも' }),
    ],
    adjacent: false,
    揃える: '向く土地',
    effect: { kind: '売れやすさ', multiplier: 1.05 },
  },
]

/**
 * 層2（名物コンビ）。**空が既定。**
 * INV-4 の判定条件「層2を全部消しても成立すること」を常時テストする状態にしてある。
 *
 * ⚠ **層1 と同じ `SetRule` に畳んだ**（#59）。層2 のためだけの型も評価経路も無い。
 *   書くときは `members: ['apple', 'honey'], adjacent: true` のように**品IDを並べる。**
 *   ⚠ **品IDを書いてよいのはここだけ。**層1（`SET_RULES`）に書くと INV-4 に触れる。
 */
export const SIGNATURE_SETS: readonly SetRule[] = []

/**
 * 島の需要（D1）。islands.ts の需要表4行から機械的に作る。**調整はあの4行に集まる**
 *
 * ⚠ **効き目は `値段` である（`売れやすさ` ではない。段4-5 で入れ替えた）。**
 *   `売れやすさ` は「何個売れるか」を動かすので、効き目は**その品の売値に比例する**。
 *   プールごとの平均売値が 259／200／163／129 と2倍開いているため、
 *   1.3倍をもらった側が等倍の側に**絶対額で負ける島が出ていた**（ハルヴェラ。実測 6〜7%）。
 *   倍率を上げても解けない（`129 × 1.4 = 180` < `259 × 1.0 = 259`）。
 *
 *   `値段` は `finalPrice()` の作りから**粗利にだけ乗る**ので、
 *   「その島に向く品は、その島では**高く売れる**」＝ **取り分が増える**という読みになる。
 *   → aidlc-docs/construction/plans/stage4-price-gradient-result.md
 */
export const DEMAND_RULES: readonly ConditionRule[] = DEMAND_TABLE.map(row => ({
  id: `D1_${row.island}`,
  description: `${row.suitedLand}に向く品は${row.island}で高く売れる`,
  condition: かつ(
    item({ axis: '向く土地', op: '==', value: row.suitedLand }),
    { metric: '現在地', op: '==', value: row.island },
  ),
  effect: { kind: '値段', multiplier: row.multiplier },
}))

/**
 * D2 — よその島の産の品は目に留まりやすい。産地と現在地の突き合わせは評価器が行う。
 *
 * ⚠ R5 と同じく**産地は「材料を遡った産地」で当てる**（#37。derive.ts `originReach`）。
 *   1島に定まる加工品は「よその島の産」になりうる。**2島以上が混ざる品は当たらない。**
 */
export const FOREIGN_ORIGIN_RULE: ConditionRule = {
  id: 'D2', description: 'よその島の産の品は目に留まりやすい',
  condition: item({ axis: '産地', op: '!=', value: 'なし' }),
  effect: { kind: '売れやすさ', multiplier: 1.15 },
}

/**
 * 入荷**解禁**（U1・U2）。ItemId を書かない。
 *
 * ⚠ **ここが持つのは「そもそも並ぶか」だけ。**「どこで並ぶか」＝**場所の条件**は
 *   evaluate.ts の `stockedByIslandMerchant` が持つ（産地 == 現在地 ／ 産地 == なし）。
 *
 *   場所の条件は**軸どうしの比較**（`産地 == 現在地`）を要求するが、
 *   条件言語にそれが無いため書けない（→ issue #31）。
 *
 *   ⚠ **書けない条件をここに置かないこと。**置いても評価器は読まず、
 *   **規則データが嘘をつくことになる。**U3「島の商人はその島を産地とする品を並べる」と
 *   U4「産地を持たない品はどの島でも並ぶ」がここに無いのはそのため。
 *
 * ⚠ **評価器は `stockedBy` で絞ってから「どれか1本でも通るか」を見る**（#59 で名指しを解いた）。
 *   **ここに1本足せば、評価器を触らずに効く。**以前は `r.id === 'U1'` と**IDで名指し**していた。
 */
export const UNLOCK_RULES: readonly UnlockRule[] = [
  {
    // 加工品はすべて産地が `なし`（旬を持たないため）。U4「産地を持たない品はどの島でも並ぶ」と
    // 組み合わさるので、ここを tier<=2 にすると tier2 の加工品が最初から買えてしまい、
    // 「作るしかなかった品」という U2 の前提が崩れる。**素材だけが商人の店先に並ぶ。**
    id: 'U1', description: '加工の深い品は序盤には並ばない（並ぶのは素材だけ）',
    condition: item({ axis: 'tier', op: '==', value: 1 }),
    stockedBy: '島の商人',
  },
  {
    id: 'U2', description: 'その品を一定数売ると、作るしかなかった品が買えるようになる（買う方が高い）',
    condition: かつ(
      item({ axis: 'tier', op: '>=', value: 2 }),
      { metric: '累計販売数', target: 'この品', op: '>=', value: 100 },
    ),
    stockedBy: '島の商人',
  },
]

/**
 * U3「島の商人は、その島を産地とする品を並べる」は、産地と現在地の**一致**を見る規則。
 * 条件言語には「産地 == 現在地」という**軸どうしの比較**が無いので、評価器が持つ（evaluate.ts）。
 * → Phase 3 の申し送り。条件言語に足すかどうかは Phase 4 以降の判断
 */

/** 客の好み。**Cycle 5 で書く。**器だけ用意し、データは空のままにする */
export const CUSTOMER_PREFERENCE_RULES: readonly CustomerPreferenceRule[] = []
