/**
 * 1品目あたりの持てる上限。
 *
 * ⚠ **下げるときは、溢れたぶんの扱いを先に決めること。**`add` は `Math.min` で丸めるので、
 *   超えたぶんは**黙って消える。**
 */
const MAX_QUANTITY = 99999

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

  add(itemId: string, quantity: number): void {
    if (quantity <= 0) return
    const current = this.stock.get(itemId) ?? 0
    this.stock.set(itemId, Math.min(current + quantity, MAX_QUANTITY))
    this.everHeld.add(itemId)
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
