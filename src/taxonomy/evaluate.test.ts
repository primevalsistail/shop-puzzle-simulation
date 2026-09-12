/**
 * Cycle 4 / Phase 3 — 規則評価器のテスト
 *
 * とくに **店全体ぶん**と、**tier による按分**（方針5・A案）が動くことを確かめる。
 */

import { describe, it, expect } from 'vitest'
import { ALL_ITEMS } from './items.js'
import { tier, salePrice, purchasePrice } from './derive.js'
import { ALL_RECIPES } from './recipes.js'
import {
  adjacentPairs, evaluate, finalModifiers, stockedByIslandMerchant,
  type GameState, type Placement,
} from './evaluate.js'
import { SAME_ORIGIN_RULE, shopWideWeight } from './rules.js'

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

describe('店全体に効く効き目', () => {
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

  it('島の棚を2つ作っても、店全体は濃くならない（平均で積むため）', () => {
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
    // ⚠ **ここは意図的に反転させた。**以前は合計で積んでいたので 2倍になった。
    //   店全体ぶんは**すべての区画に掛かる**ので、合計だと効果の総量が区画数の2乗で伸びる
    //   （実測 13×10 で値段65倍）。**置いてある区画数で割る**ことで区画数に依らなくなる。
    //   → rules.ts `shopWideWeight` の注記
    expect(r2).toBeCloseTo(r1, 10)
  })

  it('店全体ぶんは、店に占める割合で決まる（半分にすると増分も半分）', () => {
    const 全部島の棚: Placement[] = [
      { slotId: 'a', itemId: 'rice',  x: 0, y: 0 },
      { slotId: 'b', itemId: 'apple', x: 2, y: 0 },
    ]
    const 半分だけ: Placement[] = [
      ...全部島の棚,
      { slotId: 'c', itemId: 'reindeer_meat', x: 0, y: 5 },  // ミフユリア・離れている
      { slotId: 'd', itemId: 'salt',          x: 5, y: 5 },  // 産地なし・離れている
    ]
    const r1 = evaluate(全部島の棚, at('ハルヴェラ')).shopWide.集客
    const r2 = evaluate(半分だけ, at('ハルヴェラ')).shopWide.集客
    expect(r2 - 1).toBeCloseTo((r1 - 1) / 2, 10)
  })
})

describe('tier による按分（方針5・A案）', () => {
  it('tier1 の効き目は9割が店全体へ、1割がその区画へ行く', () => {
    // apple（tier1・ノアキータ）と rice（tier1・ノアキータ）で R5 が1回発火する
    const p: Placement[] = [
      { slotId: 'a', itemId: 'rice',  x: 0, y: 0 },
      { slotId: 'b', itemId: 'apple', x: 2, y: 0 },
    ]
    const r = evaluate(p, at('ハルヴェラ'))
    const e = SAME_ORIGIN_RULE.effect.multiplier - 1
    // 店全体は「区画数で割る」ので、2区画なら e × 0.9 ÷ 2
    expect(r.shopWide.集客 - 1).toBeCloseTo(e * 0.9 / 2, 10)
    expect(r.perSlot.get('a')!.集客 - 1).toBeCloseTo(e * 0.1, 10)
  })

  it('tier が深いほど、その区画ぶんが濃くなる（tier1 の0.1 → tier7 の0.9）', () => {
    expect(shopWideWeight(1)).toBeCloseTo(0.9, 10)
    expect(shopWideWeight(4)).toBeCloseTo(0.5, 10)   // PO のグラフの中点
    expect(shopWideWeight(7)).toBeCloseTo(0.1, 10)
    // ⚠ **端でも0にしない。**どの tier でも両方に届く
    expect(shopWideWeight(7)).toBeGreaterThan(0)
    expect(1 - shopWideWeight(1)).toBeGreaterThan(0)
    // tier は 1〜7 の外に出ない（段5 で tier7 まで増やす）
    expect(shopWideWeight(99)).toBe(shopWideWeight(7))
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

// 解禁の条件（U1・U2）は規則データが持つ。場所の条件（U3・U4）は評価器が持つ。
// 軸どうしの比較が条件言語に無いため規則データに書けない（→ issue #31）。
// U4 は 2026-09-07 に rules.ts から削除した（データが一度も読まれていなかったため）。
describe('入荷解禁（解禁 U1・U2 ／ 場所 U3・U4）', () => {
  it('U3（場所・評価器が持つ） — 島の商人は、その島を産地とする品を並べる', () => {
    const stocked = stockedByIslandMerchant(ALL_ITEMS, at('ミフユリア'))
    expect(stocked.every(i => i.origin === 'ミフユリア' || i.origin === 'なし')).toBe(true)
    expect(stocked.map(i => i.id)).toContain('reindeer_meat')
  })

  it('U4（場所・評価器が持つ） — 産地を持たない品は、どの島でも並ぶ', () => {
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

  it('U2 — 出来上がりを買うより、材料を買って作るほうが安く済む', () => {
    // ⚠ 2026-09-12 に検査の中身を変えた。以前は「買値 > 売値（買うと必ず損）」を見ていたが、
    //   その規則は廃止した。いまの土台は「**買値は全品同じ率**」で、そこから
    //   「材料を買って作る < 出来上がりを買う」が自動的に出る。
    //   U2 の「時間を金で買う」は、**損をすることではなく、割高なことで表される。**
    for (const recipe of ALL_RECIPES) {
      const buyMaterials = recipe.ingredients
        .reduce((sum, g) => sum + purchasePrice(g.itemId) * g.quantity, 0) / recipe.outputQuantity
      expect(purchasePrice(recipe.outputItemId),
        `${recipe.outputItemId}: 出来上がりを買う ${purchasePrice(recipe.outputItemId)} vs 材料を買う ${buyMaterials.toFixed(0)}`,
      ).toBeGreaterThan(buyMaterials)
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

  it('122品ある（素材50 ＋ 加工品72）', () => {
    // 110品/60本 → 宿題B で道具10品＋10本 → Phase 4 後に実りの土地を2品＋2本。
    // 素材50は変わらない（追加はすべて tier2 以上の加工品）。
    expect(ALL_ITEMS).toHaveLength(122)
    expect(ALL_ITEMS.filter(i => i.basePrice !== undefined)).toHaveLength(50)
    expect(ALL_RECIPES).toHaveLength(72)
  })
})
