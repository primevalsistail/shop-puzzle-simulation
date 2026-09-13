import { describe, it, expect } from 'vitest'
import { WorldState, nextInRoute, nextPortCandidates } from './WorldState.js'
import { ROUTE, DAYS_PER_PORT } from '../../taxonomy/islands.js'
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


/**
 * 自由航行（#7）。**目標に届いたあとだけ、次にどの島へ行くかを選べる。**
 *
 * ⚠ **クリア前の導出は1行も変えない**（計画「決めたこと 2」）。上の「巡回（#2）」が
 *   そのまま通ることがその証拠で、ここではさらに**全ての日**で式と一致することを固定する。
 */
describe('自由航行（#7）', () => {
  describe('⚠ クリア前は、何をしても日付からの導出のまま', () => {
    /** ⚠ **1周ぶん全部の日**を式と突き合わせる。1日でもずれたら実装の誤り */
    it('自由航行に入るまで、現在地も次も日付だけで決まる', () => {
      const w = new WorldState()
      for (let day = 1; day <= 4 * ROUTE.length * DAYS_PER_PORT; day++) {
        w.setDay(day)
        const portIndex = Math.floor((day - 1) / DAYS_PER_PORT) % ROUTE.length
        expect(w.getLocation()).toEqual({
          island: ROUTE[portIndex],
          next: ROUTE[(portIndex + 1) % ROUTE.length],
          daysLeftAtPort: DAYS_PER_PORT - ((day - 1) % DAYS_PER_PORT),
        })
      }
      expect(w.isFreeSailing()).toBe(false)
    })

    it('クリア前に選ぼうとしても効かない（島順が固定だから先読みが成り立つ・決めたこと1）', () => {
      const w = new WorldState()
      w.setDay(1)
      w.chooseNextPort('ミフユリア')
      expect(w.getLocation().next).toBe('リナツィア')
      expect(w.availableNextPorts()).toEqual([])
      w.setDay(11)
      expect(w.getIsland()).toBe('リナツィア')
    })

    it('セーブに積む航路は null（クリア前は日付だけで足りる）', () => {
      expect(new WorldState().voyageRecord()).toBeNull()
    })
  })

  describe('選べる島', () => {
    it('いま居る島は候補に入らない（1寄港10日は変えない・決めたこと3）', () => {
      for (const island of ROUTE) {
        expect(nextPortCandidates(island)).toHaveLength(ROUTE.length - 1)
        expect(nextPortCandidates(island)).not.toContain(island)
      }
    })

    /** ⚠ **先頭が順どおりの次。**だから「1つも押さない」と「先頭を選ぶ」が同じになる */
    it('候補の先頭は順どおりの次', () => {
      for (const island of ROUTE) {
        expect(nextPortCandidates(island)[0]).toBe(nextInRoute(island))
      }
      expect(nextInRoute('ミフユリア')).toBe('ハルヴェラ')
    })
  })

  describe('自由航行に入ったあと', () => {
    const cleared = (day: number) => {
      const w = new WorldState()
      w.setDay(day)
      w.beginFreeSailing()
      return w
    }

    it('入った瞬間は何も動かない（現在地も次もそのまま）', () => {
      const w = cleared(15)
      expect(w.getLocation()).toEqual({
        island: 'リナツィア', next: 'ノアキータ', daysLeftAtPort: 6,
      })
      expect(w.isFreeSailing()).toBe(true)
    })

    /** ⚠ **受入条件4。**選ばなければ、今までどおりの順で進む */
    it('選ばなければ、何周しても日付からの導出と同じ島を回る', () => {
      const free = cleared(1)
      const fixed = new WorldState()
      for (let day = 1; day <= 3 * ROUTE.length * DAYS_PER_PORT; day++) {
        free.setDay(day)
        fixed.setDay(day)
        expect(free.getLocation()).toEqual(fixed.getLocation())
      }
    })

    /** ⚠ **受入条件3。**選んだ島へ実際に移ること */
    it('選んだ島へ、次の寄港で移る', () => {
      const w = cleared(1)                       // Day1 ハルヴェラ、順どおりの次はリナツィア
      w.chooseNextPort('ミフユリア')
      expect(w.getLocation().next).toBe('ミフユリア')
      expect(w.getIsland()).toBe('ハルヴェラ')   // 滞在中は動かない
      w.setDay(11)
      expect(w.getIsland()).toBe('ミフユリア')
      // 選び直さなければ、そこから先は順どおり（ミフユリアの次はハルヴェラ）
      expect(w.getLocation().next).toBe('ハルヴェラ')
      w.setDay(21)
      expect(w.getIsland()).toBe('ハルヴェラ')
    })

    it('滞在中は何度でも選び直せる（最後に選んだものが効く）', () => {
      const w = cleared(1)
      w.chooseNextPort('ミフユリア')
      w.setDay(5)
      w.chooseNextPort('ノアキータ')
      w.setDay(9)
      expect(w.getLocation().next).toBe('ノアキータ')
      w.setDay(11)
      expect(w.getIsland()).toBe('ノアキータ')
    })

    it('いま居る島は選べない（無視される）', () => {
      const w = cleared(1)
      w.chooseNextPort('ハルヴェラ')
      expect(w.getLocation().next).toBe('リナツィア')
    })

    it('寄港を何回もまたいで進めても、その回数だけ順に移る', () => {
      const w = cleared(1)
      w.setDay(31)   // 3寄港ぶん
      expect(w.getIsland()).toBe('ミフユリア')
    })

    it('滞在日数は日付から出たまま（1寄港10日は変わらない・決めたこと3）', () => {
      const w = cleared(1)
      w.chooseNextPort('ミフユリア')
      w.setDay(11)
      expect(w.getLocation().daysLeftAtPort).toBe(10)
      w.setDay(20)
      expect(w.getLocation().daysLeftAtPort).toBe(1)
    })
  })

  describe('セーブとロード（受入条件5）', () => {
    it('選んだ航路が往復する', () => {
      const w = new WorldState()
      w.setDay(11)
      w.beginFreeSailing()
      w.chooseNextPort('ハルヴェラ')
      const record = w.voyageRecord()
      expect(record).toEqual({ island: 'リナツィア', next: 'ハルヴェラ' })

      const loaded = new WorldState()
      loaded.setDay(11)
      loaded.restoreVoyage(record)
      expect(loaded.getLocation().next).toBe('ハルヴェラ')
      loaded.setDay(21)
      expect(loaded.getIsland()).toBe('ハルヴェラ')
    })

    /** ⚠ **順から外れた島は日付から出せない。**積まないとロードで巻き戻る */
    it('順から外れた現在地も往復する', () => {
      const w = new WorldState()
      w.setDay(1)
      w.beginFreeSailing()
      w.chooseNextPort('ミフユリア')
      w.setDay(11)                       // Day11 は本来リナツィア
      const loaded = new WorldState()
      loaded.setDay(11)
      loaded.restoreVoyage(w.voyageRecord())
      expect(loaded.getIsland()).toBe('ミフユリア')
    })

    /** ⚠ **無いセーブを読んでも落ちないこと**（`orders` ／ `peddler` と同じ） */
    it('航路の無いセーブ（クリア前・#7 より前・壊れたもの）を読んでも落ちない', () => {
      for (const record of [null, undefined, { island: '無い島', next: null }] as never[]) {
        const w = new WorldState()
        w.setDay(23)
        w.restoreVoyage(record)
        expect(w.isFreeSailing()).toBe(false)
        expect(w.getIsland()).toBe('ノアキータ')   // 日付からの導出へ戻る
      }
    })

    it('知らない島が「次」に入っていても落ちず、順どおりに戻る', () => {
      const w = new WorldState()
      w.setDay(1)
      w.restoreVoyage({ island: 'ミフユリア', next: '無い島' } as never)
      expect(w.getLocation()).toMatchObject({ island: 'ミフユリア', next: 'ハルヴェラ' })
    })

    /** ⚠ クリア済みのセーブを読んだあとにクリア前のセーブを読む道 */
    it('航路の無いセーブを読むと、自由航行そのものが解ける', () => {
      const w = new WorldState()
      w.setDay(1)
      w.beginFreeSailing()
      w.chooseNextPort('ミフユリア')
      w.restoreVoyage(null)
      expect(w.isFreeSailing()).toBe(false)
      expect(w.getLocation().next).toBe('リナツィア')
    })
  })
})
