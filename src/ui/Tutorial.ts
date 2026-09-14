import Phaser from 'phaser'
import { GOAL_TUTORIAL_LINE } from './goal.js'
import {
  TRADE_TITLE,
  TUTORIAL_TITLE_FONT_PX, TUTORIAL_BODY_FONT_PX, TUTORIAL_STEP_FONT_PX, TUTORIAL_BTN_FONT_PX,
} from './layout.js'
import {
  BG_WINDOW,
  BTN_ADVANCE,
  BTN_TEXT,
  LINE_STRONG,
  SCRIM,
  SCRIM_ALPHA,
  TEXT_BODY,
  TEXT_SUB,
  TEXT_WEAK,
  css,
} from './palette.js'

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
      .rectangle(0, 0, width, height, SCRIM, SCRIM_ALPHA)
      .setOrigin(0, 0)
      .setInteractive()
    objs.push(backdrop)

    objs.push(
      this.scene.add.rectangle(width / 2, height / 2, 720, 420, BG_WINDOW)
        .setStrokeStyle(3, LINE_STRONG),
    )

    objs.push(
      this.scene.add.text(width / 2, height / 2 - 150, step.title, {
        fontSize: `${TUTORIAL_TITLE_FONT_PX}px`,
        color: css(TEXT_BODY),
        fontStyle: 'bold',
      }).setOrigin(0.5),
    )

    objs.push(
      this.scene.add.text(width / 2, height / 2 - 30, step.body, {
        fontSize: `${TUTORIAL_BODY_FONT_PX}px`,
        color: css(TEXT_SUB),
        align: 'center',
      }).setOrigin(0.5),
    )

    const stepLabel = `${this.stepIndex + 1} / ${STEPS.length}`
    objs.push(
      this.scene.add.text(width / 2, height / 2 + 120, stepLabel, {
        fontSize: `${TUTORIAL_STEP_FONT_PX}px`,
        color: css(TEXT_WEAK),
      }).setOrigin(0.5),
    )

    const isLast = this.stepIndex === STEPS.length - 1
    const btnText = isLast ? '始める！' : '次へ'
    const nextBtn = this.scene.add.text(width / 2, height / 2 + 165, btnText, {
      fontSize: `${TUTORIAL_BTN_FONT_PX}px`,
      color: css(BTN_TEXT),
      backgroundColor: css(BTN_ADVANCE),
      padding: { x: 36, y: 15 },
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
