import { describe, it, expect, beforeEach } from 'vitest'
import { AdjacencyEngine } from './AdjacencyEngine.js'
import { FloorGrid } from './FloorGrid.js'
import { ItemRegistry } from '../items/ItemRegistry.js'
import type { ItemDef } from '../items/ItemRegistry.js'
import type { DisplaySlot } from '../../types/index.js'

function makeSlot(id: string, itemId: string, x: number, y: number, shape: number[][]): DisplaySlot {
  return { id, itemId, shape, position: { x, y }, rotation: 0, quantity: 5 }
}

const ITEMS_WITH_BONUS: ItemDef[] = [
  {
    id: 'apple',
    name: 'りんご',
    itemType: 'product',
    shape: [[1]],
    color: 0xe74c3c,
    category: 'food',
    price: 100,
    adjacencyBonuses: [
      { adjacentItemId: 'bread', bonusType: 'sales_rate', multiplier: 1.2 },
    ],
  },
  {
    id: 'bread',
    name: 'パン',
    itemType: 'product',
    shape: [[1]],
    color: 0xe67e22,
    category: 'food',
    price: 150,
  },
  {
    id: 'milk',
    name: 'ミルク',
    itemType: 'product',
    shape: [[1]],
    color: 0xecf0f1,
    category: 'drink',
    price: 120,
  },
]

describe('AdjacencyEngine', () => {
  let reg: ItemRegistry
  let grid: FloorGrid
  let engine: AdjacencyEngine

  beforeEach(() => {
    reg = new ItemRegistry(ITEMS_WITH_BONUS)
    grid = new FloorGrid({ width: 6, height: 5 }, reg)
    engine = new AdjacencyEngine(grid, reg)
  })

  it('隣接スロットなしのとき空のボーナス', () => {
    const appleSlot = makeSlot('s1', 'apple', 0, 0, [[1]])
    grid.place(appleSlot)
    const bonuses = engine.calculateAllBonuses([appleSlot])
    expect(bonuses.get('s1')).toEqual([])
  })

  it('隣接するbreadのとき sales_rate ボーナスを返す', () => {
    const appleSlot = makeSlot('s1', 'apple', 0, 0, [[1]])
    const breadSlot = makeSlot('s2', 'bread', 1, 0, [[1]])
    grid.place(appleSlot)
    grid.place(breadSlot)

    const bonuses = engine.calculateAllBonuses([appleSlot, breadSlot])
    const appleBonuses = bonuses.get('s1')!
    expect(appleBonuses).toHaveLength(1)
    expect(appleBonuses[0].bonusType).toBe('sales_rate')
    expect(appleBonuses[0].multiplier).toBe(1.2)
    expect(appleBonuses[0].sourceSlotIds).toContain('s2')
  })

  it('隣接しないスロットにはボーナスなし', () => {
    const appleSlot = makeSlot('s1', 'apple', 0, 0, [[1]])
    const breadSlot = makeSlot('s2', 'bread', 3, 3, [[1]])
    grid.place(appleSlot)
    grid.place(breadSlot)

    const bonuses = engine.calculateAllBonuses([appleSlot, breadSlot])
    expect(bonuses.get('s1')).toEqual([])
  })

  it('隣接ルールのないアイテムはボーナスなし', () => {
    const milkSlot = makeSlot('s1', 'milk', 0, 0, [[1]])
    const breadSlot = makeSlot('s2', 'bread', 1, 0, [[1]])
    grid.place(milkSlot)
    grid.place(breadSlot)

    const bonuses = engine.calculateAllBonuses([milkSlot, breadSlot])
    expect(bonuses.get('s1')).toEqual([])
  })

  it('getAdjacentSlotsで上下左右の隣接スロットを返す', () => {
    const center = makeSlot('s0', 'apple', 2, 2, [[1]])
    const right = makeSlot('s1', 'bread', 3, 2, [[1]])
    const below = makeSlot('s2', 'milk', 2, 3, [[1]])
    const far = makeSlot('s3', 'bread', 5, 4, [[1]])
    grid.place(center)
    grid.place(right)
    grid.place(below)
    grid.place(far)

    const adjacent = engine.getAdjacentSlots(center, [center, right, below, far])
    expect(adjacent).toHaveLength(2)
    expect(adjacent.map(s => s.id)).toContain('s1')
    expect(adjacent.map(s => s.id)).toContain('s2')
  })
})
