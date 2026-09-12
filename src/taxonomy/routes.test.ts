import { describe, it, expect } from 'vitest'
import { routeValues, isIngredient } from './routes.js'
import { craftMinutes } from './materials.js'
import type { RecipeDef } from './axes.js'
import { ALL_RECIPES } from './recipes.js'
import { ROUTE } from './islands.js'

describe('craftMinutes — 材料を作る時間も足す', () => {
  const RECIPES: RecipeDef[] = [
    { id: 'r_dough', display: { name: '生地' }, outputItemId: 'dough', outputQuantity: 1,
      ingredients: [{ itemId: 'wheat', quantity: 2 }], durationMinutes: 10 },
    { id: 'r_bread', display: { name: 'パン' }, outputItemId: 'bread', outputQuantity: 1,
      ingredients: [{ itemId: 'dough', quantity: 3 }], durationMinutes: 20 },
  ]

  it('買うしかない品は0分', () => {
    expect(craftMinutes('wheat', RECIPES)).toBe(0)
  })

  it('1段なら、そのレシピの時間', () => {
    expect(craftMinutes('dough', RECIPES)).toBe(10)
  })

  it('材料を作る時間が積み上がる（パン20 ＋ 生地10×3 = 50）', () => {
    expect(craftMinutes('bread', RECIPES)).toBe(50)
  })

  it('作り方を知らない材料の時間は数えない', () => {
    const knownOnly = RECIPES.filter(r => r.id !== 'r_dough')
    expect(craftMinutes('bread', knownOnly)).toBe(20)
  })

  it('1回で複数できるなら1個あたりで割る', () => {
    const batch: RecipeDef[] = [
      { id: 'b', display: { name: 'B' }, outputItemId: 'b', outputQuantity: 4,
        ingredients: [], durationMinutes: 40 },
    ]
    expect(craftMinutes('b', batch)).toBe(10)
  })
})

/**
 * **実データで符号を見る。**
 * ⚠ `derive.ts` の不変条件（`作る利益 − 転売利益 ＝ 加工利益 × 買値率 > 0`）が
 *   画面に出す金額の上でも成り立っていること。**崩れたら「作るほうが儲かる」が嘘になる。**
 */
describe('実データ（92レシピ × 4島 ＋ 島の外）', () => {
  const places = [...ROUTE, undefined] as const

  it('どのレシピ・どの島でも「作る > 転売」', () => {
    for (const at of places) {
      for (const recipe of ALL_RECIPES) {
        const v = routeValues(recipe, ALL_RECIPES, at)
        expect(v.craft, `${recipe.id} @ ${at ?? '島の外'}`).toBeGreaterThan(v.resell)
      }
    }
  })

  /** ⚠ **深さの報酬。**崩れると「深く作る意味がない」ことになる */
  it('どのレシピ・どの島でも「材料も作る ≧ 作る」', () => {
    for (const at of places) {
      for (const recipe of ALL_RECIPES) {
        const v = routeValues(recipe, ALL_RECIPES, at)
        expect(v.deepCraft, `${recipe.id} @ ${at ?? '島の外'}`).toBeGreaterThanOrEqual(v.craft)
      }
    }
  })

  /** ⚠ **取り分だけ見せると「材料も作る」がただ得に見える。**時間も増えることを確かめる */
  it('材料も作るほうが時間はかかる（作れる材料があるとき）', () => {
    for (const recipe of ALL_RECIPES) {
      const v = routeValues(recipe, ALL_RECIPES)
      if (v.hasDeeper) expect(v.deepMinutes).toBeGreaterThan(v.minutes)
      else expect(v.deepMinutes).toBe(v.minutes)
    }
  })

  it('作れる材料が無ければ ③ は ② と同じ', () => {
    for (const recipe of ALL_RECIPES) {
      const v = routeValues(recipe, ALL_RECIPES)
      if (!v.hasDeeper) expect(v.deepCraft).toBe(v.craft)
    }
  })

  /** 知らないレシピで展開しない ＝ 解禁前は ③ が出ない */
  it('作れるレシピが自分だけなら、③ は ② と同じ', () => {
    for (const recipe of ALL_RECIPES.slice(0, 20)) {
      const v = routeValues(recipe, [recipe])
      expect(v.deepCraft).toBe(v.craft)
      expect(v.hasDeeper).toBe(false)
    }
  })

  /** ⚠ 行に収まるか。桁が増えると文字が溢れる */
  it('金額が6桁を超えない（1回ぶん）', () => {
    for (const recipe of ALL_RECIPES) {
      const v = routeValues(recipe, ALL_RECIPES)
      expect(Math.abs(v.deepCraft)).toBeLessThan(1_000_000)
    }
  })
})

describe('isIngredient', () => {
  it('材料に使われていれば true', () => {
    const used = ALL_RECIPES[0].ingredients[0].itemId
    expect(isIngredient(used, ALL_RECIPES)).toBe(true)
  })

  it('どこにも使われていなければ false', () => {
    expect(isIngredient('__not_an_item__', ALL_RECIPES)).toBe(false)
  })

  it('値段の強化の倍率が3ルートすべてに乗る（#76。持ち物一覧とずれない）', () => {
    const recipe = ALL_RECIPES.find(r => r.ingredients.length > 0)!
    const plain = routeValues(recipe, ALL_RECIPES)
    const boosted = routeValues(recipe, ALL_RECIPES, undefined, 2)

    // 倍率は粗利にだけ乗るので、額は増えるが time は変わらない
    expect(boosted.craft).toBeGreaterThan(plain.craft)
    expect(boosted.resell).toBeGreaterThan(plain.resell)
    expect(boosted.minutes).toBe(plain.minutes)
    // ⚠ **順序は変わらない。**3ルートとも同じ倍率を通る
    expect(boosted.craft).toBeGreaterThan(boosted.resell)
  })

  it('倍率を渡さないと従来どおり（既定は 1）', () => {
    const recipe = ALL_RECIPES.find(r => r.ingredients.length > 0)!
    expect(routeValues(recipe, ALL_RECIPES, undefined, 1)).toEqual(routeValues(recipe, ALL_RECIPES))
  })

  it('手際を渡すと3ルートの分数が縮む（#53。渡さないと行の表示と食い違う）', () => {
    const recipe = ALL_RECIPES.find(r => r.ingredients.some(i => ALL_RECIPES.some(x => x.outputItemId === i.itemId)))!
    const raw = routeValues(recipe, ALL_RECIPES)
    const skilled = routeValues(recipe, ALL_RECIPES, undefined, 1, 30)

    // 手際30 は最大。素の値より短い
    expect(skilled.minutes).toBeLessThan(raw.minutes)
    expect(skilled.deepMinutes).toBeLessThan(raw.deepMinutes)
    // ⚠ 深いほうが浅いほうより長い、は崩れない
    expect(skilled.deepMinutes).toBeGreaterThanOrEqual(skilled.minutes)
  })

  it('手際を渡さないと従来どおりの素の分数', () => {
    const recipe = ALL_RECIPES.find(r => r.ingredients.length > 0)!
    expect(routeValues(recipe, ALL_RECIPES).minutes).toBe(recipe.durationMinutes)
  })
})
