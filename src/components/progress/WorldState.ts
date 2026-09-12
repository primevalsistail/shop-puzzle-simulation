import type { GameState } from '../../taxonomy/evaluate.js'
import type { IslandName } from '../../taxonomy/islands.js'
import { ROUTE, DAYS_PER_PORT } from '../../taxonomy/islands.js'
import type { ItemId } from '../../taxonomy/axes.js'

export interface Location {
  readonly island: IslandName
  /** 次の寄港地 */
  readonly next: IslandName
  /** あと何日この島にいるか（今日を含む） */
  readonly daysLeftAtPort: number
}

/**
 * 規則が読む世界の状態（`現在地` と `累計販売数`）を持つ。
 *
 * **現在地は日付から決まる**（#2）。順序は固定で、プレイヤーは選べない。
 *
 *   Day 1-10 ハルヴェラ ／ Day 11-20 リナツィア ／ Day 21-30 ノアキータ ／ …
 *
 * ⚠ **航海日は作らない**（#74）。このゲームは「毎日どこに投じるか決める」のが骨格で、
 *   営業も仕入れもできない日は**判断の無い日**になる。
 *   周期10日・4島一周40日で、`world.md` の「10日ごとに移る」と一致する。
 *   **200日 ＝ 20回の寄港・5周。**
 *
 * `累計販売数` は U2（その品を一定数売ると買えるようになる）が読む。
 */
export class WorldState {
  private day = 1
  private soldCounts = new Map<ItemId, number>()

  /** 日付を設定する。現在地はここから導出され、保存も日付だけでよい */
  setDay(day: number): void {
    this.day = Math.max(1, Math.floor(day))
  }

  getDay(): number {
    return this.day
  }

  getLocation(): Location {
    const elapsed = this.day - 1
    const indexInPort = elapsed % DAYS_PER_PORT
    const portIndex = Math.floor(elapsed / DAYS_PER_PORT) % ROUTE.length
    return {
      island: ROUTE[portIndex],
      next: ROUTE[(portIndex + 1) % ROUTE.length],
      daysLeftAtPort: DAYS_PER_PORT - indexInPort,
    }
  }

  getState(): GameState {
    return { 現在地: this.getLocation().island, 累計販売数: this.soldCounts }
  }

  getIsland(): IslandName {
    return this.getLocation().island
  }

  /**
   * 次にこの島へ戻るまでの日数（今日から数える）。
   *
   * ⚠ **島を出ると30日戻らない**（一周40日・寄港10日）。
   *   素材は産地の島でしか買えないので、**いま買わないと次は30日後**になる。
   *   これを仕入れの画面に出すのが #33。
   */
  daysUntilReturn(): number {
    return this.getLocation().daysLeftAtPort + (ROUTE.length - 1) * DAYS_PER_PORT
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
