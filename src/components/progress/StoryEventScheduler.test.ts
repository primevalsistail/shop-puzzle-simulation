import { describe, it, expect } from 'vitest'
import { StoryEventScheduler } from './StoryEventScheduler.js'
import { STORY_EVENTS, PEDDLER_VISIT_CHANCE } from './StoryEvents.js'
import type { StoryEventDef } from './StoryEvents.js'

/** 決まった順で数を返す。**同じ種なら同じ結果**（`PeddlerStock.test.ts` と同じ作り） */
function seeded(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/** いつも同じ数を返す。**当たり／外れを狙って作る** */
function fixed(v: number): () => number {
  return () => v
}

const PEDDLER = STORY_EVENTS.find(e => e.id === 'peddler_visit')!

/**
 * その日ぶんを引いて、**朝から晩まで1分ずつ訊いたときに起きたか**を返す。
 * `GameScene` が `TIME_MINUTE_PASSED` ごとに `due()` を呼ぶのと同じ回し方。
 */
function runDay(
  sched: StoryEventScheduler, day: number, rand: () => number,
): StoryEventDef[] {
  sched.ensureDay(day, rand)
  const fired: StoryEventDef[] = []
  for (let h = 6; h < 24; h++) {
    for (let m = 0; m < 60; m++) {
      let def = sched.due(h, m)
      while (def) {
        fired.push(def)
        def = sched.due(h, m)
      }
    }
  }
  return fired
}

describe('できごとの発火（#24）', () => {
  it('同じ日に2度引かない（ロードし直しても引き直せない）', () => {
    const s = new StoryEventScheduler()
    expect(s.ensureDay(5, fixed(0))).toBe(true)
    const first = s.scheduled().map(p => `${p.def.id}@${p.hour}:${p.minute}`)
    expect(s.ensureDay(5, fixed(0))).toBe(false)
    expect(s.scheduled().map(p => `${p.def.id}@${p.hour}:${p.minute}`)).toEqual(first)
    expect(s.ensureDay(6, fixed(0))).toBe(true)
    expect(s.getDay()).toBe(6)
  })

  it('1日に起きるのは多くても1回（取り出したら控えから消える）', () => {
    const s = new StoryEventScheduler([PEDDLER])
    expect(runDay(s, 1, fixed(0)).length).toBe(1)
    expect(s.scheduled()).toHaveLength(0)
  })

  it('起きるのは、決められた時間帯の中', () => {
    const s = new StoryEventScheduler([PEDDLER])
    for (let seed = 1; seed <= 200; seed++) {
      const fresh = new StoryEventScheduler([PEDDLER])
      fresh.ensureDay(seed, seeded(seed))
      for (const p of fresh.scheduled()) {
        expect(p.hour).toBeGreaterThanOrEqual(PEDDLER.trigger.fromHour)
        expect(p.hour).toBeLessThan(PEDDLER.trigger.untilHour)
        expect(p.minute).toBeGreaterThanOrEqual(0)
        expect(p.minute).toBeLessThan(60)
      }
    }
    expect(s.scheduled()).toHaveLength(0)
  })

  /**
   * ⚠ **加工（`TimeManager.skipMinutes`）は1分ごとの出来事を出さない。**
   *   控えの時刻を飛び越えることがあるので、`===` で見るとその日のぶんが黙って消える。
   */
  it('控えの時刻を飛び越えても、次に訊いたときに起きる', () => {
    const s = new StoryEventScheduler([PEDDLER])
    s.ensureDay(1, fixed(0))              // 当たり ＋ その日のいちばん早い分
    const at = s.scheduled()[0]
    expect(at.hour).toBe(PEDDLER.trigger.fromHour)
    expect(at.minute).toBe(0)
    // まだ時刻に達していない
    expect(s.due(at.hour - 1, 59)).toBeNull()
    // 何時間も飛ばしたあとで訊く（加工で時計が飛んだとき）
    expect(s.due(at.hour + 3, 0)).toBe(PEDDLER)
    expect(s.due(23, 59)).toBeNull()
  })

  it('その時刻より前には起きない', () => {
    const s = new StoryEventScheduler([PEDDLER])
    s.ensureDay(1, seeded(12345))
    const at = s.scheduled()[0]
    if (at) {
      expect(s.due(PEDDLER.trigger.fromHour - 1, 0)).toBeNull()
      expect(s.due(at.hour, at.minute)).toBe(PEDDLER)
    }
  })
})

/**
 * ⚠ **#90 の中身そのもの。**実装は長らく「必ず毎日」で、`refresh()` は
 *   日が変わったかしか見ていなかった（#9 本文は「最大1日1回**程度**」）。
 */
describe('行商人は毎日は来ない（#90）', () => {
  it('来ない日がある／来る日もある', () => {
    const s = new StoryEventScheduler([PEDDLER])
    const rand = seeded(2026)
    let came = 0
    const DAYS = 400
    for (let day = 1; day <= DAYS; day++) {
      if (runDay(s, day, rand).length > 0) came++
    }
    expect(came).toBeGreaterThan(0)      // 来る日がある
    expect(came).toBeLessThan(DAYS)      // ⚠ **来ない日がある**
    // 仮置きの確率（→ #61）のあたりに寄っている
    expect(came / DAYS).toBeGreaterThan(PEDDLER_VISIT_CHANCE - 0.1)
    expect(came / DAYS).toBeLessThan(PEDDLER_VISIT_CHANCE + 0.1)
  })

  it('外れの目なら1日も来ない', () => {
    const s = new StoryEventScheduler([PEDDLER])
    for (let day = 1; day <= 30; day++) {
      expect(runDay(s, day, fixed(0.999))).toHaveLength(0)
    }
  })

  it('当たりの目なら毎日来る', () => {
    const s = new StoryEventScheduler([PEDDLER])
    for (let day = 1; day <= 30; day++) {
      expect(runDay(s, day, fixed(0))).toHaveLength(1)
    }
  })

  it('確率は 0〜1 の間にあり、1（必ず毎日）ではない', () => {
    expect(PEDDLER_VISIT_CHANCE).toBeGreaterThan(0)
    expect(PEDDLER_VISIT_CHANCE).toBeLessThan(1)
  })
})

/**
 * **受入条件2 —— イベントを1本足すのに、発火の仕組みを触らなくてよいこと。**
 *
 * ここで渡しているのは `STORY_EVENTS` に無い作り物で、`StoryEventScheduler.ts` は
 * この試験のために1文字も変えていない。**足すのはデータだけ**という形の裏返し。
 */
describe('できごとは1本足すのにデータだけで済む', () => {
  const MADE_UP: StoryEventDef = {
    id: 'made_up',
    speaker: 'だれか',
    lines: ['ためし'],
    choices: [{ label: 'はい' }, { label: 'いいえ' }],
    trigger: { chancePerDay: 1, fromHour: 7, untilHour: 9 },
  }

  it('作り物のできごとが、そのまま引かれて起きる', () => {
    const s = new StoryEventScheduler([MADE_UP])
    const fired = runDay(s, 1, seeded(3))
    expect(fired).toEqual([MADE_UP])
  })

  it('作り物の時間帯がそのまま効く', () => {
    const s = new StoryEventScheduler([MADE_UP])
    s.ensureDay(1, seeded(3))
    const at = s.scheduled()[0]
    expect(at.hour).toBeGreaterThanOrEqual(7)
    expect(at.hour).toBeLessThan(9)
  })

  it('複数本でも、早い順に起きる', () => {
    const early: StoryEventDef = { ...MADE_UP, id: 'early', trigger: { chancePerDay: 1, fromHour: 7, untilHour: 8 } }
    const late: StoryEventDef = { ...MADE_UP, id: 'late', trigger: { chancePerDay: 1, fromHour: 18, untilHour: 19 } }
    const s = new StoryEventScheduler([late, early])
    expect(runDay(s, 1, seeded(11)).map(d => d.id)).toEqual(['early', 'late'])
  })

  it('確率0のできごとは引かれない', () => {
    const never: StoryEventDef = { ...MADE_UP, trigger: { chancePerDay: 0, fromHour: 7, untilHour: 9 } }
    const s = new StoryEventScheduler([never])
    expect(runDay(s, 1, fixed(0))).toHaveLength(0)
  })
})

describe('データの形（`STORY_EVENTS`）', () => {
  it('⚠ どのできごとにも選択肢がある（無い知らせはログへ・#24 の既決）', () => {
    for (const def of STORY_EVENTS) {
      expect(def.choices.length, def.id).toBeGreaterThan(0)
    }
  })

  it('id が重ならない', () => {
    const ids = STORY_EVENTS.map(d => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('時間帯が逆さまでない', () => {
    for (const def of STORY_EVENTS) {
      expect(def.trigger.untilHour, def.id).toBeGreaterThan(def.trigger.fromHour)
    }
  })

  it('話し手の名前が空でない（名前だけは必ず出す）', () => {
    for (const def of STORY_EVENTS) {
      expect(def.speaker.length, def.id).toBeGreaterThan(0)
    }
  })

  /** ⚠ **行商人の窓から品揃えへ行けること。**行けないと「見る」が何もしない選択肢になる */
  it('行商人のできごとに「積荷を見る」結末がある', () => {
    expect(PEDDLER.choices.some(c => c.outcome === '行商人の積荷を見る')).toBe(true)
    // 断る側は結末を持たない（閉じるだけ）
    expect(PEDDLER.choices.some(c => c.outcome === undefined)).toBe(true)
  })
})
