import { describe, it, expect } from 'vitest'
import { WorldState } from './WorldState.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import { stockedByIslandMerchant } from '../../taxonomy/evaluate.js'
import { tier } from '../../taxonomy/derive.js'

describe('WorldState', () => {
  it('現在地はハルヴェラに固定されている（巡航は #2）', () => {
    expect(new WorldState().getIsland()).toBe('ハルヴェラ')
  })

  it('累計販売数を積める（U2 の解禁条件が読む）', () => {
    const w = new WorldState()
    expect(w.getSoldCount('snap_pea')).toBe(0)
    w.recordSale('snap_pea', 3)
    w.recordSale('snap_pea')
    expect(w.getSoldCount('snap_pea')).toBe(4)
  })

  it('保存して読み直すと累計販売数が戻る', () => {
    const w = new WorldState()
    w.recordSale('snap_pea', 7)
    const restored = new WorldState()
    restored.restore(w.toRecord())
    expect(restored.getSoldCount('snap_pea')).toBe(7)
  })

  describe('仕入れに並ぶ品', () => {
    const world = new WorldState()

    it('その島の産か、旬を持たない品しか並ばない（U3・U4）', () => {
      const stocked = stockedByIslandMerchant(ALL_ITEMS, world.getState())
      expect(stocked.length).toBeGreaterThan(0)
      expect(stocked.every(i => i.origin === 'ハルヴェラ' || i.origin === 'なし')).toBe(true)
    })

    it('売る前は素材しか並ばない（U1: 加工の深い品は序盤には並ばない）', () => {
      const stocked = stockedByIslandMerchant(ALL_ITEMS, world.getState())
      expect(stocked.every(i => tier(i.id) === 1)).toBe(true)
    })

    it('売った実績があると、その加工品が並ぶようになる（U2）', () => {
      const before = stockedByIslandMerchant(ALL_ITEMS, world.getState())
      const crafted = ALL_ITEMS.find(i => tier(i.id) >= 2 && (i.origin === 'なし' || i.origin === 'ハルヴェラ'))!

      const sold = new WorldState()
      sold.recordSale(crafted.id, 1000)
      const after = stockedByIslandMerchant(ALL_ITEMS, sold.getState())

      expect(before.some(i => i.id === crafted.id)).toBe(false)
      expect(after.some(i => i.id === crafted.id)).toBe(true)
    })
  })
})
