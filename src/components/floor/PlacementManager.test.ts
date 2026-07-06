import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlacementManager } from './PlacementManager.js'
import { FloorGrid } from './FloorGrid.js'
import { ItemRegistry } from '../items/ItemRegistry.js'
import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'
import { SAMPLE_ITEMS } from '../../data/items.js'

function setup() {
  const reg = new ItemRegistry(SAMPLE_ITEMS)
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
    const slot = pm.tryPlace('apple', { x: 0, y: 0 }, 0, 10)
    expect(slot).not.toBeNull()
    expect(slot!.itemId).toBe('apple')
    expect(slot!.quantity).toBe(10)
  })

  it('配置成功時にFLOOR_SLOT_PLACEDイベントを発火する', () => {
    const { pm } = setup()
    const listener = vi.fn()
    EventBus.on(GameEvents.FLOOR_SLOT_PLACED, listener)
    pm.tryPlace('apple', { x: 0, y: 0 }, 0, 5)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('配置不可な位置でnullを返す', () => {
    const { pm } = setup()
    pm.tryPlace('apple', { x: 0, y: 0 }, 0, 5)
    const slot2 = pm.tryPlace('apple', { x: 0, y: 0 }, 0, 5)
    expect(slot2).toBeNull()
  })

  it('グリッド外でnullを返す', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('apple', { x: 99, y: 99 }, 0, 5)
    expect(slot).toBeNull()
  })

  it('数量を999で上限クリップ', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('apple', { x: 0, y: 0 }, 0, 9999)
    expect(slot!.quantity).toBe(999)
  })

  it('removeSlotでスロットを削除しFLOOR_SLOT_REMOVEDを発火', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('apple', { x: 0, y: 0 }, 0, 5)
    const listener = vi.fn()
    EventBus.on(GameEvents.FLOOR_SLOT_REMOVED, listener)
    pm.removeSlot(slot!.id)
    expect(listener).toHaveBeenCalledWith(slot!.id)
  })

  it('depleteOneで数量を1減らす', () => {
    const { pm, grid } = setup()
    const slot = pm.tryPlace('apple', { x: 0, y: 0 }, 0, 3)
    const result = pm.depleteOne(slot!.id)
    expect(result).toBe(true)
    expect(grid.getAllSlots()[0].quantity).toBe(2)
  })

  it('depleteOneで0になったときFLOOR_SLOT_EMPTIEDを発火', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('apple', { x: 0, y: 0 }, 0, 1)
    const listener = vi.fn()
    EventBus.on(GameEvents.FLOOR_SLOT_EMPTIED, listener)
    pm.depleteOne(slot!.id)
    expect(listener).toHaveBeenCalledWith(slot!.id)
  })

  it('depleteOne: quantity=0のとき失敗しfalseを返す', () => {
    const { pm } = setup()
    const slot = pm.tryPlace('apple', { x: 0, y: 0 }, 0, 1)
    pm.depleteOne(slot!.id)
    const result = pm.depleteOne(slot!.id)
    expect(result).toBe(false)
  })

  it('restockで数量を加算し999を超えない', () => {
    const { pm, grid } = setup()
    const slot = pm.tryPlace('apple', { x: 0, y: 0 }, 0, 990)
    pm.restock(slot!.id, 20)
    expect(grid.getAllSlots()[0].quantity).toBe(999)
  })

  it('canPlaceAtで配置可否を返す', () => {
    const { pm } = setup()
    expect(pm.canPlaceAt('apple', { x: 0, y: 0 }, 0)).toBe(true)
    pm.tryPlace('apple', { x: 0, y: 0 }, 0, 1)
    expect(pm.canPlaceAt('apple', { x: 0, y: 0 }, 0)).toBe(false)
  })
})
