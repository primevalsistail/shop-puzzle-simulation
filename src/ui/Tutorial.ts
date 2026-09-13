import Phaser from 'phaser'
import { GOAL_TUTORIAL_LINE } from './goal.js'
import { TRADE_TITLE } from './layout.js'

const TUTORIAL_KEY = 'shop_puzzle_tutorial_done'

const STEPS = [
  {
    title: 'ようこそ！',
    // ⚠ **「運ぶ操作だ」と書く**（#70）。押して離すだけでは置けない。
    body: '左の持ち物から品を選んで\n売り場に置きましょう。\n品は押したまま運んで離します。\n\n右クリックで回転できます。',
  },
  {
    title: '時間を進める',
    body: '右下の「▶ 進める」を押すと\n時間が高速で進みます。\n\nお客さんが来るのは 10:00〜20:00 の\n「営業」の間だけです。',
  },
  {
    title: '工房',
    body: '「工房」ボタンから材料を使って\n品を作ることができます。\n\n作っている間は店が閉まり、\nその分だけ時間が進みます。\n\n日をまたぐ加工は始められません。',
  },
  {
    // ⚠ **ボタンの名と同じにすること**（#96 で `商人のところ` は `取引` の中のタブになった）。
    //   ここだけ古い名が残ると、**押すボタンが画面に無い**と読まれる
    title: TRADE_TITLE,
    // ⚠ **目標額をここに書かない**（#73）。`goal.ts` が `GameService.GOAL_AMOUNT` から出す。
    //   **初日に必ず見る画面**なので、ここが実際の条件と違うと遊び始めから嘘になる
    body: `「${TRADE_TITLE}」ボタンから材料を買えます。\n\n${GOAL_TUTORIAL_LINE}`,
  },
]

export class Tutorial {
  private container: Phaser.GameObjects.Container | null = null
  private stepIndex = 0

  constructor(private scene: Phaser.Scene) {}

  /** 出ているか。**`GameScene` が `<input>` を隠すために見る**（depth 500 で全部を覆う） */
  isShown(): boolean {
    return this.container !== null
  }

  shouldShow(): boolean {
    try {
      return !localStorage.getItem(TUTORIAL_KEY)
    } catch {
      return true
    }
  }

  show(onDone: () => void): void {
    this.stepIndex = 0
    this.buildStep(onDone)
  }

  private buildStep(onDone: () => void): void {
    this.container?.destroy()
    const { width, height } = this.scene.scale
    const step = STEPS[this.stepIndex]

    const objs: Phaser.GameObjects.GameObject[] = []

    const backdrop = this.scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0, 0)
      .setInteractive()
    objs.push(backdrop)

    objs.push(
      this.scene.add.rectangle(width / 2, height / 2, 480, 280, 0x1a1a3a)
        .setStrokeStyle(2, 0x4a4a8a),
    )

    objs.push(
      this.scene.add.text(width / 2, height / 2 - 100, step.title, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    )

    objs.push(
      this.scene.add.text(width / 2, height / 2 - 20, step.body, {
        fontSize: '16px',
        color: '#cccccc',
        align: 'center',
      }).setOrigin(0.5),
    )

    const stepLabel = `${this.stepIndex + 1} / ${STEPS.length}`
    objs.push(
      this.scene.add.text(width / 2, height / 2 + 80, stepLabel, {
        fontSize: '13px',
        color: '#888888',
      }).setOrigin(0.5),
    )

    const isLast = this.stepIndex === STEPS.length - 1
    const btnText = isLast ? '始める！' : '次へ'
    const nextBtn = this.scene.add.text(width / 2, height / 2 + 110, btnText, {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#4a4a8a',
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    nextBtn.on('pointerdown', () => {
      if (isLast) {
        this.finish(onDone)
      } else {
        this.stepIndex++
        this.buildStep(onDone)
      }
    })
    objs.push(nextBtn)

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(500)
  }

  private finish(onDone: () => void): void {
    this.container?.destroy()
    this.container = null
    try {
      localStorage.setItem(TUTORIAL_KEY, '1')
    } catch {
      // ignore
    }
    onDone()
  }
}
