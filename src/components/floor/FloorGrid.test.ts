import { describe, it, expect, beforeEach } from 'vitest'
import { FloorGrid } from './FloorGrid.js'
import { ItemRegistry } from '../items/ItemRegistry.js'
import { SAMPLE_ITEMS } from '../../data/items.js'
import type { DisplaySlot } from '../../types/index.js'

function makeGrid(w = 6, h = 5) {
  const reg = new ItemRegistry(SAMPLE_ITEMS)
  return new FloorGrid({ width: w, height: h }, reg)
}

function makeSlot(itemId: string, x: number, y: number, rotation: 0 | 1 | 2 | 3 = 0): DisplaySlot {
  const reg = new ItemRegistry(SAMPLE_ITEMS)
  const item = reg.getItem(itemId)
  return { id: `slot_${itemId}_${x}_${y}`, itemId, shape: item.shape, position: { x, y }, rotation, quantity: 5 }
}

describe('FloorGrid', () => {
  let grid: FloorGrid

  beforeEach(() => {
    grid = makeGrid()
  })

  it('初期状態でスロットなし', () => {
    expect(grid.getAllSlots()).toHaveLength(0)
  })

  it('グリッドサイズを返す', () => {
    expect(grid.getGridSize()).toEqual({ width: 6, height: 5 })
  })

  it('空セルに1x1アイテムを配置できる', () => {
    const slot = makeSlot('apple', 0, 0)
    expect(grid.canPlace(slot.shape, slot.position, slot.rotation)).toBe(true)
    grid.place(slot)
    expect(grid.getAllSlots()).toHaveLength(1)
  })

  it('同じセルへの重複配置を拒否する', () => {
    const slot = makeSlot('apple', 0, 0)
    grid.place(slot)
    expect(grid.canPlace([[1]], { x: 0, y: 0 }, 0)).toBe(false)
  })

  it('グリッド外への配置を拒否する', () => {
    expect(grid.canPlace([[1]], { x: 6, y: 0 }, 0)).toBe(false)
    expect(grid.canPlace([[1]], { x: 0, y: 5 }, 0)).toBe(false)
    expect(grid.canPlace([[1]], { x: -1, y: 0 }, 0)).toBe(false)
  })

  it('2x1形状をはみ出ない位置に配置できる', () => {
    // bread: [[1,1]]
    const slot = makeSlot('bread', 4, 0)
    expect(grid.canPlace(slot.shape, slot.position, slot.rotation)).toBe(true)
  })

  it('2x1形状がグリッドからはみ出る場合拒否', () => {
    // bread: [[1,1]] at x=5 → cells (5,0) and (6,0); x=6 is out of bounds
    const slot = makeSlot('bread', 5, 0)
    expect(grid.canPlace(slot.shape, slot.position, slot.rotation)).toBe(false)
  })

  it('スロットを削除するとセルが解放される', () => {
    const slot = makeSlot('apple', 0, 0)
    grid.place(slot)
    grid.remove(slot.id)
    expect(grid.getAllSlots()).toHaveLength(0)
    expect(grid.canPlace([[1]], { x: 0, y: 0 }, 0)).toBe(true)
  })

  it('getSlotAtで指定セルのスロットを取得できる', () => {
    const slot = makeSlot('apple', 2, 3)
    grid.place(slot)
    expect(grid.getSlotAt({ x: 2, y: 3 })?.id).toBe(slot.id)
    expect(grid.getSlotAt({ x: 1, y: 3 })).toBeNull()
  })

  it('getEmptySlotsはquantity=0のスロットのみ返す', () => {
    const slot1 = makeSlot('apple', 0, 0)
    const slot2 = { ...makeSlot('apple', 1, 0), id: 'slot_empty', quantity: 0 }
    grid.place(slot1)
    grid.place(slot2)
    const empty = grid.getEmptySlots()
    expect(empty).toHaveLength(1)
    expect(empty[0].id).toBe('slot_empty')
  })

  it('expandGridで大きなグリッドに拡張できる', () => {
    const slot = makeSlot('apple', 0, 0)
    grid.place(slot)
    grid.expandGrid({ width: 9, height: 7 })
    expect(grid.getGridSize()).toEqual({ width: 9, height: 7 })
    // 既存スロットは維持
    expect(grid.getSlotAt({ x: 0, y: 0 })?.id).toBe(slot.id)
    // 新セルは配置可能
    expect(grid.canPlace([[1]], { x: 8, y: 6 }, 0)).toBe(true)
  })

  it('updateQuantityで数量を更新できる', () => {
    const slot = makeSlot('apple', 0, 0)
    grid.place(slot)
    grid.updateQuantity(slot.id, 42)
    expect(grid.getAllSlots()[0].quantity).toBe(42)
  })

  it('getOccupiedCellsで占有セル一覧を返す', () => {
    // milk: [[1],[1]] → cells (0,0) and (0,1)
    const slot = makeSlot('milk', 0, 0)
    grid.place(slot)
    const cells = grid.getOccupiedCells(slot)
    expect(cells).toHaveLength(2)
    expect(cells).toContainEqual({ x: 0, y: 0 })
    expect(cells).toContainEqual({ x: 0, y: 1 })
  })
})
