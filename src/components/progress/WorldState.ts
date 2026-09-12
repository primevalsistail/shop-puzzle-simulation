import type { GameState } from '../../taxonomy/evaluate.js'
import type { IslandName } from '../../taxonomy/islands.js'
import { ROUTE, DAYS_PER_PORT } from '../../taxonomy/islands.js'
import type { ItemId } from '../../taxonomy/axes.js'

/**
 * 航海に使う日数。**0 ＝ 航海日は無い。**
 *
 * ⚠ **航海日を作らない。**このゲームは「毎日どこに投じるか決める」のが骨格で、
 *   営業も仕入れもできない日は**判断の無い日**になる。
 *   周期10日・4島一周40日で、`world.md` の「10日ごとに移る」と一致する。
 *   **200日 ＝ 20回の寄港・5周。**
 */
export const DAYS_AT_SEA = 0

/** 1島ぶんの周期（寄港＋航海） */
export const DAYS_PER_CYCLE = DAYS_PER_PORT + DAYS_AT_SEA

export interface Location {
  readonly island: IslandName
  /** `DAYS_AT_SEA` が 0 の間は常に false */
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

  /**
   * 次にこの島へ戻るまでの日数（今日から数える）。
   *
   * ⚠ **島を出ると30日戻らない**（一周40日・寄港10日・航海日なし）。
   *   素材は産地の島でしか買えないので、**いま買わないと次は30日後**になる。
   *   これを仕入れの画面に出すのが #33。
   */
  daysUntilReturn(): number {
    return this.getLocation().daysLeftAtPort + (ROUTE.length - 1) * DAYS_PER_CYCLE
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
