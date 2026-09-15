import Phaser from 'phaser'
import { hasAnySave, readSlotMeta } from '../components/progress/GameProgress.js'
import { SaveLoadMenu } from '../ui/SaveLoadMenu.js'
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
 * ⚠ **「つづきから」の枠3つは、この画面の上に重ねる**（#123・PO 判断 2026-09-15）。
 *   **`GameScene` を先に作らないこと。**作ると**選ぶ前に1日目の画面が見えてしまう**
 *   （それが #123）。**枠を選んでから `GameScene` を始める。**
 */
export class TitleScene extends Phaser.Scene {
  private loadMenu!: SaveLoadMenu

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
      // ⚠ **「はじめる」は、はじまりの場面を通してから `GameScene` へ**（#6）。
      //   **「つづきから」は通さない**（2周目に同じ語りを読ませない）
      () => this.scene.start('OpeningScene'))

    // ⚠ **枠は `GameProgress` を作らずに読む**（`readSlotMeta`）。
    //   ここには所持金も盤面もまだ無い。
    // ⚠ **セーブ側は呼ばれない**（ロードのときは空の枠が押せない）。
    this.loadMenu = new SaveLoadMenu(
      this,
      (slot) => readSlotMeta(slot),
      () => {},
      // ⚠ **確認の「読み込む」を押したあとここへ来る**（PO 判断 2026-09-15 Q2 ／ 確認は残す）。
      //   **`GameScene` は `create()` のうちに読み込みまで済ませる**ので、
      //   **1日目の画面は一度も描かれない**（#123）
      (slot) => this.scene.start('GameScene', { loadSlot: slot }),
    )

    const canContinue = hasAnySave()
    this.makeButton(TITLE_BTN_CONTINUE_Y, TITLE_BTN_CONTINUE_LABEL,
      canContinue ? BTN_BACK : BTN_BACK_OFF, BTN_BACK_HOVER,
      // ⚠ **「キャンセル」は枠の面を閉じるだけ。**閉じればこの画面が残る
      //   ＝ タイトルへ戻る（PO 判断 2026-09-15 Q3）
      canContinue ? () => this.loadMenu.openLoad() : null)
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
