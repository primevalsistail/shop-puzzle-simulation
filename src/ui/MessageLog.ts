import type Phaser from 'phaser'
import { LEFT_PANEL_R, LOG_T, SCREEN_W, SCREEN_H, LOG_LINE_FONT_PX } from './layout.js'
import { BG_PANEL, LINE_STRONG, LINE_WEAK, SCROLL_THUMB, ST_OK, ST_SELECTED, TEXT_SUB, css } from './palette.js'

export type MessageType = 'sale' | 'event' | 'info'

export interface LogEntry {
  readonly text: string
  readonly type: MessageType
}

const LOG_X = LEFT_PANEL_R   // 左パネル(0〜330)は侵食しない
const LOG_Y = LOG_T
const LOG_WIDTH = SCREEN_W - LOG_X
const LOG_HEIGHT = SCREEN_H - LOG_Y
/** 一度に見える行数。**表示の値**（#40 の前から変えていない） */
const MAX_MESSAGES = 5
/**
 * 保持する件数。**表示とは別の値。**
 *
 * ⚠ **仮置き（#61 で測り直す）。**「1日ぶんの出来事を遡れる」を目安に置いた。
 *   売れた・着いた・出たの合計が1日あたり数十行なので、200 で数日ぶん残る。
 */
const MAX_HISTORY = 200
const LINE_HEIGHT = 27
const PADDING_X = 18
const PADDING_Y = 12
const DEPTH = 8
/** 遡れる量と、いまどこを見ているかを示す棒。⚠ **文字は足さない**（言い回しは PO が決める・#79） */
const BAR_W = 6
const BAR_MARGIN = 9

const TYPE_COLORS: Record<MessageType, string> = {
  sale: css(ST_OK),
  event: css(ST_SELECTED),
  info: css(TEXT_SUB),
}

/**
 * ログ欄。**保持（`MAX_HISTORY` 件）と表示（`MAX_MESSAGES` 行）を分けて持つ**（#40）。
 *
 * 以前は超えたぶんを `queue.shift()` で**捨てていた**ので、
 * 流れた行は「見られない」のではなく「**残っていない**」状態だった。
 *
 * ## 遡り方
 *
 * ⚠ **ログ欄の中で完結させる。行く場所（`PlaceFrame`）にはしない。**
 *   `PlaceFrame.isShown()` は `GameScene.isShelfBlocked()` に直結していて、
 *   **開いている間は棚に触れず時間も進まない。**ログを読むだけで店が止まるのは重い。
 *   → ログ欄の上でホイールを回すと遡る。それだけ。店は動き続ける。
 */
export class MessageLog {
  private lines: Phaser.GameObjects.Text[] = []
  /** ⚠ **捨てない。**`MAX_HISTORY` を超えたときだけ古い順に落とす */
  private history: LogEntry[] = []
  /** 何行ぶん遡っているか。0 ＝ 最新を見ている */
  private scroll = 0
  private bar?: Phaser.GameObjects.Graphics

  constructor(private scene: Phaser.Scene) {}

  create(): void {
    // 背景
    this.scene.add.rectangle(
      LOG_X + LOG_WIDTH / 2,
      LOG_Y + LOG_HEIGHT / 2,
      LOG_WIDTH,
      LOG_HEIGHT,
      BG_PANEL,
      0.92,
    ).setDepth(DEPTH).setStrokeStyle(1.5, LINE_STRONG)

    // 上部区切り線
    const lineGfx = this.scene.add.graphics().setDepth(DEPTH)
    lineGfx.lineStyle(1.5, LINE_WEAK, 0.9)
    lineGfx.lineBetween(LOG_X, LOG_Y, LOG_X + LOG_WIDTH, LOG_Y)

    // テキスト行（固定数を事前生成して再利用）
    for (let i = 0; i < MAX_MESSAGES; i++) {
      const y = LOG_Y + PADDING_Y + i * LINE_HEIGHT
      const t = this.scene.add.text(LOG_X + PADDING_X, y, '', {
        fontSize: `${LOG_LINE_FONT_PX}px`,
        color: css(TEXT_SUB),
        fontStyle: 'normal',
      }).setDepth(DEPTH + 1)
      this.lines.push(t)
    }

    this.bar = this.scene.add.graphics().setDepth(DEPTH + 1)

    // ⚠ **ログ欄の上だけ**で受ける。左パネル(〜330)の一覧送りと取り合わない
    this.scene.input.on('wheel', (
      pointer: Phaser.Input.Pointer,
      _over: unknown, _dx: number, dy: number,
    ) => {
      if (!this.isOverLog(pointer.x, pointer.y)) return
      // 下へ回すと新しいほうへ、上へ回すと古いほうへ
      this.scrollBy(dy > 0 ? -1 : 1)
    })

    this.refresh()
  }

  /** ログ欄の上か。⚠ 左端 `LOG_X` ちょうどは左パネル側に譲る（一覧の送りと重ねない） */
  private isOverLog(x: number, y: number): boolean {
    return x > LOG_X && x <= LOG_X + LOG_WIDTH && y >= LOG_Y && y <= LOG_Y + LOG_HEIGHT
  }

  addMessage(text: string, type: MessageType = 'info'): void {
    // ⚠ **`info` の同じ文を続けて出さない。**`info` は「いまどうなっているか」の説明なので、
    //   2回並べても増える情報が無い。5行しか無い欄が、掴み直しや回転で埋まって
    //   `売れた` が押し流される（束M・ペルソナ2巡目）。
    //   ⚠ `sale` と `event` は出来事なので、同じ文でも回数が情報。抑止しない
    // ⚠ **抑止は表示ではなく保持の側で行う**（#40 で決めた）。理由: `つかんでいる…` は
    //   `pointermove` ごとに来るので、保持側で通すと出来事が数十行で押し出され、
    //   遡っても同じ1文しか無い履歴になる。遡ったとき同じ文は並ばない。
    const last = this.history[this.history.length - 1]
    if (type === 'info' && last?.type === 'info' && last.text === text) return
    this.history.push({ text, type })
    if (this.history.length > MAX_HISTORY) {
      this.history.splice(0, this.history.length - MAX_HISTORY)
      // 古い側が落ちたぶん、見ている位置も詰める
      if (this.scroll > this.maxScroll()) this.scroll = this.maxScroll()
    }
    // ⚠ 遡っている最中は**読んでいる行を動かさない**（新しい1行ぶん位置をずらす）。
    //   追いつけなくなるので、上限に当たったら流れるに任せる
    if (this.scroll > 0) this.scroll = Math.min(this.scroll + 1, this.maxScroll())
    this.refresh()
  }

  /** 何行ぶんまで遡れるか */
  private maxScroll(): number {
    return Math.max(0, this.history.length - MAX_MESSAGES)
  }

  /** `+1` で1行古いほうへ、`-1` で1行新しいほうへ。端は超えない */
  scrollBy(delta: number): void {
    const next = Math.min(Math.max(0, this.scroll + delta), this.maxScroll())
    if (next === this.scroll) return
    this.scroll = next
    this.refresh()
  }

  /** 最新へ戻す */
  scrollToLatest(): void {
    if (this.scroll === 0) return
    this.scroll = 0
    this.refresh()
  }

  /** いま何行ぶん遡っているか（0 ＝ 最新） */
  getScroll(): number { return this.scroll }

  /** 保持している件数。⚠ **表示行数とは別** */
  historyLength(): number { return this.history.length }

  /** 保持しているものすべて（古い順）。遡りと検証のため */
  getHistory(): readonly LogEntry[] { return this.history }

  /** いま映っている行（上から順）。**最大 `MAX_MESSAGES` 行** */
  getVisible(): LogEntry[] {
    const end = this.history.length - this.scroll
    const start = Math.max(0, end - MAX_MESSAGES)
    return this.history.slice(start, end)
  }

  private refresh(): void {
    const shown = this.getVisible()
    for (let i = 0; i < MAX_MESSAGES; i++) {
      const entry = shown[i]
      const line = this.lines[i]
      if (!line) continue
      if (entry) {
        line.setText(entry.text).setStyle({ color: TYPE_COLORS[entry.type] })
      } else {
        line.setText('')
      }
    }
    this.drawBar()
  }

  /** 遡れることと、いまどこを見ているかを棒で示す。⚠ 文字は足さない */
  private drawBar(): void {
    const bar = this.bar
    if (!bar) return
    bar.clear()
    const total = this.history.length
    if (total <= MAX_MESSAGES) return
    const x = LOG_X + LOG_WIDTH - BAR_MARGIN - BAR_W
    const top = LOG_Y + BAR_MARGIN
    const trackH = LOG_HEIGHT - BAR_MARGIN * 2
    bar.fillStyle(LINE_WEAK, 0.9)
    bar.fillRect(x, top, BAR_W, trackH)
    const thumbH = Math.max(15, Math.round((MAX_MESSAGES / total) * trackH))
    // scroll が 0（最新）なら一番下
    const ratio = this.maxScroll() === 0 ? 0 : this.scroll / this.maxScroll()
    const thumbY = top + Math.round((1 - ratio) * (trackH - thumbH))
    bar.fillStyle(this.scroll > 0 ? SCROLL_THUMB : LINE_WEAK, 0.9)
    bar.fillRect(x, thumbY, BAR_W, thumbH)
  }
}
