import Phaser from 'phaser'
import type { ShelfPresets, PresetSlot } from '../components/floor/ShelfPresets.js'
import { PRESET_COUNT } from '../components/floor/ShelfPresets.js'
import type { ItemRegistry } from '../components/items/ItemRegistry.js'
import type { GridSize } from '../types/index.js'
import type { PlaceFrame } from './PlaceFrame.js'
import { CONTENT_DEPTH } from './PlaceFrame.js'
import { CONTENT_L, CONTENT_R, SUBTITLE_Y, ROWS_TOP, ROWS_BOTTOM } from './layout.js'

/** 2列 × 5行。**型は10本**（`PRESET_COUNT`） */
const COLS = 2
const ROWS = PRESET_COUNT / COLS

const GAP_X = 14
const GAP_Y = 8
const CELL_W = Math.floor((CONTENT_R - CONTENT_L - GAP_X * (COLS - 1)) / COLS)
const CELL_H = Math.floor((ROWS_BOTTOM - ROWS_TOP) / ROWS)

/** 盤面の縮小図を置く枠 */
const PREVIEW_W = 70
const PREVIEW_H = CELL_H - 22

/** セーブ ／ ロード ／ 削除 */
const BTN_H = 24
const BTN_W = 76
const BTN_GAP = 7

/**
 * 品出しの型（マイセット。#27）。**ダイアログではなく「行く場所」**（#58）。
 *
 * ⚠ **覚えるのは「どこに何をどの向きで出しているか」だけ。**持ち物も在庫も動かさない。
 *   棚は「どこに出しているか」を表すだけで、**並べても在庫は減らない**（段2.5）。
 *   だから型を覚えるのも呼び出すのも**何も消費しない。**
 *
 * ⚠ **番号で呼ばない**（PO 2026-09-12）。「型1」「型2」では**中身が思い出せない。**
 *   **盤面の縮小図**をそのまま出し、**見て選ばせる。**
 */
export class PresetMenu {
  private container: Phaser.GameObjects.Container | null = null
  private isOpen = false

  constructor(
    private scene: Phaser.Scene,
    private presets: ShelfPresets,
    private registry: ItemRegistry,
    private frame: PlaceFrame,
    /** いまの盤面の大きさ。縮小図の枠に使う */
    private gridSize: () => GridSize,
    /** いま棚に出ている区画の数 */
    private currentCount: () => number,
    private onSave: (index: number) => void,
    private onApply: (index: number) => void,
    private onDelete: (index: number) => void,
    private onClose: () => void,
  ) {}

  open(): void {
    if (this.isOpen) return
    this.isOpen = true
    this.frame.show('品出しの型', () => this.close())
    this.build()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.container?.destroy()
    this.container = null
    this.frame.hide()
    this.onClose()
  }

  isVisible(): boolean {
    return this.isOpen
  }

  /** 覚えた・呼び出した・消したあとに、表示を今の状態に合わせる */
  refresh(): void {
    if (!this.isOpen) return
    this.container?.destroy()
    this.container = null
    this.build()
  }

  private build(): void {
    const objs: Phaser.GameObjects.GameObject[] = []

    objs.push(
      this.scene.add.text(CONTENT_L, SUBTITLE_Y,
        `いま棚に出しているのは ${this.currentCount()}区画`, {
        fontSize: '13px', color: '#8899aa',
      }).setOrigin(0, 0.5),
    )

    for (let i = 0; i < PRESET_COUNT; i++) {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      this.buildCell(
        i,
        CONTENT_L + col * (CELL_W + GAP_X),
        ROWS_TOP + row * CELL_H,
        objs,
      )
    }

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(CONTENT_DEPTH)
  }

  private buildCell(index: number, left: number, top: number, objs: Phaser.GameObjects.GameObject[]): void {
    const preset = this.presets.get(index)
    const filled = preset !== null
    const h = CELL_H - GAP_Y
    const cy = top + h / 2

    objs.push(
      this.scene.add.rectangle(left + CELL_W / 2, cy, CELL_W, h, filled ? 0x232344 : 0x25252f)
        .setStrokeStyle(1, filled ? 0x445577 : 0x383848),
    )

    // ── 盤面の縮小図 ──
    this.buildPreview(preset, left + 10, cy - PREVIEW_H / 2, objs)

    const textL = left + 10 + PREVIEW_W + 12
    objs.push(
      this.scene.add.text(textL, cy - h / 2 + 15, this.describe(preset), {
        fontSize: '12px', color: filled ? '#aabbcc' : '#667788',
      }).setOrigin(0, 0.5),
    )

    // ── セーブ ／ ロード ／ 削除 ──
    const by = cy + h / 2 - 18
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
    const cell = Math.max(2, Math.floor(Math.min(PREVIEW_W / size.width, PREVIEW_H / size.height)))
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
        gfx.fillRect(ox + gx * cell, oy + gy * cell, cell - 1, cell - 1)
      }
    }

    gfx.lineStyle(1, 0x6688aa, 0.8)
    gfx.strokeRect(ox, oy, w, h)
    objs.push(gfx)
  }

  private describe(preset: { savedAt: number; slots: readonly PresetSlot[] } | null): string {
    if (!preset) return '空'
    // ⚠ **現実の時刻は出さない。**「どの型を呼ぶか」の判断に一切効かない（束M・ペルソナ3人）
    if (preset.slots.length === 0) return '全部下ろす'
    return `${preset.slots.length}区画`
  }

  private button(
    objs: Phaser.GameObjects.GameObject[],
    left: number, cy: number, w: number, h: number,
    label: string, fill: number, enabled: boolean, onClick: () => void,
  ): void {
    const cx = left + w / 2
    const bg = this.scene.add.rectangle(cx, cy, w, h, enabled ? fill : 0x33333f)
      .setStrokeStyle(1, enabled ? 0x6a8ab0 : 0x444455)
    if (enabled) {
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', onClick)
      bg.on('pointerover', () => bg.setFillStyle(0x5a7ab0))
      bg.on('pointerout', () => bg.setFillStyle(fill))
    }
    objs.push(
      bg,
      this.scene.add.text(cx, cy, label, {
        fontSize: '12px', color: enabled ? '#ffffff' : '#777788',
      }).setOrigin(0.5),
    )
  }
}
