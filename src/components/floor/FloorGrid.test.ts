import { describe, it, expect, beforeEach } from 'vitest'
import { FloorGrid } from './FloorGrid.js'
import { ItemRegistry } from '../items/ItemRegistry.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import type { DisplaySlot } from '../../types/index.js'

function makeGrid(w = 6, h = 5) {
  const reg = new ItemRegistry(ALL_ITEMS)
  return new FloorGrid({ width: w, height: h }, reg)
}

function makeSlot(itemId: string, x: number, y: number, rotation: 0 | 1 | 2 | 3 = 0): DisplaySlot {
  const reg = new ItemRegistry(ALL_ITEMS)
  const item = reg.getItem(itemId)
  return { id: `slot_${itemId}_${x}_${y}`, itemId, shape: item.shape, position: { x, y }, rotation }
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
    const slot = makeSlot('snap_pea', 0, 0)
    expect(grid.canPlace(slot.shape, slot.position, slot.rotation)).toBe(true)
    grid.place(slot)
    expect(grid.getAllSlots()).toHaveLength(1)
  })

  it('同じセルへの重複配置を拒否する', () => {
    const slot = makeSlot('snap_pea', 0, 0)
    grid.place(slot)
    expect(grid.canPlace([[1]], { x: 0, y: 0 }, 0)).toBe(false)
  })

  it('グリッド外への配置を拒否する', () => {
    expect(grid.canPlace([[1]], { x: 6, y: 0 }, 0)).toBe(false)
    expect(grid.canPlace([[1]], { x: 0, y: 5 }, 0)).toBe(false)
    expect(grid.canPlace([[1]], { x: -1, y: 0 }, 0)).toBe(false)
  })

  it('2x1形状をはみ出ない位置に配置できる', () => {
    // そら豆: [[1,1]]
    const slot = makeSlot('broad_bean', 4, 0)
    expect(grid.canPlace(slot.shape, slot.position, slot.rotation)).toBe(true)
  })

  it('2x1形状がグリッドからはみ出る場合拒否', () => {
    // そら豆: [[1,1]] at x=5 → cells (5,0) and (6,0); x=6 is out of bounds
    const slot = makeSlot('broad_bean', 5, 0)
    expect(grid.canPlace(slot.shape, slot.position, slot.rotation)).toBe(false)
  })

  it('スロットを削除するとセルが解放される', () => {
    const slot = makeSlot('snap_pea', 0, 0)
    grid.place(slot)
    grid.remove(slot.id)
    expect(grid.getAllSlots()).toHaveLength(0)
    expect(grid.canPlace([[1]], { x: 0, y: 0 }, 0)).toBe(true)
  })

  it('getSlotAtで指定セルのスロットを取得できる', () => {
    const slot = makeSlot('snap_pea', 2, 3)
    grid.place(slot)
    expect(grid.getSlotAt({ x: 2, y: 3 })?.id).toBe(slot.id)
    expect(grid.getSlotAt({ x: 1, y: 3 })).toBeNull()
  })


  it('expandGridで大きなグリッドに拡張できる', () => {
    const slot = makeSlot('snap_pea', 0, 0)
    grid.place(slot)
    grid.expandGrid({ width: 9, height: 7 })
    expect(grid.getGridSize()).toEqual({ width: 9, height: 7 })
    // 既存スロットは維持
    expect(grid.getSlotAt({ x: 0, y: 0 })?.id).toBe(slot.id)
    // 新セルは配置可能
    expect(grid.canPlace([[1]], { x: 8, y: 6 }, 0)).toBe(true)
  })


  it('getAdjacentSlotIdsは回転後の実際の占有升目で隣接を見る（#30）', () => {
    // 羊の乳 [[1],[1]] を90度回すと横2升になる。回転前のかたちで見ると隣接を取り違える
    const rotated = makeSlot('sheep_milk', 0, 0, 1)   // (0,0) と (1,0) を占める
    const neighbor = makeSlot('snap_pea', 2, 0)        // (2,0)
    const apart = makeSlot('snap_pea', 0, 2)           // (0,2) — 接していない
    grid.place(rotated)
    grid.place(neighbor)
    grid.place({ ...apart, id: 'slot_apart' })

    const ids = grid.getAdjacentSlotIds(rotated)
    expect(ids).toContain(neighbor.id)
    expect(ids).not.toContain('slot_apart')
  })

  it('getOccupiedCellsで占有セル一覧を返す', () => {
    // 羊の乳: [[1],[1]] → cells (0,0) and (0,1)
    const slot = makeSlot('sheep_milk', 0, 0)
    grid.place(slot)
    const cells = grid.getOccupiedCells(slot)
    expect(cells).toHaveLength(2)
    expect(cells).toContainEqual({ x: 0, y: 0 })
    expect(cells).toContainEqual({ x: 0, y: 1 })
  })
})
