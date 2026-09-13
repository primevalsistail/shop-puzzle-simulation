import type { MainKind } from '../taxonomy/axes.js'
import { MAIN_KINDS } from '../taxonomy/axes.js'

/** 絞り込みボタンの並び。表示だけ短く詰める（値そのものは `主種類`） */
export const KIND_BUTTONS: { id: MainKind; label: string }[] = [
  { id: '食料',     label: '食料' },
  { id: '飲みもの', label: '飲物' },
  { id: '衣類',     label: '衣類' },
  { id: '道具',     label: '道具' },
]

/**
 * 一覧の「絞り込み」と「ページ」を持つ。**描画は持たない。**
 *
 * 品は161、レシピは106、仕入れは18〜。3画面とも同じ計算が要るので、ここに1つだけ置く。
 *
 * ## 絞り込みの決まり
 *
 * - **既定は絞り込みなし**（何も選ばれていない ＝ 全部出る）
 * - `食料` を押すと**食料だけ**になる
 * - **全部選ぶ**か**全部外す**と、絞り込みは**外れる**（＝全部出る）
 *
 * 「全部選ぶ」と「全部外す」が同じ結果になるのは意図。
 * どちらも『どれかに限る』を言っていないため。
 *
 * ## 名前での検索（#55）／読みでの検索（#65）
 *
 * 主種類の絞り込みと **AND** で効く（`食料` を押しつつ `パン` で引ける）。
 *
 * **名前か読みのどちらかに当たれば通る。**`羊の乳` は `羊` でも `ひつじ` でも引ける。
 * 読みは `ItemDef.display.reading`（全161品にひらがなで持たせてある）。
 *
 * ⚠ **読みは画面に出さない。**引くためだけのデータ。
 * ⚠ **工房もここを通る。**`CraftMenu` はレシピを「出来上がる品」で引くので、
 *   レシピ側（106本）に読みを書く必要は無い。
 */
export class ListPaging {
  private kinds = new Set<MainKind>()
  /** 名前の問い合わせ。空文字なら効かない */
  private query = ''
  private page = 0

  constructor(private pageSize: number) {}

  // ─── 絞り込み ─────────────────────────────────────
  toggleKind(kind: MainKind): void {
    if (this.kinds.has(kind)) this.kinds.delete(kind)
    else this.kinds.add(kind)
    this.page = 0
  }

  isKindActive(kind: MainKind): boolean {
    return this.kinds.has(kind)
  }

  /** 絞り込みが効いているか。空でも全選択でも効かない */
  hasFilter(): boolean {
    return this.kinds.size > 0 && this.kinds.size < MAIN_KINDS.length
  }

  clearKinds(): void {
    this.kinds.clear()
    this.page = 0
  }

  // ─── 名前での検索（#55） ───────────────────────────
  /**
   * 問い合わせを差し替える。**変わったときだけ**ページを先頭へ戻す
   * （同じ文字で呼ばれてもページを飛ばさない）。
   */
  setQuery(query: string): void {
    const next = query.trim()
    if (next === this.query) return
    this.query = next
    this.page = 0
  }

  getQuery(): string {
    return this.query
  }

  hasQuery(): boolean {
    return this.query.length > 0
  }

  /**
   * 主種類と名前の両方で絞る。**2つは AND。**
   *
   * `nameOf` を渡さなければ名前の絞り込みは効かない（呼ぶ側が名前を持たない画面のため）。
   * `readingOf` を渡すと**読みでも引ける**（#65）。⚠ **名前は必ず引ける**（渡しても退行しない）。
   */
  filter<T>(
    items: readonly T[],
    kindOf: (item: T) => MainKind,
    nameOf?: (item: T) => string,
    readingOf?: (item: T) => string,
  ): T[] {
    const byKind = this.hasFilter()
      ? items.filter(i => this.kinds.has(kindOf(i)))
      : [...items]
    if (!this.hasQuery() || !nameOf) return byKind
    // 大小の違いは無視する。日本語の名前には効かないが、英数字の品名で効く
    const q = this.query.toLowerCase()
    return byKind.filter(i => {
      if (nameOf(i).toLowerCase().includes(q)) return true
      const yomi = readingOf?.(i)
      return yomi !== undefined && yomi.toLowerCase().includes(q)
    })
  }

  // ─── ページ ───────────────────────────────────────
  pageCount(total: number): number {
    return Math.max(1, Math.ceil(total / this.pageSize))
  }

  /** いまのページ（0始まり）。件数が減ったら最後のページへ寄せる */
  currentPage(total: number): number {
    return Math.min(this.page, this.pageCount(total) - 1)
  }

  setPage(page: number, total: number): void {
    this.page = Math.min(Math.max(0, page), this.pageCount(total) - 1)
  }

  /** その位置が映るページへ飛ぶ。棚から「この品を補充したい」と来たとき用 */
  jumpTo(index: number, total: number): void {
    if (index < 0) return
    this.setPage(Math.floor(index / this.pageSize), total)
  }

  movePage(delta: number, total: number): boolean {
    const before = this.currentPage(total)
    this.setPage(before + delta, total)
    return this.page !== before
  }

  slice<T>(items: readonly T[]): T[] {
    const from = this.currentPage(items.length) * this.pageSize
    return items.slice(from, from + this.pageSize)
  }

  /** `3 / 16` の形。0件なら `0 / 1` にはせず `- / -` */
  pageLabel(total: number): string {
    if (total === 0) return '- / -'
    return `${this.currentPage(total) + 1} / ${this.pageCount(total)}`
  }

  /** `9-16 / 122` の形。件数の見当をつけるため */
  rangeLabel(total: number): string {
    if (total === 0) return '0件'
    const from = this.currentPage(total) * this.pageSize
    return `${from + 1}-${Math.min(from + this.pageSize, total)} / ${total}`
  }
}
