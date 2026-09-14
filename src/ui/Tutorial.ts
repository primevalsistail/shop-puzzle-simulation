import Phaser from 'phaser'
import { STEPS } from './tutorialSteps.js'
import {
  TUTORIAL_TITLE_FONT_PX, TUTORIAL_BODY_FONT_PX, TUTORIAL_STEP_FONT_PX, TUTORIAL_BTN_FONT_PX,
  TUTORIAL_NEM_FONT_PX, TUTORIAL_PANEL_W, TUTORIAL_PANEL_H,
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
      this.scene.add.rectangle(width / 2, height / 2, TUTORIAL_PANEL_W, TUTORIAL_PANEL_H, BG_WINDOW)
        .setStrokeStyle(3, LINE_STRONG),
    )

    objs.push(
      this.scene.add.text(width / 2, height / 2 - 150, step.title, {
        fontSize: `${TUTORIAL_TITLE_FONT_PX}px`,
        color: css(TEXT_BODY),
        fontStyle: 'bold',
      }).setOrigin(0.5),
    )

    // 猫が指す1行。⚠ **ノエラより上・小さく・弱い色**（指すだけで、説明はしない）
    objs.push(
      this.scene.add.text(width / 2, height / 2 - 96, step.nem, {
        fontSize: `${TUTORIAL_NEM_FONT_PX}px`,
        color: css(TEXT_WEAK),
        align: 'center',
      }).setOrigin(0.5),
    )

    objs.push(
      this.scene.add.text(width / 2, height / 2 - 6, step.noela, {
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
    const btnText = isLast ? '店を開ける' : '次へ'
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
