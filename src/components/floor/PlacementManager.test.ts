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
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
    expect(slot).not.toBeNull()
    expect(slot!.itemId).toBe('snap_pea')
  })

  it('配置成功時にFLOOR_SLOT_PLACEDイベントを発火する', () => {
    const { pm } = setup()
    const listener = vi.fn()
    EventBus.on(GameEvents.FLOOR_SLOT_PLACED, listener)
    pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('配置不可な位置でnullを返す', () => {
    const { pm } = setup()
    pm.tryPlace('broad_bean', { x: 0, y: 0 }, 0)   // [[1,1]] が (0,0)(1,0) を占める
    const slot2 = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
    expect(slot2).toBeNull()
  })

  it('グリッド外でnullを返す', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 99, y: 99 }, 0)
    expect(slot).toBeNull()
  })


  it('removeSlotでスロットを削除しFLOOR_SLOT_REMOVEDを発火', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
    const listener = vi.fn()
    EventBus.on(GameEvents.FLOOR_SLOT_REMOVED, listener)
    pm.removeSlot(slot!.id)
    expect(listener).toHaveBeenCalledWith(slot!.id)
  })








  describe('1つの品は棚に1区画まで', () => {
    it('同じ品を2箇所に並べられない', () => {
      const { pm } = setup()
      expect(pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)).not.toBeNull()
      expect(pm.tryPlace('snap_pea', { x: 3, y: 3 }, 0)).toBeNull()
    })

    it('プレビューの段階で弾く（空いている升でも置けない）', () => {
      const { pm } = setup()
      pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
      expect(pm.canPlaceAt('snap_pea', { x: 3, y: 3 }, 0)).toBe(false)
    })

    it('違う品なら並べられる', () => {
      const { pm } = setup()
      pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
      expect(pm.tryPlace('broad_bean', { x: 3, y: 3 }, 0)).not.toBeNull()
    })

    it('撤去すればまた並べられる（＝移動ができる）', () => {
      const { pm } = setup()
      const slot = pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)!
      pm.removeSlot(slot.id)
      expect(pm.isDisplayed('snap_pea')).toBe(false)
      expect(pm.tryPlace('snap_pea', { x: 3, y: 3 }, 0)).not.toBeNull()
    })

    it('isDisplayed は並べているかを返す', () => {
      const { pm } = setup()
      expect(pm.isDisplayed('snap_pea')).toBe(false)
      pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
      expect(pm.isDisplayed('snap_pea')).toBe(true)
    })
  })

  it('canPlaceAtで配置可否を返す', () => {
    const { pm } = setup()
    expect(pm.canPlaceAt('snap_pea', { x: 0, y: 0 }, 0)).toBe(true)
    pm.tryPlace('broad_bean', { x: 0, y: 0 }, 0)
    expect(pm.canPlaceAt('snap_pea', { x: 0, y: 0 }, 0)).toBe(false)
  })
})
