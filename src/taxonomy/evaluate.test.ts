/**
 * Cycle 4 / Phase 3 — 規則評価器のテスト
 *
 * とくに **`店全体`（新機構）**が動くことを確かめる。現行コードには無い機構。
 */

import { describe, it, expect } from 'vitest'
import { ALL_ITEMS } from './items.js'
import { tier, salePrice, purchasePrice, ingredientCost } from './derive.js'
import { ALL_RECIPES } from './recipes.js'
import {
  adjacentPairs, evaluate, finalModifiers, stockedByIslandMerchant,
  type GameState, type Placement,
} from './evaluate.js'

const noSales = new Map<string, number>()
const at = (島: GameState['現在地'], sales = noSales): GameState =>
  ({ 現在地: 島, 累計販売数: sales })

describe('隣接の判定', () => {
  it('辺で接していれば隣接', () => {
    const p: Placement[] = [
      { slotId: 'a', itemId: 'apple', x: 0, y: 0 },   // 1マス
      { slotId: 'b', itemId: 'lemon',  x: 1, y: 0 },   // 1マス
    ]
    expect(adjacentPairs(p)).toHaveLength(1)
  })

  it('斜めは隣接ではない', () => {
    const p: Placement[] = [
      { slotId: 'a', itemId: 'apple', x: 0, y: 0 },
      { slotId: 'b', itemId: 'lemon',  x: 1, y: 1 },
    ]
    expect(adjacentPairs(p)).toHaveLength(0)
  })

  it('複数マスの品は、どの升目が接していても隣接になる', () => {
    const p: Placement[] = [
      { slotId: 'a', itemId: 'salmon', x: 0, y: 0 },  // [[1,1,1]]
      { slotId: 'b', itemId: 'apple',  x: 2, y: 1 },  // 木材の右端の真下
    ]
    expect(adjacentPairs(p)).toHaveLength(1)
  })
})

describe('取り合わせ 層1', () => {
  it('R1 — 食べものと飲みものが隣り合うと、両方の売れやすさが上がる', () => {
    const p: Placement[] = [
      { slotId: 'food',  itemId: 'buckwheat_bread', x: 0, y: 0 },  // 食料
      { slotId: 'drink', itemId: 'grape_wine',  x: 2, y: 0 },  // 飲みもの
    ]
    const r = evaluate(p, at('ハルヴェラ'))
    expect(r.firedRules).toContain('R1')
    // ⚠ 層1 の効き目は**甲にだけ**かかる。R1 は 甲=食料 / 乙=飲みもの なので、
    //   得をするのは食べものの側。R4「贅沢の隣に日用を置くと値が下がる」で
    //   日用品まで値下がりしないのは同じ規則による。→ rules.ts の注記
    expect(r.perSlot.get('food')!.売れやすさ).toBeGreaterThan(1)
    expect(r.perSlot.get('drink')!.売れやすさ).toBe(1)
  })

  it('R4 — 贅沢な品の隣に日用品を置くと、値段が下がる', () => {
    const p: Placement[] = [
      { slotId: 'lux',   itemId: 'grape_wine',  x: 0, y: 0 },  // 贅沢
      { slotId: 'daily', itemId: 'rice', x: 0, y: 2 },  // 日用
    ]
    const r = evaluate(p, at('ハルヴェラ'))
    expect(r.firedRules).toContain('R4')
    expect(r.perSlot.get('lux')!.値段).toBeLessThan(1)
  })

  it('離れて置けば取り合わせは効かない', () => {
    const p: Placement[] = [
      { slotId: 'food',  itemId: 'buckwheat_bread', x: 0, y: 0 },
      { slotId: 'drink', itemId: 'grape_wine',  x: 9, y: 9 },
    ]
    expect(evaluate(p, at('ハルヴェラ')).firedRules).not.toContain('R1')
  })
})

describe('効き目の適用範囲 `店全体`（新機構）', () => {
  it('R5 — 同じ島の産の品を並べると、店全体の集客が上がる', () => {
    const p: Placement[] = [
      { slotId: 'a', itemId: 'rice',  x: 0, y: 0 },   // ノアキータ [[1,1]]
      { slotId: 'b', itemId: 'apple', x: 2, y: 0 },   // ノアキータ [[1]]
      { slotId: 'c', itemId: 'reindeer_meat', x: 9, y: 9 },   // ミフユリア・離れている
    ]
    const r = evaluate(p, at('ハルヴェラ'))
    expect(r.firedRules).toContain('R5')
    expect(r.shopWide.集客).toBeGreaterThan(1)
    // 店全体なので、離れた区画にも同じだけかかる
    expect(finalModifiers(r, 'c').集客).toBe(r.shopWide.集客)
  })

  it('産地が違えば島の棚にならない', () => {
    const p: Placement[] = [
      { slotId: 'a', itemId: 'rice',          x: 0, y: 0 },   // ノアキータ
      { slotId: 'b', itemId: 'reindeer_meat', x: 2, y: 0 },   // ミフユリア
    ]
    expect(evaluate(p, at('ハルヴェラ')).shopWide.集客).toBe(1)
  })

  it('海のもの（産地なし）どうしでは島の棚にならない', () => {
    const p: Placement[] = [
      { slotId: 'a', itemId: 'salt',    x: 0, y: 0 },
      { slotId: 'b', itemId: 'driftwood', x: 1, y: 0 },
    ]
    expect(evaluate(p, at('ハルヴェラ')).shopWide.集客).toBe(1)
  })

  it('島の棚を2つ作ると、店全体の効き目が加算で積む（Q5）', () => {
    const one: Placement[] = [
      { slotId: 'a', itemId: 'rice',  x: 0, y: 0 },
      { slotId: 'b', itemId: 'apple', x: 2, y: 0 },
    ]
    const two: Placement[] = [
      ...one,
      { slotId: 'c', itemId: 'reindeer_meat', x: 0, y: 5 },  // [[1,1],[1,1]]
      { slotId: 'd', itemId: 'rabbit_fur',    x: 2, y: 5 },  // [[1,1]]
    ]
    const r1 = evaluate(one, at('ハルヴェラ')).shopWide.集客
    const r2 = evaluate(two, at('ハルヴェラ')).shopWide.集客
    // 加算合成なので、2つ目の増分は1つ目と同じ
    expect(r2 - 1).toBeCloseTo((r1 - 1) * 2, 10)
  })
})

describe('島の需要（D1）— 需要表4行', () => {
  it('向く土地が今いる島と合う品は売れやすい', () => {
    const p: Placement[] = [{ slotId: 's', itemId: 'reindeer_meat', x: 0, y: 0 }]  // 寒い土地
    const cold = evaluate(p, at('ミフユリア'))
    const warm = evaluate(p, at('ハルヴェラ'))
    expect(cold.firedRules).toContain('D1_ミフユリア')
    expect(cold.perSlot.get('s')!.売れやすさ)
      .toBeGreaterThan(warm.perSlot.get('s')!.売れやすさ)
  })

  it('D2 — よその島の産の品は目に留まる。自分の島の産では効かない', () => {
    const p: Placement[] = [{ slotId: 's', itemId: 'rice', x: 0, y: 0 }]  // ノアキータ産
    expect(evaluate(p, at('ミフユリア')).firedRules).toContain('D2')
    expect(evaluate(p, at('ノアキータ')).firedRules).not.toContain('D2')
  })

  it('海のもの（産地なし）は D2 で得をしない', () => {
    const p: Placement[] = [{ slotId: 's', itemId: 'salt', x: 0, y: 0 }]
    expect(evaluate(p, at('ハルヴェラ')).firedRules).not.toContain('D2')
  })
})

describe('入荷解禁（U1〜U4）', () => {
  it('U3 — 島の商人は、その島を産地とする品を並べる', () => {
    const stocked = stockedByIslandMerchant(ALL_ITEMS, at('ミフユリア'))
    expect(stocked.every(i => i.origin === 'ミフユリア' || i.origin === 'なし')).toBe(true)
    expect(stocked.map(i => i.id)).toContain('reindeer_meat')
  })

  it('U4 — 産地を持たない品は、どの島でも並ぶ', () => {
    for (const island of ['ハルヴェラ', 'リナツィア', 'ノアキータ', 'ミフユリア'] as const) {
      const ids = stockedByIslandMerchant(ALL_ITEMS, at(island)).map(i => i.id)
      expect(ids).toContain('salt')
      expect(ids).toContain('driftwood')
    }
  })

  it('U1 — 並ぶのは素材（tier1）だけ。加工品は作るか、U2 で解禁するしかない', () => {
    const ids = stockedByIslandMerchant(ALL_ITEMS, at('ミフユリア')).map(i => i.id)
    expect(ids).not.toContain('fur_lined_coat')         // tier3
    expect(ids).not.toContain('wool_felt')  // tier2 も並ばない
    expect(ids).toContain('reindeer_meat')             // tier1 は並ぶ
  })

  it('U2 — その品を100個売ると、島の商人が並べるようになる', () => {
    const sold = new Map<string, number>([['fur_lined_coat', 100]])
    const ids = stockedByIslandMerchant(ALL_ITEMS, at('ミフユリア', sold)).map(i => i.id)
    expect(ids).toContain('fur_lined_coat')
  })

  it('U2 の成立条件(a) — 買う方が高い（作れば安く、買えば高い）', () => {
    for (const recipe of ALL_RECIPES) {
      const perUnitCost = ingredientCost(recipe) / recipe.outputQuantity
      expect(purchasePrice(recipe.outputItemId),
        `${recipe.outputItemId}: 仕入れ ${purchasePrice(recipe.outputItemId)} vs 材料費 ${perUnitCost}`,
      ).toBeGreaterThan(perUnitCost)
    }
  })
})

describe('導出', () => {
  it('tier は 1〜4 に収まる（Q2 = A）', () => {
    const tiers = ALL_ITEMS.map(i => tier(i.id))
    expect(Math.min(...tiers)).toBe(1)
    expect(Math.max(...tiers)).toBe(4)
  })

  it('売値はすべて正の整数', () => {
    for (const item of ALL_ITEMS) {
      const p = salePrice(item.id)
      expect(Number.isInteger(p)).toBe(true)
      expect(p).toBeGreaterThan(0)
    }
  })

  it('110品ある（素材50 ＋ 加工品60）', () => {
    expect(ALL_ITEMS).toHaveLength(110)
    expect(ALL_ITEMS.filter(i => i.basePrice !== undefined)).toHaveLength(50)
    expect(ALL_RECIPES).toHaveLength(60)
  })
})
