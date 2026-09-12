import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameService } from './GameService.js'
import { FloorGrid } from '../components/floor/FloorGrid.js'
import { PlacementManager } from '../components/floor/PlacementManager.js'
import { CustomerSimulator } from '../components/simulation/CustomerSimulator.js'
import { EconomyManager } from '../components/economy/EconomyManager.js'
import { ItemRegistry } from '../components/items/ItemRegistry.js'
import { EventBus } from './EventBus.js'
import { GameEvents } from '../types/index.js'
import { WorldState } from '../components/progress/WorldState.js'
import { ALL_ITEMS } from '../taxonomy/items.js'
import { ALL_RECIPES } from '../taxonomy/recipes.js'

function setup() {
  const reg = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)
  const grid = new FloorGrid({ width: 6, height: 5 }, reg)
  const pm = new PlacementManager(grid, reg)
  const sim = new CustomerSimulator(reg)
  const eco = new EconomyManager(50000)
  const world = new WorldState()
  const gs = new GameService(grid, pm, sim, eco, world)
  return { reg, grid, pm, sim, eco, world, gs }
}

describe('GameService', () => {
  beforeEach(() => {
    EventBus.removeAllListeners()
  })

  it('スロットなしのとき売上ゼロ', () => {
    const { gs, eco } = setup()
    gs.onMinutePassed(() => 0, true) // always trigger customer
    expect(eco.getTotalRevenue()).toBe(0)
  })

  it('顧客が購入するとき売上が計上される', () => {
    const { gs, pm, eco } = setup()
    pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01 // arrive + buy
    }
    gs.onMinutePassed(rng, true)
    expect(eco.getTotalRevenue()).toBeGreaterThan(0)
  })

  it('購入でスロット数量が減る', () => {
    const { gs, pm, grid } = setup()
    pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 5)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng, true)
    expect(grid.getAllSlots()[0].quantity).toBe(4)
  })

  it('閉店中（isOpen=false）は客が来ない — 売上も在庫も動かない（#25）', () => {
    const { gs, pm, eco, grid } = setup()
    pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)
    const sold = vi.fn()
    EventBus.on(GameEvents.FLOOR_SLOT_SOLD, sold)

    // 営業中なら必ず買われる乱数（到着 → 購入）を渡しても、閉店中は何も起きない
    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng, false)

    expect(eco.getTotalRevenue()).toBe(0)
    expect(grid.getAllSlots()[0].quantity).toBe(10)
    expect(sold).not.toHaveBeenCalled()
    expect(callCount).toBe(0) // 乱数すら引かれない＝客の判定に入っていない
  })

  it('同じ乱数でも営業中なら売れる（閉店テストの対照）', () => {
    const { gs, pm, eco } = setup()
    pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)
    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng, true)
    expect(eco.getTotalRevenue()).toBeGreaterThan(0)
  })

  it('累計売上が100万に達したときPROGRESS_GOAL_COMPLETEを発火する', () => {
    const { gs, eco, pm, reg } = setup()
    const listener = vi.fn()
    EventBus.on(GameEvents.PROGRESS_GOAL_COMPLETE, listener)

    // ⚠ 判定は**所持金**（#26）。ちょうど1品売れば届くところまで積む
    eco.addRevenue(gs.getGoalAmount() - reg.salePriceOf('snap_pea'))
    pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng, true)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('2回目以降はGOAL_COMPLETEを発火しない', () => {
    const { gs, eco, pm } = setup()
    gs.enterEndlessMode()
    eco.addRevenue(999999)
    pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)

    const listener = vi.fn()
    EventBus.on(GameEvents.PROGRESS_GOAL_COMPLETE, listener)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount % 2 === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng, true)
    expect(listener).not.toHaveBeenCalled()
  })

  it('売れた品は累計販売数に積まれる（U2 の解禁条件が読む）', () => {
    const { gs, pm, world } = setup()
    pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 5)
    expect(world.getSoldCount('snap_pea')).toBe(0)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng, true)
    expect(world.getSoldCount('snap_pea')).toBe(1)
  })

  it('getGoalAmountは1000万を返す', () => {
    const { gs } = setup()
    expect(gs.getGoalAmount()).toBe(10_000_000)
  })
})
