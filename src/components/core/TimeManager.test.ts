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

  it('初期時刻は Day1 08:00', () => {
    expect(tm.getCurrentTime()).toEqual({ day: 1, hour: 8, minute: 0 })
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

  it('60分で1時間進む', () => {
    tm.startAdvancing()
    tm.update(100 * 60) // 60分分のdelta
    expect(tm.getCurrentTime()).toEqual({ day: 1, hour: 9, minute: 0 })
  })

  it('24時間で翌日になる', () => {
    tm.startAdvancing()
    tm.update(100 * 60 * 16) // 16時間分（8時スタートなので24:00到達）
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
