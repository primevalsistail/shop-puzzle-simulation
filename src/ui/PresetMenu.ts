import Phaser from 'phaser'
import type { ShelfPresets, PresetSlot } from '../components/floor/ShelfPresets.js'
import {
  PRESET_COUNT, PRESET_NAME_MAX, describePreset, defaultPresetLabel,
} from '../components/floor/ShelfPresets.js'
import type { ItemRegistry } from '../components/items/ItemRegistry.js'
import type { GridSize } from '../types/index.js'
import type { PlaceFrame } from './PlaceFrame.js'
import { CONTENT_DEPTH } from './PlaceFrame.js'
import { createInput, tryAddDom, setGameKeyboard } from './domInput.js'
import {
  CONTENT_L, ROWS_TOP, ROWS_BOTTOM, PRESET_TEXT_FONT_PX, PRESET_SUB_FONT_PX,
  PRESET_COLS, PRESET_GAP_X, PRESET_CELL_W, PRESET_PREVIEW_W,
  PRESET_TEXT_L_OFFSET, PRESET_NAME_INPUT_W, PRESET_NAME_INPUT_H,
} from './layout.js'

/** 2列 × 5行。**型は10本**（`PRESET_COUNT`） */
const COLS = PRESET_COLS
const ROWS = PRESET_COUNT / COLS

/** ⚠ **横の寸法は `layout.ts`。**名前の入力欄が入るかを `layout.test.ts` が見るため */
const GAP_X = PRESET_GAP_X
const GAP_Y = 12
const CELL_W = PRESET_CELL_W
const CELL_H = Math.floor((ROWS_BOTTOM - ROWS_TOP) / ROWS)

/** 盤面の縮小図を置く枠 */
const PREVIEW_W = PRESET_PREVIEW_W
const PREVIEW_H = CELL_H - 33

/** セーブ ／ ロード ／ 削除 */
const BTN_H = 36
const BTN_W = 114
const BTN_GAP = 10.5

/**
 * マイセット（#27）。**ダイアログではなく「行く場所」**（#58）。
 *
 * ⚠ **覚えるのは「どこに何をどの向きで出しているか」だけ。**持ち物も在庫も動かさない。
 *   棚は「どこに出しているか」を表すだけで、**並べても在庫は減らない**（段2.5）。
 *   だから型を覚えるのも呼び出すのも**何も消費しない。**
 *
 * ⚠ **番号で呼ばない**（PO 2026-09-12）。「型1」「型2」では**中身が思い出せない。**
 *   **盤面の縮小図**をそのまま出し、**見て選ばせる。**
 *
 * ⚠ **覚えたときの島を出す**（#67。PO 判断 Q5 のベース案 A）。`12区画` が2つ並ぶと
 *   **文字が完全に同一**になり、縮小図しか手がかりが無かった。
 *   ⚠ **区画数と「全部下ろす」は 2026-09-13 に落とした**（PO 指示）。**出すのは島名だけで、
 *   中身は縮小図が背負う。**同じ島で2本覚えると、また字が同一になる（→ #47 で判断待ち）。
 *   ⚠ **文字は `describePreset`（`ShelfPresets.ts`）が組む。**ここで組むと検査できない。
 *
 * ⚠ **名前は `<input>` で直に打たせる**（#83。PO 判断 Q5「そのあとにユーザが編集できればいい」）。
 *   **入力欄は `container` に入れない。**`refresh()` は中身をまるごと `destroy()` するので、
 *   一緒に入れると**打鍵のたびに作り直されてカーソルが飛ぶ**（`SearchBox` と同じ地雷）。
 *   **開くとき1度だけ置き、閉じるときに捨てる。**`refresh()` は値と `placeholder` を
 *   合わせ直すだけ（`syncNameInputs`）。
 * ⚠ **空にしたら島名（既定値）へ戻る。**`placeholder` に既定値を出しているので、
 *   **名前を付けなければ従来どおりに見える**（ペルソナ2人が名前に反対している）。
 */
export class PresetMenu {
  private container: Phaser.GameObjects.Container | null = null
  private isOpen = false
  /**
   * 名前の入力欄。**型1本につき1つ。**⚠ **`container` とは別に持つ**（作り直さないため）。
   * DOM が使えないときは `null` のままで、そのときは升に文字を出す。
   */
  private nameDoms: (Phaser.GameObjects.DOMElement | null)[] = []
  private nameInputs: (HTMLInputElement | null)[] = []

  constructor(
    private scene: Phaser.Scene,
    private presets: ShelfPresets,
    private registry: ItemRegistry,
    private frame: PlaceFrame,
    /** いまの盤面の大きさ。縮小図の枠に使う */
    private gridSize: () => GridSize,
    private onSave: (index: number) => void,
    private onApply: (index: number) => void,
    private onDelete: (index: number) => void,
    private onClose: () => void,
  ) {
    // シーンが終わるとき DOM が残らないようにする（`SearchBox` と同じ）
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroyNameInputs())
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroyNameInputs())
  }

  open(): void {
    if (this.isOpen) return
    this.isOpen = true
    this.frame.show('マイセット', () => this.close())
    // ⚠ **入力欄はここで1度だけ置く。**`build()` から置くと打鍵ごとに作り直される
    this.placeNameInputs()
    this.build()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.container?.destroy()
    this.container = null
    this.destroyNameInputs()
    this.frame.hide()
    this.onClose()
  }

  isVisible(): boolean {
    return this.isOpen
  }

  /**
   * 覚えた・呼び出した・消したあとに、表示を今の状態に合わせる。
   *
   * ⚠ **入力欄は作り直さない**（#83）。ここで作り直すと**打っている途中でカーソルが飛ぶ。**
   *   値と `placeholder` を合わせ直すだけにする。
   */
  refresh(): void {
    if (!this.isOpen) return
    this.container?.destroy()
    this.container = null
    this.build()
    this.syncNameInputs()
  }

  /**
   * 名前の入力欄を置く。**開くとき1度だけ。**
   *
   * ⚠ **位置は升から決まる固定値。**型の中身では動かないので、置き直す理由が無い。
   * ⚠ **DOM が使えないときは何も置かない**（`tryAddDom` が `null`）。
   *   そのときは升に `describePreset` の文字を出す（`buildCell`）。
   */
  private placeNameInputs(): void {
    if (this.nameDoms.length > 0) return
    this.nameDoms = Array(PRESET_COUNT).fill(null)
    this.nameInputs = Array(PRESET_COUNT).fill(null)

    for (let i = 0; i < PRESET_COUNT; i++) {
      const box = this.cellBox(i)
      const preset = this.presets.get(i)
      const el = createInput(this.scene, {
        width: PRESET_NAME_INPUT_W,
        height: PRESET_NAME_INPUT_H,
        value: preset?.name ?? '',
        // ⚠ **既定値を薄く出し続ける。**名前を付けなければ従来どおりに見える
        placeholder: defaultPresetLabel(preset),
        onInput: value => this.presets.setName(i, value),
      })
      // ⚠ **升からはみ出させない**（`PRESET_NAME_MAX`）。長さの根拠は `ShelfPresets.ts`
      el.maxLength = PRESET_NAME_MAX
      // ⚠ **`tryAddDom` は左上基点**（`domInput.ts` の注記）
      const dom = tryAddDom(
        this.scene, box.textL, box.nameCy - PRESET_NAME_INPUT_H / 2, el, 'マイセットの名前',
      )
      if (!dom) continue
      this.nameDoms[i] = dom.setDepth(CONTENT_DEPTH)
      this.nameInputs[i] = el
    }
    this.syncNameInputs()
  }

  /**
   * 入力欄を今の型に合わせ直す。**作り直さない。**
   *
   * ⚠ **打っている最中の欄には触らない。**`value` を入れ直すとカーソルが末尾へ飛ぶ。
   * ⚠ **空の升では隠す。**名前は型に付くもので、空の升に打たせる意味が無い。
   */
  private syncNameInputs(): void {
    for (let i = 0; i < this.nameInputs.length; i++) {
      const el = this.nameInputs[i]
      const dom = this.nameDoms[i]
      if (!el || !dom) continue
      const preset = this.presets.get(i)
      dom.setVisible(preset !== null)
      el.placeholder = defaultPresetLabel(preset)
      if (typeof document !== 'undefined' && document.activeElement === el) continue
      el.value = preset?.name ?? ''
    }
  }

  /**
   * 入力欄を片付ける。
   *
   * ⚠ **ゲームのキー入力を必ず戻すこと。**入力中の要素を消すと `blur` が来ないことがあり、
   *   止めたままだと **ESC も速度切り替えも効かなくなる**（`SearchBox.destroy` と同じ）。
   */
  private destroyNameInputs(): void {
    for (const dom of this.nameDoms) dom?.destroy()
    this.nameDoms = []
    this.nameInputs = []
    setGameKeyboard(this.scene, true)
  }

  /** 升の位置。**`build` と `placeNameInputs` が同じ式を使う**（写しを作らない） */
  private cellBox(index: number): {
    left: number; top: number; h: number; cy: number; textL: number; nameCy: number; subCy: number
  } {
    const col = index % COLS
    const row = Math.floor(index / COLS)
    const left = CONTENT_L + col * (CELL_W + GAP_X)
    const top = ROWS_TOP + row * CELL_H
    const h = CELL_H - GAP_Y
    const cy = top + h / 2
    const nameCy = cy - h / 2 + 22.5
    // ⚠ **2行目は「名前を付けたときだけ」出す**（下の `buildCell`）。
    //   名前が無いときは入力欄の `placeholder` が同じ文字を出しているので、二重になる
    return { left, top, h, cy, textL: left + PRESET_TEXT_L_OFFSET, nameCy, subCy: nameCy + 25.5 }
  }

  private build(): void {
    const objs: Phaser.GameObjects.GameObject[] = []

    for (let i = 0; i < PRESET_COUNT; i++) this.buildCell(i, objs)

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(CONTENT_DEPTH)
  }

  private buildCell(index: number, objs: Phaser.GameObjects.GameObject[]): void {
    const preset = this.presets.get(index)
    const filled = preset !== null
    const { left, cy, h, textL, nameCy, subCy } = this.cellBox(index)

    objs.push(
      this.scene.add.rectangle(left + CELL_W / 2, cy, CELL_W, h, filled ? 0x232344 : 0x25252f)
        .setStrokeStyle(1.5, filled ? 0x445577 : 0x383848),
    )

    // ── 盤面の縮小図 ──
    this.buildPreview(preset, left + 15, cy - PREVIEW_H / 2, objs)

    // ── 1行目（名前） ──
    // ⚠ **入力欄が置けているなら、字はそれが出す。**両方出すと二重に重なる。
    //   置けないとき（DOM 無し）と、空の升（入力欄は隠してある）だけ文字を出す
    if (!this.nameInputs[index] || !filled) {
      objs.push(
        this.scene.add.text(textL, nameCy, describePreset(preset), {
          fontSize: `${PRESET_TEXT_FONT_PX}px`, color: filled ? '#aabbcc' : '#667788',
        }).setOrigin(0, 0.5),
      )
    }

    // ── 2行目（島名）──
    // ⚠ **名前を付けると、名前が1行目を占める。**島名まで消えると
    //   **型を呼ぶときに盤面ではなく名前だけを読むようになる**（ペルソナ2人の反対点）。
    //   **付けた人にだけ、元の文字を薄く残す。**
    if (filled && preset.name) {
      objs.push(
        this.scene.add.text(textL, subCy, defaultPresetLabel(preset), {
          fontSize: `${PRESET_SUB_FONT_PX}px`, color: '#667788',
        }).setOrigin(0, 0.5),
      )
    }

    // ── セーブ ／ ロード ／ 削除 ──
    const by = cy + h / 2 - 27
    this.button(objs, textL, by, BTN_W, BTN_H, 'セーブ', 0x3a5a8a, true,
      () => this.onSave(index))
    this.button(objs, textL + BTN_W + BTN_GAP, by, BTN_W, BTN_H, 'ロード', 0x3a6a3a, filled,
      () => this.onApply(index))
    this.button(objs, textL + (BTN_W + BTN_GAP) * 2, by, BTN_W, BTN_H, '削除', 0x6a3a3a, filled,
      () => this.onDelete(index))
  }

  /**
   * 盤面の縮小図。**何が保存されているかを、見て思い出すためのもの。**
   *
   * ⚠ **いまの盤面の大きさで描く。**呼び出したときに入らない区画は、ここでも出ない。
   *   **見えたとおりになる**のが大事で、保存時の盤面で描くと嘘になる。
   * ⚠ **品の名前は出さない**（PO「詳細は不要」）。色と形だけで足りる。
   */
  private buildPreview(
    preset: { slots: readonly PresetSlot[] } | null,
    left: number, top: number,
    objs: Phaser.GameObjects.GameObject[],
  ): void {
    const size = this.gridSize()
    const cell = Math.max(3, Math.floor(Math.min(PREVIEW_W / size.width, PREVIEW_H / size.height)))
    const w = cell * size.width
    const h = cell * size.height
    const ox = left + (PREVIEW_W - w) / 2
    const oy = top + (PREVIEW_H - h) / 2

    const gfx = this.scene.add.graphics()
    gfx.fillStyle(0x0d2340, 1)
    gfx.fillRect(ox, oy, w, h)

    for (const slot of preset?.slots ?? []) {
      const item = this.registry.getItem(slot.itemId)
      const rotated = this.registry.getRotatedShape(item.shape, slot.rotation)
      for (const off of this.registry.shapeToOffsets(rotated)) {
        const gx = slot.position.x + off.x
        const gy = slot.position.y + off.y
        // 入らない区画は描かない（呼び出したときも落ちるため）
        if (gx < 0 || gy < 0 || gx >= size.width || gy >= size.height) continue
        gfx.fillStyle(item.display.color, 1)
        gfx.fillRect(ox + gx * cell, oy + gy * cell, cell - 1.5, cell - 1.5)
      }
    }

    gfx.lineStyle(1.5, 0x6688aa, 0.8)
    gfx.strokeRect(ox, oy, w, h)
    objs.push(gfx)
  }

  private button(
    objs: Phaser.GameObjects.GameObject[],
    left: number, cy: number, w: number, h: number,
    label: string, fill: number, enabled: boolean, onClick: () => void,
  ): void {
    const cx = left + w / 2
    const bg = this.scene.add.rectangle(cx, cy, w, h, enabled ? fill : 0x33333f)
      .setStrokeStyle(1.5, enabled ? 0x6a8ab0 : 0x444455)
    if (enabled) {
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', onClick)
      bg.on('pointerover', () => bg.setFillStyle(0x5a7ab0))
      bg.on('pointerout', () => bg.setFillStyle(fill))
    }
    objs.push(
      bg,
      this.scene.add.text(cx, cy, label, {
        fontSize: '18px', color: enabled ? '#ffffff' : '#777788',
      }).setOrigin(0.5),
    )
  }
}
