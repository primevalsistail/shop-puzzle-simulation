import { describe, it, expect, beforeEach } from 'vitest'
import { DeliveryOrders, ORDER_QUANTITY } from './DeliveryOrders.js'
import { WorldState } from './WorldState.js'
import { Inventory } from '../economy/Inventory.js'
import { EconomyManager } from '../economy/EconomyManager.js'
import { EventBus } from '../../services/EventBus.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import { stockedByIslandMerchant } from '../../taxonomy/evaluate.js'
import { salePrice, tier } from '../../taxonomy/derive.js'
import type { DeliveryOrder } from './DeliveryOrders.js'

function setup() {
  const inventory = new Inventory()
  const economy = new EconomyManager()
  return { inventory, economy, orders: new DeliveryOrders(inventory, economy) }
}

/** Day1 ＝ ハルヴェラ寄港中。納品先は次の寄港地（リナツィア） */
function world(day = 1): { state: ReturnType<WorldState['getState']>; next: string } {
  const w = new WorldState()
  w.setDay(day)
  return { state: w.getState(), next: w.getLocation().next }
}

describe('DeliveryOrders — 注文の選び方（#28）', () => {
  beforeEach(() => EventBus.removeAllListeners())

  it('注文は「納品先（次の島）の商人が並べない品」からしか出ない', () => {
    const { orders } = setup()
    const { state, next } = world()
    const there = new Set(stockedByIslandMerchant(ALL_ITEMS, { ...state, 現在地: next as never }).map(i => i.id))

    const candidates = orders.candidates(ALL_ITEMS, state, next as never)
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates.every(i => !there.has(i.id))).toBe(true)
  })

  it('注文は「いまの島で買える品」からしか出ない（果たしようのない注文を出さない）', () => {
    const { orders } = setup()
    const { state, next } = world()
    const here = new Set(stockedByIslandMerchant(ALL_ITEMS, state).map(i => i.id))

    expect(orders.candidates(ALL_ITEMS, state, next as never).every(i => here.has(i.id))).toBe(true)
  })

  /**
   * ⚠ U2（100個売ると買えるようになる）で「発注時は買えないが納品時には買える」が起きないこと。
   *   候補が**産地 ＝ 発注元の島**の品に限られるので、納品先では U3 が先に落とす。
   */
  it('候補は産地が発注元の島の品だけになる（U2 で納品先に並ぶようにならない）', () => {
    const { orders } = setup()
    const { state, next } = world()
    const candidates = orders.candidates(ALL_ITEMS, state, next as never)
    expect(candidates.every(i => i.origin === state.現在地)).toBe(true)

    // 100個売って U2 を通したあとでも、納品先の品揃えには入らない
    const sold = new Map(candidates.map(i => [i.id, 1000] as const))
    const there = stockedByIslandMerchant(ALL_ITEMS, { 現在地: next as never, 累計販売数: sold })
    expect(candidates.some(i => there.some(t => t.id === i.id))).toBe(false)
  })

  it('4島どこにいても候補があり、報酬は売値×個数に比例する', () => {
    const { orders } = setup()
    for (const day of [1, 11, 21, 31]) {
      const { state, next } = world(day)
      const order = orders.issue(ALL_ITEMS, state, next as never, day, () => 0)
      expect(order, `Day${day}`).not.toBeNull()
      expect(order!.island).toBe(next)
      expect(order!.quantity).toBe(ORDER_QUANTITY)
      expect(order!.reward).toBe(Math.round(salePrice(order!.itemId) * ORDER_QUANTITY * 3))
      // 候補は素材（tier1）。作り方を知らなくても揃えられる
      expect(tier(order!.itemId)).toBe(1)
    }
  })

  it('注文は1件だけ。次を出すと前のは流れる', () => {
    const { orders } = setup()
    const { state, next } = world()
    const first = orders.issue(ALL_ITEMS, state, next as never, 1, () => 0)!
    const second = orders.issue(ALL_ITEMS, state, next as never, 1, () => 0.99)!
    expect(first.itemId).not.toBe(second.itemId)
    expect(orders.getActive()).toEqual(second)
    expect(orders.toRecord()).toHaveLength(1)
  })
})

describe('DeliveryOrders — 納品の精算', () => {
  beforeEach(() => EventBus.removeAllListeners())

  it('積んであれば納品先で自動的に納まり、報酬が入る', () => {
    const { inventory, economy, orders } = setup()
    const { state, next } = world()
    const order = orders.issue(ALL_ITEMS, state, next as never, 1, () => 0)!
    inventory.add(order.itemId, ORDER_QUANTITY + 3)
    const before = economy.getMoney()

    const result = orders.settleArrival(next as never)

    expect(result).toEqual({ order, delivered: true })
    expect(economy.getMoney()).toBe(before + order.reward)
    expect(inventory.getQuantity(order.itemId)).toBe(3)
    expect(orders.getActive()).toBeNull()
  })

  it('報酬は累計売上に積まれない（客に売れた経路ではない）', () => {
    const { inventory, economy, orders } = setup()
    const { state, next } = world()
    const order = orders.issue(ALL_ITEMS, state, next as never, 1, () => 0)!
    inventory.add(order.itemId, ORDER_QUANTITY)
    const before = economy.getMoney()

    orders.settleArrival(next as never)

    // ⚠ 積むと、進捗バーと目標達成の幕が読む「どれだけ売ったか」が納品ぶん膨らむ
    expect(economy.getTotalRevenue()).toBe(0)
    expect(economy.getMoney()).toBe(before + order.reward)
  })

  it('足りなければ流れるだけ。持ち物も金も動かない（罰なし）', () => {
    const { inventory, economy, orders } = setup()
    const { state, next } = world()
    const order = orders.issue(ALL_ITEMS, state, next as never, 1, () => 0)!
    inventory.add(order.itemId, ORDER_QUANTITY - 1)
    const before = economy.getMoney()

    expect(orders.settleArrival(next as never)!.delivered).toBe(false)
    expect(economy.getMoney()).toBe(before)
    expect(inventory.getQuantity(order.itemId)).toBe(ORDER_QUANTITY - 1)
    expect(orders.getActive()).toBeNull()
  })

  it('納品先でない島に着いても何も起きない', () => {
    const { inventory, economy, orders } = setup()
    const { state, next } = world()
    const order = orders.issue(ALL_ITEMS, state, next as never, 1, () => 0)!
    inventory.add(order.itemId, ORDER_QUANTITY)

    expect(orders.settleArrival('ミフユリア')).toBeNull()
    expect(economy.getMoney()).toBe(5000)
    expect(orders.getActive()).toEqual(order)
  })
})

describe('DeliveryOrders — セーブとロード', () => {
  beforeEach(() => EventBus.removeAllListeners())

  it('セーブを経ても受けている注文が残る', () => {
    const { state, next } = world()
    const a = setup()
    const order = a.orders.issue(ALL_ITEMS, state, next as never, 1, () => 0)!

    // セーブは JSON を通る
    const saved = JSON.parse(JSON.stringify(a.orders.toRecord())) as DeliveryOrder[]
    const b = setup()
    b.orders.restore(saved)

    expect(b.orders.getActive()).toEqual(order)
    // 戻したあとも精算できる
    b.inventory.add(order.itemId, ORDER_QUANTITY)
    expect(b.orders.settleArrival(next as never)!.delivered).toBe(true)
  })

  it('注文が無かった頃のセーブ（undefined）を読める', () => {
    const { orders } = setup()
    orders.restore(undefined)
    expect(orders.getActive()).toBeNull()
    expect(orders.toRecord()).toEqual([])
  })

  it('壊れた注文は読み捨てる', () => {
    const { orders } = setup()
    orders.restore([{ itemId: 42, reward: 'x' } as unknown as DeliveryOrder])
    expect(orders.getActive()).toBeNull()
  })
})
