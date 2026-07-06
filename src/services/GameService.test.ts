import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameService } from './GameService.js'
import { FloorGrid } from '../components/floor/FloorGrid.js'
import { AdjacencyEngine } from '../components/floor/AdjacencyEngine.js'
import { PlacementManager } from '../components/floor/PlacementManager.js'
import { CustomerSimulator } from '../components/simulation/CustomerSimulator.js'
import { EconomyManager } from '../components/economy/EconomyManager.js'
import { ItemRegistry } from '../components/items/ItemRegistry.js'
import { EventBus } from './EventBus.js'
import { GameEvents } from '../types/index.js'
import { ALL_ITEMS } from '../data/items.js'

function setup() {
  const reg = new ItemRegistry(ALL_ITEMS)
  const grid = new FloorGrid({ width: 6, height: 5 }, reg)
  const adj = new AdjacencyEngine(grid, reg)
  const pm = new PlacementManager(grid, reg)
  const sim = new CustomerSimulator(reg)
  const eco = new EconomyManager(50000)
  const gs = new GameService(grid, adj, pm, sim, eco)
  return { reg, grid, adj, pm, sim, eco, gs }
}

describe('GameService', () => {
  beforeEach(() => {
    EventBus.removeAllListeners()
  })

  it('スロットなしのとき売上ゼロ', () => {
    const { gs, eco } = setup()
    gs.onMinutePassed(() => 0) // always trigger customer
    expect(eco.getTotalRevenue()).toBe(0)
  })

  it('顧客が購入するとき売上が計上される', () => {
    const { gs, pm, eco } = setup()
    pm.tryPlace('apple', { x: 0, y: 0 }, 0, 10)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01 // arrive + buy
    }
    gs.onMinutePassed(rng)
    expect(eco.getTotalRevenue()).toBeGreaterThan(0)
  })

  it('購入でスロット数量が減る', () => {
    const { gs, pm, grid } = setup()
    pm.tryPlace('apple', { x: 0, y: 0 }, 0, 5)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng)
    expect(grid.getAllSlots()[0].quantity).toBe(4)
  })

  it('累計売上が100万に達したときPROGRESS_GOAL_COMPLETEを発火する', () => {
    const { gs, eco, pm } = setup()
    const listener = vi.fn()
    EventBus.on(GameEvents.PROGRESS_GOAL_COMPLETE, listener)

    // Manually add revenue close to goal
    for (let i = 0; i < 9999; i++) {
      eco.addRevenue(100)
    }
    pm.tryPlace('apple', { x: 0, y: 0 }, 0, 10)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('2回目以降はGOAL_COMPLETEを発火しない', () => {
    const { gs, eco, pm } = setup()
    gs.enterEndlessMode()
    eco.addRevenue(999999)
    pm.tryPlace('apple', { x: 0, y: 0 }, 0, 10)

    const listener = vi.fn()
    EventBus.on(GameEvents.PROGRESS_GOAL_COMPLETE, listener)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount % 2 === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng)
    expect(listener).not.toHaveBeenCalled()
  })

  it('getGoalAmountは100万を返す', () => {
    const { gs } = setup()
    expect(gs.getGoalAmount()).toBe(1_000_000)
  })
})
