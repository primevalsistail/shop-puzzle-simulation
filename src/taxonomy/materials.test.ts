import { describe, it, expect } from 'vitest'
import { expandToMaterials, materialNeeds } from './materials.js'
import type { RecipeDef } from './axes.js'
import { ALL_RECIPES } from './recipes.js'
import { ALL_ITEMS } from './items.js'
import { ROUTE } from './islands.js'

/** 小麦 → 生地 → パン。パンとサンドイッチが同じ素材を共有する */
const RECIPES: RecipeDef[] = [
  {
    id: 'r_dough', display: { name: '生地' }, outputItemId: 'dough', outputQuantity: 1,
    ingredients: [{ itemId: 'wheat', quantity: 2 }, { itemId: 'water', quantity: 1 }],
    durationMinutes: 10,
  },
  {
    id: 'r_bread', display: { name: 'パン' }, outputItemId: 'bread', outputQuantity: 1,
    ingredients: [{ itemId: 'dough', quantity: 3 }],
    durationMinutes: 20,
  },
  {
    id: 'r_sand', display: { name: 'サンド' }, outputItemId: 'sandwich', outputQuantity: 1,
    ingredients: [{ itemId: 'bread', quantity: 1 }, { itemId: 'ham', quantity: 2 }],
    durationMinutes: 5,
  },
]

describe('expandToMaterials — 素材まで潜る', () => {
  it('作れない品はそれ自身が素材', () => {
    expect([...expandToMaterials('wheat', RECIPES)]).toEqual([['wheat', 1]])
  })

  it('1段潜る', () => {
    expect([...expandToMaterials('dough', RECIPES)].sort())
      .toEqual([['water', 1], ['wheat', 2]])
  })

  it('数は掛け算で積み上がる（パン = 生地3 = 小麦6・水3）', () => {
    const m = expandToMaterials('bread', RECIPES)
    expect(m.get('wheat')).toBe(6)
    expect(m.get('water')).toBe(3)
  })

  it('3段潜っても積み上がる', () => {
    const m = expandToMaterials('sandwich', RECIPES)
    expect(m.get('wheat')).toBe(6)
    expect(m.get('ham')).toBe(2)
    expect(m.has('bread')).toBe(false)  // 作れるので素材ではない
  })

  /**
   * ⚠ **これが #33 の肝。**作り方を知らない品は買うしかないので、
   *   そこで展開を止めないと「作れば済む」ことになって不足が消える。
   */
  it('作り方を知らない品は、そこで止めて素材に数える', () => {
    const knownOnly = RECIPES.filter(r => r.id !== 'r_dough')  // 生地の作り方を知らない
    const m = expandToMaterials('bread', knownOnly)
    expect(m.get('dough')).toBe(3)
    expect(m.has('wheat')).toBe(false)
  })

  it('輪になっていても止まる', () => {
    const looped: RecipeDef[] = [
      { id: 'a', display: { name: 'A' }, outputItemId: 'a', outputQuantity: 1,
        ingredients: [{ itemId: 'b', quantity: 1 }], durationMinutes: 1 },
      { id: 'b', display: { name: 'B' }, outputItemId: 'b', outputQuantity: 1,
        ingredients: [{ itemId: 'a', quantity: 1 }], durationMinutes: 1 },
    ]
    expect(() => expandToMaterials('a', looped)).not.toThrow()
  })
})

describe('materialNeeds — 本数と数', () => {
  it('本数は「その素材を要するレシピの数」', () => {
    const needs = materialNeeds(RECIPES)
    // 小麦は 生地・パン・サンド の3本が要する
    expect(needs.get('wheat')?.recipes).toBe(3)
    // ハムはサンドだけ
    expect(needs.get('ham')?.recipes).toBe(1)
  })

  it('数は「1回ずつ作るのに要る数」', () => {
    const needs = materialNeeds(RECIPES)
    // 生地 2 ＋ パン 6 ＋ サンド 6 = 14
    expect(needs.get('wheat')?.quantity).toBe(14)
  })

  it('作れる品そのものは素材に入らない', () => {
    const needs = materialNeeds(RECIPES)
    expect(needs.has('dough')).toBe(false)
    expect(needs.has('bread')).toBe(false)
  })

  it('レシピが1本も無ければ空', () => {
    expect(materialNeeds([]).size).toBe(0)
  })
})

/**
 * **画面に収まるかを実データで見る。**
 * 島ごとの素材が多すぎると、一覧が「全部足りない」になって読めなくなる。
 */
describe('実データ（135品 / 85レシピ）', () => {
  const needs = materialNeeds(ALL_RECIPES)
  const byId = new Map(ALL_ITEMS.map(i => [i.id, i]))

  it('どの島も、その島でしか買えない素材は 15種を超えない', () => {
    for (const island of ROUTE) {
      const mats = [...needs.keys()].filter(id => byId.get(id)?.origin === island)
      expect(mats.length).toBeGreaterThan(0)
      expect(mats.length).toBeLessThanOrEqual(15)
    }
  })

  it('素材はすべて実在する品', () => {
    for (const id of needs.keys()) expect(byId.has(id)).toBe(true)
  })

  /** ⚠ 本数は画面に出す。3桁になると行に収まらない */
  it('本数がレシピの総数を超えない', () => {
    for (const need of needs.values()) {
      expect(need.recipes).toBeGreaterThan(0)
      expect(need.recipes).toBeLessThanOrEqual(ALL_RECIPES.length)
    }
  })
})

/**
 * ⚠ **85本中59本が `outputQuantity` 2個以上。**
 *   割らずに数えると、要る素材を段ごとに最大4倍に見積もる。
 */
describe('1回で複数できるレシピ', () => {
  const BATCH: RecipeDef[] = [
    {
      id: 'r_dough2', display: { name: '生地' }, outputItemId: 'dough', outputQuantity: 2,
      ingredients: [{ itemId: 'wheat', quantity: 2 }], durationMinutes: 10,
    },
    {
      id: 'r_bread2', display: { name: 'パン' }, outputItemId: 'bread', outputQuantity: 1,
      ingredients: [{ itemId: 'dough', quantity: 3 }], durationMinutes: 20,
    },
  ]

  it('1個あたりで割る（生地1個 = 小麦1）', () => {
    expect(expandToMaterials('dough', BATCH).get('wheat')).toBe(1)
  })

  it('親も割ったぶんで積む（パン1個 = 生地3 = 小麦3）', () => {
    expect(expandToMaterials('bread', BATCH).get('wheat')).toBe(3)
  })

  it('materialNeeds は1回ぶん（出来高）に戻す', () => {
    const needs = materialNeeds(BATCH)
    // 生地の1回 = 小麦2 ／ パンの1回 = 小麦3 → 合計5
    expect(needs.get('wheat')?.quantity).toBe(5)
  })
})
