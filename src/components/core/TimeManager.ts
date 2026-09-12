import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'
import type { GameTime } from '../../types/index.js'

const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
const TICK_INTERVAL_MS = 100 // 100ms = 1ゲーム分（10ゲーム分/秒）

/**
 * 一日の区分（#25）。
 *
 *   6:00-10:00 作業 ／ 10:00-20:00 営業 ／ 20:00-24:00 作業 ／ 24:00-6:00 睡眠
 *
 * **客が来るのは `営業` の間だけ。**24:00 に達したら 6:00 へ飛ばして日付を進めるので、
 * `睡眠` は状態としては存在するが、時計がそこに留まることはない。
 */
export type DayPhase = '作業' | '営業' | '睡眠'

export const OPEN_HOUR = 10
export const CLOSE_HOUR = 20
export const WAKE_HOUR = 6

/** 一日のうち起きている分数（6:00→24:00）。加工が1日に収まるかの判定に使う */
export const AWAKE_MINUTES_PER_DAY = (HOURS_PER_DAY - WAKE_HOUR) * MINUTES_PER_HOUR

export function phaseOf(hour: number): DayPhase {
  if (hour < WAKE_HOUR) return '睡眠'
  if (hour < OPEN_HOUR) return '作業'
  if (hour < CLOSE_HOUR) return '営業'
  return '作業'
}

export class TimeManager {
  /** 開始は **6:00**（#41）。`WAKE_HOUR` と同じで、一日の最初の `作業` から始まる */
  private time: GameTime = { day: 1, hour: WAKE_HOUR, minute: 0 }
  private advancing = false
  private accumulated = 0

  update(deltaMs: number): void {
    if (!this.advancing) return
    this.accumulated += deltaMs
    while (this.accumulated >= TICK_INTERVAL_MS) {
      this.accumulated -= TICK_INTERVAL_MS
      this.tick()
    }
  }

  startAdvancing(): void {
    this.advancing = true
    this.accumulated = 0
    EventBus.emit(GameEvents.TIME_ADVANCE_STARTED)
  }

  stopAdvancing(): void {
    this.advancing = false
    this.accumulated = 0
    EventBus.emit(GameEvents.TIME_ADVANCE_STOPPED)
  }

  isAdvancing(): boolean {
    return this.advancing
  }

  getCurrentTime(): GameTime {
    return { ...this.time }
  }

  setTime(time: GameTime): void {
    this.time = { ...time }
  }

  /** いまの区分（作業／営業／睡眠） */
  getPhase(): DayPhase {
    return phaseOf(this.time.hour)
  }

  /** いま店が開いているか。客が来るのはこれが true の間だけ */
  isOpen(): boolean {
    return this.getPhase() === '営業'
  }

  /** 24:00 まであと何分か。加工がその日のうちに終わるかの判定に使う（#25 Q3 = B） */
  minutesUntilEndOfDay(): number {
    return HOURS_PER_DAY * MINUTES_PER_HOUR - (this.time.hour * MINUTES_PER_HOUR + this.time.minute)
  }

  /**
   * 時計を n 分だけ**飛ばす**（#25 Q2 = B）。
   *
   * ⚠ **`TIME_MINUTE_PASSED` を出さない。**この間は客が来ない、というのがこの関数の意味。
   *   加工がこれを呼ぶ ——「**加工している間は店が閉まる**」＝ 作る時間は売る機会の損失。
   */
  skipMinutes(minutes: number): void {
    const before = this.time.day
    for (let i = 0; i < minutes; i++) this.advanceMinute()
    EventBus.emit(GameEvents.TIME_SKIPPED, { minutes, time: this.getCurrentTime() })
    if (this.time.day !== before) {
      EventBus.emit(GameEvents.TIME_DAY_CHANGED, this.getCurrentTime())
    }
  }

  private tick(): void {
    const phaseBefore = this.getPhase()
    const dayBefore = this.time.day
    this.advanceMinute()
    EventBus.emit(GameEvents.TIME_MINUTE_PASSED, this.getCurrentTime())
    if (this.getPhase() !== phaseBefore) {
      EventBus.emit(GameEvents.TIME_PHASE_CHANGED, this.getPhase())
    }
    if (this.time.day !== dayBefore) {
      EventBus.emit(GameEvents.TIME_DAY_CHANGED, this.getCurrentTime())
    }
  }

  private advanceMinute(): void {
    this.time.minute++
    if (this.time.minute >= MINUTES_PER_HOUR) {
      this.time.minute = 0
      this.time.hour++
    }
    // 24:00 に達したら睡眠を飛ばして翌日 6:00 へ（#25）
    if (this.time.hour >= HOURS_PER_DAY) {
      this.time.hour = WAKE_HOUR
      this.time.day++
    }
  }
}
