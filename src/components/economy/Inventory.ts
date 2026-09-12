/**
 * **1品あたり 999個まで**（段4-7）。PO 指定（2026-09-12）。
 *
 * ## なぜ上限が要るのか
 *
 * 上限が無いと「安い島でN個買って高い島でN個売る」の期待値が N に比例して正になり、
 * **転売だけが指数関数的に伸びて加工をしなくなる**（→ stage4-persona-review.md 「案4 には上限が要る」）。
 * 上限は、1品に賭けられる額に天井を作ることで、**品数を広げる／加工で1個あたりの値を上げる**
 * 方向へ戻す。
 *
 * ## 溢れたぶんの扱い ＝ **買えない**（黙って消さない）
 *
 * 旧実装は `Math.min` で丸めるだけで、**超えたぶんは黙って消えていた**（代金は払ったまま）。
 * いまは:
 *   - `add` は**実際に入った数を返す**。呼ぶ側は溢れたかどうかを知れる
 *   - `spaceFor` / `isFull` で**買う前に**空きを訊ける。`PurchaseMenu` は空きが足りない行を
 *     押せなくして「上限999」と出す（**払ってから消える、が起きない**）
 *   - 加工の出来上がりは `add` の丸めが最後の砦。`GameScene` が上限に達した旨をログに出す
 *
 * ⚠ **999 は PO 指定なので #61 の測り直しの対象ではない。**動かすときは PO に訊く。
 */
export const MAX_QUANTITY = 999

export class Inventory {
  private stock: Map<string, number> = new Map()
  /**
   * **一度でも手に入れたことがある品。**減って0になっても消えない。
   *
   * アイテム一覧はこれで絞る。**持ったことのない品を「在庫0」で並べると、
   * 何が手元にあるのか読めなくなる。**
   * レシピの解禁（#48「材料を取得したことがあるか」）も同じ記録を読む。
   */
  private everHeld: Set<string> = new Set()

  /** 一度でも手に入れたことがあるか */
  hasEverHeld(itemId: string): boolean {
    return this.everHeld.has(itemId)
  }

  getEverHeld(): string[] {
    return Array.from(this.everHeld)
  }

  restoreEverHeld(ids: readonly string[]): void {
    this.everHeld = new Set(ids)
  }

  /** 上限までの空き。**買う前にここで訊く**（上限を超える買い物をさせない） */
  spaceFor(itemId: string): number {
    return MAX_QUANTITY - this.getQuantity(itemId)
  }

  isFull(itemId: string): boolean {
    return this.spaceFor(itemId) <= 0
  }

  /**
   * 手に入れる。**実際に入った数を返す**（上限で切られたら要求より少ない）。
   *
   * ⚠ 戻り値を捨ててよいのは「溢れても構わない」と決めた場所だけ。
   *   買い物は `spaceFor` で先に止めること（上の注記）。
   */
  add(itemId: string, quantity: number): number {
    if (quantity <= 0) return 0
    const current = this.stock.get(itemId) ?? 0
    const next = Math.min(current + quantity, MAX_QUANTITY)
    this.stock.set(itemId, next)
    this.everHeld.add(itemId)
    return next - current
  }

  remove(itemId: string, quantity: number): boolean {
    const current = this.stock.get(itemId) ?? 0
    if (current < quantity) return false
    const next = current - quantity
    if (next === 0) {
      this.stock.delete(itemId)
    } else {
      this.stock.set(itemId, next)
    }
    return true
  }

  getQuantity(itemId: string): number {
    return this.stock.get(itemId) ?? 0
  }

  hasEnough(itemId: string, quantity: number): boolean {
    return this.getQuantity(itemId) >= quantity
  }

  getAllStock(): Record<string, number> {
    return Object.fromEntries(this.stock.entries())
  }

  getTypeCount(): number {
    return this.stock.size
  }

  setInitialStock(stock: Record<string, number>): void {
    this.stock.clear()
    for (const [id, qty] of Object.entries(stock)) {
      if (qty > 0) {
        this.stock.set(id, Math.min(qty, MAX_QUANTITY))
        this.everHeld.add(id)
      }
    }
  }
}
