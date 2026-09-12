/**
 * 段5 — **作り込みの深さ**（tier5〜7 を足したこと）を固定する検査。
 *
 * 見ているのは `items.ts` と `recipes.ts` のデータの形だけで、
 * **数値のバランスは1つも見ていない**（バランスは #61 でまとめて測り直す）。
 *
 * ⚠ 不変条件（INV-1〜6）は `invariants.test.ts` が見ている。ここは重ねない。
 */

import { describe, it, expect } from 'vitest'
import type { ItemDef } from './axes.js'
import { ALL_ITEMS } from './items.js'
import { ALL_RECIPES, RECIPES_BY_OUTPUT } from './recipes.js'
import { cellCount, tier } from './derive.js'
import { MAX_TIER } from './rules.js'
import { ATTEMPT_HEADROOM, SKILL_INITIAL, difficulty, speedMultiplier } from './craft.js'

const itemsAt = (t: number): readonly ItemDef[] => ALL_ITEMS.filter(i => tier(i.id) === t)
const avgCells = (t: number): number => {
  const list = itemsAt(t)
  return list.reduce((s, i) => s + cellCount(i), 0) / list.length
}

describe('深さは 7段で止まる', () => {
  it('どの品も MAX_TIER を超えない', () => {
    for (const item of ALL_ITEMS) {
      expect(tier(item.id), item.id).toBeLessThanOrEqual(MAX_TIER)
    }
  })

  it('tier7 の品が実在する（終点が空でない）', () => {
    expect(itemsAt(MAX_TIER).length).toBeGreaterThan(0)
  })

  it('tier7 の品は、素材（tier1）まで途切れずに辿れる', () => {
    // 「作れる連鎖が1本以上ある」ことの判定。材料を再帰的に開いて、
    // 行き着く先がすべて tier1（＝島の商人が並べる品）であることを見る。
    const roots = (id: string, seen = new Set<string>()): string[] => {
      if (seen.has(id)) throw new Error(`Recipe cycle detected at: ${id}`)
      const recipe = RECIPES_BY_OUTPUT.get(id)
      if (!recipe) return [id]
      const next = new Set(seen).add(id)
      return recipe.ingredients.flatMap(ing => roots(ing.itemId, next))
    }
    for (const item of itemsAt(MAX_TIER)) {
      const leaves = roots(item.id)
      expect(leaves.length, item.id).toBeGreaterThan(0)
      for (const leaf of leaves) expect(tier(leaf), `${item.id} <- ${leaf}`).toBe(1)
    }
  })
})

describe('深いほど品数は少なく、升は大きい', () => {
  it('tier4 以降は先細りする（同数まで許すが、増えない）', () => {
    const counts = [4, 5, 6, 7].map(t => itemsAt(t).length)
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i], `tier${i + 4}`).toBeLessThanOrEqual(counts[i - 1])
    }
    expect(counts[3]).toBeLessThan(counts[0])
  })

  it('tier4 以降は平均の升目が増える（方針5「高tier＝大きい升」）', () => {
    const avgs = [4, 5, 6, 7].map(avgCells)
    for (let i = 1; i < avgs.length; i++) {
      expect(avgs[i], `tier${i + 4}`).toBeGreaterThan(avgs[i - 1])
    }
  })

  it('1品で盤面を食い潰さない（最大盤面 13×10=130升の1割以内）', () => {
    const MAX_BOARD_CELLS = 13 * 10
    for (const item of ALL_ITEMS) {
      expect(cellCount(item), item.id).toBeLessThanOrEqual(MAX_BOARD_CELLS / 10)
    }
  })

  it('どの品も初期の棚（6×5）に置ける形をしている', () => {
    for (const item of ALL_ITEMS) {
      expect(item.shape.length, `${item.id} の縦`).toBeLessThanOrEqual(5)
      expect(Math.max(...item.shape.map(r => r.length)), `${item.id} の横`).toBeLessThanOrEqual(6)
    }
  })
})

describe('深い品も、着手できるようになった手際で作り切れる', () => {
  it('着手可能になる最小の手際で、所要が1日（1080分）に収まる', () => {
    // `craft.ts`: 着手条件は D <= S + ATTEMPT_HEADROOM なので、着手できる最小の手際は D − 8。
    // ただし手際は SKILL_INITIAL から始まって下がらないので、実際の下限は両者の大きいほう。
    // 深い品（tier5以上）は D − 8 の側で決まり、所要倍率が 2^(8/5) ≈ 3.03倍 まで伸びる。
    // ここを超えると `CraftingSystem.fitsInToday` が常に false になり、
    // **解禁されたのに一度も着手できないレシピ**が生まれる。
    const AWAKE_MINUTES_PER_DAY = 1080
    for (const recipe of ALL_RECIPES) {
      const minSkill = Math.max(SKILL_INITIAL, difficulty(recipe.outputItemId) - ATTEMPT_HEADROOM)
      const minutes = recipe.durationMinutes * speedMultiplier(recipe.outputItemId, minSkill)
      expect(minutes, recipe.id).toBeLessThanOrEqual(AWAKE_MINUTES_PER_DAY)
    }
  })
})
