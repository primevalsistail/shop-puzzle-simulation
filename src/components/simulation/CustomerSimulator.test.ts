import { describe, it, expect } from 'vitest'
import { CustomerSimulator, CUSTOMER_ARRIVAL_RATE, BASE_PURCHASE_PROB } from './CustomerSimulator.js'
import { ItemRegistry } from '../items/ItemRegistry.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import { ALL_RECIPES } from '../../taxonomy/recipes.js'
import type { DisplaySlot } from '../../types/index.js'
import type { EvaluationResult, GameState, Modifiers } from '../../taxonomy/evaluate.js'
import type { CustomerType } from '../../taxonomy/customers.js'
import { CUSTOMER_TYPES, CUSTOMER_ARRIVAL_WEIGHTS } from '../../taxonomy/customers.js'

const reg = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)

const NEUTRAL: Modifiers = { 売れやすさ: 1, 値段: 1, 集客: 1 }

/** 棚は数量を持たない。売れるかどうかは持ち物で決まる */
const stock = new Map<string, number>()
const inventory = { getQuantity: (id: string) => stock.get(id) ?? 0 }

function makeSlot(id: string, itemId: string, qty: number): DisplaySlot {
  const item = reg.getItem(itemId)
  stock.set(itemId, qty)
  return { id, itemId, shape: item.shape, position: { x: 0, y: 0 }, rotation: 0 }
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
  const sim = new CustomerSimulator(reg, inventory)

  it('顧客が来ないとき売上ゼロ', () => {
    const slot = makeSlot('s1', 'snap_pea', 5)
    expect(sim.simulateMinute([slot], evaluation(), () => 1.0).sales).toHaveLength(0)
  })

  it('顧客が来て必ず購入するとき売上あり', () => {
    const slot = makeSlot('s1', 'snap_pea', 5)
    const { sales: results } = sim.simulateMinute([slot], evaluation(), arriveThenBuy())
    expect(results).toHaveLength(1)
    expect(results[0].itemId).toBe('snap_pea')
    expect(results[0].revenue).toBe(reg.salePriceOf('snap_pea'))
  })

  it('quantity=0のスロットは対象外', () => {
    const slot = makeSlot('s1', 'snap_pea', 0)
    expect(sim.simulateMinute([slot], evaluation(), arriveThenBuy()).sales).toHaveLength(0)
  })

  it('値段の倍率で収益が増える', () => {
    const slot = makeSlot('s1', 'snap_pea', 5)
    const { sales: results } = sim.simulateMinute([slot], evaluation({ s1: { 値段: 2.0 } }), arriveThenBuy())
    expect(results[0].revenue).toBe(reg.finalPriceOf('snap_pea', 2.0))
    expect(results[0].revenue).toBeGreaterThan(reg.salePriceOf('snap_pea'))
  })

  it('加工品では倍率が加工利益にだけ乗る（材料費には乗らない）', () => {
    const slot = makeSlot('s1', 'buckwheat_flour', 5)
    const { sales: results } = sim.simulateMinute([slot], evaluation({ s1: { 値段: 2.0 } }), arriveThenBuy())
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
    expect(sim.simulateMinute([slot], evaluation(), rngAt(between)).sales).toHaveLength(0)
    expect(
      sim.simulateMinute([slot], evaluation({ s1: { 売れやすさ: 1.5 } }, { 売れやすさ: 1.5 }), rngAt(between)).sales,
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
    expect(sim.simulateMinute([slot], evaluation(), rngAt(between)).sales).toHaveLength(0)
    expect(sim.simulateMinute([slot], evaluation({}, { 集客: 1.5 }), rngAt(between)).sales).toHaveLength(1)
  })

  it('複数スロットが存在する場合も正しく処理する', () => {
    const slots = [makeSlot('s1', 'snap_pea', 3), makeSlot('s2', 'sheep_milk', 3)]
    const { sales: results } = sim.simulateMinute(slots, evaluation(), arriveThenBuy())
    expect(results.length).toBeGreaterThanOrEqual(1)
  })
})

/**
 * 誰が来たかと、その人の好み（#21）。
 *
 * ⚠ **乱数は順番に意味がある。**1回目＝来店するか、2回目＝誰が来たか、
 *   そのあと＝棚をめくる順（品が1つなら引かない）と、品ごとに買うか。
 */
describe('来店客の年ごろ', () => {
  const sim = new CustomerSimulator(reg, inventory)
  const STATE: GameState = { 現在地: 'ハルヴェラ', 累計販売数: new Map() }

  /** 決めた目を順に返す。尽きたら最後の目を返し続ける */
  function seq(...values: number[]): () => number {
    let n = 0
    return () => values[Math.min(n++, values.length - 1)]
  }

  /** その年ごろを引く目（重みの合計 14 のうち、その人の帯に入る位置） */
  function pickAt(type: CustomerType): number {
    let acc = 0
    const total = CUSTOMER_TYPES.reduce((a, t) => a + CUSTOMER_ARRIVAL_WEIGHTS[t], 0)
    for (const t of CUSTOMER_TYPES) {
      if (t === type) return (acc + 0.5) / total
      acc += CUSTOMER_ARRIVAL_WEIGHTS[t]
    }
    throw new Error(type)
  }

  it('来なかった分は誰も居ない', () => {
    const slot = makeSlot('s1', 'snap_pea', 5)
    expect(sim.simulateMinute([slot], evaluation(), () => 1.0).visitor).toBeNull()
  })

  it('来た分は6通りのどれかが居る', () => {
    const slot = makeSlot('s1', 'snap_pea', 5)
    const { visitor } = sim.simulateMinute([slot], evaluation(), arriveThenBuy())
    expect(CUSTOMER_TYPES).toContain(visitor)
  })

  /**
   * ⚠ **好みが確率に効くこと。**同じ品・同じ配置・同じ目で、
   *   **来た人だけが違うと売れ行きが変わる**（道具は男性 ×1.2 ／ 女性 ×0.8）。
   */
  it('好みが買うかどうかを変える', () => {
    const slot = makeSlot('s1', 'bamboo', 5)              // 道具・日用（回転率 1.0）
    const bare = BASE_PURCHASE_PROB                        // 素の確率
    const between = bare * 1.0                             // 男性は届き、女性は届かない目
    const buyRoll = between * 0.999

    const 男 = sim.simulateMinute([slot], evaluation(), seq(0, pickAt('男性'), buyRoll), undefined, STATE)
    const 女 = sim.simulateMinute([slot], evaluation(), seq(0, pickAt('女性'), buyRoll), undefined, STATE)
    expect(男.visitor).toBe('男性')
    expect(女.visitor).toBe('女性')
    expect(男.sales).toHaveLength(1)
    expect(女.sales).toHaveLength(0)
  })

  /** ⚠ **`state` を渡さない呼び手では好みが効かない**（`src/sim/` の素の比較用） */
  it('店の状態を渡さない分には好みが効かない', () => {
    const slot = makeSlot('s1', 'bamboo', 5)
    const buyRoll = BASE_PURCHASE_PROB * 0.999
    for (const type of ['男性', '女性'] as const) {
      const r = sim.simulateMinute([slot], evaluation(), seq(0, pickAt(type), buyRoll))
      expect(r.sales, type).toHaveLength(1)
    }
  })
})
