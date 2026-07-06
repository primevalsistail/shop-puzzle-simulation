import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'
import type { GameTime } from '../../types/index.js'

const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
const TICK_INTERVAL_MS = 100 // 100ms = 1ゲーム分（10ゲーム分/秒）

export class TimeManager {
  private time: GameTime = { day: 1, hour: 8, minute: 0 }
  private advancing = false
  private crafting = false
  private accumulated = 0

  update(deltaMs: number): void {
    if (!this.advancing || this.crafting) return
    this.accumulated += deltaMs
    while (this.accumulated >= TICK_INTERVAL_MS) {
      this.accumulated -= TICK_INTERVAL_MS
      this.tick()
    }
  }

  startAdvancing(): void {
    if (this.crafting) return
    this.advancing = true
    this.accumulated = 0
    EventBus.emit(GameEvents.TIME_ADVANCE_STARTED)
  }

  stopAdvancing(): void {
    this.advancing = false
    this.accumulated = 0
    EventBus.emit(GameEvents.TIME_ADVANCE_STOPPED)
  }

  pause(): void {
    this.crafting = true
  }

  resume(): void {
    this.crafting = false
  }

  isCrafting(): boolean {
    return this.crafting
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

  private tick(): void {
    this.advanceMinute()
    EventBus.emit(GameEvents.TIME_MINUTE_PASSED, this.getCurrentTime())
  }

  private advanceMinute(): void {
    this.time.minute++
    if (this.time.minute >= MINUTES_PER_HOUR) {
      this.time.minute = 0
      this.time.hour++
    }
    if (this.time.hour >= HOURS_PER_DAY) {
      this.time.hour = 0
      this.time.day++
    }
  }
}
