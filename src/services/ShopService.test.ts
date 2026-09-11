import { describe, it, expect, beforeEach } from 'vitest'
import { ShopService } from './ShopService.js'
import { FloorGrid } from '../components/floor/FloorGrid.js'
import { PlacementManager } from '../components/floor/PlacementManager.js'
import { Inventory } from '../components/economy/Inventory.js'
import { ItemRegistry } from '../components/items/ItemRegistry.js'
import { EventBus } from './EventBus.js'
import { ALL_ITEMS } from '../taxonomy/items.js'
import { ALL_RECIPES } from '../taxonomy/recipes.js'

function setup() {
  const reg = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)
  const grid = new FloorGrid({ width: 6, height: 5 }, reg)
  const pm = new PlacementManager(grid, reg)
  const inv = new Inventory()
  const svc = new ShopService(grid, pm, inv, reg)
  return { reg, grid, pm, inv, svc }
}

describe('ShopService', () => {
  beforeEach(() => {
    EventBus.removeAllListeners()
  })

  it('補充すると手持ちが減り、区画が増える', () => {
    const { svc, pm, inv, grid } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)!
    inv.add('snap_pea', 50)

    expect(svc.restockSlot(slot.id, 20)).toBe(true)
    expect(grid.getAllSlots()[0].quantity).toBe(30)
    expect(inv.getQuantity('snap_pea')).toBe(30)
  })

  it('手持ちより多く補充しようとしても、あるぶんだけ動く', () => {
    const { svc, pm, inv, grid } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 0)!
    inv.add('snap_pea', 5)

    expect(svc.restockSlot(slot.id, 100)).toBe(true)
    expect(grid.getAllSlots()[0].quantity).toBe(5)
    expect(inv.getQuantity('snap_pea')).toBe(0)
  })

  /**
   * ⚠ 回帰テスト — 区画の上限 999 で頭打ちになったぶんが**消滅していた**。
   *   渡した数をそのまま手持ちから引いていたのが原因。
   */
  it('区画の上限で頭打ちになっても、積めなかったぶんは手持ちに残る', () => {
    const { svc, pm, inv, grid } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 990)!
    inv.add('snap_pea', 500)

    expect(svc.restockSlot(slot.id, 500)).toBe(true)
    expect(grid.getAllSlots()[0].quantity).toBe(999)   // 990 + 9
    expect(inv.getQuantity('snap_pea')).toBe(491)      // 500 − 9。消えていない
  })

  it('すでに満杯の区画には補充できず、手持ちも減らない', () => {
    const { svc, pm, inv } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 999)!
    inv.add('snap_pea', 100)

    expect(svc.restockSlot(slot.id, 50)).toBe(false)
    expect(inv.getQuantity('snap_pea')).toBe(100)
  })

  it('手持ちが無いときは何も起きない', () => {
    const { svc, pm, inv } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)!
    expect(svc.restockSlot(slot.id, 5)).toBe(false)
    expect(inv.getQuantity('snap_pea')).toBe(0)
  })
})
