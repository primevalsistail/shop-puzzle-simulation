/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import panelSource from './InventoryPanel.ts?raw'
import { CustomerSimulator } from '../components/simulation/CustomerSimulator.js'
import { ItemRegistry } from '../components/items/ItemRegistry.js'
import { Upgrades } from '../components/progress/Upgrades.js'
import { ALL_ITEMS } from '../taxonomy/items.js'
import { ALL_RECIPES } from '../taxonomy/recipes.js'
import type { DisplaySlot } from '../types/index.js'
import type { EvaluationResult, Modifiers } from '../taxonomy/evaluate.js'

/**
 * #76 —— **一覧の売値と、実際に売れる額が一致しない。**
 *
 * 一覧は `salePriceOf`（**素の売値**）、売れたときの額は
 * `finalPriceOf(id, 配置の効き目 × 強化の利益率)`。**強化の利益率が乗っていなかった**ので、
 * `売120レン` と出ている品が `+156レン` で売れていた。⚠ **強化を買うほどずれが広がる。**
 *
 * 直したあとの形は「**一覧も売れたときと同じ経路（`finalPriceOf`）を通す**」。
 * 一覧の時点では置き場所が決まっていないので、配置の効き目だけは 1 のまま。
 *
 * ⚠ `InventoryPanel` は Phaser を読むのでここからは import できない。
 *   **数の関係は実物の関数で確かめ、呼び出し側はソースで縛る。**
 */
const reg = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)

/** 持ち物一覧が出す額。`InventoryPanel.renderItems` と同じ式 */
const listed = (id: string, margin: number) => reg.finalPriceOf(id, margin)

const NEUTRAL: Modifiers = { 売れやすさ: 1, 値段: 1, 集客: 1 }

function soldRevenue(itemId: string, margin: number, priceModifier = 1): number {
  const item = reg.getItem(itemId)
  const slot: DisplaySlot = {
    id: 's1', itemId, shape: item.shape, position: { x: 0, y: 0 }, rotation: 0,
  }
  const sim = new CustomerSimulator(reg, { getQuantity: () => 5 })
  const evaluation: EvaluationResult = {
    perSlot: new Map([['s1', { ...NEUTRAL, 値段: priceModifier }]]),
    shopWide: NEUTRAL,
    firedRules: [],
  }
  const { sales } = sim.simulateMinute([slot], evaluation, () => 0, { 来客: 1, 利益率: margin })
  expect(sales).toHaveLength(1)
  return sales[0].revenue
}

/** 利益率の強化を `stage` 段まで買った状態の倍率 */
function marginAt(stage: number): number {
  const up = new Upgrades()
  for (let i = 0; i < stage; i++) up.advance('利益率')
  return up.marginMultiplier()
}

describe('持ち物一覧の売値（#76）', () => {
  /**
   * **これが #76 の本体。**置き場所の効き目を除けば、一覧の額と売れる額は同じ数でなければならない。
   * ⚠ 直す前はここが `salePriceOf`（＝`利益率 1` のときの額）で固定だったので、
   *   **強化を買うほど右辺だけが増えていった。**
   */
  it('配置の効き目が中立なら、一覧の額と実際に売れる額が一致する', () => {
    for (const stage of [0, 1, 3, 5]) {
      const m = marginAt(stage)
      for (const id of ['snap_pea', 'buckwheat_flour', 'buckwheat_bread', 'celebration_hamper']) {
        expect(listed(id, m), `${id} / 利益率${stage}段`).toBe(soldRevenue(id, m))
      }
    }
  })

  /** ⚠ **強化を買っていないうちは、今までと同じ数字が出る**（全161品で確かめる） */
  it('強化なしのときは素の売値と同じ（見え方を変えていない）', () => {
    expect(marginAt(0)).toBe(1)
    for (const item of reg.getAllItems()) {
      expect(listed(item.id, 1), item.id).toBe(reg.salePriceOf(item.id))
    }
  })

  /**
   * ⚠ **これが「強化を買うほどずれが広がる」の中身。**
   *   素の売値のままだと、利益率を上げても一覧の数字は1レンも動かない。
   */
  it('利益率を上げると一覧の額も上がる（素の売値は動かない）', () => {
    const id = 'snap_pea'
    const base = reg.salePriceOf(id)
    let previous = listed(id, marginAt(0))
    expect(previous).toBe(base)
    for (const stage of [1, 2, 3, 4, 5]) {
      const now = listed(id, marginAt(stage))
      expect(now, `利益率${stage}段`).toBeGreaterThan(previous)
      previous = now
    }
    // 素の売値は導出なので、強化では動かない（動いたら品の性質になってしまう）
    expect(reg.salePriceOf(id)).toBe(base)
  })

  /**
   * ⚠ **倍率は加工利益にだけ乗る**（`derive.ts`）。売値全体に乗せると、
   *   材料費の高い品ほど強化の恩恵が大きくなり、**生売りだけが不当に強くなる。**
   */
  it('倍率は売値全体には乗らない（利益率3倍でも額は3倍にならない）', () => {
    const m = marginAt(5)
    expect(m).toBeGreaterThan(1)
    const ratio = listed('snap_pea', m) / reg.salePriceOf('snap_pea')
    expect(ratio).toBeGreaterThan(1)
    expect(ratio).toBeLessThan(m)
  })

  /**
   * ⚠ **呼び出し側をここで縛る。**数の関係が合っていても、
   *   一覧が `salePriceOf` を呼び戻したら #76 はそのまま再発する。
   */
  it('一覧は salePriceOf を呼ばない（売れたときと同じ finalPriceOf を通す）', () => {
    const body = panelSource
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
    expect(body, '素の売値は「手に入る額」ではない（#76）').not.toContain('salePriceOf')
    expect(body).toContain('finalPriceOf')
    expect(body).toContain('this.marginOf()')
  })
})
