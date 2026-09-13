import { STORY_EVENTS } from './StoryEvents.js'
import type { StoryEventDef } from './StoryEvents.js'

/**
 * できごとの発火（#24）。**Phaser を読まない。**
 *
 * ## どう動くか
 *
 *   1. 日が変わったら、できごとごとに **1回だけ引く**（`ensureDay`）。
 *      当たったら、その日の**どの分に起きるか**まで決めて控えておく。
 *   2. 時間を進めている最中、1分ごとに `due()` を訊く。控えの時刻に達していたら返す。
 *
 * ⚠ **ここに個々のできごとの名前を書かないこと。**規則（`SET_RULES`）と同じで、
 *   **1本足すのはデータ（`STORY_EVENTS`）の側だけ**で済む形にしてある。
 *
 * ## なぜ日の変わり目に出さないのか（#90）
 *
 * 日の変わり目は `GameScene.pauseAt` が必ず時間を止める瞬間なので、そこへ出すと
 * **止まったところに窓が重なる**だけで、「店を回している最中に人が来た」にならない。
 * **時間を進めている最中に出す**（#90 の必須要件）。
 */
export interface ScheduledStoryEvent {
  readonly def: StoryEventDef
  /** その日の何時何分に起きるか */
  readonly hour: number
  readonly minute: number
}

export class StoryEventScheduler {
  /** 何日ぶんを引いてあるか。0 は「まだ引いていない」 */
  private day = 0
  /** その日ぶんの控え。**起きたら消える** */
  private pending: ScheduledStoryEvent[] = []

  /**
   * @param defs 引く対象。**既定は `STORY_EVENTS`。**試験は自前の一覧を渡す
   *             （＝ 1本足すのにこのファイルを触らなくてよいことの裏返し）
   */
  constructor(private readonly defs: readonly StoryEventDef[] = STORY_EVENTS) {}

  /**
   * その日ぶんを引く。
   *
   * ⚠ **同じ日に2度呼んでも引き直さない**（`false` を返して何もしない）。
   *   呼ぶ側は日の変わり目とロード直後の両方から呼ぶので、ここで守らないと
   *   **ロードするたび引き直せる**（`PeddlerStock.refresh` と同じ作り）。
   */
  ensureDay(day: number, rand: () => number = Math.random): boolean {
    const d = Math.max(1, Math.floor(day))
    if (d === this.day) return false
    this.day = d
    this.pending = []
    for (const def of this.defs) {
      const span = (def.trigger.untilHour - def.trigger.fromHour) * 60
      if (span <= 0) continue
      // ⚠ **引くのは「起きるか」が先、「何分に」が後。**順を入れ替えると、
      //   同じ種を渡した試験の結果が黙って変わる
      if (rand() >= def.trigger.chancePerDay) continue
      const at = Math.min(span - 1, Math.floor(rand() * span))
      this.pending.push({
        def,
        hour: def.trigger.fromHour + Math.floor(at / 60),
        minute: at % 60,
      })
    }
    this.pending.sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute))
    return true
  }

  /**
   * いま起きるできごと。**取り出したら控えから消える**（同じ日に2度起きない）。
   *
   * ⚠ **`<=` で見る。**加工（`TimeManager.skipMinutes`）は1分ごとの出来事を出さないので、
   *   控えの時刻を**飛び越えることがある。**`===` にすると、その日のぶんが黙って消える。
   */
  due(hour: number, minute: number): StoryEventDef | null {
    const now = hour * 60 + minute
    const i = this.pending.findIndex(p => p.hour * 60 + p.minute <= now)
    if (i < 0) return null
    const [taken] = this.pending.splice(i, 1)
    return taken.def
  }

  /** その日まだ起きていないもの（検証のため） */
  scheduled(): readonly ScheduledStoryEvent[] {
    return this.pending
  }

  /** 何日ぶんを引いてあるか */
  getDay(): number {
    return this.day
  }
}
