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
      expect(at(1)).toMatchObject({ island: 'ハルヴェラ', daysLeftAtPort: 10 })
      expect(at(10)).toMatchObject({ island: 'ハルヴェラ', daysLeftAtPort: 1 })
    })

    it('Day11 にはもうリナツィアにいる（航海日を挟まない）', () => {
      expect(at(11)).toMatchObject({ island: 'リナツィア', daysLeftAtPort: 10 })
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

    it('どの日も必ずどこかの島に寄港している（航海日は無い・#74）', () => {
      for (const d of [1, 10, 11, 20, 21, 40, 41, 200]) {
        expect(at(d).daysLeftAtPort).toBeGreaterThan(0)
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

describe('daysUntilReturn — 次にこの島へ戻るまで（#33）', () => {
  it('着いた初日は、一周ぶん先', () => {
    const w = new WorldState()
    w.setDay(1)
    expect(w.daysUntilReturn()).toBe(40)
  })

  /** ⚠ 出る直前がいちばん切実。ここで買わないと30日戻らない */
  it('滞在の最終日は 31日後', () => {
    const w = new WorldState()
    w.setDay(10)
    expect(w.daysUntilReturn()).toBe(31)
  })

  it('次の島へ移った初日も、一周ぶん先', () => {
    const w = new WorldState()
    w.setDay(11)
    expect(w.getIsland()).toBe('リナツィア')
    expect(w.daysUntilReturn()).toBe(40)
  })

  it('足すと本当にその島へ戻る', () => {
    for (const day of [1, 5, 10, 11, 23, 37]) {
      const now = new WorldState()
      now.setDay(day)
      const later = new WorldState()
      later.setDay(day + now.daysUntilReturn())
      expect(later.getIsland()).toBe(now.getIsland())
    }
  })
})
