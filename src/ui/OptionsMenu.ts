import type Phaser from 'phaser'
import { optionSections } from './options.js'
import type { OptionSlider, OptionSwitch } from './options.js'
import {
  CONFIRM_BTN_W, CONFIRM_BTN_H, CONFIRM_BTN_FONT_PX,
  OPTIONS_MW, OPTIONS_ROW_W, OPTIONS_ROW_H, OPTIONS_SECTION_H,
  OPTIONS_TITLE_FONT_PX, OPTIONS_SECTION_FONT_PX, OPTIONS_ROW_FONT_PX, OPTIONS_NOTE_FONT_PX,
  OPTIONS_TOGGLE_W, OPTIONS_TOGGLE_H, OPTIONS_KNOB_R,
  OPTIONS_SLIDER_W, OPTIONS_SLIDER_TRACK_H, OPTIONS_SLIDER_KNOB_R,
  OPTIONS_VALUE_FONT_PX,
  optionsSliderCx, optionsSliderDx, optionsSliderValue, optionsValueCx,
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
  /**
   * **場面そのものに付けた見張りを外すための控え。**
   * ⚠ **`destroy()` では外れない**（付けた先が場面の入力で、消したものではない）。
   *   **外さないと、開くたびに増えて残る。**
   */
  private unhooks: (() => void)[] = []

  constructor(private scene: Phaser.Scene) {}

  isVisible(): boolean { return this.objects.length > 0 }

  open(): void { this.build() }

  close(): void {
    for (const obj of this.objects) obj.destroy()
    this.objects = []
    for (const off of this.unhooks) off()
    this.unhooks = []
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
    const draw: ({ kind: 'section'; title: string }
      | { kind: 'row'; row: OptionSwitch }
      | { kind: 'slider'; slider: OptionSlider }
      | { kind: 'note'; text: string })[] = []
    for (const section of sections) {
      kinds.push('section')
      draw.push({ kind: 'section', title: section.title })
      for (const row of section.rows) {
        kinds.push('row')
        draw.push({ kind: 'row', row })
      }
      for (const slider of section.sliders ?? []) {
        kinds.push('slider')
        draw.push({ kind: 'slider', slider })
      }
      for (const note of section.notes ?? []) {
        kinds.push('note')
        draw.push({ kind: 'note', text: note })
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

      if (item.kind === 'slider') {
        this.slider(cx, y, item.slider)
        return
      }

      if (item.kind === 'note') {
        // ⚠ **枠もつまみも付けない。**押せるように見えると押される
        this.push(
          this.scene.add.text(optionsLabelL(cx), y, item.text, {
            fontSize: `${OPTIONS_NOTE_FONT_PX}px`, color: css(TEXT_SUB),
          }).setOrigin(0, 0.5).setDepth(DEPTH),
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
   * **0〜100 のつまみ**（#14 の音量。PO 指示 2026-09-15）。
   *
   * ⚠ **面ごと作り直さない**（入／切とはここが違う）。**掴んで動かしている間ずっと変わる**ので、
   *   **作り直すと掴んでいたものが消える。**丸と数字だけを動かす。
   * ⚠ **掴む面は溝より広い**（`OPTIONS_ROW_H`）。**細い溝は掴みづらい。**
   * ⚠ **指が溝の外へ出ても離すまで付いてくる**（`optionsSliderValue` が 0〜100 に収める）。
   */
  private slider(cx: number, y: number, slider: OptionSlider): void {
    // ⚠ **下地と字を先に作る。**あとから作ると**後のものが上に出る**ので、
    //   **溝も丸も数字も、行の下地に隠れる**
    this.push(
      this.scene.add.rectangle(cx, y, OPTIONS_ROW_W, OPTIONS_ROW_H, ROW_LOCAL)
        .setStrokeStyle(1.5, LINE_STRONG).setDepth(DEPTH),
      this.scene.add.text(optionsLabelL(cx), y, slider.label, {
        fontSize: `${OPTIONS_ROW_FONT_PX}px`, color: css(TEXT_BODY),
      }).setOrigin(0, 0.5).setDepth(DEPTH),
    )

    const sx = optionsSliderCx(cx)
    const left = sx - OPTIONS_SLIDER_W / 2

    const track = this.scene.add.graphics().setDepth(DEPTH)
    const knob = this.scene.add.circle(0, y, OPTIONS_SLIDER_KNOB_R, BG_WINDOW)
      .setStrokeStyle(1.5, LINE_STRONG).setDepth(DEPTH)
    const value = this.scene.add.text(optionsValueCx(cx), y, '', {
      fontSize: `${OPTIONS_VALUE_FONT_PX}px`, color: css(TEXT_BODY),
    }).setOrigin(0.5).setDepth(DEPTH)

    const redraw = (v: number): void => {
      track.clear()
      track.fillStyle(BTN_BACK_OFF, 1)
      track.fillRoundedRect(left, y - OPTIONS_SLIDER_TRACK_H / 2,
        OPTIONS_SLIDER_W, OPTIONS_SLIDER_TRACK_H, OPTIONS_SLIDER_TRACK_H / 2)
      // ⚠ **通ってきたぶんを塗る。**塗らないと、いまどのくらいかが丸の位置だけになる
      const filled = OPTIONS_SLIDER_W * Math.min(1, Math.max(0, v / 100))
      if (filled > 0) {
        track.fillStyle(FILTER_ON_BG, 1)
        track.fillRoundedRect(left, y - OPTIONS_SLIDER_TRACK_H / 2,
          filled, OPTIONS_SLIDER_TRACK_H, OPTIONS_SLIDER_TRACK_H / 2)
      }
      knob.setPosition(sx + optionsSliderDx(v), y)
      value.setText(String(v))
    }
    redraw(slider.value())

    const hit = this.scene.add
      .rectangle(sx, y, OPTIONS_SLIDER_W + OPTIONS_SLIDER_KNOB_R * 2, OPTIONS_ROW_H, BG_WINDOW, 0)
      .setInteractive({ useHandCursor: true }).setDepth(DEPTH)
    let holding = false
    const moveTo = (pointerX: number): void => {
      const v = optionsSliderValue(pointerX, cx)
      slider.set(v)
      // ⚠ **書いた値ではなく、覚えられた値を描く**（範囲の外は向こうで丸められる）
      redraw(slider.value())
    }
    hit.on('pointerdown', (p: Phaser.Input.Pointer) => { holding = true; moveTo(p.x) })
    hit.on('pointermove', (p: Phaser.Input.Pointer) => { if (holding) moveTo(p.x) })
    // ⚠ **離すのは画面のどこでもよい**（溝の外で離しても掴んだままにしない）
    const release = (): void => { holding = false }
    this.scene.input.on('pointerup', release)
    this.unhooks.push(() => { this.scene.input.off('pointerup', release) })
    hit.on('pointerover', () => knob.setFillStyle(ROW_LOCAL))
    hit.on('pointerout',  () => knob.setFillStyle(BG_WINDOW))

    this.push(track, knob, value, hit)
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
