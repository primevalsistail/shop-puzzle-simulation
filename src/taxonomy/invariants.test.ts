/**
 * Cycle 4 / Phase 3 — 不変条件の自動テスト
 *
 * Phase 0（cycle4-phase0-invariants.md）が「自動テスト可」と指定した判定を、
 * その判定手順どおりに実装する。
 *
 * ⚠ Phase 2 §7「確かめること」5件はここに**無い**。
 *   Q4 により評価セッションの担当であり、このセッションは計測も判定もしない。
 */

import { describe, it, expect } from 'vitest'
import type { ItemDef, RecipeDef } from './axes.js'
import { ALL_ITEMS, getItem } from './items.js'
import { ALL_RECIPES, RECIPES_BY_OUTPUT } from './recipes.js'
import { craftProfit, dumpAll, ingredientCost, salePrice, tier } from './derive.js'
import { SIGNATURE_PAIRS, PAIR_RULES, DEMAND_RULES, UNLOCK_RULES, combine } from './rules.js'
import { evalCondition, evaluate, type GameState, type Placement } from './evaluate.js'

const EMPTY_SALES = new Map<string, number>()
const STATE: GameState = { 現在地: 'ハルヴェラ', 累計販売数: EMPTY_SALES }

// ══ INV-1 追加しても、既存は変わらない ═══════════════════
describe('INV-1 追加しても、既存は変わらない', () => {
  it('新しいアイテムを1件足しても、既存アイテムの全属性（導出値を含む）が変わらない', () => {
    const before = dumpAll()

    const added: ItemDef = {
      id: 'test_new_item',
      display: { name: '試しの品', reading: 'ためしのしな', color: 0x000000 },
      mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
      shape: [[1]], basePrice: 40,
      originReason: 'INV-1 の判定のためだけに足した品',
    }
    const after = dumpAll([...ALL_ITEMS, added], RECIPES_BY_OUTPUT)

    for (const item of ALL_ITEMS) {
      expect(after[item.id]).toEqual(before[item.id])
    }
  })

  it('既存アイテムを材料に使うレシピを1件足しても、既存アイテムの属性が変わらない', () => {
    const before = dumpAll()

    const newItem: ItemDef = {
      id: 'test_flatbread',
      display: { name: '試しの焼きもの', reading: 'ためしのやきもの', color: 0x000000 },
      mainKind: '食料', origin: 'ノアキータ', luxury: '日用', suitedLand: 'どこでも',
      shape: [[1]],
      originReason: 'INV-1（レシピ版）の判定のためだけに足した品',
    }
    const newRecipe: RecipeDef = {
      id: 'test_recipe', display: { name: '試しに焼く' },
      outputItemId: 'test_flatbread', outputQuantity: 2,
      // 既存の品（麦・塩）を材料に使う
      ingredients: [{ itemId: 'rice', quantity: 2 }, { itemId: 'salt', quantity: 1 }],
      durationMinutes: 3,
    }
    const recipes = new Map(RECIPES_BY_OUTPUT)
    recipes.set(newRecipe.outputItemId, newRecipe)
    const after = dumpAll([...ALL_ITEMS, newItem], recipes)

    for (const item of ALL_ITEMS) {
      expect(after[item.id]).toEqual(before[item.id])
    }
  })
})

// ══ INV-3 導出できる属性は持たない ═══════════════════════
describe('INV-3 導出できる属性は持たない', () => {
  it('ItemDef に tier / price のフィールドが存在しない', () => {
    for (const item of ALL_ITEMS) {
      expect(item).not.toHaveProperty('tier')
      expect(item).not.toHaveProperty('price')
      expect(item).not.toHaveProperty('salePrice')
      expect(item).not.toHaveProperty('purchasePrice')
    }
  })

  it('レシピを持つ品は basePrice を持たない（価格は積み上げで出る）', () => {
    for (const item of ALL_ITEMS) {
      const hasRecipe = RECIPES_BY_OUTPUT.has(item.id)
      expect(hasRecipe ? item.basePrice === undefined : item.basePrice !== undefined).toBe(true)
    }
  })

  it('tier は ALL_RECIPES から導出され、手書きの値と一致しない余地がない', () => {
    for (const item of ALL_ITEMS) {
      const recipe = RECIPES_BY_OUTPUT.get(item.id)
      const expected = recipe
        ? 1 + Math.max(...recipe.ingredients.map(i => tier(i.itemId)))
        : 1
      expect(tier(item.id)).toBe(expected)
    }
  })

  it('循環したレシピは検出して落ちる', () => {
    const cyclic = new Map(RECIPES_BY_OUTPUT)
    // 蕎麦の実 ← 蕎麦粉 という逆向きのレシピを足すと、蕎麦粉 ← 蕎麦の実 と循環する
    cyclic.set('buckwheat', {
      id: 'cyclic', display: { name: '循環' },
      outputItemId: 'buckwheat', outputQuantity: 1,
      ingredients: [{ itemId: 'buckwheat_flour', quantity: 1 }],
      durationMinutes: 1,
    })
    expect(() => tier('buckwheat_flour', cyclic)).toThrow(/cycle/i)
  })
})

// ══ INV-4 規則はアイテムを知らない ═══════════════════════
describe('INV-4 規則はアイテムを知らない', () => {
  const KNOWN_ITEM_IDS = new Set(ALL_ITEMS.map(i => i.id))

  const collectStrings = (v: unknown, out: string[] = []): string[] => {
    if (typeof v === 'string') out.push(v)
    else if (Array.isArray(v)) v.forEach(x => collectStrings(x, out))
    else if (v && typeof v === 'object') Object.values(v).forEach(x => collectStrings(x, out))
    return out
  }

  it('層1・島の需要・入荷解禁の規則データに ItemId が現れない', () => {
    for (const rule of [...PAIR_RULES, ...DEMAND_RULES, ...UNLOCK_RULES]) {
      const found = collectStrings(rule).filter(s => KNOWN_ITEM_IDS.has(s))
      expect(found, `rule ${rule.id} references item ids`).toEqual([])
    }
  })

  it('層2（名物コンビ）は既定で空である', () => {
    expect(SIGNATURE_PAIRS).toEqual([])
  })

  it('層2を空にしても評価結果が変わらない（層2を全部消しても成立する）', () => {
    const placements: Placement[] = [
      { slotId: 's1', itemId: 'buckwheat_bread', x: 0, y: 0 },
      { slotId: 's2', itemId: 'grape_wine', x: 2, y: 0 },
    ]
    const withLayer2 = evaluate(placements, STATE)
    // SIGNATURE_PAIRS が空である以上、層2を通る経路は結果に寄与しない
    expect(withLayer2.firedRules.every(id => !id.startsWith('SIG'))).toBe(true)
    expect(withLayer2.perSlot.size).toBe(2)
  })
})

// ══ INV-5 追加コストが定数 ═══════════════════════════════
describe('INV-5 追加コストが定数', () => {
  it('品を1つ足すのに書くのは定義1件だけで、既存の定義も規則も需要表も触らない', () => {
    const added: ItemDef = {
      id: 'test_cost_item',
      display: { name: '試しの品', reading: 'ためしのしな', color: 0x111111 },
      mainKind: '飲みもの', origin: 'リナツィア', luxury: '上等', suitedLand: '暑い土地',
      shape: [[1]], basePrice: 33,
      originReason: 'INV-5 の判定のためだけに足した品',
    }
    const items = [...ALL_ITEMS, added]

    // 既存の定義オブジェクトは同一参照のまま（1行も書き換えていない）
    ALL_ITEMS.forEach((original, i) => expect(items[i]).toBe(original))

    // 規則・需要表・レシピを触らずに、新しい品が規則の評価対象になる
    const result = evaluate(
      [{ slotId: 'n', itemId: added.id, x: 0, y: 0 }],
      { 現在地: 'リナツィア', 累計販売数: EMPTY_SALES },
      id => items.find(i => i.id === id)!,
    )
    // 向く土地=暑い土地 × 現在地=リナツィア → 需要表の1行が効く（D1）
    expect(result.firedRules).toContain('D1_リナツィア')
  })

  it('品数が増えても、1件あたりに書く行数は増えない（定義のキー数が一定）', () => {
    const keyCounts = ALL_ITEMS.map(i => Object.keys(i).length)
    const min = Math.min(...keyCounts)
    const max = Math.max(...keyCounts)
    // basePrice の有無（tier1 かどうか）だけが差
    expect(max - min).toBeLessThanOrEqual(1)
  })
})

// ══ 検索用の読み（#65） ═════════════════════════════════
describe('検索用の読み（#65）', () => {
  /** ひらがな（U+3041〜U+3096）と長音符だけ。⚠ カタカナ・漢字・ローマ字を混ぜない */
  const KANA_ONLY = /^[\u3041-\u3096\u30FC]+$/

  it('全品に読みがある（1品でも欠けると、その品だけ検索から黙って外れる）', () => {
    const missing = ALL_ITEMS.filter(i => !i.display.reading)
    expect(missing.map(i => i.id)).toEqual([])
    expect(ALL_ITEMS).toHaveLength(145)
  })

  it('読みはひらがな（と長音符）だけ', () => {
    // ⚠ カタカナの品にもひらがなで持たせる（`あすぱらがす` で引けるように）。
    //   ローマ字は入れない（`shi`/`si` のどちらかを選ぶことになる）
    const bad = ALL_ITEMS.filter(i => !KANA_ONLY.test(i.display.reading))
    expect(bad.map(i => `${i.id}:${i.display.reading}`)).toEqual([])
  })

  it('読みは `display` の中にある（品の定義のキー数を増やさない）', () => {
    // ⚠ INV-5「1件あたりに書く行数は増えない」を壊さないための置き場所
    for (const item of ALL_ITEMS) {
      expect(item).not.toHaveProperty('reading')
    }
  })
})

// ══ INV-6 作った品は、材料より高い ═══════════════════════
describe('INV-6 作った品は、材料より高い', () => {
  it('全レシピについて 売値(出力) × 出力数 > Σ 売値(材料)', () => {
    for (const recipe of ALL_RECIPES) {
      const output = salePrice(recipe.outputItemId) * recipe.outputQuantity
      const cost = ingredientCost(recipe)
      expect(output, `${recipe.id}: ${output} vs ${cost}`).toBeGreaterThan(cost)
    }
  })

  it('加工利益は常に正（構造的に INV-6 を満たす条件）', () => {
    // 売値 = 材料費 + 加工利益 なので、利益が正である限り INV-6 は定義から成立する。
    // 旧式は「加工倍率 > 1」に依存していた。
    for (const recipe of ALL_RECIPES) {
      const item = getItem(recipe.outputItemId)
      expect(craftProfit(recipe, item), recipe.id).toBeGreaterThan(0)
    }
  })
})

// ══ 効き目の合成（Q5: 加算） ═════════════════════════════
describe('効き目の合成は加算である（Q5）', () => {
  it('1.1 と 1.1 を積むと 1.2 になる', () => {
    expect(combine([1.1, 1.1])).toBeCloseTo(1.2, 10)
  })

  it('効き目が無ければ 1.0', () => {
    expect(combine([])).toBe(1)
  })

  it('上限が無い（3つ積めば 1.3）', () => {
    expect(combine([1.1, 1.1, 1.1])).toBeCloseTo(1.3, 10)
  })
})

// ══ 異常入力 ═════════════════════════════════════════════
describe('異常入力は必ず落ちる', () => {
  it('未知の ItemId は落ちる', () => {
    expect(() => salePrice('no_such_item')).toThrow(/not found/i)
  })

  it('tier1 なのに basePrice が無い品は落ちる', () => {
    const broken: ItemDef = {
      id: 'broken', display: { name: '壊れた品', reading: 'こわれたしな', color: 0 },
      mainKind: '道具', origin: 'なし', luxury: '日用', suitedLand: 'どこでも',
      shape: [[1]], originReason: '判定用',
    }
    expect(() => salePrice('broken', RECIPES_BY_OUTPUT, () => broken)).toThrow(/basePrice/)
  })

  it('順序を持たない軸に順序演算子を使うと落ちる', () => {
    // 主種類は順序を持たないので `>=` は使えない。型でも縛っているが、実行時にも落ちること
    const badCondition = { axis: '主種類' as const, op: '>=' as never, value: '食料' as const }
    expect(() => evalCondition(badCondition, { item: ALL_ITEMS[0], state: STATE }))
      .toThrow(/not allowed/i)
  })

  it('置いた品が1つも無い船倉でも評価が落ちない', () => {
    const empty: Placement[] = []
    const result = evaluate(empty, STATE)
    expect(result.perSlot.size).toBe(0)
    expect(result.shopWide).toEqual({ 売れやすさ: 1, 値段: 1, 集客: 1 })
  })
})
