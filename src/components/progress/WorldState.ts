import type { GameState } from '../../taxonomy/evaluate.js'
import type { IslandName } from '../../taxonomy/islands.js'
import type { ItemId } from '../../taxonomy/axes.js'

/**
 * 規則が読む世界の状態（`現在地` と `累計販売数`）を持つ。
 *
 * ⚠ **巡航はまだ無い。**現在地はハルヴェラに固定してある（#30 実行計画 Q1 = A）。
 *   10日ごとに島が変わる仕組みは [#2] が引き取る。ここを差し替えれば需要表4行が全部効く。
 *
 * `累計販売数` は U2（その品を一定数売ると買えるようになる）が読む。
 */
const INITIAL_ISLAND: IslandName = 'ハルヴェラ'

export class WorldState {
  private island: IslandName = INITIAL_ISLAND
  private soldCounts = new Map<ItemId, number>()

  getState(): GameState {
    return { 現在地: this.island, 累計販売数: this.soldCounts }
  }

  getIsland(): IslandName {
    return this.island
  }

  recordSale(itemId: ItemId, quantity = 1): void {
    this.soldCounts.set(itemId, (this.soldCounts.get(itemId) ?? 0) + quantity)
  }

  getSoldCount(itemId: ItemId): number {
    return this.soldCounts.get(itemId) ?? 0
  }

  toRecord(): Record<string, number> {
    return Object.fromEntries(this.soldCounts)
  }

  restore(record: Record<string, number>): void {
    this.soldCounts = new Map(Object.entries(record))
  }
}
