import { describe, it, expect, beforeEach } from 'vitest'
import { EventBus } from './EventBus.js'
import { GameEvents } from '../types/index.js'

describe('EventBus', () => {
  beforeEach(() => {
    EventBus.removeAllListeners()
  })

  it('イベントを発行してリスナーが呼ばれる', () => {
    let called = false
    EventBus.on(GameEvents.TIME_MINUTE_PASSED, () => { called = true })
    EventBus.emit(GameEvents.TIME_MINUTE_PASSED, { day: 1, hour: 8, minute: 1 })
    expect(called).toBe(true)
  })

  it('ペイロードがリスナーに渡される', () => {
    let received: unknown
    EventBus.on(GameEvents.TIME_MINUTE_PASSED, (time) => { received = time })
    const payload = { day: 1, hour: 9, minute: 30 }
    EventBus.emit(GameEvents.TIME_MINUTE_PASSED, payload)
    expect(received).toEqual(payload)
  })

  it('off でリスナーが解除される', () => {
    let count = 0
    const listener = () => { count++ }
    EventBus.on(GameEvents.TIME_ADVANCE_STARTED, listener)
    EventBus.emit(GameEvents.TIME_ADVANCE_STARTED)
    EventBus.off(GameEvents.TIME_ADVANCE_STARTED, listener)
    EventBus.emit(GameEvents.TIME_ADVANCE_STARTED)
    expect(count).toBe(1)
  })

  it('once は1回だけ呼ばれる', () => {
    let count = 0
    EventBus.once(GameEvents.PROGRESS_GOAL_COMPLETE, () => { count++ })
    EventBus.emit(GameEvents.PROGRESS_GOAL_COMPLETE)
    EventBus.emit(GameEvents.PROGRESS_GOAL_COMPLETE)
    expect(count).toBe(1)
  })

  it('複数リスナーを登録できる', () => {
    let a = 0, b = 0
    EventBus.on(GameEvents.ECONOMY_MONEY_CHANGED, () => { a++ })
    EventBus.on(GameEvents.ECONOMY_MONEY_CHANGED, () => { b++ })
    EventBus.emit(GameEvents.ECONOMY_MONEY_CHANGED)
    expect(a).toBe(1)
    expect(b).toBe(1)
  })

  it('removeAllListeners で全リスナーが解除される', () => {
    let count = 0
    EventBus.on(GameEvents.TIME_ADVANCE_STOPPED, () => { count++ })
    EventBus.removeAllListeners()
    EventBus.emit(GameEvents.TIME_ADVANCE_STOPPED)
    expect(count).toBe(0)
  })
})
