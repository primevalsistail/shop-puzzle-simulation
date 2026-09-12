import { describe, it, expect, beforeEach } from 'vitest'
import { TimeManager } from './TimeManager.js'
import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'

describe('TimeManager', () => {
  let tm: TimeManager

  beforeEach(() => {
    EventBus.removeAllListeners()
    tm = new TimeManager()
  })

  it('初期時刻は Day1 06:00（#41）', () => {
    expect(tm.getCurrentTime()).toEqual({ day: 1, hour: 6, minute: 0 })  // #41
  })

  it('startAdvancing で時間が進む（update に十分なdeltaを渡す）', () => {
    tm.startAdvancing()
    tm.update(100) // 100ms = 1分
    expect(tm.getCurrentTime().minute).toBe(1)
  })

  it('stopAdvancing で時間が止まる', () => {
    tm.startAdvancing()
    tm.update(100)
    tm.stopAdvancing()
    tm.update(100)
    expect(tm.getCurrentTime().minute).toBe(1) // 止まっているので増えない
  })

  it('skipMinutes は時計を飛ばす（加工がこれを呼ぶ）', () => {
    tm.setTime({ day: 1, hour: 8, minute: 0 })
    tm.skipMinutes(120)
    expect(tm.getCurrentTime()).toEqual({ day: 1, hour: 10, minute: 0 })
  })

  it('skipMinutes は TIME_MINUTE_PASSED を出さない（＝その間は客が来ない）', () => {
    let count = 0
    EventBus.on(GameEvents.TIME_MINUTE_PASSED, () => { count++ })
    tm.skipMinutes(60)
    expect(count).toBe(0)
  })

  // HUD の時計はこのペイロードだけを頼りに追いつく（GameScene の TIME_SKIPPED 購読）。
  // day をまたぐ場合も飛んだ後の時刻が入っていること。
  it('TIME_SKIPPED は飛ばした分数と飛んだ後の時刻を渡す', () => {
    const payloads: unknown[] = []
    EventBus.on(GameEvents.TIME_SKIPPED, (p) => payloads.push(p))

    tm.setTime({ day: 1, hour: 23, minute: 55 })
    tm.skipMinutes(5) // 24:00 到達 → 翌日 6:00

    expect(payloads).toEqual([
      { minutes: 5, time: { day: 2, hour: 6, minute: 0 } },
    ])
  })

  it('60分で1時間進む', () => {
    tm.startAdvancing()
    tm.update(100 * 60) // 60分分のdelta
    expect(tm.getCurrentTime()).toEqual({ day: 1, hour: 7, minute: 0 })
  })

  it('24時間で翌日になる', () => {
    tm.startAdvancing()
    tm.update(100 * 60 * 18) // 18時間分（6時スタートなので24:00到達）
    expect(tm.getCurrentTime().day).toBe(2)
    expect(tm.getCurrentTime().hour).toBe(6) // 睡眠を飛ばして翌日6:00（#25）
  })

  it('TIME_MINUTE_PASSED イベントが発行される', () => {
    const times: unknown[] = []
    EventBus.on(GameEvents.TIME_MINUTE_PASSED, (t) => times.push(t))
    tm.startAdvancing()
    tm.update(300) // 3分
    expect(times).toHaveLength(3)
  })

  it('TIME_ADVANCE_STARTED イベントが発行される', () => {
    let fired = false
    EventBus.on(GameEvents.TIME_ADVANCE_STARTED, () => { fired = true })
    tm.startAdvancing()
    expect(fired).toBe(true)
  })

  it('TIME_ADVANCE_STOPPED イベントが発行される', () => {
    let fired = false
    EventBus.on(GameEvents.TIME_ADVANCE_STOPPED, () => { fired = true })
    tm.startAdvancing()
    tm.stopAdvancing()
    expect(fired).toBe(true)
  })

  it('区分は 6-10 作業 / 10-20 営業 / 20-24 作業', () => {
    tm.setTime({ day: 1, hour: 8, minute: 0 })
    expect(tm.getPhase()).toBe('作業')
    expect(tm.isOpen()).toBe(false)
    tm.setTime({ day: 1, hour: 10, minute: 0 })
    expect(tm.getPhase()).toBe('営業')
    expect(tm.isOpen()).toBe(true)
    tm.setTime({ day: 1, hour: 19, minute: 59 })
    expect(tm.isOpen()).toBe(true)
    tm.setTime({ day: 1, hour: 20, minute: 0 })
    expect(tm.getPhase()).toBe('作業')
    expect(tm.isOpen()).toBe(false)
  })

  it('24:00 に達したら睡眠を飛ばして翌日 6:00 になる', () => {
    tm.setTime({ day: 1, hour: 23, minute: 59 })
    tm.startAdvancing()
    tm.update(100)
    expect(tm.getCurrentTime()).toEqual({ day: 2, hour: 6, minute: 0 })
  })

  it('minutesUntilEndOfDay は 24:00 までの分数を返す', () => {
    tm.setTime({ day: 1, hour: 22, minute: 30 })
    expect(tm.minutesUntilEndOfDay()).toBe(90)
  })
})

describe('速度切り替え', () => {
  it('等倍から始まり、押すごとに 3倍 → 10倍 → 等倍 と回る', () => {
    const tm = new TimeManager()
    expect(tm.getSpeed()).toBe(1)
    expect(tm.cycleSpeed()).toBe(3)
    expect(tm.cycleSpeed()).toBe(10)
    expect(tm.cycleSpeed()).toBe(1)
  })

  it('速くすると同じ delta でより多くの分が進む', () => {
    const slow = new TimeManager()
    slow.startAdvancing()
    slow.update(1000)          // 等倍なら10分

    const fast = new TimeManager()
    fast.cycleSpeed()          // 3倍
    fast.startAdvancing()
    fast.update(1000)

    const m = (tm: TimeManager) => { const t = tm.getCurrentTime(); return t.hour * 60 + t.minute }
    expect(m(fast) - 6 * 60).toBe((m(slow) - 6 * 60) * 3)
  })

  it('⚠ 飛ばすのではなく速くする（売れた実感を消さないため、分は1つずつ進む）', () => {
    const tm = new TimeManager()
    let count = 0
    EventBus.on(GameEvents.TIME_MINUTE_PASSED, () => count++)
    tm.cycleSpeed()            // 3倍
    tm.startAdvancing()
    tm.update(1000)            // 30分ぶん
    expect(count).toBe(30)     // まとめて飛ばさず、30回イベントが出る
  })
})

describe('節目の合図（速さを上げても判断の瞬間を通り過ぎないため）', () => {
  it('作業→営業 と 営業→作業 で区分の合図が出る', () => {
    const phases: string[] = []
    EventBus.on(GameEvents.TIME_PHASE_CHANGED, (p: unknown) => phases.push(p as string))
    const tm = new TimeManager()
    tm.setTime({ day: 1, hour: 9, minute: 59 })
    tm.startAdvancing()
    tm.update(100)                       // 10:00 へ
    expect(phases).toEqual(['営業'])

    tm.setTime({ day: 1, hour: 19, minute: 59 })
    tm.update(100)                       // 20:00 へ
    expect(phases).toEqual(['営業', '作業'])
  })

  it('日が変わる合図が出る', () => {
    let day = 0
    EventBus.on(GameEvents.TIME_DAY_CHANGED, (t: unknown) => { day = (t as { day: number }).day })
    const tm = new TimeManager()
    tm.setTime({ day: 1, hour: 23, minute: 59 })
    tm.startAdvancing()
    tm.update(100)
    expect(day).toBe(2)
  })
})

/**
 * 加工が営業時間を何分削るか（#53）。
 *
 * ⚠ **issue #53 の本文は「加工が営業時間を食わないのでコストになっていない」と
 *   書いていたが、実測は逆だった。**`skipMinutes` が `TIME_MINUTE_PASSED` を
 *   出さないので、加工中は客が来ない ——コストは**すでに**払っている。
 *   足りなかったのは、**払っている額が画面に出ていないこと**のほう。
 */
describe('openMinutesWithin —— 加工が削る営業時間', () => {
  let tm: TimeManager

  beforeEach(() => {
    EventBus.removeAllListeners()
    tm = new TimeManager()
  })

  it('作業帯に収まるあいだは0分（夜20:00 から240分は削らない）', () => {
    tm.setTime({ day: 1, hour: 20, minute: 0 })
    expect(tm.openMinutesWithin(240)).toBe(0)
  })

  it('⚠ 朝6:00 は「24:00 まで1080分」あるが、その中に営業600分がまるごと入っている', () => {
    tm.setTime({ day: 1, hour: 6, minute: 0 })
    // fitsInToday はこの1080分を丸ごと通す。「今日のうちに終わる」と
    // 「営業時間を削らずに終わる」が別物である、というのがこの数字
    expect(tm.minutesUntilEndOfDay()).toBe(1080)
    // ⚠ **無料枠は 240分ではなく 239分。**240分目は 10:00 ちょうどに着き、
    //   その1分はもう営業（tick と同じ数え方）。夜20:00 側は 24:00→6:00 へ飛ぶので 240分
    expect(tm.openMinutesWithin(239)).toBe(0)
    expect(tm.openMinutesWithin(240)).toBe(1)
    expect(tm.openMinutesWithin(1080)).toBe(600) // 営業日をまるごと潰す
  })

  it('営業中に始めれば1分目から削る', () => {
    tm.setTime({ day: 1, hour: 15, minute: 0 })
    expect(tm.openMinutesWithin(1)).toBe(1)
    expect(tm.openMinutesWithin(60)).toBe(60)
  })

  it('⚠ 数え方が tick と揃っている（1分進めてから営業かを見る）', () => {
    // 9:59 → 10:00 の1分は「客が回る分」。tick は進めてから isOpen() を見るので、
    // ここも同じ順で数える。ずらすと境界の1分だけ答えが食い違う
    tm.setTime({ day: 1, hour: 9, minute: 59 })
    expect(tm.openMinutesWithin(1)).toBe(1)
    // 19:59 → 20:00 は閉店側。営業には数えない
    tm.setTime({ day: 1, hour: 19, minute: 59 })
    expect(tm.openMinutesWithin(1)).toBe(0)
  })

  it('実測と一致する —— 10:00 から600分で営業599分（睡眠を跨ぐと翌日ぶんも数える）', () => {
    tm.setTime({ day: 1, hour: 10, minute: 0 })
    expect(tm.openMinutesWithin(600)).toBe(599) // 10:01〜19:59
    // 24:00 は 6:00 へ飛ぶので、長い加工は翌日の営業まで食い込む
    tm.setTime({ day: 1, hour: 23, minute: 0 })
    // 23:00 +60分 で 24:00 → 6:00 へ飛ぶ。そこから240分で翌朝10:00 ちょうど
    expect(tm.openMinutesWithin(60 + 239)).toBe(0)
    expect(tm.openMinutesWithin(60 + 240)).toBe(1)      // 10:00 に着いた1分は営業
    expect(tm.openMinutesWithin(60 + 240 + 29)).toBe(30)
  })

  it('0分と負の分は0（ガード）', () => {
    tm.setTime({ day: 1, hour: 15, minute: 0 })
    expect(tm.openMinutesWithin(0)).toBe(0)
    expect(tm.openMinutesWithin(-5)).toBe(0)
  })
})
