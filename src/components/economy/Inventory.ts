/**
 * 1品目あたりの持てる上限。
 *
 * ⚠ **下げるときは、溢れたぶんの扱いを先に決めること。**`add` は `Math.min` で丸めるので、
 *   超えたぶんは**黙って消える。**
 */
const MAX_QUANTITY = 99999

export class Inventory {
  private stock: Map<string, number> = new Map()

  add(itemId: string, quantity: number): void {
    const current = this.stock.get(itemId) ?? 0
    this.stock.set(itemId, Math.min(current + quantity, MAX_QUANTITY))
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
      if (qty > 0) this.stock.set(id, Math.min(qty, MAX_QUANTITY))
    }
  }
}
