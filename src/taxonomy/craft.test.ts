import { describe, it, expect } from 'vitest'
import { ALL_RECIPES } from './recipes.js'
import { tier } from './derive.js'
import {
  difficulty, canAttempt, speedMultiplier, craftMinutes, standing,
  SKILL_INITIAL, SKILL_MAX, ATTEMPT_HEADROOM, SPEED_FLOOR, SPEED_CEILING,
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

  it('着手できるのは D <= S + 8 の品だけ', () => {
    const t4 = byTier(4)[0].outputItemId // D = 20
    expect(canAttempt(t4, 10)).toBe(false) // 20 > 10+8
    expect(canAttempt(t4, 12)).toBe(true)  // 20 <= 12+8
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

  it('★ 着手できる品は、どの手際でも必ず1日（1080分）に収まる', () => {
    for (let s = SKILL_INITIAL; s <= SKILL_MAX; s++) {
      for (const r of ALL_RECIPES) {
        if (!canAttempt(r.outputItemId, s)) continue
        expect(craftMinutes(r.outputItemId, s),
          `手際${s} ${r.outputItemId}`).toBeLessThanOrEqual(AWAKE)
      }
    }
  })

  it('初期の手際では「作れない」品があり、上限では無くなる', () => {
    const blocked = (s: number) => ALL_RECIPES.filter(r => !canAttempt(r.outputItemId, s)).length
    expect(blocked(SKILL_INITIAL)).toBeGreaterThan(0)
    expect(blocked(SKILL_MAX)).toBe(0)
  })

  it('段階は 作れない → 背伸び → 適正 → 量産 と進む', () => {
    const t4 = byTier(4)[0].outputItemId // D = 20
    expect(standing(t4, 10)).toBe('作れない')
    expect(standing(t4, 15)).toBe('背伸び')
    expect(standing(t4, 20)).toBe('適正')
    expect(standing(t4, 25)).toBe('量産')
  })

  it('ATTEMPT_HEADROOM は背伸びを許す（適正未満なら作れない、にしない）', () => {
    expect(ATTEMPT_HEADROOM).toBeGreaterThan(0)
    const t4 = byTier(4)[0].outputItemId
    expect(standing(t4, 15)).toBe('背伸び') // D=20 > S=15 でも作れる
  })
})
