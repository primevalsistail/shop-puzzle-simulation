import type { FloorGrid } from '../components/floor/FloorGrid.js'
import type { AdjacencyEngine } from '../components/floor/AdjacencyEngine.js'
import type { PlacementManager } from '../components/floor/PlacementManager.js'
import type { CustomerSimulator } from '../components/simulation/CustomerSimulator.js'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import { EventBus } from './EventBus.js'
import { GameEvents } from '../types/index.js'

const GOAL_AMOUNT = 1_000_000

export class GameService {
  private isEndlessMode = false

  constructor(
    private floorGrid: FloorGrid,
    private adjacencyEngine: AdjacencyEngine,
    private placementManager: PlacementManager,
    private customerSim: CustomerSimulator,
    private economy: EconomyManager,
  ) {}

  /**
   * 1ゲーム分ぶんの売買を回す。
   *
   * ⚠ `isOpen` が false の分には**客が来ない**（#25）。
   *   営業は 10:00-20:00 のみ。加工で飛ばした分も呼ばれない（TimeManager.skipMinutes）。
   *
   * ⚠ `isOpen` に既定値を置かない。既定 `true` は「渡し忘れたら営業中」＝
   *   呼び出し漏れが**閉店中の売買**として静かに通ってしまうため（SE-7）。
   */
  onMinutePassed(rng: () => number, isOpen: boolean): void {
    if (!isOpen) return
    const slots = this.floorGrid.getAllSlots()
    if (slots.length === 0) return

    const bonuses = this.adjacencyEngine.calculateAllBonuses(slots)
    const sales = this.customerSim.simulateMinute(slots, bonuses, rng)

    for (const sale of sales) {
      this.placementManager.depleteOne(sale.slotId)
      this.economy.addRevenue(sale.revenue)
      EventBus.emit(GameEvents.FLOOR_SLOT_SOLD, sale)
    }

    if (!this.isEndlessMode && this.economy.getTotalRevenue() >= GOAL_AMOUNT) {
      EventBus.emit(GameEvents.PROGRESS_GOAL_COMPLETE, this.economy.getTotalRevenue())
    }

    if (this.economy.getMoney() <= 0 && !this.isEndlessMode) {
      EventBus.emit(GameEvents.PROGRESS_GAME_OVER, this.economy.getMoney())
    }
  }

  enterEndlessMode(): void {
    this.isEndlessMode = true
  }

  isInEndlessMode(): boolean {
    return this.isEndlessMode
  }

  getGoalAmount(): number {
    return GOAL_AMOUNT
  }
}
