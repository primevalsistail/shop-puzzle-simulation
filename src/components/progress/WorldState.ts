import type { GameState } from '../../taxonomy/evaluate.js'
import type { IslandName } from '../../taxonomy/islands.js'
import { ROUTE, DAYS_PER_PORT } from '../../taxonomy/islands.js'
import type { ItemId } from '../../taxonomy/axes.js'

/**
 * 航海に使う日数（#4 / 束B Q1）。**寄港10日 ＋ 航海1日 = 11日で1島。**
 *
 * ⚠ `world.md` の「10日ごとに移る」は**寄港している長さ**を指すと読む。
 *   航海日は寄港日の外側にあり、`DAYS_PER_PORT` の意味は変わっていない。
 */
export const DAYS_AT_SEA = 1

/** 1島ぶんの周期（寄港＋航海） */
export const DAYS_PER_CYCLE = DAYS_PER_PORT + DAYS_AT_SEA

export interface Location {
  /** 寄港中はその島。**航海中は出港した島**（まだ着いていないので次の島ではない） */
  readonly island: IslandName
  readonly atSea: boolean
  /** 次の寄港地 */
  readonly next: IslandName
  /** 寄港中はあと何日この島にいるか（今日を含む）。航海中は 0 */
  readonly daysLeftAtPort: number
}

/**
 * 規則が読む世界の状態（`現在地` と `累計販売数`）を持つ。
 *
 * **現在地は日付から決まる**（#2）。順序は固定で、プレイヤーは選べない。
 *
 *   Day 1-10 ハルヴェラ ／ Day 11 航海 ／ Day 12-21 リナツィア ／ Day 22 航海 ／ …
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
    const indexInCycle = elapsed % DAYS_PER_CYCLE
    const portIndex = Math.floor(elapsed / DAYS_PER_CYCLE) % ROUTE.length
    const atSea = indexInCycle >= DAYS_PER_PORT
    return {
      island: ROUTE[portIndex],
      atSea,
      next: ROUTE[(portIndex + 1) % ROUTE.length],
      daysLeftAtPort: atSea ? 0 : DAYS_PER_PORT - indexInCycle,
    }
  }

  getState(): GameState {
    return { 現在地: this.getLocation().island, 累計販売数: this.soldCounts }
  }

  getIsland(): IslandName {
    return this.getLocation().island
  }

  /** 航海中は店を開けない（#4）。客が来ず、島の商人からも買えない */
  isAtSea(): boolean {
    return this.getLocation().atSea
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
