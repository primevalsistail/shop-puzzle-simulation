import type Phaser from 'phaser'
import {
  SCREEN_W, SCREEN_H, MSG_SCRIM_ALPHA, MSG_WIN_CX, MSG_WIN_CY,
  MSG_LINE_H, MSG_TEXT_FONT_PX,
  CONFIRM_MW, CONFIRM_MH, CONFIRM_TEXT_TOP,
  CONFIRM_BTN_W, CONFIRM_BTN_H, CONFIRM_BTN_CY, CONFIRM_BTN_FONT_PX,
  CONFIRM_CANCEL_LABEL, confirmBtnCx,
} from './layout.js'

/**
 * ⚠ **場所の中身（`PlaceFrame` の 90 ／ 中身 100）より上、
 *   セーブ／ロード（150）より下。**確認は場所の中から出るので中身より上に要り、
 *   **どこからでも開けるセーブ**（PO 判断 2026-09-12 Q2）には譲る。
 */
const DEPTH = 130

/**
 * 確認を出す行為（#113「確認ダイアログを行為ごとに ON/OFF できるようにしたい」）。
 *
 * ⚠ **既定は全部 ON。**切り替える口はここ1つで、**#113 はこの表を設定から書き換えるだけ**になる。
 *   **設定の画面はまだ作らない**（#113 の範囲）。
 * ⚠ **行為を足すときはこの型に足す。**足さずに `ConfirmDialog` を直に開くと、
 *   **その行為だけ ON/OFF が効かない**ものができる。
 */
export type ConfirmAction = '廃棄'

const CONFIRM_ON: Record<ConfirmAction, boolean> = { 廃棄: true }

/** その行為に確認が要るか（#113）。**押す側は必ずここを通す** */
export function confirmNeeded(action: ConfirmAction): boolean {
  return CONFIRM_ON[action]
}

/**
 * **戻らない操作の前に出す確認**（納品の `廃棄`。PO 指示 2026-09-14「ダイアログ形式で」）。
 *
 * ⚠ **4つ目の形を作らない。**この作りのダイアログは
 *   **`Tutorial` ／ `SaveLoadMenu` ／ できごとの窓**の3つで、どれも
 *   **全画面の暗幕 ＋ 画面中央の不透明な面**である（`MessageWindow` の注記）。
 *   **色も `SaveLoadMenu` と同じ**（同じ作りのダイアログを2つの色で出さない）。
 *
 * ⚠ **文字はここで作らない。**本文は `ui/delivery.ts`（Phaser を読まない）が持ち、
 *   寸法は `layout.ts` が持つ。**ここで組み立てると `layout.test.ts` が実物を測れない。**
 *
 * ⚠ **決めてから閉じるのではなく、閉じてから呼ぶ。**先に呼ぶと、結末が
 *   別の画面を作り直したときに面がその上に残る（`MessageWindow.show()` と同じ順）。
 */
export class ConfirmDialog {
  private objects: Phaser.GameObjects.GameObject[] = []

  constructor(private scene: Phaser.Scene) {}

  isShown(): boolean {
    return this.objects.length > 0
  }

  /**
   * 出す。**`onConfirm` を呼ぶのは「する」側を押したときだけ。**
   *
   * @param lines     本文。**1要素が1行**（折り返さない ＝ node のテストから測れる）
   * @param okLabel   実行する側の字。⚠ **押したボタンと同じ語を渡すこと**（`廃棄` → `廃棄`）
   */
  open(lines: readonly string[], okLabel: string, onConfirm: () => void): void {
    if (this.isShown()) return

    // ⚠ **暗幕は全画面。**窓の下だけでは「前に出ている」に見えない（PO 2026-09-14）。
    //   ⚠ **`setInteractive()` を外さないこと。**下の表を押させないのはこの面。
    this.objects.push(
      this.scene.add
        .rectangle(MSG_WIN_CX, MSG_WIN_CY, SCREEN_W, SCREEN_H, 0x000000, MSG_SCRIM_ALPHA)
        .setInteractive()
        .setDepth(DEPTH),
    )

    // ⚠ **面は不透明。**透けると後ろの表と混ざって、暗幕を敷いても沈まない
    this.objects.push(
      this.scene.add
        .rectangle(MSG_WIN_CX, MSG_WIN_CY, CONFIRM_MW, CONFIRM_MH, 0x16213e)
        .setStrokeStyle(2, 0x5566cc)
        .setInteractive()
        .setDepth(DEPTH + 1),
    )

    lines.forEach((line, i) => {
      this.objects.push(
        this.scene.add.text(MSG_WIN_CX, CONFIRM_TEXT_TOP + i * MSG_LINE_H, line, {
          fontSize: `${MSG_TEXT_FONT_PX}px`, color: '#ffffff',
        }).setOrigin(0.5, 0).setDepth(DEPTH + 2),
      )
    })

    // ⚠ **左が実行、右がやめる**（`SaveLoadMenu` の確認と同じ並び）
    this.button(confirmBtnCx(0, 2), okLabel, 0x6a3a3a, 0x8a4a4a, () => {
      this.close()
      onConfirm()
    })
    this.button(confirmBtnCx(1, 2), CONFIRM_CANCEL_LABEL, 0x3a3a4a, 0x555566, () => this.close())
  }

  /** 片付ける。**押されなくても、表を離れるときに呼ばれる** */
  close(): void {
    for (const obj of this.objects) obj.destroy()
    this.objects = []
  }

  private button(
    x: number, label: string, fill: number, hover: number, onClick: () => void,
  ): void {
    const bg = this.scene.add
      .rectangle(x, CONFIRM_BTN_CY, CONFIRM_BTN_W, CONFIRM_BTN_H, fill)
      .setStrokeStyle(1, 0x666677)
      .setInteractive({ useHandCursor: true })
      .setDepth(DEPTH + 2)
    bg.on('pointerover', () => bg.setFillStyle(hover))
    bg.on('pointerout', () => bg.setFillStyle(fill))
    bg.on('pointerdown', onClick)
    this.objects.push(
      bg,
      this.scene.add.text(x, CONFIRM_BTN_CY, label, {
        fontSize: `${CONFIRM_BTN_FONT_PX}px`, color: '#bbbbcc',
      }).setOrigin(0.5).setDepth(DEPTH + 3),
    )
  }
}
