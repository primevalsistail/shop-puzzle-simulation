/**
 * Cycle 4 / Phase 3 — 規則評価器のテスト
 *
 * とくに **店全体ぶん**と、**tier による按分**（方針5・A案）が動くことを確かめる。
 */

import { describe, it, expect } from 'vitest'
import { ALL_ITEMS, getItem } from './items.js'
import {
  tier, salePrice, purchasePrice, originReach, RESCUE_ITEM_ID, isRescueItem,
} from './derive.js'
import { ALL_RECIPES } from './recipes.js'
import {
  adjacentPairs, evaluate, finalModifiers, stockedByIslandMerchant,
  passesStockGates, becameBuyable, salesUntilBuyable, merchantListing,
  handledByIslandMerchant,
  type GameState, type Placement,
} from './evaluate.js'
import { ROUTE } from './islands.js'
import { MAX_TIER, SET_RULES, shopWideWeight, type SetRule } from './rules.js'

/** ⚠ **規則は ID で引かない**（#59 で名指しを解いた）。テストだけが、見たい1本を ID で取り出す */
const ruleOf = (id: string): SetRule => SET_RULES.find(r => r.id === id)!

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

  it('R4 — ⚠ 値が下がるのは贅沢な品だけ。日用品は下がらない（甲乙の非対称）', () => {
    const p: Placement[] = [
      { slotId: 'lux',   itemId: 'grape_wine', x: 0, y: 0 },  // 贅沢
      { slotId: 'daily', itemId: 'rice',       x: 0, y: 2 },  // 日用
    ]
    const r = evaluate(p, at('ハルヴェラ'))
    // ⚠ **`members` が順序のある列であることが、この非対称を持っている唯一の場所。**
    //   集合にすると日用品まで値下がりする（→ rules.ts `SetRule` の注記）
    expect(r.perSlot.get('daily')!.値段).toBe(1)
    // 店全体ぶんも「贅沢な品の tier で按分したぶん」しか無い（1回しか発火していない）
    expect(r.firedRules.filter(id => id === 'R4')).toHaveLength(1)
  })

  it('甲乙の非対称は、規則を足しても保たれる（甲だけが効き目を受ける）', () => {
    const 片側だけ: SetRule = {
      id: 'T1', description: '判定用: 食料の隣に飲みものを置くと、食料だけ値が上がる',
      members: [
        { axis: '主種類', op: '==', value: '食料' },
        { axis: '主種類', op: '==', value: '飲みもの' },
      ],
      adjacent: true,
      effect: { kind: '値段', multiplier: 1.5 },
    }
    const p: Placement[] = [
      { slotId: 'food',  itemId: 'buckwheat_bread', x: 0, y: 0 },
      { slotId: 'drink', itemId: 'grape_wine',      x: 2, y: 0 },
    ]
    const r = evaluate(p, at('ハルヴェラ'), undefined, undefined, [片側だけ])
    expect(r.perSlot.get('food')!.値段).toBeGreaterThan(1)
    expect(r.perSlot.get('drink')!.値段).toBe(1)
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

  it('R5 — 材料を遡って1島に定まる加工品にも効く（#37）', () => {
    const p: Placement[] = [
      { slotId: 'a', itemId: 'buckwheat_flour', x: 0, y: 0 },  // 蕎麦の実だけ → ノアキータ
      { slotId: 'b', itemId: 'rice',            x: 2, y: 0 },  // ノアキータ（素材）
    ]
    const r = evaluate(p, at('ハルヴェラ'))
    expect(r.firedRules).toContain('R5')
    expect(r.shopWide.集客).toBeGreaterThan(1)
  })

  it('材料に産地なしが混ざっても島は定まる（加工品どうしでも島の棚になる。#37）', () => {
    // バターもチーズも 羊の乳（ハルヴェラ）＋ 塩（産地なし）。`なし` は島を足さないだけで消さない
    const p: Placement[] = [
      { slotId: 'a', itemId: 'butter', x: 0, y: 0 },  // [[1]]
      { slotId: 'b', itemId: 'cheese', x: 1, y: 0 },  // [[1,1]]
    ]
    expect(evaluate(p, at('ノアキータ')).firedRules).toContain('R5')
  })

  it('2島以上の材料が混ざる品は、いままでどおり島の棚にならない（#37）', () => {
    // いちごのジャム = いちご（ハルヴェラ）＋ 蜂蜜（リナツィア）→ 行き着く島が2つ
    const p: Placement[] = [
      { slotId: 'a', itemId: 'strawberry_jam', x: 0, y: 0 },
      { slotId: 'b', itemId: 'strawberry',     x: 1, y: 0 },  // ハルヴェラ（素材）
    ]
    expect(evaluate(p, at('ノアキータ')).firedRules).not.toContain('R5')
    expect(evaluate(p, at('ノアキータ')).shopWide.集客).toBe(1)
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

describe('同棚セット（S1・S2。#59）— 隣り合っていなくても効く', () => {
  /** ⚠ **どれも離して置く。**隣接のボーナス（R1〜R6）は1本も発火しない配置 */
  const 離して = (ids: string[]): Placement[] =>
    ids.map((itemId, i) => ({ slotId: `s${i}`, itemId, x: i * 5, y: i * 5 }))

  it('S1 — 奮発する品が3つ揃えば、離れていても値が付く', () => {
    const p = 離して(['snap_pea', 'strawberry', 'mugwort'])   // すべて 上等以上・1升
    const r = evaluate(p, at('ハルヴェラ'))
    expect(r.firedRules).toContain('S1')
    // ⚠ **当たった品それぞれが甲になる。**3つとも値が上がる
    for (const slot of ['s0', 's1', 's2']) {
      expect(finalModifiers(r, slot).値段, slot).toBeGreaterThan(1)
    }
    // 隣接のボーナスは1本も効いていない（離して置いてあるため）
    expect(r.firedRules.some(id => /^R[1-6]$/.test(id))).toBe(false)
  })

  it('S1 — 2つでは揃わない（3つ目が要る）', () => {
    const r = evaluate(離して(['snap_pea', 'strawberry']), at('ハルヴェラ'))
    expect(r.firedRules).not.toContain('S1')
  })

  it('S2 — 同じ土地に向く品が3つ揃えば、離れていても売れやすい', () => {
    const p = 離して(['chili', 'rabbit_fur', 'reindeer_meat'])   // すべて 寒い土地
    expect(evaluate(p, at('ハルヴェラ')).firedRules).toContain('S2')
  })

  it('S2 — 向く土地が揃わなければ効かない（`揃える` は値の一致を見る）', () => {
    const p = 離して(['chili', 'rabbit_fur', 'strawberry'])   // 寒い・寒い・温暖
    expect(evaluate(p, at('ハルヴェラ')).firedRules).not.toContain('S2')
  })

  it('⚠ 同棚セットを足しても、隣接のボーナスは今までどおり効く', () => {
    const p: Placement[] = [
      { slotId: 'food',  itemId: 'buckwheat_bread', x: 0, y: 0 },
      { slotId: 'drink', itemId: 'grape_wine',      x: 2, y: 0 },
    ]
    const r = evaluate(p, at('ハルヴェラ'))
    expect(r.firedRules).toContain('R1')
    expect(r.perSlot.get('food')!.売れやすさ).toBeGreaterThan(1)
  })
})

describe('規則を1本足すのに、評価器を触らなくてよい（#59 の受入条件7）', () => {
  it('同棚の規則を足すと、離れて置いた品に効く', () => {
    const 足した: SetRule = {
      id: 'T2', description: '判定用: 飲みものが2つあれば、離れていても売れやすい',
      members: [
        { axis: '主種類', op: '==', value: '飲みもの' },
        { axis: '主種類', op: '==', value: '飲みもの' },
      ],
      adjacent: false,
      effect: { kind: '売れやすさ', multiplier: 1.5 },
    }
    const p: Placement[] = [
      { slotId: 'a', itemId: 'grape_wine', x: 0, y: 0 },
      { slotId: 'b', itemId: 'grape_wine', x: 9, y: 9 },
    ]
    const r = evaluate(p, at('ハルヴェラ'), undefined, undefined, [足した])
    expect(r.firedRules.filter(id => id === 'T2')).toHaveLength(2)   // 2つとも甲になる
  })

  it('名物コンビ（層2）は同じ器で書ける。品IDを並べるだけ', () => {
    const 名物: SetRule = {
      id: 'SIG_T', description: '判定用: 蕎麦のパンと葡萄酒',
      members: ['buckwheat_bread', 'grape_wine'],
      adjacent: true,
      effect: { kind: '売れやすさ', multiplier: 1.5 },
    }
    const 隣り: Placement[] = [
      { slotId: 'a', itemId: 'buckwheat_bread', x: 0, y: 0 },
      { slotId: 'b', itemId: 'grape_wine',      x: 2, y: 0 },
    ]
    const 離れ: Placement[] = [
      { slotId: 'a', itemId: 'buckwheat_bread', x: 0, y: 0 },
      { slotId: 'b', itemId: 'grape_wine',      x: 9, y: 9 },
    ]
    expect(evaluate(隣り, at('ハルヴェラ'), undefined, undefined, [名物]).firedRules).toContain('SIG_T')
    expect(evaluate(離れ, at('ハルヴェラ'), undefined, undefined, [名物]).firedRules).not.toContain('SIG_T')
  })

  it('入荷解禁を1本足すと、ID を書き足さずに効く（`r.id === \'U1\'` を解いた）', () => {
    const crafted = ALL_ITEMS.find(i => tier(i.id) === 2)!
    // いまの U1・U2 では並ばない品
    expect(passesStockGates(crafted, at('ハルヴェラ'))).toBe(false)
    const 足した = [{
      id: 'U9', description: '判定用: tier2 も並ぶ',
      condition: { axis: 'tier', op: '<=', value: 2 } as const,
      stockedBy: '島の商人' as const,
    }]
    expect(passesStockGates(crafted, at('ハルヴェラ'), 足した)).toBe(true)
  })

  it('⚠ 行商人だけの解禁は作れない（`stockedBy` が読まれている証拠）', () => {
    const crafted = ALL_ITEMS.find(i => tier(i.id) === 2)!
    const 行商人だけ = [{
      id: 'U9', description: '判定用: 行商人だけが並べる',
      condition: { axis: 'tier', op: '<=', value: 2 } as const,
      stockedBy: '行商人バレン' as const,
    }]
    expect(passesStockGates(crafted, at('ハルヴェラ'), 行商人だけ)).toBe(false)
  })

  it('隣接の規則を3件で書くと落ちる（隣り合わせに3件目は無い）', () => {
    const 壊れた: SetRule = {
      id: 'T3', description: '判定用: 隣接なのに3件',
      members: [
        { axis: 'tier', op: '>=', value: 1 },
        { axis: 'tier', op: '>=', value: 1 },
        { axis: 'tier', op: '>=', value: 1 },
      ],
      adjacent: true,
      effect: { kind: '値段', multiplier: 1.1 },
    }
    const p: Placement[] = [
      { slotId: 'a', itemId: 'apple', x: 0, y: 0 },
      { slotId: 'b', itemId: 'lemon', x: 1, y: 0 },
    ]
    expect(() => evaluate(p, at('ハルヴェラ'), undefined, undefined, [壊れた])).toThrow(/2件/)
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
    const e = ruleOf('R5').effect.multiplier - 1
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
  it('向く土地が今いる島と合う品は、その島では高く売れる', () => {
    const p: Placement[] = [{ slotId: 's', itemId: 'reindeer_meat', x: 0, y: 0 }]  // 寒い土地
    const cold = evaluate(p, at('ミフユリア'))
    const warm = evaluate(p, at('ハルヴェラ'))
    expect(cold.firedRules).toContain('D1_ミフユリア')
    // ⚠ **意図的に反転させた（段4-5）。**以前は `売れやすさ` を見ていた。
    //   `売れやすさ` は「何個売れるか」なので効き目がその品の売値に比例し、
    //   プールの平均売値が 259／200／163／129 と2倍開いている今の品では、
    //   1.3倍をもらった側が等倍の側に**絶対額で負ける島が出る**（実測 ハルヴェラで 6〜7%）。
    //   倍率を上げても解けない（129 × 1.4 = 180 < 259 × 1.0 = 259）ので、効き目のほうを変えた。
    //   → aidlc-docs/construction/plans/stage4-persona-review.md
    expect(cold.perSlot.get('s')!.値段)
      .toBeGreaterThan(warm.perSlot.get('s')!.値段)
    // ⚠ 売れやすさで比べないこと。よその島では D2（よその島の産は目に留まる）が別に効くので、
    //   D1 とは無関係に差が付く
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

  it('D2 — 材料を遡って1島に定まる加工品も、よその島では目に留まる（#37）', () => {
    const p: Placement[] = [{ slotId: 's', itemId: 'buckwheat_flour', x: 0, y: 0 }]  // → ノアキータ
    expect(evaluate(p, at('ミフユリア')).firedRules).toContain('D2')
    // 行き着く島が現在地なら「よその島の産」ではない
    expect(evaluate(p, at('ノアキータ')).firedRules).not.toContain('D2')
  })

  it('2島以上の材料が混ざる品は、どの島でも D2 で得をしない（#37）', () => {
    const p: Placement[] = [{ slotId: 's', itemId: 'strawberry_jam', x: 0, y: 0 }]
    for (const island of ROUTE) {
      expect(evaluate(p, at(island)).firedRules, island).not.toContain('D2')
    }
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
  it('tier は 1〜7 に収まる（MAX_TIER。段5 で 4 から伸ばした）', () => {
    // ⚠ **意図的な反転。**以前は「1〜4 に収まる（Q2 = A）」だった。
    //   Q2 = A は Phase 3 時点の「いまは4段しかない」という現状の記述であって、
    //   **4段を上限とする決定ではない。**上限を決めたのは段5 の PO 決定（2026-09-12）で、
    //   **7段**（→ aidlc-docs/construction/plans/max-tier-review.md）。
    //   上限そのものは `rules.ts` の `MAX_TIER` が持ち、深さの検査は depth.test.ts にある。
    const tiers = ALL_ITEMS.map(i => tier(i.id))
    expect(Math.min(...tiers)).toBe(1)
    expect(Math.max(...tiers)).toBe(MAX_TIER)
  })

  it('売値はすべて正の整数', () => {
    for (const item of ALL_ITEMS) {
      const p = salePrice(item.id)
      expect(Number.isInteger(p)).toBe(true)
      expect(p).toBeGreaterThan(0)
    }
  })

  it('162品ある（素材56 ＋ 加工品106）', () => {
    // 110品/60本 → 宿題B で道具10品＋10本 → Phase 4 後に実りの土地を2品＋2本
    // → **段5 で tier5〜7 を13品＋13本**（tier5=7・tier6=4・tier7=2）。
    // → **#86 で素材3品（麻・藍・小麦）＋加工品7品＋レシピ7本。**
    //   **素材が増えたのはここが初めて**（それまでの追加はすべて tier2 以上だった）。
    // → **#87 で素材1品（鉄鉱石）＋加工品8品＋レシピ8本**（魔法の品4・鉄・武器3）。
    // → **#89 で素材1品（粘土）＋加工品6品＋レシピ6本**
    //   （鉄から 包丁・はさみ・鍋・釘 ／ 粘土から 皿・壺）。
    // → **2026-09-15 に救済の品（`砂`）を1品。**レシピは足していない
    //   （**ただで買える唯一の品。**`derive.ts` の `isRescueItem`）。
    expect(ALL_ITEMS).toHaveLength(162)
    expect(ALL_ITEMS.filter(i => i.basePrice !== undefined)).toHaveLength(56)
    expect(ALL_RECIPES).toHaveLength(106)
  })
})

describe('becameBuyable —「買えるようになった」の知らせ（#60）', () => {
  const crafted = ALL_ITEMS.find(i => tier(i.id) >= 2)!
  const material = ALL_ITEMS.find(i => tier(i.id) === 1)!

  it('しきい値をまたいだ瞬間だけ true', () => {
    expect(becameBuyable(crafted, 'ハルヴェラ', 99, 100)).toBe(true)
  })

  it('またぐ前は false', () => {
    expect(becameBuyable(crafted, 'ハルヴェラ', 90, 99)).toBe(false)
  })

  /** ⚠ 生涯1回。毎回流れると log が埋まる */
  it('またいだあとは何度売っても false', () => {
    expect(becameBuyable(crafted, 'ハルヴェラ', 100, 130)).toBe(false)
    expect(becameBuyable(crafted, 'ハルヴェラ', 500, 600)).toBe(false)
  })

  it('一気にまたいでも true', () => {
    expect(becameBuyable(crafted, 'ハルヴェラ', 0, 250)).toBe(true)
  })

  /** 素材は最初から並んでいる（U1）ので、解禁という出来事が起きない */
  it('素材では起きない', () => {
    expect(becameBuyable(material, 'ハルヴェラ', 0, 1000)).toBe(false)
  })

  it('どの島でも同じ（U2 は現在地を読まない）', () => {
    for (const island of ROUTE) {
      expect(becameBuyable(crafted, island, 99, 100)).toBe(true)
    }
  })
})

/**
 * ⚠ **知らせが島に依存しないことの根拠。**
 *   加工品に島の産地が付くと、その島の外では並ばないのに
 *   「並ぶようになった」と知らせてしまう。
 */
describe('tier2以上の産地', () => {
  it('すべて「なし」（どの島でも並ぶ）', () => {
    const withIsland = ALL_ITEMS.filter(i => tier(i.id) >= 2 && i.origin !== 'なし')
    expect(withIsland.map(i => i.display.name)).toEqual([])
  })

  /**
   * ⚠ **材料を遡った産地（#37）はここへ波及させない。**
   *   波及させると「作った品がその島の外では並ばない」ことになり、知らせが島に依存する。
   */
  it('材料を遡って島が付いた加工品も、どの島でも並ぶ（場所の条件は品の産地を見る）', () => {
    const flour = ALL_ITEMS.find(i => i.id === 'buckwheat_flour')!
    expect(originReach(flour)).toBe('ノアキータ')   // R5・D2 にはノアキータとして当たる
    const sold = new Map([[flour.id, 1000]])        // U2 を通しておく
    for (const island of ROUTE) {
      const ids = stockedByIslandMerchant(ALL_ITEMS, at(island, sold)).map(i => i.id)
      expect(ids, island).toContain(flour.id)
    }
  })
})

/**
 * **材料を遡った産地**（#37）。R5・D2 が自分で作った品にも当たるようにするための導出。
 * → derive.ts `originReach`
 */
describe('材料を遡った産地（#37）', () => {
  const reach = (id: string): string => originReach(ALL_ITEMS.find(i => i.id === id)!)

  it('素材は自分の産地そのもの（素材の当たり方は変わっていない）', () => {
    for (const item of ALL_ITEMS.filter(i => tier(i.id) === 1)) {
      expect(originReach(item), item.id).toBe(item.origin)
    }
  })

  it('行き着く島が1つに定まればその島。産地なしの材料は島を足さない', () => {
    expect(reach('buckwheat_flour')).toBe('ノアキータ')   // 蕎麦の実だけ
    expect(reach('butter')).toBe('ハルヴェラ')            // 羊の乳（ハルヴェラ）＋ 塩（なし）
  })

  it('2島以上が混ざれば「なし」（当たらない側に落ちる）', () => {
    expect(reach('strawberry_jam')).toBe('なし')          // いちご ＋ 蜂蜜
  })

  it('1段上の材料ではなく、素材まで遡る', () => {
    // 包丁 = 鉄 ＋ 白樺。**1段上だけ見ると**島を持つ材料は白樺（ミフユリア）だけに見えるが、
    // 鉄が2島（鉄鉱石・松の薪）に行き着くので**包丁は「なし」**
    expect(reach('birch')).toBe('ミフユリア')
    expect(reach('iron')).toBe('なし')
    expect(reach('kitchen_knife')).toBe('なし')
  })

  it('当たる品の数は、素材だけだったころより増えている（加工品にも当たる）', () => {
    const 当たる = ALL_ITEMS.filter(i => originReach(i) !== 'なし')
    const 素材だけ = ALL_ITEMS.filter(i => i.origin !== 'なし')
    expect(当たる.length).toBeGreaterThan(素材だけ.length)
    // 素材は1品も落ちない（増える方向にしか動かない）
    for (const item of 素材だけ) expect(当たる, item.id).toContain(item)
  })

  /** ⚠ **売値に効かせない。**産地割引は品に書いてある産地のまま（→ derive.ts `ORIGIN_DISCOUNT`） */
  it('売値・仕入れ値には効かない', () => {
    const id = 'buckwheat_flour'            // 材料を遡るとノアキータ
    const 素の買値 = purchasePrice(id)
    for (const island of ROUTE) {
      expect(purchasePrice(id, island), island).toBe(素の買値)   // どの島でも割引が乗らない
    }
  })
})

describe('passesStockGates — 場所の条件を見ない', () => {
  const material = ALL_ITEMS.find(i => tier(i.id) === 1)!
  const crafted = ALL_ITEMS.find(i => tier(i.id) >= 2)!

  it('素材は現在地に関わらず通る（U1）', () => {
    for (const island of ROUTE) expect(passesStockGates(material, at(island))).toBe(true)
  })

  it('売っていない加工品は通らない（U2 の手前）', () => {
    expect(passesStockGates(crafted, at('ミフユリア'))).toBe(false)
  })

  it('売った数が届けば通る', () => {
    expect(passesStockGates(crafted, at('ミフユリア', new Map([[crafted.id, 100]])))).toBe(true)
  })
})

/**
 * **あと何個売れば買えるようになるか**（#66）。
 *
 * ⚠ **しきい値（100）をテストにも書き写さない。**`becameBuyable` が
 *   「またいだ瞬間だけ true」であることを使い、**規則から出した残りと突き合わせる。**
 */
describe('salesUntilBuyable —「あとN個」（#66）', () => {
  const crafted = ALL_ITEMS.find(i => tier(i.id) >= 2)!
  const material = ALL_ITEMS.find(i => tier(i.id) === 1)!

  it('すでに並んでいる品は 0', () => {
    expect(salesUntilBuyable(material, 'ハルヴェラ', 0)).toBe(0)
  })

  /** ⚠ **画面へ書き写した数ではなく、規則を評価して出した数であることの検査** */
  it('出した残りだけ売ると、ちょうど並ぶようになる', () => {
    for (const sold of [0, 1, 37, 99]) {
      const left = salesUntilBuyable(crafted, 'ハルヴェラ', sold)!
      expect(left).toBeGreaterThan(0)
      // 残りだけ売れば「並ぶようになった」が起きる
      expect(becameBuyable(crafted, 'ハルヴェラ', sold, sold + left)).toBe(true)
      // 1個手前では、まだ起きない
      expect(becameBuyable(crafted, 'ハルヴェラ', sold, sold + left - 1)).toBe(false)
    }
  })

  it('売るほど残りが1ずつ減る', () => {
    const a = salesUntilBuyable(crafted, 'ハルヴェラ', 10)!
    const b = salesUntilBuyable(crafted, 'ハルヴェラ', 11)!
    expect(a - b).toBe(1)
  })

  it('届いたあとは 0 のまま', () => {
    const left = salesUntilBuyable(crafted, 'ハルヴェラ', 0)!
    expect(salesUntilBuyable(crafted, 'ハルヴェラ', left)).toBe(0)
    expect(salesUntilBuyable(crafted, 'ハルヴェラ', left + 500)).toBe(0)
  })

  it('どの島でも同じ（U2 は現在地を読まない）', () => {
    const left = salesUntilBuyable(crafted, ROUTE[0], 0)
    for (const island of ROUTE) expect(salesUntilBuyable(crafted, island, 0)).toBe(left)
  })
})

/**
 * **商人のところに出す行**（#66）。
 * **買えるもの ＋ もうすぐ買えるもの**（PO 決定 2026-09-13）。
 */
describe('merchantListing — 買えるもの ＋ もうすぐ買えるもの（#66）', () => {
  const crafted = ALL_ITEMS.find(i => tier(i.id) >= 2)!
  const everything = () => true
  const nothing = () => false

  it('一度手にした U2 待ちの品が、もうすぐ買える側に出る', () => {
    const { upcoming } = merchantListing(ALL_ITEMS, at('ハルヴェラ'), everything)
    const row = upcoming.find(u => u.item.id === crafted.id)
    expect(row).toBeDefined()
    expect(row!.salesLeft).toBe(salesUntilBuyable(crafted, 'ハルヴェラ', 0))
  })

  /** ⚠ **手にしたことのない品は出さない。**出すと商人の一覧が未見の品のカタログになる */
  it('一度も手にしていない品は、どちらにも出ない', () => {
    const { stocked, upcoming } = merchantListing(ALL_ITEMS, at('ハルヴェラ'), nothing)
    expect(upcoming).toHaveLength(0)
    // 買える側（U1 の素材）は everHeld に関わらず出る
    expect(stocked.length).toBeGreaterThan(0)
    expect(stocked.some(i => tier(i.id) >= 2)).toBe(false)
  })

  /**
   * ⚠ **買う操作は `stocked` にしか無い**（`PurchaseMenu` は `upcoming` の行に
   *   買う部品をそもそも作らない）。**同じ品が両側に出ないこと**がその前提。
   */
  it('もうすぐ買える品は、買える側に入っていない', () => {
    const { stocked, upcoming } = merchantListing(ALL_ITEMS, at('ハルヴェラ'), everything)
    const stockedIds = new Set(stocked.map(i => i.id))
    for (const u of upcoming) {
      expect(stockedIds.has(u.item.id)).toBe(false)
      expect(passesStockGates(u.item, at('ハルヴェラ'))).toBe(false)
      expect(u.salesLeft).toBeGreaterThan(0)
    }
  })

  /** ⚠ **その島に並びようのない品に「あとN個」を出すと嘘になる**（U3・U4） */
  it('その島の商人が扱わない品は、もうすぐ買える側にも出ない', () => {
    for (const island of ROUTE) {
      const { upcoming } = merchantListing(ALL_ITEMS, at(island), everything)
      for (const u of upcoming) {
        expect(handledByIslandMerchant(u.item, at(island))).toBe(true)
      }
    }
  })

  it('売って届いた品は、買える側へ移る', () => {
    const left = salesUntilBuyable(crafted, 'ハルヴェラ', 0)!
    const sold = new Map([[crafted.id, left]])
    const { stocked, upcoming } = merchantListing(ALL_ITEMS, at('ハルヴェラ', sold), everything)
    expect(stocked.some(i => i.id === crafted.id)).toBe(true)
    expect(upcoming.some(u => u.item.id === crafted.id)).toBe(false)
  })

  /** 買える側は、これまでどおり `stockedByIslandMerchant` と同じ */
  it('買える側は、これまでの品揃えと変わらない', () => {
    for (const island of ROUTE) {
      const { stocked } = merchantListing(ALL_ITEMS, at(island), everything)
      expect(stocked.map(i => i.id))
        .toEqual(stockedByIslandMerchant(ALL_ITEMS, at(island)).map(i => i.id))
    }
  })
})

/**
 * **救済の品（砂）**（PO 判断 2026-09-15）。
 *
 * **詰みを無くすために、ただで買える品を1つ置いた。**ここで見るのは
 * **所持金0でも買って並べて売れること**と、**買値0 の例外が1品のままであること。**
 *
 * ⚠ **1日に買える数の上限は無い**（PO 判断 2026-09-15 で外した）。
 *   **1つの品は棚に1区画まで**（`PlacementManager.isDisplayed`）なので、
 *   **ただで買えても盤面は埋まらない** —— 天井は **1升 × 5.4個/日 × 5レン ＝ 27レン/日**。
 *   （**加工の稼ぎを超えないこと**は `src/sim/` の `--policy=rescue` で測る。）
 */
describe('救済の品（買値0・上限なし）', () => {
  it('品が1つだけあり、tier1・1升・売値5レンである', () => {
    const item = getItem(RESCUE_ITEM_ID)
    expect(ALL_ITEMS.filter(i => isRescueItem(i.id))).toHaveLength(1)
    expect(tier(item.id)).toBe(1)
    expect(item.shape).toEqual([[1]])
    expect(salePrice(item.id)).toBe(5)
    // ⚠ **いちばん安い仕入れ品よりはっきり下**（「店に並べたくない」水準。PO 指示）
    const cheapest = Math.min(
      ...ALL_ITEMS.filter(i => !isRescueItem(i.id)).map(i => salePrice(i.id)),
    )
    expect(salePrice(item.id)).toBeLessThan(cheapest)
  })

  /**
   * **所持金0でも、買って並べて売れる。**
   *
   * ⚠ **規則を1本も足していない。**産地 `なし` ＋ tier1 なので、
   *   **U4（産地を持たない品はどこでも並ぶ）と U1（並ぶのは素材だけ）だけで常に並ぶ。**
   */
  it('4島すべてで、売った実績ゼロでも商人が並べている', () => {
    for (const island of ROUTE) {
      const stocked = stockedByIslandMerchant(ALL_ITEMS, at(island))
      expect(stocked.map(i => i.id), island).toContain(RESCUE_ITEM_ID)
    }
  })

  /**
   * ⚠ **例外は買値だけ。**「率が3つ目に増えた」ではないことの検査
   *   （`derive.ts` の `PURCHASE_RATE` の注記）。
   */
  it('買値0 はこの品だけ。ほかの全品は今までどおり 売値 × 0.7', () => {
    expect(purchasePrice(RESCUE_ITEM_ID)).toBe(0)
    for (const island of ROUTE) {
      expect(purchasePrice(RESCUE_ITEM_ID, island), island).toBe(0)
    }
    const free = ALL_ITEMS.filter(i => purchasePrice(i.id) === 0)
    expect(free.map(i => i.id)).toEqual([RESCUE_ITEM_ID])
  })
})
