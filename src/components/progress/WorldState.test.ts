import { describe, it, expect } from 'vitest'
import { WorldState } from './WorldState.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import { stockedByIslandMerchant } from '../../taxonomy/evaluate.js'
import { tier } from '../../taxonomy/derive.js'

describe('WorldState', () => {
  it('初日はハルヴェラにいる', () => {
    expect(new WorldState().getIsland()).toBe('ハルヴェラ')
  })

  describe('巡回（#2）— 寄港10日で次の島へ。航海日は無い', () => {
    const at = (day: number) => {
      const w = new WorldState()
      w.setDay(day)
      return w.getLocation()
    }

    it('Day1-10 はハルヴェラに寄港している', () => {
      expect(at(1)).toMatchObject({ island: 'ハルヴェラ', atSea: false, daysLeftAtPort: 10 })
      expect(at(10)).toMatchObject({ island: 'ハルヴェラ', atSea: false, daysLeftAtPort: 1 })
    })

    it('Day11 にはもうリナツィアにいる（航海日を挟まない）', () => {
      expect(at(11)).toMatchObject({ island: 'リナツィア', atSea: false, daysLeftAtPort: 10 })
    })

    it('Day21 ノアキータ、Day31 ミフユリア', () => {
      expect(at(21).island).toBe('ノアキータ')
      expect(at(31).island).toBe('ミフユリア')
    })

    it('4島を回ると先頭へ戻る。**1周は40日**', () => {
      expect(at(41).island).toBe('ハルヴェラ')
      // 200日 = 20回の寄港・5周
      expect(at(200).island).toBe('ミフユリア')
    })

    it('航海日は存在しない（isAtSea は常に false）', () => {
      const w = new WorldState()
      for (const d of [1, 10, 11, 20, 21, 40, 41, 200]) {
        w.setDay(d)
        expect(w.isAtSea()).toBe(false)
      }
    })

    it('島が変われば規則が読む現在地も変わる', () => {
      const w = new WorldState()
      w.setDay(1);  expect(w.getState().現在地).toBe('ハルヴェラ')
      w.setDay(11); expect(w.getState().現在地).toBe('リナツィア')
    })
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
