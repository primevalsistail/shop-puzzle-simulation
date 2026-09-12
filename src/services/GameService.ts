import type { FloorGrid } from '../components/floor/FloorGrid.js'
import type { Inventory } from '../components/economy/Inventory.js'
import type { CustomerSimulator } from '../components/simulation/CustomerSimulator.js'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { WorldState } from '../components/progress/WorldState.js'
import type { Upgrades } from '../components/progress/Upgrades.js'
import { EventBus } from './EventBus.js'
import { GameEvents } from '../types/index.js'
import type { DisplaySlot } from '../types/index.js'
import type { Placement } from '../taxonomy/evaluate.js'
import { evaluate } from '../taxonomy/evaluate.js'

/**
 * クリアの基準。**所持金**がこれに届いたら達成（#26）。
 *
 * ⚠ **累計売上ではなく所持金で見る。**強化に払った金は目標から遠ざかるので、
 *   「いま強化を買うか、目標まで我慢するか」という判断がここから生まれる。
 */
const GOAL_AMOUNT = 10_000_000

export class GameService {
  private isEndlessMode = false

  constructor(
    private floorGrid: FloorGrid,
    private inventory: Inventory,
    private customerSim: CustomerSimulator,
    private economy: EconomyManager,
    private world: WorldState,
    private upgrades: Upgrades,
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

    const evaluation = this.evaluateFloor(slots)
    const sales = this.customerSim.simulateMinute(slots, evaluation, rng, {
      来客: this.upgrades.customerMultiplier(),
      利益率: this.upgrades.marginMultiplier(),
    })

    for (const sale of sales) {
      // 売れたら持ち物が減る。棚は「どこに出しているか」だけなので触らない
      this.inventory.remove(sale.itemId, sale.qtySold)
      this.economy.addRevenue(sale.revenue)
      // U2（その品を一定数売ると買えるようになる）が読む
      this.world.recordSale(sale.itemId, sale.qtySold)
      EventBus.emit(GameEvents.FLOOR_SLOT_SOLD, sale)
    }

    if (!this.isEndlessMode && this.economy.getMoney() >= GOAL_AMOUNT) {
      EventBus.emit(GameEvents.PROGRESS_GOAL_COMPLETE, this.economy.getMoney())
    }

    if (this.economy.getMoney() <= 0 && !this.isEndlessMode) {
      EventBus.emit(GameEvents.PROGRESS_GAME_OVER, this.economy.getMoney())
    }
  }

  /**
   * 盤面を規則にかける。
   *
   * ⚠ **隣接はこちらで出して渡す。**`evaluate()` 既定の `adjacentPairs` は
   *   品の回転前のかたちで見るので、回転した品があると食い違う（#30）。
   */
  private evaluateFloor(slots: DisplaySlot[]) {
    const placements: Placement[] = slots.map(s => ({
      slotId: s.id,
      itemId: s.itemId,
      x: s.position.x,
      y: s.position.y,
    }))
    const byId = new Map(placements.map(p => [p.slotId, p]))

    const pairs: [Placement, Placement][] = []
    const seen = new Set<string>()
    for (const slot of slots) {
      for (const otherId of this.floorGrid.getAdjacentSlotIds(slot)) {
        const key = slot.id < otherId ? `${slot.id}|${otherId}` : `${otherId}|${slot.id}`
        if (seen.has(key)) continue
        seen.add(key)
        const a = byId.get(slot.id)
        const b = byId.get(otherId)
        if (a && b) pairs.push([a, b])
      }
    }

    return evaluate(placements, this.world.getState(), undefined, pairs)
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
