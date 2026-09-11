import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlacementManager } from './PlacementManager.js'
import { FloorGrid } from './FloorGrid.js'
import { ItemRegistry } from '../items/ItemRegistry.js'
import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'

function setup() {
  const reg = new ItemRegistry(ALL_ITEMS)
  const grid = new FloorGrid({ width: 6, height: 5 }, reg)
  const pm = new PlacementManager(grid, reg)
  return { reg, grid, pm }
}

describe('PlacementManager', () => {
  beforeEach(() => {
    EventBus.removeAllListeners()
  })

  it('有効な位置にアイテムを配置してスロットを返す', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)
    expect(slot).not.toBeNull()
    expect(slot!.itemId).toBe('snap_pea')
    expect(slot!.quantity).toBe(10)
  })

  it('配置成功時にFLOOR_SLOT_PLACEDイベントを発火する', () => {
    const { pm } = setup()
    const listener = vi.fn()
    EventBus.on(GameEvents.FLOOR_SLOT_PLACED, listener)
    pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 5)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('配置不可な位置でnullを返す', () => {
    const { pm } = setup()
    pm.tryPlace('broad_bean', { x: 0, y: 0 }, 0, 5)   // [[1,1]] が (0,0)(1,0) を占める
    const slot2 = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 5)
    expect(slot2).toBeNull()
  })

  it('グリッド外でnullを返す', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 99, y: 99 }, 0, 5)
    expect(slot).toBeNull()
  })

  it('数量を999で上限クリップ', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 9999)
    expect(slot!.quantity).toBe(999)
  })

  it('removeSlotでスロットを削除しFLOOR_SLOT_REMOVEDを発火', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 5)
    const listener = vi.fn()
    EventBus.on(GameEvents.FLOOR_SLOT_REMOVED, listener)
    pm.removeSlot(slot!.id)
    expect(listener).toHaveBeenCalledWith(slot!.id)
  })

  it('depleteOneで数量を1減らす', () => {
    const { pm, grid } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 3)
    const result = pm.depleteOne(slot!.id)
    expect(result).toBe(true)
    expect(grid.getAllSlots()[0].quantity).toBe(2)
  })

  it('depleteOneで0になったときFLOOR_SLOT_EMPTIEDを発火', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 1)
    const listener = vi.fn()
    EventBus.on(GameEvents.FLOOR_SLOT_EMPTIED, listener)
    pm.depleteOne(slot!.id)
    expect(listener).toHaveBeenCalledWith(slot!.id)
  })

  it('depleteOne: quantity=0のとき失敗しfalseを返す', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 1)
    pm.depleteOne(slot!.id)
    const result = pm.depleteOne(slot!.id)
    expect(result).toBe(false)
  })

  it('restockで数量を加算し999を超えない', () => {
    const { pm, grid } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 990)
    pm.restock(slot!.id, 20)
    expect(grid.getAllSlots()[0].quantity).toBe(999)
  })

  it('restock は実際に積めた数を返す（上限で頭打ちになったぶんは積んでいない）', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 990)
    expect(pm.restock(slot!.id, 20)).toBe(9)   // 990 → 999
    expect(pm.restock(slot!.id, 20)).toBe(0)   // もう積めない
  })

  it('存在しない区画への restock は 0 を返す', () => {
    const { pm } = setup()
    expect(pm.restock('not_exist', 10)).toBe(0)
  })

  it('上限を超える数で置いても、置けるのは999個まで（残りは呼び出し側が持つ）', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10000)
    expect(slot!.quantity).toBe(999)
  })

  describe('1つの品は棚に1区画まで', () => {
    it('同じ品を2箇所に並べられない', () => {
      const { pm } = setup()
      expect(pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)).not.toBeNull()
      expect(pm.tryPlace('snap_pea', { x: 3, y: 3 }, 0, 10)).toBeNull()
    })

    it('プレビューの段階で弾く（空いている升でも置けない）', () => {
      const { pm } = setup()
      pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)
      expect(pm.canPlaceAt('snap_pea', { x: 3, y: 3 }, 0)).toBe(false)
    })

    it('違う品なら並べられる', () => {
      const { pm } = setup()
      pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)
      expect(pm.tryPlace('broad_bean', { x: 3, y: 3 }, 0, 10)).not.toBeNull()
    })

    it('撤去すればまた並べられる（＝移動ができる）', () => {
      const { pm } = setup()
      const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)!
      pm.removeSlot(slot.id)
      expect(pm.isDisplayed('snap_pea')).toBe(false)
      expect(pm.tryPlace('snap_pea', { x: 3, y: 3 }, 0, 10)).not.toBeNull()
    })

    it('isDisplayed は並べているかを返す', () => {
      const { pm } = setup()
      expect(pm.isDisplayed('snap_pea')).toBe(false)
      pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0, 10)
      expect(pm.isDisplayed('snap_pea')).toBe(true)
    })
  })

  it('canPlaceAtで配置可否を返す', () => {
    const { pm } = setup()
    expect(pm.canPlaceAt('snap_pea', { x: 0, y: 0 }, 0)).toBe(true)
    pm.tryPlace('broad_bean', { x: 0, y: 0 }, 0, 1)
    expect(pm.canPlaceAt('snap_pea', { x: 0, y: 0 }, 0)).toBe(false)
  })
})
