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
import { cellCount, craftProfit, dumpAll, ingredientCost, originReach, salePrice, tier } from './derive.js'
import { SIGNATURE_SETS, SET_RULES, DEMAND_RULES, UNLOCK_RULES, combine } from './rules.js'
import { evalCondition, evaluate, type GameState, type Placement } from './evaluate.js'
import { DEMAND_TABLE } from './islands.js'

const EMPTY_SALES = new Map<string, number>()
const STATE: GameState = { 現在地: 'ハルヴェラ', 累計販売数: EMPTY_SALES }

// ══ INV-1 追加しても、既存は変わらない ═══════════════════
describe('INV-1 追加しても、既存は変わらない', () => {
  it('新しいアイテムを1件足しても、既存アイテムの全属性（導出値を含む）が変わらない', () => {
    const before = dumpAll()

    const added: ItemDef = {
      id: 'test_new_item',
      display: { name: '試しの品', reading: 'ためしのしな' },
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
      display: { name: '試しの焼きもの', reading: 'ためしのやきもの' },
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
  /** 蕎麦の実 ← 蕎麦粉 という逆向きのレシピを足すと、蕎麦粉 ← 蕎麦の実 と循環する */
  const cyclicRecipes = (): Map<string, RecipeDef> => {
    const cyclic = new Map(RECIPES_BY_OUTPUT)
    cyclic.set('buckwheat', {
      id: 'cyclic', display: { name: '循環' },
      outputItemId: 'buckwheat', outputQuantity: 1,
      ingredients: [{ itemId: 'buckwheat_flour', quantity: 1 }],
      durationMinutes: 1,
    })
    return cyclic
  }

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
    expect(() => tier('buckwheat_flour', cyclicRecipes())).toThrow(/cycle/i)
  })

  /** 材料を遡った産地（#37）も tier と同じ扱い。**黙って「なし」を返さない** */
  it('循環したレシピは、材料を遡った産地でも検出して落ちる（#37）', () => {
    expect(() => originReach(getItem('buckwheat_flour'), cyclicRecipes())).toThrow(/cycle/i)
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
    for (const rule of [...SET_RULES, ...DEMAND_RULES, ...UNLOCK_RULES]) {
      const found = collectStrings(rule).filter(s => KNOWN_ITEM_IDS.has(s))
      expect(found, `rule ${rule.id} references item ids`).toEqual([])
    }
  })

  it('層2（名物コンビ）は既定で空である', () => {
    expect(SIGNATURE_SETS).toEqual([])
  })

  it('層2を空にしても評価結果が変わらない（層2を全部消しても成立する）', () => {
    const placements: Placement[] = [
      { slotId: 's1', itemId: 'buckwheat_bread', x: 0, y: 0 },
      { slotId: 's2', itemId: 'grape_wine', x: 2, y: 0 },
    ]
    const withLayer2 = evaluate(placements, STATE)
    // SIGNATURE_SETS が空である以上、層2を通る経路は結果に寄与しない
    expect(withLayer2.firedRules.every(id => !id.startsWith('SIG'))).toBe(true)
    expect(withLayer2.perSlot.size).toBe(2)
  })
})

// ══ INV-5 追加コストが定数 ═══════════════════════════════
describe('INV-5 追加コストが定数', () => {
  it('品を1つ足すのに書くのは定義1件だけで、既存の定義も規則も需要表も触らない', () => {
    const added: ItemDef = {
      id: 'test_cost_item',
      display: { name: '試しの品', reading: 'ためしのしな' },
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
    // ⚠ **162品**（2026-09-15 に救済の品 `砂` を足した）
    expect(ALL_ITEMS).toHaveLength(162)
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
      expect(craftProfit(item), recipe.id).toBeGreaterThan(0)
    }
  })
})

// ══ 値段の決まり方（2026-09-15 に層1 を作り替えた） ══════
/**
 * `加工利益 = 係数 × 升数^k × 格の倍率`。**時間も tier も出力数も入らない。**
 * 計画: `aidlc-docs/construction/plans/price-model-rework.md`
 */
describe('層1 は「升数と格」だけで決まる', () => {
  const median = (xs: readonly number[]): number => {
    const s = [...xs].sort((a, b) => a - b)
    const m = (s.length / 2) | 0
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
  }

  /**
   * ⚠ **「深く作るほど取り分が増える」を、tier の係数ではなく実測で見張る。**
   *
   * **層1 に tier の係数は無い**（材料費と升数で二重に払うことになるため。r = 0.659）。
   * 代わりに、**材料費の積み上げ**と **tier↔升数の相関**が深さの報酬を運んでいる。
   * ⚠ **それが本当に成り立っているかは、データを見ないと分からない。**
   *   レシピを足したときにここが崩れたら、**設計のほうが壊れている。**
   */
  it('tier ごとの売値の中央値が単調に増える', () => {
    const byTier = new Map<number, number[]>()
    for (const item of ALL_ITEMS) {
      const t = tier(item.id)
      byTier.set(t, [...(byTier.get(t) ?? []), salePrice(item.id)])
    }
    const tiers = [...byTier.keys()].sort((a, b) => a - b)
    const medians = tiers.map(t => median(byTier.get(t)!))
    for (let i = 1; i < medians.length; i++) {
      expect(
        medians[i],
        `T${tiers[i]} の中央値 ${medians[i]} が T${tiers[i - 1]} の ${medians[i - 1]} を超えていない` +
        `（全段: ${tiers.map((t, k) => `T${t}=${medians[k]}`).join(' ')}）`,
      ).toBeGreaterThan(medians[i - 1])
    }
  })

  // ── 盤面の総額（ペルソナが出した条件） ──────────────
  /**
   * > **比例を下回ると「小さい品を敷き詰めるのが正解」、上回ると「大きい品だけ」に一本化して、
   * > テトリスの形の意味が消えます**（経営シム好き。`profit-persona-review.md`）
   *
   * **k を両側から挟む。**盤面は **4×4 ＝ 16升**、大きい品は **3×3 ＝ 9升**（実在の形。
   * `grand_outfit` ／ `celebration_hamper`）、小さい品は 1升。
   * ⚠ **4×4 に 3×3 は1つしか入らない**（下でしらみつぶしに数えている）ので、
   *   「大きい品だけ」の盤面は **7升が死ぬ。**
   *
   * | 盤面 | 総額（格をそろえ、係数を約す） | |
   * |---|---|---|
   * | A 大きい品だけ | `9^k` | 7升が空き |
   * | B 隙間を小さい品で埋めた | `9^k + 7` | 升を使い切る |
   * | C 小さい品だけ | `16` | 升を使い切る |
   *
   * - **B > A** … 受入条件そのもの（隙間は埋めたほうが高い）
   * - ⚠ **A < C** … `9^k < 16` ⟺ **k < 1.262**。**k が行き過ぎたらここが落ちる**
   *   （7升を捨ててなお「大きい品だけ」が勝つなら、形の意味が消える）
   * - ⚠ **B > C** … `9^k > 9` ⟺ **k > 1**。**比例を下回ったらここが落ちる**
   *   （小さい品を敷き詰めるのが常に正解になる）
   *
   * ⚠ **材料費を混ぜない。**比べているのは**層1 の加工利益だけ**で、
   *   ここが k で動く唯一の部分である。材料費は升数と別の理由（下の段の積み上げ）で動く。
   * ⚠ **格もそろえる。**そろえないと `LUXURY_PROFIT`（0.9 / 1.1 / 1.7）の差が k の効きを覆う。
   */
  describe('盤面の総額 —— 大きい品だけに一本化しない（k を両側から挟む）', () => {
    const BOARD = { width: 4, height: 4 }
    const shaped = (shape: readonly (readonly (0 | 1)[])[]): ItemDef => ({
      id: 'board_probe', display: { name: '検査用', reading: 'けんさよう' },
      mainKind: '道具', origin: 'なし', luxury: '上等', suitedLand: 'どこでも',
      shape, basePrice: 1, originReason: '盤面の総額を測るためだけの品',
    })
    const BIG = shaped([[1, 1, 1], [1, 1, 1], [1, 1, 1]])
    const SMALL = shaped([[1]])

    /** その形が盤面に重ならずいくつ置けるか（しらみつぶし。回転しない） */
    const maxFit = (item: ItemDef): number => {
      const used = Array.from({ length: BOARD.height }, () => Array(BOARD.width).fill(false))
      let placed = 0
      for (let y = 0; y < BOARD.height; y++) {
        for (let x = 0; x < BOARD.width; x++) {
          const cells: { x: number; y: number }[] = []
          let ok = true
          item.shape.forEach((row, dy) => row.forEach((c, dx) => {
            if (c !== 1) return
            const cx = x + dx, cy = y + dy
            if (cx >= BOARD.width || cy >= BOARD.height || used[cy][cx]) ok = false
            else cells.push({ x: cx, y: cy })
          }))
          if (!ok) continue
          cells.forEach(c => { used[c.y][c.x] = true })
          placed++
        }
      }
      return placed
    }

    const BOARD_CELLS = BOARD.width * BOARD.height
    const bigFit = maxFit(BIG)
    const gaps = BOARD_CELLS - bigFit * cellCount(BIG)

    const 大きい品だけ = bigFit * craftProfit(BIG)
    const 隙間を小さい品で埋めた = 大きい品だけ + gaps * craftProfit(SMALL)
    const 小さい品だけ = maxFit(SMALL) * craftProfit(SMALL)

    it('盤面の前提: 4×4 に 3×3 は1つしか入らず、7升が余る', () => {
      expect(BOARD_CELLS).toBe(16)
      expect(cellCount(BIG)).toBe(9)
      expect(bigFit).toBe(1)
      expect(gaps).toBe(7)
      expect(maxFit(SMALL)).toBe(16)
      // ⚠ 格をそろえていること（そろっていないと下の比較が k を測っていない）
      expect(BIG.luxury).toBe(SMALL.luxury)
    })

    it('隙間を小さい品で埋めた盤面のほうが、大きい品だけの盤面より総額が高い', () => {
      expect(隙間を小さい品で埋めた).toBeGreaterThan(大きい品だけ)
    })

    it('⚠ k の上限: 7升を捨ててなお「大きい品だけ」が勝つことはない（k < 1.262）', () => {
      expect(
        大きい品だけ,
        `大きい品だけ ${大きい品だけ.toFixed(2)} が小さい品だけ ${小さい品だけ.toFixed(2)} 以上。` +
        '升数の指数が行き過ぎている（derive.ts の CELL_EXPONENT）',
      ).toBeLessThan(小さい品だけ)
    })

    it('⚠ k の下限: 小さい品を敷き詰めるのが常に正解にはならない（k > 1）', () => {
      expect(
        隙間を小さい品で埋めた,
        `混ぜた盤面 ${隙間を小さい品で埋めた.toFixed(2)} が小さい品だけ ${小さい品だけ.toFixed(2)} 以下。` +
        '升数の指数が比例を下回っている（derive.ts の CELL_EXPONENT）',
      ).toBeGreaterThan(小さい品だけ)
    })
  })

  /** 層1 に時間・出力数・tier が入っていないこと（形そのものを見張る） */
  it('加工利益は、升数と格が同じなら同じ —— 時間・出力数・tier で動かない', () => {
    const byShapeAndLuxury = new Map<string, Set<number>>()
    for (const recipe of ALL_RECIPES) {
      const item = getItem(recipe.outputItemId)
      const key = `${cellCount(item)}升/${item.luxury}`
      const set = byShapeAndLuxury.get(key) ?? new Set<number>()
      set.add(craftProfit(item))
      byShapeAndLuxury.set(key, set)
    }
    // ⚠ 所要分も出力数も tier もばらばらな品が同じ組に入っている。値が1つなら、どれも効いていない
    const 散っている = [...byShapeAndLuxury.entries()].filter(([, v]) => v.size > 1)
    expect(散っている.map(([k]) => k)).toEqual([])
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
      id: 'broken', display: { name: '壊れた品', reading: 'こわれたしな' },
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

describe('島ごとの需要の釣り合い（#39）', () => {
  /** その `向く土地` に向く品の数 */
  const countOf = (land: string) => ALL_ITEMS.filter(i => i.suitedLand === land).length

  it('品数 ×（倍率−1）が4行でそろう', () => {
    // 4行とも同じ倍率にすると、**品数の多い土地に向く品ばかりが得**になる。
    // 島ごとの引きの強さ＝`品数 ×（倍率−1）` をそろえて置いてある（islands.ts の注記）。
    const pulls = DEMAND_TABLE.map(row => countOf(row.suitedLand) * (row.multiplier - 1))
    const avg = pulls.reduce((a, b) => a + b, 0) / pulls.length
    for (const pull of pulls) expect(Math.abs(pull - avg) / avg).toBeLessThan(0.05)
  })

  it('品数で重みを付けた平均倍率は 1.30（総量が動いていない）', () => {
    // ⚠ **倍率を直すときは配分だけを動かす。**ここが上がると全島の稼ぎが増える
    const counts = DEMAND_TABLE.map(row => countOf(row.suitedLand))
    const total = counts.reduce((a, b) => a + b, 0)
    const weighted = DEMAND_TABLE
      .reduce((s, row, i) => s + counts[i] * row.multiplier, 0) / total
    expect(weighted).toBeCloseTo(1.30, 2)
  })
})
