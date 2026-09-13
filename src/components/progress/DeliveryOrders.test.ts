import { describe, it, expect, beforeEach } from 'vitest'
import {
  DeliveryOrders, ORDER_QUANTITY, MISSION_CAP, orderQuantity, rollQuantity,
} from './DeliveryOrders.js'
import { WorldState } from './WorldState.js'
import { Inventory } from '../economy/Inventory.js'
import { EconomyManager } from '../economy/EconomyManager.js'
import { EventBus } from '../../services/EventBus.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import { ALL_RECIPES } from '../../taxonomy/recipes.js'
import { ISLANDS } from '../../taxonomy/islands.js'
import { stockedByIslandMerchant } from '../../taxonomy/evaluate.js'
import { salePrice, tier } from '../../taxonomy/derive.js'
import type { DeliveryOrder } from './DeliveryOrders.js'

function setup() {
  const inventory = new Inventory()
  const economy = new EconomyManager()
  return { inventory, economy, orders: new DeliveryOrders(inventory, economy) }
}

/** Day1 ＝ ハルヴェラ寄港中 */
function world(day = 1): ReturnType<WorldState['getState']> {
  const w = new WorldState()
  w.setDay(day)
  return w.getState()
}

/**
 * `rollDaily` が引く順に値を返す。**当たり・先頭の品・個数1・先頭の依頼者**。
 *
 * ⚠ **引く順は 確率 → 品 → 個数 → 依頼者。**`DeliveryOrders.rollDaily` と揃えること。
 */
const ALWAYS = () => 0
/** 必ず外れる（`MISSION_CHANCE` 以上） */
const NEVER = () => 0.99

describe('DeliveryOrders — 1日1件の確率（#98）', () => {
  beforeEach(() => EventBus.removeAllListeners())

  it('当たれば1件増え、外れれば増えない', () => {
    const { orders } = setup()
    expect(orders.rollDaily(ALL_ITEMS, world(), 1, new Set(), ALWAYS)).not.toBeNull()
    expect(orders.list()).toHaveLength(1)

    expect(orders.rollDaily(ALL_ITEMS, world(2), 2, new Set(), NEVER)).toBeNull()
    expect(orders.list()).toHaveLength(1)
  })

  /** ⚠ これが歯止めそのもの。引き直せると欲しい品が出るまでロードできる */
  it('同じ日に2度引かない（外れた日でも引き直せない）', () => {
    const { orders } = setup()
    expect(orders.rollDaily(ALL_ITEMS, world(), 1, new Set(), NEVER)).toBeNull()
    // 同じ日に「当たり」で呼び直しても出ない
    expect(orders.rollDaily(ALL_ITEMS, world(), 1, new Set(), ALWAYS)).toBeNull()
    expect(orders.list()).toHaveLength(0)
    // 日が変われば引ける
    expect(orders.rollDaily(ALL_ITEMS, world(2), 2, new Set(), ALWAYS)).not.toBeNull()
  })

  it('引いた日はセーブに積まれ、戻すと同じ日は引き直せない', () => {
    const a = setup()
    a.orders.rollDaily(ALL_ITEMS, world(), 1, new Set(), ALWAYS)

    const b = setup()
    b.orders.restore(JSON.parse(JSON.stringify(a.orders.toRecord())), a.orders.rolledDay())

    expect(b.orders.rolledDay()).toBe(1)
    expect(b.orders.rollDaily(ALL_ITEMS, world(), 1, new Set(), ALWAYS)).toBeNull()
    expect(b.orders.list()).toHaveLength(1)
  })

  it(`${MISSION_CAP}件たまるとそれ以上増えない。廃棄すると翌日また入る`, () => {
    const { orders } = setup()
    for (let day = 1; day <= MISSION_CAP + 3; day++) {
      orders.rollDaily(ALL_ITEMS, world(day), day, new Set(), ALWAYS)
    }
    expect(orders.list()).toHaveLength(MISSION_CAP)

    orders.discard(orders.list()[0].id)
    expect(orders.list()).toHaveLength(MISSION_CAP - 1)

    const day = MISSION_CAP + 4
    expect(orders.rollDaily(ALL_ITEMS, world(day), day, new Set(), ALWAYS)).not.toBeNull()
    expect(orders.list()).toHaveLength(MISSION_CAP)
  })

  /** ⚠ 上限でも「引いた」ことにしないと、1件納めた直後のロードでその日にもう1件引ける */
  it('上限に達している日も「引いた」ことになる', () => {
    const { orders } = setup()
    for (let day = 1; day <= MISSION_CAP; day++) {
      orders.rollDaily(ALL_ITEMS, world(day), day, new Set(), ALWAYS)
    }
    const day = MISSION_CAP + 1
    orders.rollDaily(ALL_ITEMS, world(day), day, new Set(), ALWAYS)
    expect(orders.rolledDay()).toBe(day)
  })
})

describe('DeliveryOrders — 中身（島は無い・依頼者がいる）', () => {
  beforeEach(() => EventBus.removeAllListeners())

  it('島を持たない（#98 で納品先を無くした）', () => {
    const { orders } = setup()
    const order = orders.rollDaily(ALL_ITEMS, world(), 1, new Set(), ALWAYS)!
    expect(Object.keys(order)).not.toContain('island')
  })

  it('依頼者は四島の商人のいずれか', () => {
    const merchants = ISLANDS.map(i => i.merchant)
    const { orders } = setup()
    for (let day = 1; day <= 8; day++) {
      const order = orders.rollDaily(ALL_ITEMS, world(day), day, new Set(), () => (day % 4) / 4)
      if (order) expect(merchants).toContain(order.client)
    }
  })

  it('4島どこにいても候補があり、報酬は売値×個数×3', () => {
    for (const day of [1, 11, 21, 31]) {
      const { orders } = setup()
      const order = orders.rollDaily(ALL_ITEMS, world(day), day, new Set(), ALWAYS)
      expect(order, `Day${day}`).not.toBeNull()
      expect(order!.reward).toBe(Math.round(salePrice(order!.itemId) * order!.quantity * 3))
      // 作り方を知らない時点の候補は素材（tier1）だけ
      expect(tier(order!.itemId)).toBe(1)
    }
  })

  it('個数は 1〜上限（tier で決まる）のあいだ', () => {
    for (const item of ALL_ITEMS) {
      const max = orderQuantity(item.id)
      expect(rollQuantity(item.id, () => 0)).toBe(1)
      expect(rollQuantity(item.id, () => 0.999)).toBe(max)
      expect(rollQuantity(item.id, () => 0.5)).toBeGreaterThanOrEqual(1)
      expect(rollQuantity(item.id, () => 0.5)).toBeLessThanOrEqual(max)
    }
  })

  it('深い品ほど個数の上限が減る（10個だと作る時間が足りない）', () => {
    const t1 = ALL_ITEMS.find(i => tier(i.id) === 1)!
    const t7 = ALL_ITEMS.find(i => tier(i.id) === 7)!
    expect(orderQuantity(t1.id)).toBe(ORDER_QUANTITY)
    expect(orderQuantity(t7.id)).toBe(1)
    const byTier = [1, 2, 3, 4, 5, 6, 7]
      .map(t => orderQuantity(ALL_ITEMS.find(i => tier(i.id) === t)!.id))
    expect(byTier).toEqual([...byTier].sort((a, b) => b - a))
  })
})

describe('DeliveryOrders — 候補（いまアクセスできる品）', () => {
  beforeEach(() => EventBus.removeAllListeners())

  it('島の商人が並べている品は候補に入る', () => {
    const { orders } = setup()
    const state = world()
    const here = new Set(stockedByIslandMerchant(ALL_ITEMS, state).map(i => i.id))
    const candidates = orders.candidates(ALL_ITEMS, state)
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates.every(i => here.has(i.id))).toBe(true)
  })

  it('作れる品も候補に入る（#85）', () => {
    const { orders } = setup()
    const state = world()
    const narrow = orders.candidates(ALL_ITEMS, state)
    const wide = orders.candidates(ALL_ITEMS, state, new Set(ALL_RECIPES.map(r => r.outputItemId)))

    expect(narrow.every(i => tier(i.id) === 1)).toBe(true)
    expect(wide.length).toBeGreaterThan(narrow.length)
    expect(wide.some(i => tier(i.id) >= 5)).toBe(true)
  })

  it('レシピが解禁されていない加工品は候補に入らない', () => {
    const { orders } = setup()
    expect(orders.candidates(ALL_ITEMS, world(), new Set()).every(i => tier(i.id) === 1)).toBe(true)
  })
})

describe('DeliveryOrders — 納品ボタンと廃棄', () => {
  beforeEach(() => EventBus.removeAllListeners())

  it('手持ちが足りていれば納まり、報酬が入って行が消える', () => {
    const { inventory, economy, orders } = setup()
    const order = orders.rollDaily(ALL_ITEMS, world(), 1, new Set(), ALWAYS)!
    inventory.add(order.itemId, order.quantity + 3)
    const before = economy.getMoney()

    expect(orders.canDeliver(order)).toBe(true)
    expect(orders.deliver(order.id)).toEqual(order)
    expect(economy.getMoney()).toBe(before + order.reward)
    expect(inventory.getQuantity(order.itemId)).toBe(3)
    expect(orders.list()).toHaveLength(0)
  })

  it('報酬は累計売上に積まれない（客に売れた経路ではない）', () => {
    const { inventory, economy, orders } = setup()
    const order = orders.rollDaily(ALL_ITEMS, world(), 1, new Set(), ALWAYS)!
    inventory.add(order.itemId, order.quantity)

    orders.deliver(order.id)

    // ⚠ 積むと、進捗バーと目標達成の幕が読む「どれだけ売ったか」が納品ぶん膨らむ
    expect(economy.getTotalRevenue()).toBe(0)
  })

  it('足りなければ何も起きない（持ち物も金も行も動かない）', () => {
    const { inventory, economy, orders } = setup()
    const order = orders.rollDaily(ALL_ITEMS, world(), 1, new Set(), ALWAYS)!
    inventory.add(order.itemId, order.quantity - 1)
    const before = economy.getMoney()

    expect(orders.canDeliver(order)).toBe(false)
    expect(orders.deliver(order.id)).toBeNull()
    expect(economy.getMoney()).toBe(before)
    expect(inventory.getQuantity(order.itemId)).toBe(order.quantity - 1)
    expect(orders.list()).toHaveLength(1)
  })

  it('廃棄すると行だけ消える（罰なし）', () => {
    const { inventory, economy, orders } = setup()
    const order = orders.rollDaily(ALL_ITEMS, world(), 1, new Set(), ALWAYS)!
    inventory.add(order.itemId, order.quantity)

    expect(orders.discard(order.id)).toEqual(order)
    expect(orders.list()).toHaveLength(0)
    expect(economy.getMoney()).toBe(5000)
    expect(inventory.getQuantity(order.itemId)).toBe(order.quantity)
  })

  it('無い札を指しても何も起きない', () => {
    const { orders } = setup()
    orders.rollDaily(ALL_ITEMS, world(), 1, new Set(), ALWAYS)
    expect(orders.deliver('無い')).toBeNull()
    expect(orders.discard('無い')).toBeNull()
    expect(orders.list()).toHaveLength(1)
  })

  it('札は行ごとに違う（同じ品が2件でも取り違えない）', () => {
    const { orders } = setup()
    for (let day = 1; day <= 5; day++) {
      orders.rollDaily(ALL_ITEMS, world(day), day, new Set(), ALWAYS)
    }
    const ids = orders.list().map(o => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('DeliveryOrders — セーブとロード', () => {
  beforeEach(() => EventBus.removeAllListeners())

  it('セーブを経ても抱えているミッションが残り、納められる', () => {
    const a = setup()
    for (let day = 1; day <= 3; day++) {
      a.orders.rollDaily(ALL_ITEMS, world(day), day, new Set(), ALWAYS)
    }

    // セーブは JSON を通る
    const saved = JSON.parse(JSON.stringify(a.orders.toRecord())) as DeliveryOrder[]
    const b = setup()
    b.orders.restore(saved, a.orders.rolledDay())

    expect(b.orders.list()).toHaveLength(3)
    const order = b.orders.list()[0]
    b.inventory.add(order.itemId, order.quantity)
    expect(b.orders.deliver(order.id)).not.toBeNull()
  })

  it('注文が無かった頃のセーブ（undefined）を読める', () => {
    const { orders } = setup()
    orders.restore(undefined)
    expect(orders.list()).toEqual([])
    expect(orders.rolledDay()).toBe(0)
  })

  /** ⚠ #98 より前のセーブ。`island` があり `client` が無い */
  it('島があった頃のセーブを読める。島は残らず、依頼者が入る', () => {
    const { orders } = setup()
    orders.restore([
      { itemId: 'そら豆', island: 'リナツィア', quantity: 10, reward: 1080, issuedDay: 1 },
    ] as unknown as DeliveryOrder[])

    const order = orders.list()[0]
    expect(order).toBeDefined()
    expect(Object.keys(order)).not.toContain('island')
    expect(ISLANDS.map(i => i.merchant)).toContain(order.client)
  })

  it('壊れた注文は読み捨てる', () => {
    const { orders } = setup()
    orders.restore([
      { itemId: 42, reward: 'x' },
      { itemId: 'そら豆', reward: 100, quantity: 0 },
    ] as unknown as DeliveryOrder[])
    expect(orders.list()).toEqual([])
  })

  it(`${MISSION_CAP}件を超えるセーブは上限までしか読まない`, () => {
    const { orders } = setup()
    const many = Array.from({ length: MISSION_CAP + 5 }, (_, i) => ({
      id: `x${i}`, itemId: 'そら豆', quantity: 1, reward: 100, client: 'サディ', issuedDay: 1,
    })) as unknown as DeliveryOrder[]
    orders.restore(many)
    expect(orders.list()).toHaveLength(MISSION_CAP)
  })
})
