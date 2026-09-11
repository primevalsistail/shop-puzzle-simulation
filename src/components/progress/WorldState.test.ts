import { describe, it, expect } from 'vitest'
import { WorldState } from './WorldState.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import { stockedByIslandMerchant } from '../../taxonomy/evaluate.js'
import { tier } from '../../taxonomy/derive.js'

describe('WorldState', () => {
  it('初日はハルヴェラにいる', () => {
    expect(new WorldState().getIsland()).toBe('ハルヴェラ')
  })

  describe('巡回（#2 / #4）— 寄港10日 ＋ 航海1日 = 11日で1島', () => {
    const at = (day: number) => {
      const w = new WorldState()
      w.setDay(day)
      return w.getLocation()
    }

    it('Day1-10 はハルヴェラに寄港している', () => {
      expect(at(1)).toMatchObject({ island: 'ハルヴェラ', atSea: false, daysLeftAtPort: 10 })
      expect(at(10)).toMatchObject({ island: 'ハルヴェラ', atSea: false, daysLeftAtPort: 1 })
    })

    it('Day11 は航海日。出港した島を現在地のまま持ち、次はリナツィア', () => {
      expect(at(11)).toMatchObject({
        island: 'ハルヴェラ', atSea: true, next: 'リナツィア', daysLeftAtPort: 0,
      })
    })

    it('Day12 にリナツィアへ着く', () => {
      expect(at(12)).toMatchObject({ island: 'リナツィア', atSea: false, daysLeftAtPort: 10 })
    })

    it('Day23 にノアキータ、Day34 にミフユリア', () => {
      expect(at(23).island).toBe('ノアキータ')
      expect(at(34).island).toBe('ミフユリア')
    })

    it('4島を回ると先頭へ戻る（順序固定・スキップ不可）', () => {
      expect(at(45).island).toBe('ハルヴェラ')
    })

    it('航海日は11日ごとに1日だけ', () => {
      const seaDays = []
      for (let d = 1; d <= 44; d++) if (at(d).atSea) seaDays.push(d)
      expect(seaDays).toEqual([11, 22, 33, 44])
    })

    it('isAtSea は航海日だけ true（この日は店を開けない）', () => {
      const w = new WorldState()
      w.setDay(10); expect(w.isAtSea()).toBe(false)
      w.setDay(11); expect(w.isAtSea()).toBe(true)
      w.setDay(12); expect(w.isAtSea()).toBe(false)
    })

    it('島が変われば規則が読む現在地も変わる', () => {
      const w = new WorldState()
      w.setDay(1);  expect(w.getState().現在地).toBe('ハルヴェラ')
      w.setDay(12); expect(w.getState().現在地).toBe('リナツィア')
    })

    it('仕入れに並ぶ品は島ごとに違う（需要表4行が全部効く前提）', () => {
      const w = new WorldState()
      w.setDay(1)
      const halvera = stockedByIslandMerchant(ALL_ITEMS, w.getState()).map(i => i.id)
      w.setDay(12)
      const linazia = stockedByIslandMerchant(ALL_ITEMS, w.getState()).map(i => i.id)
      expect(halvera).not.toEqual(linazia)
      // 旬を持たない品（産地なし）はどちらでも並ぶ
      expect(halvera.filter(id => linazia.includes(id)).length).toBeGreaterThan(0)
    })
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
