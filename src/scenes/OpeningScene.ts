import Phaser from 'phaser'
import { OPENING_STEPS, OPENING_LAST_LABEL, OPENING_NEXT_LABEL, OPENING_SKIP_LABEL } from '../ui/openingSteps.js'
import {
  SCREEN_W, SCREEN_H,
  OPENING_FACE_CX, OPENING_FACE_CY, OPENING_TEXT_L, OPENING_TEXT_CY, OPENING_TEXT_FONT_PX,
  OPENING_STEP_FONT_PX, OPENING_STEP_Y,
  OPENING_BTN_CX, OPENING_BTN_Y, OPENING_BTN_W, OPENING_BTN_H, OPENING_BTN_FONT_PX,
  OPENING_SKIP_CX, OPENING_SKIP_Y, OPENING_SKIP_FONT_PX,
} from '../ui/layout.js'
import {
  BG_SCREEN, BTN_ADVANCE, BTN_ADVANCE_HOVER, BTN_TEXT, LINE_STRONG,
  TEXT_SUB, TEXT_WEAK, css,
} from '../ui/palette.js'

/**
 * はじまりの場面（#6）。**「はじめる」を押したときだけ出る。**
 *
 * ⚠ **中身（文・誰の顔か）は `ui/openingSteps.ts`。**ここは出し方だけを持つ
 *   （`Tutorial` と `tutorialSteps` と同じ分け方。**Phaser を読まない側にしないと検査できない**）。
 * ⚠ **終わったら `GameScene` を `fresh` で始める。**遊び方の案内はそのあとに出る
 *   （`GameScene.create` の末尾）。**ここで案内を出さないこと。二度読ませることになる。**
 */
export class OpeningScene extends Phaser.Scene {
  private stepIndex = 0
  private objs: Phaser.GameObjects.GameObject[] = []

  constructor() {
    super({ key: 'OpeningScene' })
  }

  create(): void {
    this.stepIndex = 0
    this.add.rectangle(SCREEN_W / 2, SCREEN_H / 2, SCREEN_W, SCREEN_H, BG_SCREEN)

    // ⚠ **飛ばすところは出し直さない**（段が変わっても残る）
    const skip = this.add.text(OPENING_SKIP_CX, OPENING_SKIP_Y, OPENING_SKIP_LABEL, {
      fontSize: `${OPENING_SKIP_FONT_PX}px`, color: css(TEXT_WEAK),
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    skip.on('pointerdown', () => this.toGame())

    this.buildStep()
  }

  private buildStep(): void {
    for (const obj of this.objs) obj.destroy()
    this.objs = []

    const step = OPENING_STEPS[this.stepIndex]
    const isLast = this.stepIndex === OPENING_STEPS.length - 1

    this.objs.push(
      this.add.image(OPENING_FACE_CX, OPENING_FACE_CY, step.face).setOrigin(0.5),
      this.add.text(OPENING_TEXT_L, OPENING_TEXT_CY, step.text, {
        fontSize: `${OPENING_TEXT_FONT_PX}px`, color: css(TEXT_SUB), align: 'left',
      }).setOrigin(0, 0.5),
      this.add.text(OPENING_BTN_CX, OPENING_STEP_Y, `${this.stepIndex + 1} / ${OPENING_STEPS.length}`, {
        fontSize: `${OPENING_STEP_FONT_PX}px`, color: css(TEXT_WEAK),
      }).setOrigin(0.5),
    )

    const bg = this.add.rectangle(OPENING_BTN_CX, OPENING_BTN_Y, OPENING_BTN_W, OPENING_BTN_H, BTN_ADVANCE)
      .setStrokeStyle(1.5, LINE_STRONG).setInteractive({ useHandCursor: true })
    bg.on('pointerover', () => bg.setFillStyle(BTN_ADVANCE_HOVER))
    bg.on('pointerout', () => bg.setFillStyle(BTN_ADVANCE))
    bg.on('pointerdown', () => {
      if (isLast) {
        this.toGame()
      } else {
        this.stepIndex++
        this.buildStep()
      }
    })
    this.objs.push(
      bg,
      this.add.text(OPENING_BTN_CX, OPENING_BTN_Y, isLast ? OPENING_LAST_LABEL : OPENING_NEXT_LABEL, {
        fontSize: `${OPENING_BTN_FONT_PX}px`, color: css(BTN_TEXT),
      }).setOrigin(0.5),
    )
  }

  private toGame(): void {
    this.scene.start('GameScene', { fresh: true })
  }
}
