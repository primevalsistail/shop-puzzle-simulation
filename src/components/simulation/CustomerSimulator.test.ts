import { describe, it, expect } from 'vitest'
import { CustomerSimulator, CUSTOMER_ARRIVAL_RATE, BASE_PURCHASE_PROB } from './CustomerSimulator.js'
import { ItemRegistry } from '../items/ItemRegistry.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import { ALL_RECIPES } from '../../taxonomy/recipes.js'
import type { DisplaySlot } from '../../types/index.js'
import type { EvaluationResult, Modifiers } from '../../taxonomy/evaluate.js'

const reg = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)

const NEUTRAL: Modifiers = { 売れやすさ: 1, 値段: 1, 集客: 1 }

function makeSlot(id: string, itemId: string, qty: number): DisplaySlot {
  const item = reg.getItem(itemId)
  return { id, itemId, shape: item.shape, position: { x: 0, y: 0 }, rotation: 0, quantity: qty }
}

/** 規則をかけた結果を手で組む。規則そのものは taxonomy 側のテストが見る */
function evaluation(
  perSlot: Record<string, Partial<Modifiers>> = {},
  shopWide: Partial<Modifiers> = {},
): EvaluationResult {
  return {
    perSlot: new Map(Object.entries(perSlot).map(([k, v]) => [k, { ...NEUTRAL, ...v }])),
    shopWide: { ...NEUTRAL, ...shopWide },
    firedRules: [],
  }
}

/** 1回目の乱数＝来店判定、2回目以降＝品ごとの購入判定。どちらも必ず通る値 */
function arriveThenBuy(): () => number {
  return () => 0
}

describe('CustomerSimulator', () => {
  const sim = new CustomerSimulator(reg)

  it('顧客が来ないとき売上ゼロ', () => {
    const slot = makeSlot('s1', 'snap_pea', 5)
    expect(sim.simulateMinute([slot], evaluation(), () => 1.0)).toHaveLength(0)
  })

  it('顧客が来て必ず購入するとき売上あり', () => {
    const slot = makeSlot('s1', 'snap_pea', 5)
    const results = sim.simulateMinute([slot], evaluation(), arriveThenBuy())
    expect(results).toHaveLength(1)
    expect(results[0].itemId).toBe('snap_pea')
    expect(results[0].revenue).toBe(reg.salePriceOf('snap_pea'))
  })

  it('quantity=0のスロットは対象外', () => {
    const slot = makeSlot('s1', 'snap_pea', 0)
    expect(sim.simulateMinute([slot], evaluation(), arriveThenBuy())).toHaveLength(0)
  })

  it('値段の倍率で収益が増える', () => {
    const slot = makeSlot('s1', 'snap_pea', 5)
    const results = sim.simulateMinute([slot], evaluation({ s1: { 値段: 2.0 } }), arriveThenBuy())
    expect(results[0].revenue).toBe(reg.finalPriceOf('snap_pea', 2.0))
    expect(results[0].revenue).toBeGreaterThan(reg.salePriceOf('snap_pea'))
  })

  it('加工品では倍率が加工利益にだけ乗る（材料費には乗らない）', () => {
    const slot = makeSlot('s1', 'buckwheat_flour', 5)
    const results = sim.simulateMinute([slot], evaluation({ s1: { 値段: 2.0 } }), arriveThenBuy())
    const plain = reg.salePriceOf('buckwheat_flour')
    expect(results[0].revenue).toBeGreaterThan(plain)
    expect(results[0].revenue).toBeLessThan(plain * 2)
  })

  it('売れやすさは店全体ぶんも掛かる', () => {
    const slot = makeSlot('s1', 'snap_pea', 5)
    // さやえんどうは 上等 ＝ 回転率 0.7。素の購入確率は BASE × 0.7
    const bare = BASE_PURCHASE_PROB * 0.7
    const rngAt = (p: number) => {
      let n = 0
      return () => (++n === 1 ? 0 : p)   // 1回目は必ず来店させる
    }
    // 素のままでは届かないが、売れやすさ 1.5 × 1.5 = 2.25倍 なら届く値を突く
    const between = bare * 1.5
    expect(sim.simulateMinute([slot], evaluation(), rngAt(between))).toHaveLength(0)
    expect(
      sim.simulateMinute([slot], evaluation({ s1: { 売れやすさ: 1.5 } }, { 売れやすさ: 1.5 }), rngAt(between)),
    ).toHaveLength(1)
  })

  it('集客は店全体ぶんが来店判定に効く', () => {
    const slot = makeSlot('s1', 'snap_pea', 5)
    // 素のままでは来ないが、集客 1.5倍なら来る値を突く
    const between = CUSTOMER_ARRIVAL_RATE * 1.2
    const rngAt = (p: number) => {
      let n = 0
      return () => (++n === 1 ? p : 0)
    }
    expect(sim.simulateMinute([slot], evaluation(), rngAt(between))).toHaveLength(0)
    expect(sim.simulateMinute([slot], evaluation({}, { 集客: 1.5 }), rngAt(between))).toHaveLength(1)
  })

  it('複数スロットが存在する場合も正しく処理する', () => {
    const slots = [makeSlot('s1', 'snap_pea', 3), makeSlot('s2', 'sheep_milk', 3)]
    const results = sim.simulateMinute(slots, evaluation(), arriveThenBuy())
    expect(results.length).toBeGreaterThanOrEqual(1)
  })
})
