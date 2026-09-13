import { describe, it, expect } from 'vitest'
import { ALL_RECIPES } from './recipes.js'
import { tier } from './derive.js'
import {
  difficulty, speedMultiplier, craftMinutes,
  SKILL_INITIAL, SKILL_MAX, SPEED_FLOOR, SPEED_CEILING,
} from './craft.js'

/** 起きている時間（6:00→24:00）。TimeManager の AWAKE_MINUTES_PER_DAY と同じ */
const AWAKE = 1080

const byTier = (t: number) => ALL_RECIPES.filter(r => tier(r.outputItemId) === t)

describe('加工の難易度（S − D 方式）', () => {
  it('難易度は tier から導出する（手書きしない）', () => {
    for (const r of ALL_RECIPES) {
      expect(difficulty(r.outputItemId)).toBe(tier(r.outputItemId) * 5)
    }
  })

  /**
   * ⚠ **「難しすぎて着手できない」は外した**（#111。PO 判断 2026-09-14）。
   *   手際の意味は「加工が速くなる」1つだけで、**止めるのは1日に収まるかどうかだけ。**
   */
  it('手際が低くても、難易度そのものでは止まらない（`canAttempt` は無い）', () => {
    const t4 = byTier(4)[0].outputItemId // D = 20
    expect(craftMinutes(t4, SKILL_INITIAL)).toBeGreaterThan(0)
  })

  it('倍率は 0.25〜4.0 に収まる', () => {
    for (const r of ALL_RECIPES) {
      for (const s of [0, 10, 20, 30, 100]) {
        const m = speedMultiplier(r.outputItemId, s)
        expect(m).toBeGreaterThanOrEqual(SPEED_FLOOR)
        expect(m).toBeLessThanOrEqual(SPEED_CEILING)
      }
    }
  })

  it('★ 手際の上限では、格上と格下の所要比が 1.00 になる（clamp が仕事をしている）', () => {
    // 上限を下げるとこの比が動かなくなり、ただの一律高速化になる
    const t2 = byTier(2)[0].outputItemId
    const t4 = byTier(4)[0].outputItemId
    expect(speedMultiplier(t4, SKILL_INITIAL) / speedMultiplier(t2, SKILL_INITIAL)).toBeCloseTo(4, 2)
    expect(speedMultiplier(t4, SKILL_MAX) / speedMultiplier(t2, SKILL_MAX)).toBeCloseTo(1, 2)
  })

  /**
   * ★ **上限まで上げれば、全106本が1日に収まる。**
   *
   * ⚠ ここが崩れると**どれだけ強化しても一度も作れないレシピ**が残る。
   *   `canAttempt` を外した後、**着手を止めているのはこの1日の壁だけ**なので、
   *   この検査が「作れない品が永久に残らない」ことの唯一の保証になる。
   */
  it('★ 手際の上限では、全レシピが1日（1080分）に収まる', () => {
    for (const r of ALL_RECIPES) {
      expect(craftMinutes(r.outputItemId, SKILL_MAX),
        `${r.outputItemId}`).toBeLessThanOrEqual(AWAKE)
    }
  })

  /**
   * ⚠ **初期の手際では1日に収まらない品がある。**これは不具合ではなく、
   *   `canAttempt` を外したあとの**唯一の関門**である（#111）。
   *   実測 2026-09-14: 手際10 で 9本（tier4 の 1200分の品）。
   */
  it('初期の手際では1日に収まらない品があり、上限では無くなる', () => {
    const over = (s: number) =>
      ALL_RECIPES.filter(r => craftMinutes(r.outputItemId, s) > AWAKE).length
    expect(over(SKILL_INITIAL)).toBeGreaterThan(0)
    expect(over(SKILL_MAX)).toBe(0)
  })
})
