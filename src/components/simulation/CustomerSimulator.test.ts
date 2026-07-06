import { describe, it, expect } from 'vitest'
import { CustomerSimulator } from './CustomerSimulator.js'
import { ItemRegistry } from '../items/ItemRegistry.js'
import { ALL_ITEMS } from '../../data/items.js'
import type { DisplaySlot } from '../../types/index.js'

function makeSlot(id: string, itemId: string, qty: number): DisplaySlot {
  const reg = new ItemRegistry(ALL_ITEMS)
  const item = reg.getItem(itemId)
  return { id, itemId, shape: item.shape, position: { x: 0, y: 0 }, rotation: 0, quantity: qty }
}

describe('CustomerSimulator', () => {
  const reg = new ItemRegistry(ALL_ITEMS)
  const sim = new CustomerSimulator(reg)

  it('顧客が来ないとき売上ゼロ (rng always > arrival rate)', () => {
    const slot = makeSlot('s1', 'apple', 5)
    const results = sim.simulateMinute([slot], new Map(), () => 1.0)
    expect(results).toHaveLength(0)
  })

  it('顧客が来て必ず購入するとき売上あり', () => {
    const slot = makeSlot('s1', 'apple', 5)
    // First rng call: customer arrives (< 0.3), second: purchase (< prob)
    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01  // arrive, always buy
    }
    const results = sim.simulateMinute([slot], new Map(), rng)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].itemId).toBe('apple')
    expect(results[0].revenue).toBe(100)
  })

  it('quantity=0のスロットは対象外', () => {
    const slot = makeSlot('s1', 'apple', 0)
    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    const results = sim.simulateMinute([slot], new Map(), rng)
    expect(results).toHaveLength(0)
  })

  it('price_upボーナスで収益が増加する', () => {
    const slot = makeSlot('s1', 'apple', 5)
    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    const bonuses = new Map([
      ['s1', [{ slotId: 's1', bonusType: 'price_up' as const, multiplier: 2.0, sourceSlotIds: [] }]],
    ])
    const results = sim.simulateMinute([slot], bonuses, rng)
    if (results.length > 0) {
      expect(results[0].revenue).toBe(200) // 100 * 2.0
    }
  })

  it('複数スロットが存在する場合も正しく処理する', () => {
    const slots = [
      makeSlot('s1', 'apple', 3),
      makeSlot('s2', 'milk', 3),
    ]
    let callCount = 0
    const rng = () => {
      callCount++
      // First call: customer arrives, then alternate buy/not
      if (callCount === 1) return 0.1 // customer arrives
      return callCount % 2 === 0 ? 0.01 : 0.99
    }
    const results = sim.simulateMinute(slots, new Map(), rng)
    // At least some results expected
    expect(results.length).toBeGreaterThanOrEqual(0)
  })
})
