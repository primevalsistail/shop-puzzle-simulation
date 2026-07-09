import Phaser from 'phaser'

export type MessageType = 'sale' | 'event' | 'info'

const LOG_X = 220        // 左パネル(0〜220)は侵食しない
const LOG_Y = 610
const LOG_WIDTH = 1060   // 1280 - 220
const LOG_HEIGHT = 110
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
