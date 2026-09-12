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
 * 品は122、レシピは72、仕入れは18〜。3画面とも同じ計算が要るので、ここに1つだけ置く。
 *
 * ## 絞り込みの決まり
 *
 * - **既定は絞り込みなし**（何も選ばれていない ＝ 全部出る）
 * - `食料` を押すと**食料だけ**になる
 * - **全部選ぶ**か**全部外す**と、絞り込みは**外れる**（＝全部出る）
 *
 * 「全部選ぶ」と「全部外す」が同じ結果になるのは意図。
 * どちらも『どれかに限る』を言っていないため。
 */
export class ListPaging {
  private kinds = new Set<MainKind>()
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

  filter<T>(items: readonly T[], kindOf: (item: T) => MainKind): T[] {
    if (!this.hasFilter()) return [...items]
    return items.filter(i => this.kinds.has(kindOf(i)))
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
