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

  it('pause 中は時間が進まない', () => {
    tm.startAdvancing()
    tm.pause()
    tm.update(500)
    expect(tm.getCurrentTime().minute).toBe(0)
  })

  it('resume 後は時間が進む', () => {
    tm.startAdvancing()
    tm.pause()
    tm.update(500)
    tm.resume()
    tm.update(100)
    expect(tm.getCurrentTime().minute).toBe(1)
  })

  it('60分で1時間進む', () => {
    tm.startAdvancing()
    tm.update(100 * 60) // 60分分のdelta
    expect(tm.getCurrentTime()).toEqual({ day: 1, hour: 9, minute: 0 })
  })

  it('24時間で翌日になる', () => {
    tm.startAdvancing()
    tm.update(100 * 60 * 16) // 16時間分（8時スタートなので翌0時）
    expect(tm.getCurrentTime().day).toBe(2)
    expect(tm.getCurrentTime().hour).toBe(0)
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

  it('isCrafting は pause/resume で切り替わる', () => {
    expect(tm.isCrafting()).toBe(false)
    tm.pause()
    expect(tm.isCrafting()).toBe(true)
    tm.resume()
    expect(tm.isCrafting()).toBe(false)
  })
})
