import { describe, it, expect } from 'vitest'
import {
  PeddlerStock, PEDDLER_MAX_KINDS, PEDDLER_MAX_PER_KIND, PEDDLER_MARKUP, peddlerPrice,
} from './PeddlerStock.js'
import { WorldState } from './WorldState.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import { ROUTE } from '../../taxonomy/islands.js'
import type { IslandName } from '../../taxonomy/islands.js'
import { purchasePrice, ORIGIN_DISCOUNT } from '../../taxonomy/derive.js'
import { stockedByPeddler, passesStockGates } from '../../taxonomy/evaluate.js'
import type { GameState } from '../../taxonomy/evaluate.js'

/** 決まった順で数を返す。**同じ種を渡せば同じ品揃えになる**（試験の再現のため） */
function seeded(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function world(day: number): { state: GameState; next: IslandName } {
  const w = new WorldState()
  w.setDay(day)
  return { state: w.getState(), next: w.getLocation().next }
}

function stockAt(day: number, seed = 1): PeddlerStock {
  const { state, next } = world(day)
  const s = new PeddlerStock()
  s.refresh(day, ALL_ITEMS, state, next, seeded(seed))
  return s
}

describe('行商人バレン — 来訪と品揃え（#9 ／ #34 を畳んだ）', () => {
  it('品揃えは1日1回変わる（同じ日に開き直しても変わらない）', () => {
    const { state, next } = world(1)
    const s = new PeddlerStock()
    expect(s.refresh(1, ALL_ITEMS, state, next, seeded(7))).toBe(true)
    const first = s.list().map(e => `${e.itemId}:${e.remaining}`)

    // 同じ日に何度呼んでも引き直さない（画面を開き直しても同じ）
    expect(s.refresh(1, ALL_ITEMS, state, next, seeded(99))).toBe(false)
    expect(s.list().map(e => `${e.itemId}:${e.remaining}`)).toEqual(first)

    // 日が変われば引き直す
    const d2 = world(2)
    expect(s.refresh(2, ALL_ITEMS, d2.state, d2.next, seeded(99))).toBe(true)
    expect(s.getDay()).toBe(2)
  })

  /**
   * ⚠ **日が変わるたび中身が入れ替わること。**入れ替わらないと「毎日来る店」になり、
   *   **欲しい品を待つ／諦めるという判断が消える**（#9 の歯止めそのもの）。
   */
  it('日が変われば中身も入れ替わる', () => {
    const a = stockAt(1, 3).list().map(e => e.itemId).join(',')
    const b = stockAt(2, 4).list().map(e => e.itemId).join(',')
    expect(a).not.toBe(b)
  })

  it('1日10種類の上限を超えない（#9 必須）', () => {
    for (let day = 1; day <= 40; day++) {
      const s = stockAt(day, day)
      expect(s.list().length).toBeLessThanOrEqual(PEDDLER_MAX_KINDS)
      expect(s.list().length).toBeGreaterThan(0)
      // 同じ品を2行出さない（10種類の上限がすり抜けないこと）
      expect(new Set(s.list().map(e => e.itemId)).size).toBe(s.list().length)
    }
  })

  /**
   * ⚠ **個数は乱数にしない**（PO 指示 2026-09-13「初期数量が乱数になっている。100に統一する」）。
   *   **どの品も、どの日も、同じ数で始まる。**
   *   乱数が残っているのは**どの種類を積むか**のほうだけ（上の検査）。
   */
  it('どの品も `PEDDLER_MAX_PER_KIND` 個で始まる（乱数にしない）', () => {
    for (let day = 1; day <= 40; day++) {
      for (const e of stockAt(day, day).list()) {
        expect(e.remaining, `day${day} ${e.itemId}`).toBe(PEDDLER_MAX_PER_KIND)
      }
    }
  })

  /**
   * ⚠ **買ったぶんが減ること。**減らないと、閉じて開き直すだけで何度でも買えて
   *   **1品あたりの数の上限が意味を失う。**
   */
  it('買ったぶんだけ減り、積荷より多くは買えない', () => {
    const s = stockAt(1, 5)
    const { itemId, remaining } = s.list()[0]
    expect(s.take(itemId, remaining + 1)).toBe(false)
    expect(s.remaining(itemId)).toBe(remaining)
    expect(s.take(itemId, remaining)).toBe(true)
    expect(s.remaining(itemId)).toBe(0)
    expect(s.take(itemId, 1)).toBe(false)
    // 積んでいない品は 0
    expect(s.remaining('___no_such_item___')).toBe(0)
  })

  it('産地が「次の寄港地」の品は積まない（島を巡る動機を削らない。#9）', () => {
    for (let day = 1; day <= 40; day++) {
      const { next } = world(day)
      for (const e of stockAt(day, day).list()) {
        expect(ALL_ITEMS.find(i => i.id === e.itemId)!.origin, `day ${day}`).not.toBe(next)
      }
    }
    // 候補の段階でも外れている（引き当ての運に頼らない）
    for (const island of ROUTE) {
      const state: GameState = { 現在地: island, 累計販売数: new Map() }
      const next = ROUTE[(ROUTE.indexOf(island) + 1) % ROUTE.length]
      expect(stockedByPeddler(ALL_ITEMS, state, next).some(i => i.origin === next)).toBe(false)
    }
  })

  /**
   * ⚠ **行商人だけでは品揃えが完成しないこと**（#9 の必須要件）。
   *   行商人だけの解禁を作っていない ＝ **どこかで買える品しか運ばない。**
   */
  it('解禁は島の商人と同じ U1・U2 を通す（行商人だけで買える品を作らない）', () => {
    const state: GameState = { 現在地: 'ハルヴェラ', 累計販売数: new Map() }
    const candidates = stockedByPeddler(ALL_ITEMS, state, 'リナツィア')
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates.every(i => passesStockGates(i, state))).toBe(true)
    // 未解禁（tier2以上で売った実績が無い）の品は1つも運ばない
    expect(candidates.some(i => !passesStockGates(i, state))).toBe(false)
    // 全品を運べるわけではない ＝ 巡る理由が残っている
    expect(candidates.length).toBeLessThan(ALL_ITEMS.length)
  })
})

describe('行商人の値段（#34 —— 割高・少量の調達）', () => {
  /**
   * ⚠ **必ず島の商人より高いこと。**安い経路ができた時点で
   *   「巡るより便利」になり、#9 の必須要件に反する。
   */
  it('どの島のどの品でも、島の商人より高い', () => {
    for (const item of ALL_ITEMS) {
      for (const island of ROUTE) {
        expect(peddlerPrice(item.id), `${item.id}@${island}`)
          .toBeGreaterThan(purchasePrice(item.id, island))
      }
    }
  })

  /**
   * #34 でペルソナ5人全員が付けた歯止め「**産地の 1.5〜2倍**」に収まっていること。
   *
   * ⚠ **率で見る。品ごとの金額で見ない。**買値は1レン単位に丸めるので、
   *   安い品（買値が1桁）では丸めだけで比が 1.71〜2.13 まで振れる。
   *   **決めたのは率であって、丸めた端数ではない。**
   */
  it('産地で買うときの 1.5〜2倍に収まる（率で見る）', () => {
    const ratio = PEDDLER_MARKUP / ORIGIN_DISCOUNT
    expect(ratio).toBeGreaterThanOrEqual(1.5)
    expect(ratio).toBeLessThanOrEqual(2)
    // 産地でない島の商人に対しては、そのまま `PEDDLER_MARKUP` 倍
    expect(PEDDLER_MARKUP).toBeGreaterThan(1)
  })

  /**
   * ⚠ **`purchasePrice()` に引数を足していないこと**（#34 のコメント・main の技術判断）。
   *   足すと `derive.ts` の「その島の中で率は2つだけ」という不変条件が壊れる。
   *   行商人の値段は**島を渡さない買値に割増を掛けたもの**でなければならない。
   */
  it('割増は行商人側で掛けている（島を渡さない買値 × 割増）', () => {
    for (const item of ALL_ITEMS) {
      expect(peddlerPrice(item.id))
        .toBe(Math.round(purchasePrice(item.id) * PEDDLER_MARKUP))
    }
  })
})

describe('行商人 — セーブとロード', () => {
  it('セーブとロードで品揃えと残りが残る', () => {
    const s = stockAt(3, 11)
    s.take(s.list()[0].itemId, 1)
    const record = JSON.parse(JSON.stringify(s.toRecord()))

    const loaded = new PeddlerStock()
    loaded.restore(record)
    expect(loaded.getDay()).toBe(3)
    expect(loaded.list()).toEqual(s.list())

    // 同じ日なら引き直さない（ロードのたびに品揃えが変わらない）
    const { state, next } = world(3)
    expect(loaded.refresh(3, ALL_ITEMS, state, next, seeded(1))).toBe(false)
    expect(loaded.list()).toEqual(s.list())
  })

  /** ⚠ **行商人が無かった頃のセーブは `undefined` で来る**（`orders` と同じ慣行） */
  it('古いセーブ（undefined）を読める。その場合はその日ぶんを引き直す', () => {
    const loaded = new PeddlerStock()
    loaded.restore(undefined)
    expect(loaded.getDay()).toBe(0)
    expect(loaded.list()).toEqual([])

    const { state, next } = world(5)
    expect(loaded.refresh(5, ALL_ITEMS, state, next, seeded(2))).toBe(true)
    expect(loaded.list().length).toBeGreaterThan(0)
  })

  it('壊れたセーブを読んでも上限を超えない', () => {
    const loaded = new PeddlerStock()
    loaded.restore({
      day: 4,
      entries: [
        { itemId: 'apple', remaining: 999 },
        ...Array.from({ length: 20 }, (_, i) => ({ itemId: `x${i}`, remaining: -3 })),
        null as never,
      ],
    })
    expect(loaded.list().length).toBeLessThanOrEqual(PEDDLER_MAX_KINDS)
    expect(loaded.remaining('apple')).toBe(PEDDLER_MAX_PER_KIND)
    expect(loaded.list().every(e => e.remaining >= 0)).toBe(true)
  })
})
