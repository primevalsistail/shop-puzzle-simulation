import type Phaser from 'phaser'
import { optionSections } from './options.js'
import type { OptionSwitch } from './options.js'
import {
  CONFIRM_BTN_W, CONFIRM_BTN_H, CONFIRM_BTN_FONT_PX,
  OPTIONS_MW, OPTIONS_ROW_W, OPTIONS_ROW_H, OPTIONS_SECTION_H,
  OPTIONS_TITLE_FONT_PX, OPTIONS_SECTION_FONT_PX, OPTIONS_ROW_FONT_PX,
  OPTIONS_TOGGLE_W, OPTIONS_TOGGLE_H, OPTIONS_KNOB_R,
  OPTIONS_TITLE, OPTIONS_CLOSE_LABEL,
  optionsLayout, optionsCloseCy, optionsLabelL, optionsSectionL, optionsToggleCx, optionsKnobDx,
} from './layout.js'
import type { OptionsItemKind } from './layout.js'
import {
  BG_WINDOW,
  BTN_BACK,
  BTN_BACK_HOVER,
  BTN_BACK_OFF,
  BTN_TEXT,
  FILTER_ON_BG,
  LINE_STRONG,
  LINE_WEAK,
  ROW_LOCAL,
  SCRIM,
  SCRIM_ALPHA,
  TEXT_BODY,
  TEXT_SUB,
  css,
} from './palette.js'

/**
 * ⚠ **`SaveLoadMenu` と同じ 150。**どこからでも開くものなので、
 *   **場所の中身（100）より上**に要る。**幕（200）よりは下。**
 */
const DEPTH = 150

/**
 * **⚙️ から開く設定の面**（#113）。
 *
 * ⚠ **何が並ぶかはこのファイルが決めない。**`options.ts` の `optionSections()` を
 *   **上から順に積むだけ。**オプションを足すのは向こう側で、**ここは触らない。**
 * ⚠ **寸法も持たない。**位置は `layout.ts` の `optionsLayout()` が出す
 *   （**node のテストから測れるのはそちらだけ**）。
 *
 * ⚠ **4つ目の形を作らない。**全画面の暗幕 ＋ 画面中央の不透明な面で、
 *   `Tutorial` ／ `SaveLoadMenu` ／ できごとの窓 ／ `ConfirmDialog` と同じ作り。
 *
 * ⚠ **`<input>` はこの面では隠れない**（HTML は canvas より上に出る）。
 *   **隠すのは `GameScene.isOverlayOpen()` の側**（毎フレーム見ている）。ここでは触らない。
 */
export class OptionsMenu {
  private objects: Phaser.GameObjects.GameObject[] = []

  constructor(private scene: Phaser.Scene) {}

  isVisible(): boolean { return this.objects.length > 0 }

  open(): void { this.build() }

  close(): void {
    for (const obj of this.objects) obj.destroy()
    this.objects = []
  }

  private push(...objs: Phaser.GameObjects.GameObject[]): void {
    objs.forEach(o => { this.objects.push(o) })
  }

  private build(): void {
    this.close()

    const { width, height } = this.scene.scale
    const cx = width / 2
    const cy = height / 2

    // 見出しと行を、出てくる順のまま1本に並べる。
    // ⚠ **描く並びと測る並びを同じ1本から作ること**（別々に組むとずれる）
    const sections = optionSections()
    const kinds: OptionsItemKind[] = []
    const draw: (({ kind: 'section'; title: string } | { kind: 'row'; row: OptionSwitch }))[] = []
    for (const section of sections) {
      kinds.push('section')
      draw.push({ kind: 'section', title: section.title })
      for (const row of section.rows) {
        kinds.push('row')
        draw.push({ kind: 'row', row })
      }
    }
    const { panelH, cys } = optionsLayout(kinds)
    const top = cy - panelH / 2

    // ⚠ **暗幕は全画面。**`setInteractive()` を外さないこと（下の表を押させないのはこの面）
    this.push(
      this.scene.add.rectangle(cx, cy, width, height, SCRIM, SCRIM_ALPHA)
        .setInteractive().setDepth(DEPTH),
    )

    // ⚠ **面は不透明**（透けると後ろの棚と混ざる）
    this.push(
      this.scene.add.rectangle(cx, cy, OPTIONS_MW, panelH, BG_WINDOW)
        .setStrokeStyle(3, LINE_STRONG).setInteractive().setDepth(DEPTH),
    )

    this.push(
      this.scene.add.text(cx, top + 39, OPTIONS_TITLE, {
        fontSize: `${OPTIONS_TITLE_FONT_PX}px`, color: css(TEXT_BODY), fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(DEPTH),
    )

    draw.forEach((item, i) => {
      const y = top + cys[i]
      if (item.kind === 'section') {
        this.push(
          this.scene.add.text(optionsSectionL(cx), y, item.title, {
            fontSize: `${OPTIONS_SECTION_FONT_PX}px`, color: css(TEXT_SUB), fontStyle: 'bold',
          }).setOrigin(0, 0.5).setDepth(DEPTH),
          // 見出しの下の細い線。**どこまでがこの区分かを出す**
          this.scene.add.rectangle(cx, y + OPTIONS_SECTION_H / 2, OPTIONS_ROW_W, 1.5, LINE_WEAK)
            .setDepth(DEPTH),
        )
        return
      }

      const { row } = item
      this.push(
        this.scene.add.rectangle(cx, y, OPTIONS_ROW_W, OPTIONS_ROW_H, ROW_LOCAL)
          .setStrokeStyle(1.5, LINE_STRONG).setDepth(DEPTH),
        this.scene.add.text(optionsLabelL(cx), y, row.label, {
          fontSize: `${OPTIONS_ROW_FONT_PX}px`, color: css(TEXT_BODY),
        }).setOrigin(0, 0.5).setDepth(DEPTH),
      )
      // ⚠ **切り替えたら面ごと作り直す。**つまみの位置と色が状態そのものなので、
      //   **描いたものを動かすより、作り直すほうが食い違わない**
      const on = row.isOn()
      this.toggle(optionsToggleCx(cx), y, on, () => {
        row.set(!on)
        this.build()
      })
    })

    this.button(cx, optionsCloseCy(cy, panelH), OPTIONS_CLOSE_LABEL, BTN_BACK, BTN_BACK_HOVER,
      () => this.close())
  }

  /**
   * 入／切のつまみ（PO 指示 2026-09-15「トグル形式に」）。
   *
   * ⚠ **溝は角の丸い長方形なので `Graphics` で描く**（`rectangle` では角が丸くならない）。
   * ⚠ **押させるのは上に重ねた見えない面。**`Graphics` は当たり判定を自分で持たない。
   */
  private toggle(x: number, y: number, on: boolean, onClick: () => void): void {
    const groove = this.scene.add.graphics().setDepth(DEPTH)
    groove.fillStyle(on ? FILTER_ON_BG : BTN_BACK_OFF, 1)
    groove.fillRoundedRect(
      x - OPTIONS_TOGGLE_W / 2, y - OPTIONS_TOGGLE_H / 2,
      OPTIONS_TOGGLE_W, OPTIONS_TOGGLE_H, OPTIONS_TOGGLE_H / 2,
    )
    groove.lineStyle(1.5, LINE_STRONG, 1)
    groove.strokeRoundedRect(
      x - OPTIONS_TOGGLE_W / 2, y - OPTIONS_TOGGLE_H / 2,
      OPTIONS_TOGGLE_W, OPTIONS_TOGGLE_H, OPTIONS_TOGGLE_H / 2,
    )

    const knob = this.scene.add.circle(x + optionsKnobDx(on), y, OPTIONS_KNOB_R, BG_WINDOW)
      .setStrokeStyle(1.5, LINE_STRONG).setDepth(DEPTH)

    const hit = this.scene.add
      .rectangle(x, y, OPTIONS_TOGGLE_W, OPTIONS_TOGGLE_H, BG_WINDOW, 0)
      .setInteractive({ useHandCursor: true }).setDepth(DEPTH)
    hit.on('pointerover', () => knob.setFillStyle(ROW_LOCAL))
    hit.on('pointerout',  () => knob.setFillStyle(BG_WINDOW))
    hit.on('pointerdown', onClick)

    this.push(groove, knob, hit)
  }

  private button(
    x: number, y: number, label: string, fill: number, hover: number, onClick: () => void,
  ): void {
    const bg = this.scene.add.rectangle(x, y, CONFIRM_BTN_W, CONFIRM_BTN_H, fill)
      .setStrokeStyle(1.5, LINE_STRONG).setInteractive({ useHandCursor: true }).setDepth(DEPTH)
    bg.on('pointerover', () => bg.setFillStyle(hover))
    bg.on('pointerout',  () => bg.setFillStyle(fill))
    bg.on('pointerdown', onClick)
    this.push(
      bg,
      this.scene.add.text(x, y, label, {
        fontSize: `${CONFIRM_BTN_FONT_PX}px`, color: css(BTN_TEXT),
      }).setOrigin(0.5).setDepth(DEPTH),
    )
  }
}
