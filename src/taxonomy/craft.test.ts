import { describe, it, expect } from 'vitest'
import { ALL_RECIPES } from './recipes.js'
import { tier } from './derive.js'
import {
  craftMinutes, skillSpeedup, speedMultiplier,
  SKILL_INITIAL, SKILL_MAX, SKILL_MAX_SPEEDUP,
} from './craft.js'

/** 起きている時間（6:00→24:00）。TimeManager の AWAKE_MINUTES_PER_DAY と同じ */
const AWAKE = 1080

const byTier = (t: number) => ALL_RECIPES.filter(r => tier(r.outputItemId) === t)

const median = (values: readonly number[]): number => {
  const s = [...values].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * ⚠ **tier ごとの基準（PO 決定 2026-09-15。計画 `stage4-start.md` の表）。**
 *   `recipes.ts` の 106本は **`基準 × clamp(いまの所要 ÷ その tier の中央値, 0.5, 2.0)`**
 *   で置き直してある。**中央値が基準に戻ることが、その置き直しが効いていることの証拠。**
 */
const TIER_BASE_MINUTES: Record<number, number> = { 2: 10, 3: 14, 4: 19, 5: 27, 6: 36, 7: 50 }

describe('加工の所要時間は durationMinutes だけで決まる（段階4 作業2）', () => {
  /**
   * ★ **tier は `durationMinutes` にだけ入る。**
   *
   * ⚠ **ここが崩れると、売値（`craftProfit`）と所要時間が別々の尺度で動き出す。**
   *   旧実装（S − D 方式）は時間にだけ tier を二重に掛けていて、
   *   **tier4 が 840分 ＝ 1日に収まらず着手すらできなかった。**
   */
  it('★ tier ごとの所要分の中央値が、決めた基準と一致する', () => {
    for (const [t, base] of Object.entries(TIER_BASE_MINUTES)) {
      const recipes = byTier(Number(t))
      expect(recipes.length, `tier${t} のレシピが無い`).toBeGreaterThan(0)
      expect(median(recipes.map(r => r.durationMinutes)), `tier${t}`).toBe(base)
    }
  })

  it('★ 深い tier ほど基準が長い（tier の順が所要分の順になる）', () => {
    const tiers = Object.keys(TIER_BASE_MINUTES).map(Number).sort((a, b) => a - b)
    for (let i = 1; i < tiers.length; i++) {
      expect(TIER_BASE_MINUTES[tiers[i]]).toBeGreaterThan(TIER_BASE_MINUTES[tiers[i - 1]])
    }
  })

  it('レシピごとの差は残っている（tier 内が全部同じ値ではない）', () => {
    for (const t of Object.keys(TIER_BASE_MINUTES).map(Number)) {
      const values = new Set(byTier(t).map(r => r.durationMinutes))
      // tier7 は2本しかないので、1種類になることがある
      if (byTier(t).length >= 4) expect(values.size, `tier${t}`).toBeGreaterThan(1)
    }
  })
})

describe('手際は全品に同じだけ効く', () => {
  it('累計倍率は初期 1.0・上限で 5.0 ちょうど', () => {
    expect(skillSpeedup(SKILL_INITIAL)).toBeCloseTo(1, 6)
    expect(skillSpeedup(SKILL_MAX)).toBeCloseTo(SKILL_MAX_SPEEDUP, 6)
  })

  it('範囲の外を渡しても 1.0〜5.0 に収まる', () => {
    for (const s of [-100, 0, 10, 20, 30, 100]) {
      expect(skillSpeedup(s)).toBeGreaterThanOrEqual(1)
      expect(skillSpeedup(s)).toBeLessThanOrEqual(SKILL_MAX_SPEEDUP)
      expect(speedMultiplier(s) * skillSpeedup(s)).toBeCloseTo(1, 9)
    }
  })

  /**
   * ★ **格上と格下の所要比は、手際で動かない。**
   *
   * ⚠ **旧実装はここが `4.00 → 1.00` に動いた**（clamp が「格上が格下に追いつく」を作っていた）。
   *   **基準が 10〜50分になって最初から全部その日に収まるので、追いつかせる必要が無くなった**
   *   （計画「失うもの」）。**比が動かないことが、tier が1回しか入っていないことの証拠。**
   */
  it('★ 所要比は手際に依らず一定（tier が二重に掛かっていない）', () => {
    const t2 = byTier(2)[0].outputItemId
    const t4 = byTier(4)[0].outputItemId
    const ratio = (s: number) => craftMinutes(t4, s) / craftMinutes(t2, s)
    expect(ratio(SKILL_MAX)).toBeCloseTo(ratio(SKILL_INITIAL), 1)
  })

  it('所要分は 1分を下回らない（時間を払わずに作れてはいけない）', () => {
    for (const r of ALL_RECIPES) {
      expect(craftMinutes(r.outputItemId, SKILL_MAX), r.id).toBeGreaterThanOrEqual(1)
    }
  })

  it('レシピを持たない品は 0分', () => {
    expect(craftMinutes('salt', SKILL_INITIAL)).toBe(0)
  })
})

describe('1日の壁', () => {
  /**
   * ★ **上限まで上げれば、全106本が1日に収まる。**
   *
   * ⚠ ここが崩れると**どれだけ強化しても一度も作れないレシピ**が残る。
   *   着手を止めているのは `CraftingSystem.fitsInToday` だけなので、
   *   この検査が「作れない品が永久に残らない」ことの保証になる。
   */
  it('★ 手際の上限では、全レシピが1日（1080分）に収まる', () => {
    for (const r of ALL_RECIPES) {
      expect(craftMinutes(r.outputItemId, SKILL_MAX), r.id).toBeLessThanOrEqual(AWAKE)
    }
  })

  /**
   * ⚠⚠ **向きが 2026-09-15（段階4 作業2）に逆転した。**
   *
   * **前**: 「初期の手際では1日に収まらない品がある」。**それが唯一の関門だった**（#111）。
   * **後**: **初期でも全部その日に収まる。**基準が 10〜50分なので、**関門そのものが消えた。**
   *
   * ⚠ **これは計画が「失うもの」として名指しで捨てた性質である**
   *   （`stage4-start.md`「`fitsInToday` と無料枠240分が意味を失う」）。
   *   **緩めたのではなく、逆を固定してある** —— 戻したいなら基準の表ごと決め直すことになる。
   * ⚠ **tier6〜7 を長くするかどうかは、測ってから決める**（計画 作業2 の末尾）。
   */
  it('⚠ 初期の手際でも、全レシピがその日のうちに終わる（関門は消えた）', () => {
    const over = (s: number) =>
      ALL_RECIPES.filter(r => craftMinutes(r.outputItemId, s) > AWAKE).length
    expect(over(SKILL_INITIAL)).toBe(0)
    expect(over(SKILL_MAX)).toBe(0)
  })
})
