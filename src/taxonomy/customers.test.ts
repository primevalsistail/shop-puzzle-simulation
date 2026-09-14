import { describe, it, expect } from 'vitest'
import {
  CUSTOMER_TYPES, CUSTOMER_ARRIVAL_WEIGHTS, arrivalShare, pickCustomerType, preferenceMultiplier,
} from './customers.js'
import { CUSTOMER_PREFERENCE_RULES } from './rules.js'
import type { ItemDef } from './axes.js'
import { ALL_ITEMS } from './items.js'
import type { GameState } from './evaluate.js'

const STATE: GameState = { 現在地: 'ハルヴェラ', 累計販売数: new Map() }

describe('来店客の好み（#21）', () => {
  it('6通りすべてに好みがある（誰か1人だけ素通しにしない）', () => {
    for (const type of CUSTOMER_TYPES) {
      const mine = CUSTOMER_PREFERENCE_RULES.filter(r => r.customerType === type)
      expect(mine.length, type).toBeGreaterThan(0)
    }
  })

  /**
   * ⚠ **INV-4「規則はアイテムを知らない」。**好みも同じ縛りに入る。
   *   **品の名前で書き始めると、品が増えるたびに規則が増える。**
   */
  it('好みの規則に品の名前が現れない', () => {
    const ids = new Set(ALL_ITEMS.map(i => i.id))
    const written = JSON.stringify(CUSTOMER_PREFERENCE_RULES)
    for (const id of ids) expect(written, id).not.toContain(`"${id}"`)
  })

  /**
   * ⚠ **これが受入条件。**好みは「誰が来たかの揺れ」であって、**店の売上の底上げではない。**
   *
   * **品ひとつずつで見る。**来る割合で重みを付けた平均が、**どの品でも 1.0** であること。
   * ⚠ **全品をならした平均が 1.0 でも足りない。**それだと
   *   **「贅沢な品だけ平均 0.75」のような偏りが残り、並べる品で店全体の売上が動く。**
   *   **実測**: 偏りを残した版は、深い品を作る遊び方で **200日の売上が 1割落ちた。**
   */
  it('どの品でも、来る割合で重みを付けた平均が 1.0（並べる品で総量が動かない）', () => {
    for (const item of ALL_ITEMS) {
      const avg = CUSTOMER_TYPES.reduce((a, t) => a + arrivalShare(t) * preferenceMultiplier(t, item, STATE), 0)
      expect(avg, item.id).toBeGreaterThan(0.99)
      expect(avg, item.id).toBeLessThan(1.01)
    }
  })

  /**
   * ⚠ **好む人と控える人を対にすること。**片側だけ書くと、その軸の品が静かに売れなくなる。
   */
  it('好まれる軸の値には、控える人もいる', () => {
    const 軸の値: [string, (i: ItemDef) => boolean][] = [
      ['食料', i => i.mainKind === '食料'], ['飲みもの', i => i.mainKind === '飲みもの'],
      ['道具', i => i.mainKind === '道具'], ['衣類', i => i.mainKind === '衣類'],
      ['日用', i => i.luxury === '日用'], ['贅沢', i => i.luxury === '贅沢'],
    ]
    for (const [name, hit] of 軸の値) {
      const item = ALL_ITEMS.find(hit)!
      const ms = CUSTOMER_TYPES.map(t => preferenceMultiplier(t, item, STATE))
      expect(Math.max(...ms), name).toBeGreaterThan(1)
      expect(Math.min(...ms), name).toBeLessThan(1)
    }
  })

  /**
   * ⚠ **年ごろごとの平均は 1.0 でなくてよい**（子ども 0.90 ／ 女性 1.08）。**それが性格。**
   *   **総量を守るのは上の「品ひとつずつ 1.0」であって、ここではない。**
   *   ただし**何も買わない年ごろ**が出ると、その人が立った分だけ店が止まって見える。
   */
  it('どの年ごろも、店の品をひととおりは買う', () => {
    for (const type of CUSTOMER_TYPES) {
      const mine = ALL_ITEMS.map(i => preferenceMultiplier(type, i, STATE))
      const avg = mine.reduce((a, b) => a + b, 0) / mine.length
      expect(avg, type).toBeGreaterThan(0.85)
      expect(avg, type).toBeLessThan(1.15)
    }
  })

  it('倍率は0を下回らない（買う確率が負にならない）', () => {
    for (const type of CUSTOMER_TYPES) {
      for (const item of ALL_ITEMS) {
        expect(preferenceMultiplier(type, item, STATE), `${type}/${item.id}`).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('子どもは食べものに寄り、奮発する品からは離れる', () => {
    const 食料の上等 = ALL_ITEMS.find(i => i.mainKind === '食料' && i.luxury === '上等')!
    const 贅沢 = ALL_ITEMS.find(i => i.luxury === '贅沢')!
    expect(preferenceMultiplier('男子', 食料の上等, STATE)).toBeGreaterThan(1)
    expect(preferenceMultiplier('男子', 贅沢, STATE)).toBeLessThan(1)
    // ⚠ **その贅沢な品を買うのは働き盛り**（子どもが控えるぶんを受ける側）
    expect(preferenceMultiplier('男性', 贅沢, STATE)).toBeGreaterThan(1)
  })
})

describe('誰が来るか', () => {
  it('おとなが主で、子どもはたまに来る', () => {
    expect(CUSTOMER_ARRIVAL_WEIGHTS.男性).toBeGreaterThan(CUSTOMER_ARRIVAL_WEIGHTS.老人男性)
    expect(CUSTOMER_ARRIVAL_WEIGHTS.老人男性).toBeGreaterThan(CUSTOMER_ARRIVAL_WEIGHTS.男子)
  })

  it('割合の合計は1', () => {
    const sum = CUSTOMER_TYPES.reduce((a, t) => a + arrivalShare(t), 0)
    expect(sum).toBeCloseTo(1, 10)
  })

  /** ⚠ **端（0 と 1 の直前）で誰も引けない、が起きないこと** */
  it('どの目でも6通りのどれかを引く', () => {
    for (const p of [0, 0.0001, 0.3, 0.5, 0.9, 0.999999]) {
      expect(CUSTOMER_TYPES).toContain(pickCustomerType(() => p))
    }
  })

  it('引く割合が重みどおりになる', () => {
    const count = new Map<string, number>()
    const N = 14000
    for (let i = 0; i < N; i++) {
      const t = pickCustomerType(() => (i + 0.5) / N)   // 一様に舐める
      count.set(t, (count.get(t) ?? 0) + 1)
    }
    for (const type of CUSTOMER_TYPES) {
      expect((count.get(type) ?? 0) / N, type).toBeCloseTo(arrivalShare(type), 2)
    }
  })
})
