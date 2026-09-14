import Phaser from 'phaser'
import { hasAnySave } from '../components/progress/GameProgress.js'
import {
  SCREEN_W, SCREEN_H,
  GAME_TITLE, TITLE_NAME_FONT_PX, TITLE_NAME_Y, TITLE_FACE_CY,
  TITLE_BTN_W, TITLE_BTN_H, TITLE_BTN_FONT_PX,
  TITLE_BTN_NEW_Y, TITLE_BTN_CONTINUE_Y, TITLE_BTN_NEW_LABEL, TITLE_BTN_CONTINUE_LABEL,
} from '../ui/layout.js'
import {
  BG_SCREEN, BTN_ADVANCE, BTN_ADVANCE_HOVER, BTN_BACK, BTN_BACK_HOVER, BTN_BACK_OFF,
  BTN_TEXT, BTN_TEXT_OFF, LINE_STRONG, TEXT_BODY, css,
} from '../ui/palette.js'

/**
 * タイトル画面（#114）。**題名・はじめる・つづきから の3つだけ。**
 *
 * ⚠ **「つづきから」は、記録が1つも無ければ押せない。**押せてしまうと、
 *   **空の枠が3つ並んだロードの画面が出る**だけで、何も起きない。
 * ⚠ **「つづきから」が開くのは、いつものロードの画面。**枠は3つあるので、
 *   **どれを読むかはここで決めない**（決めると、ここにも枠の一覧が要る）。
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }

  create(): void {
    this.add.rectangle(SCREEN_W / 2, SCREEN_H / 2, SCREEN_W, SCREEN_H, BG_SCREEN)

    this.add.text(SCREEN_W / 2, TITLE_NAME_Y, GAME_TITLE, {
      fontSize: `${TITLE_NAME_FONT_PX}px`, color: css(TEXT_BODY), fontStyle: 'bold',
    }).setOrigin(0.5)

    // 主人公の顔。⚠ **252×370 をそのまま出す**（拡縮すると輪郭がぼやける）
    this.add.image(SCREEN_W / 2, TITLE_FACE_CY, 'noela').setOrigin(0.5)

    this.makeButton(TITLE_BTN_NEW_Y, TITLE_BTN_NEW_LABEL, BTN_ADVANCE, BTN_ADVANCE_HOVER,
      () => this.scene.start('GameScene', { fresh: true }))

    const canContinue = hasAnySave()
    this.makeButton(TITLE_BTN_CONTINUE_Y, TITLE_BTN_CONTINUE_LABEL,
      canContinue ? BTN_BACK : BTN_BACK_OFF, BTN_BACK_HOVER,
      canContinue ? () => this.scene.start('GameScene', { openLoad: true }) : null)
  }

  private makeButton(
    cy: number, label: string, normal: number, hover: number, action: (() => void) | null,
  ): void {
    const bg = this.add.rectangle(SCREEN_W / 2, cy, TITLE_BTN_W, TITLE_BTN_H, normal)
      .setStrokeStyle(1.5, LINE_STRONG)
    this.add.text(SCREEN_W / 2, cy, label, {
      fontSize: `${TITLE_BTN_FONT_PX}px`, color: css(action ? BTN_TEXT : BTN_TEXT_OFF),
    }).setOrigin(0.5)
    if (!action) return
    bg.setInteractive({ useHandCursor: true })
    bg.on('pointerdown', action)
    bg.on('pointerover', () => bg.setFillStyle(hover))
    bg.on('pointerout', () => bg.setFillStyle(normal))
  }
}
