/**
 * Cycle 4 / Phase 3 — 5軸の型定義
 *
 * 出典: aidlc-docs/inception/application-design/cycle4-phase2-axes.md §4
 * 不変条件: aidlc-docs/inception/requirements/cycle4-phase0-invariants.md
 *
 * 軸の値を日本語リテラルにしている理由:
 *   PR-1「説明が要る名前は負け」。設計文書の語とコードの語が字面で一致していないと、
 *   対応表を覚える作業が発生し、それ自体が PR-1 の負けになる。
 */

// ─── 軸1: 主種類 ──────────────────────────────────────
/**
 * 主種類とは、その品を人がどう扱うものかである。
 *
 * ⚠ INV-1 のための言い方: 「最終的に何になるか」で決めない（レシピを足すと値が動く）。
 *    その品そのものを人がどう扱うかで決める。
 *    例: 小麦粉は口に入るものなので `食料`。パンになるからではない。
 *
 * ⚠ `原料` という値は置かない。「用途を持たないもの」は用途の不在で切っており、
 *    他の値（用途）と切り方が違う。INV-2b 違反（§3「書物」と同型）。
 */
export type MainKind =
  /** 口に入れて腹を満たすもの */
  | '食料'
  /** 口に入れて喉を潤すもの */
  | '飲みもの'
  /** 身につけるもの */
  | '衣類'
  /** 手に持って使うもの */
  | '道具'

export const MAIN_KINDS: readonly MainKind[] = ['食料', '飲みもの', '衣類', '道具'] as const

// ─── 軸2: tier ────────────────────────────────────────
// tier は導出値であり、ItemDef に置かない（INV-3）。
// 定義と算出は derive.ts を参照。tier = 1 + max(材料の tier)、レシピ無しは 1。

// ─── 軸3: 産地 ────────────────────────────────────────
/**
 * 産地とは、その品が採れる島である。
 *
 * `なし` は明示的な値であって空欄ではない（空欄は型エラーになる）。
 * `なし` ＝ 海のもの。海はどの島のものでもなく四島に共通してある。
 * → aidlc-docs/inception/worldbuilding/island-goods.md §4
 */
export type Origin =
  | 'ハルヴェラ'
  | 'リナツィア'
  | 'ノアキータ'
  | 'ミフユリア'
  /** 海のもの。どの島の気候にも属さない */
  | 'なし'

export const ORIGINS: readonly Origin[] = [
  'ハルヴェラ', 'リナツィア', 'ノアキータ', 'ミフユリア', 'なし',
] as const

// ─── 軸4: 面① 贅沢さ ─────────────────────────────────
/**
 * 贅沢さとは、その品を買うときに客がどれだけ奮発するかである。
 *
 * 価格とは別の問い（INV-2a）。価格は「いくらか」に、贅沢さは「なぜ買うか」に答える。
 * **安い贅沢品も、高い日用品も存在してよい。**これが両者が別軸である証拠。
 *
 * 消耗の面を落としたため（Phase 2 §3-C）、回転率を担う唯一の軸になっている。
 */
export type Luxury =
  /** 無ければ困るので、値段を見て買うもの */
  | '日用'
  /** 無くても困らないが、暮らしを良くするもの */
  | '上等'
  /** 要るから買うのではなく、欲しいから買うもの */
  | '贅沢'

export const LUXURIES: readonly Luxury[] = ['日用', '上等', '贅沢'] as const

/** 贅沢さは順序を持つ（日用 < 上等 < 贅沢）。条件式に `贅沢さ >= 上等` と書ける */
const LUXURY_ORDER: Record<Luxury, number> = { 日用: 0, 上等: 1, 贅沢: 2 }

export function luxuryRank(v: Luxury): number {
  return LUXURY_ORDER[v]
}

// ─── 軸5: 面② 向く土地 ───────────────────────────────
/**
 * 向く土地とは、その品が役に立つ土地の性質である。
 *
 * ⚠ 品は島の名前を知らない。知っているのは「自分は寒い土地で役に立つ品である」ことだけ。
 *    島との結びつけは需要表4行（islands.ts）が持つ。島の気候設定を変えても品は無傷。
 *
 * 産地とは別の問い（INV-2a）。産地は「どこで採れるか」、向く土地は「どこで役に立つか」。
 * 一致する場合が多いが、一致しない品があってよい。
 */
export type SuitedLand =
  /** 寒さをしのぐのに役立つもの */
  | '寒い土地'
  /** 暑さをしのぐのに役立つもの */
  | '暑い土地'
  /** 穏やかな気候の暮らしで使われるもの */
  | '温暖な土地'
  /** 実りの多い土地の暮らしで使われるもの */
  | '実りの土地'
  /** 土地を選ばないもの（既定） */
  | 'どこでも'

export const SUITED_LANDS: readonly SuitedLand[] = [
  '寒い土地', '暑い土地', '温暖な土地', '実りの土地', 'どこでも',
] as const

// ─── 規則が参照しない属性 ─────────────────────────────

/** かたち・大きさとは、船倉で占める升目の形である。1 = 占有, 0 = 空き */
export type Shape = readonly (readonly number[])[]

/** 表示とは、画面での見え方である。規則から参照しない */
export interface Display {
  /** 普通名詞のみ。固有名詞を作らない（world.md §7） */
  readonly name: string
  readonly color: number
}

// ─── アイテム定義 ─────────────────────────────────────
export type ItemId = string

/**
 * アイテム定義。**手で書くのはここにあるものだけ。**
 *
 * ⚠ 型に置いていないもの（INV-3。判定は「型に存在しないこと」）:
 *   - `tier`   … ALL_RECIPES から導出（derive.ts）
 *   - `price`  … tier2以上は材料から積み上げ（derive.ts）
 *   - 何から作れるか / 何に使えるか … ALL_RECIPES から導出
 *
 * ⚠ 隣接ボーナスを型に置いていない（INV-4）。効き目は規則側（rules.ts）にある。
 *   現行 src/data/items.ts の `adjacencyBonuses: [{ adjacentItemId: 'milk' }]` が
 *   INV-4 / INV-5 違反として落とされた形。
 *
 * INV-5: 品を1つ足すときに書くのはこの定義1件だけ。既存の定義は1行も変わらない。
 */
export interface ItemDef {
  readonly id: ItemId
  readonly display: Display

  // ── 手書きの4軸 ──
  readonly mainKind: MainKind
  readonly origin: Origin
  readonly luxury: Luxury
  readonly suitedLand: SuitedLand

  // ── 規則が参照しない属性 ──
  readonly shape: Shape

  /**
   * tier1（レシピを持たない品）の売値の基準値。
   * **tier2以上の品はこれを持たない**（材料から積み上げるため。P2 / INV-3）。
   * 実際の売値は derive.ts の salePrice() が出す。
   */
  readonly basePrice?: number

  /** なぜこの島から出たか（island-goods.md §7「理由を併記する」）。判定用であり規則は読まない */
  readonly originReason: string
}

// ─── レシピ定義 ───────────────────────────────────────
export interface RecipeDef {
  readonly id: string
  readonly display: { readonly name: string }
  readonly outputItemId: ItemId
  readonly outputQuantity: number
  readonly ingredients: readonly { readonly itemId: ItemId; readonly quantity: number }[]
  /** 加工中は店が閉まる（機会損失）。戦略を分ける5つの量の1つ */
  readonly durationMinutes: number
  /**
   * 加工倍率。売値 = (Σ 材料の売値) × これ（P2）。
   *
   * ⚠ P3 — 所要時間だけから決めない。時間だけで決めると `利益/時間` が全品一定になり
   *   「何を買ってどう売っても結局同じ」になる。贅沢さによる回転率の差を併せて入れる。
   */
  readonly craftMultiplier: number
}
