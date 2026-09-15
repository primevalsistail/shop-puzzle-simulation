import type Phaser from 'phaser'
import {
  SCREEN_W, SCREEN_H, MSG_WIN_CX, MSG_WIN_CY,
  MSG_LINE_H, MSG_TEXT_FONT_PX,
  CONFIRM_MW, CONFIRM_MH, CONFIRM_TEXT_TOP,
  CONFIRM_BTN_W, CONFIRM_BTN_H, CONFIRM_BTN_CY, CONFIRM_BTN_FONT_PX,
  CONFIRM_CANCEL_LABEL, confirmBtnCx,
} from './layout.js'
import {
  BG_WINDOW,
  BTN_ADVANCE,
  BTN_ADVANCE_HOVER,
  BTN_BACK,
  BTN_BACK_HOVER,
  BTN_TEXT,
  LINE_STRONG,
  SCRIM,
  SCRIM_ALPHA,
  TEXT_BODY,
  css,
} from './palette.js'

/**
 * ⚠ **場所の中身（`PlaceFrame` の 90 ／ 中身 100）より上、
 *   セーブ／ロード（150）より下。**確認は場所の中から出るので中身より上に要り、
 *   **どこからでも開けるセーブ**（PO 判断 2026-09-12 Q2）には譲る。
 */
const DEPTH = 130

/**
 * 確認を出す行為（#113）。
 *
 * ⚠ **配列が本体で、型はそこから作る。**union 型は実行時に数えられないので、
 *   **設定の行を自動で増やすにはこの向きが要る**（`OptionsMenu` がこの配列から行を作る）。
 * ⚠ **行為を足すときはここに足す。**足さずに `ConfirmDialog` を直に開くと、
 *   **その行為だけ ON/OFF が効かない**ものができる。
 */
export const CONFIRM_ACTIONS = [
  '廃棄',
  // #99。⚠ **型は10本あり、縮小図と名前でしか見分けられない。**
  //   押し間違えても**元の並びは戻らない**（覚え直すには、その並びをもう一度作るしかない）
  'マイセットの上書き',
  'マイセットの削除',
  // #109。⚠ **営業時間を1分も削らないときは、そもそも呼ばない**（朝と閉店後の加工に確認は出ない）。
  //   **押した瞬間に時計が飛び、その間は客が1人も来ない** —— 止まれる場所がここしかない
  '営業時間を削る加工',
] as const

export type ConfirmAction = typeof CONFIRM_ACTIONS[number]

/**
 * 覚えさせ方は `localStorage`（`Tutorial` と同じ形）。⚠ **読み書きは必ず `try/catch`。**
 *
 * ⚠ **記録するのは「出さない」ほうだけ。**ON/OFF の表をそのまま書くと、
 *   **あとから行為を足したとき、古い記録に無い行為の既定が決まらない。**
 *   **「入っていない ＝ 出す」**にしておけば、足した行為は黙って既定（出す）になる。
 * ⚠ **セーブデータ（枠3つ）には混ぜない。**遊びの記録ではなく、この端末の好み。
 */
const CONFIRM_OFF_KEY = 'shop_puzzle_confirm_off'

const CONFIRM_ON: Record<ConfirmAction, boolean> = {
  廃棄: true,
  'マイセットの上書き': true,
  'マイセットの削除': true,
  '営業時間を削る加工': true,
}

function loadConfirmSettings(): void {
  try {
    const raw = localStorage.getItem(CONFIRM_OFF_KEY)
    if (!raw) return
    const off: unknown = JSON.parse(raw)
    if (!Array.isArray(off)) return
    for (const action of CONFIRM_ACTIONS) CONFIRM_ON[action] = !off.includes(action)
  } catch {
    // ignore
  }
}

function saveConfirmSettings(): void {
  try {
    const off = CONFIRM_ACTIONS.filter(action => !CONFIRM_ON[action])
    localStorage.setItem(CONFIRM_OFF_KEY, JSON.stringify(off))
  } catch {
    // ignore
  }
}

// ⚠ **読み込みは1度だけ。**呼ぶたびに読むと、設定の画面で変えた値が次の確認で戻る
loadConfirmSettings()

/** その行為に確認が要るか（#113）。**押す側は必ずここを通す** */
export function confirmNeeded(action: ConfirmAction): boolean {
  return CONFIRM_ON[action]
}

/** 出す・出さないを切り替えて覚えさせる（#113。**呼ぶのは `OptionsMenu` だけ**） */
export function setConfirmNeeded(action: ConfirmAction, on: boolean): void {
  CONFIRM_ON[action] = on
  saveConfirmSettings()
}

/**
 * **戻らない操作の前に出す確認**（納品の `廃棄`。PO 指示 2026-09-14「ダイアログ形式で」）。
 *
 * ⚠ **マイセットの `保存`（上書き）と `削除` もここを通る**（#99）。
 *   **升にボタンは1つも増えない** —— 面は全画面の暗幕の上に出るので、行の作りは変わらない。
 *
 * ⚠ **4つ目の形を作らない。**この作りのダイアログは
 *   **`Tutorial` ／ `SaveLoadMenu` ／ できごとの窓**の3つで、どれも
 *   **全画面の暗幕 ＋ 画面中央の不透明な面**である（`MessageWindow` の注記）。
 *   **色も `SaveLoadMenu` と同じ**（同じ作りのダイアログを2つの色で出さない）。
 *
 * ⚠ **文字はここで作らない。**本文は `ui/delivery.ts` ／ `ShelfPresets.ts`（Phaser を読まない）が持ち、
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
   * @param onClose   **どちらを押しても**閉じたあとに呼ぶ。任意。
   *   ⚠ **`<input>` を隠した画面が戻すために要る**（`PresetMenu`）。
   *   **HTML は canvas より上に出るので、depth では暗幕の下へ回らない**（`domInput.ts` の注記）。
   *   **「する」を押したときは `onConfirm` のあと。**
   */
  open(
    lines: readonly string[], okLabel: string, onConfirm: () => void, onClose?: () => void,
  ): void {
    if (this.isShown()) return

    // ⚠ **暗幕は全画面。**窓の下だけでは「前に出ている」に見えない（PO 2026-09-14）。
    //   ⚠ **`setInteractive()` を外さないこと。**下の表を押させないのはこの面。
    this.objects.push(
      this.scene.add
        .rectangle(MSG_WIN_CX, MSG_WIN_CY, SCREEN_W, SCREEN_H, SCRIM, SCRIM_ALPHA)
        .setInteractive()
        .setDepth(DEPTH),
    )

    // ⚠ **面は不透明。**透けると後ろの表と混ざって、暗幕を敷いても沈まない
    this.objects.push(
      this.scene.add
        .rectangle(MSG_WIN_CX, MSG_WIN_CY, CONFIRM_MW, CONFIRM_MH, BG_WINDOW)
        .setStrokeStyle(3, LINE_STRONG)
        .setInteractive()
        .setDepth(DEPTH + 1),
    )

    lines.forEach((line, i) => {
      this.objects.push(
        this.scene.add.text(MSG_WIN_CX, CONFIRM_TEXT_TOP + i * MSG_LINE_H, line, {
          fontSize: `${MSG_TEXT_FONT_PX}px`, color: css(TEXT_BODY),
        }).setOrigin(0.5, 0).setDepth(DEPTH + 2),
      )
    })

    // ⚠ **左が実行、右がやめる**（`SaveLoadMenu` の確認と同じ並び）
    this.button(confirmBtnCx(0, 2), okLabel, BTN_ADVANCE, BTN_ADVANCE_HOVER, () => {
      this.close()
      onConfirm()
      onClose?.()
    })
    this.button(confirmBtnCx(1, 2), CONFIRM_CANCEL_LABEL, BTN_BACK, BTN_BACK_HOVER, () => {
      this.close()
      onClose?.()
    })
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
      .setStrokeStyle(1.5, LINE_STRONG)
      .setInteractive({ useHandCursor: true })
      .setDepth(DEPTH + 2)
    bg.on('pointerover', () => bg.setFillStyle(hover))
    bg.on('pointerout', () => bg.setFillStyle(fill))
    bg.on('pointerdown', onClick)
    this.objects.push(
      bg,
      this.scene.add.text(x, CONFIRM_BTN_CY, label, {
        fontSize: `${CONFIRM_BTN_FONT_PX}px`, color: css(BTN_TEXT),
      }).setOrigin(0.5).setDepth(DEPTH + 3),
    )
  }
}
