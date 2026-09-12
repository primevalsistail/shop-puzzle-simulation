import Phaser from 'phaser'
import { LEFT_PANEL_R, LOG_T, SCREEN_W, SCREEN_H } from './layout.js'

export type MessageType = 'sale' | 'event' | 'info'

const LOG_X = LEFT_PANEL_R   // 左パネル(0〜220)は侵食しない
const LOG_Y = LOG_T
const LOG_WIDTH = SCREEN_W - LOG_X
const LOG_HEIGHT = SCREEN_H - LOG_Y
const MAX_MESSAGES = 5
const LINE_HEIGHT = 18
const PADDING_X = 12
const PADDING_Y = 8
const DEPTH = 8

const TYPE_COLORS: Record<MessageType, string> = {
  sale: '#ffee44',
  event: '#00ffee',
  info: '#aaaaaa',
}

export class MessageLog {
  private lines: Phaser.GameObjects.Text[] = []
  private queue: { text: string; type: MessageType }[] = []

  constructor(private scene: Phaser.Scene) {}

  create(): void {
    // 背景
    this.scene.add.rectangle(
      LOG_X + LOG_WIDTH / 2,
      LOG_Y + LOG_HEIGHT / 2,
      LOG_WIDTH,
      LOG_HEIGHT,
      0x0d1117,
      0.92,
    ).setDepth(DEPTH).setStrokeStyle(1, 0x223344)

    // 上部区切り線
    const lineGfx = this.scene.add.graphics().setDepth(DEPTH)
    lineGfx.lineStyle(1, 0x334455, 0.9)
    lineGfx.lineBetween(LOG_X, LOG_Y, LOG_X + LOG_WIDTH, LOG_Y)

    // テキスト行（固定数を事前生成して再利用）
    for (let i = 0; i < MAX_MESSAGES; i++) {
      const y = LOG_Y + PADDING_Y + i * LINE_HEIGHT
      const t = this.scene.add.text(LOG_X + PADDING_X, y, '', {
        fontSize: '13px',
        color: '#aaaaaa',
        fontStyle: 'normal',
      }).setDepth(DEPTH + 1)
      this.lines.push(t)
    }
  }

  addMessage(text: string, type: MessageType = 'info'): void {
    // ⚠ **`info` の同じ文を続けて出さない。**`info` は「いまどうなっているか」の説明なので、
    //   2回並べても増える情報が無い。5行しか無い欄が、掴み直しや回転で埋まって
    //   `売れた` が押し流される（束M・ペルソナ2巡目）。
    //   ⚠ `sale` と `event` は出来事なので、同じ文でも回数が情報。抑止しない
    const last = this.queue[this.queue.length - 1]
    if (type === 'info' && last?.type === 'info' && last.text === text) return
    this.queue.push({ text, type })
    if (this.queue.length > MAX_MESSAGES) {
      this.queue.shift()
    }
    this.refresh()
  }

  private refresh(): void {
    const start = Math.max(0, this.queue.length - MAX_MESSAGES)
    for (let i = 0; i < MAX_MESSAGES; i++) {
      const entry = this.queue[start + i]
      const line = this.lines[i]
      if (!line) continue
      if (entry) {
        line.setText(entry.text).setStyle({ color: TYPE_COLORS[entry.type] })
      } else {
        line.setText('')
      }
    }
  }
}
