import Phaser from 'phaser'
import type { ShelfPresets } from '../components/floor/ShelfPresets.js'
import { PRESET_COUNT } from '../components/floor/ShelfPresets.js'
import type { PlaceFrame } from './PlaceFrame.js'
import { CONTENT_DEPTH } from './PlaceFrame.js'
import { PLACE_CX, CONTENT_L, CONTENT_R, SUBTITLE_Y, ROWS_TOP } from './layout.js'

const ROW_H = 120
const ROW_W = CONTENT_R - CONTENT_L

/**
 * 品出しの型（マイセット。#27）。**ダイアログではなく「行く場所」**（#58）。
 *
 * ⚠ **覚えるのは「どこに何をどの向きで出しているか」だけ。**持ち物も在庫も動かさない。
 *   棚は「どこに出しているか」を表すだけで、**並べても在庫は減らない**（段2.5）。
 *   だから型を呼び出しても**何も消費しない。**
 */
export class PresetMenu {
  private container: Phaser.GameObjects.Container | null = null
  private isOpen = false

  constructor(
    private scene: Phaser.Scene,
    private presets: ShelfPresets,
    private frame: PlaceFrame,
    /** いま棚に出ている区画の数。型を覚える前に見せる */
    private currentCount: () => number,
    private onSave: (index: number) => void,
    private onApply: (index: number) => void,
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

  /** 覚えたあと・呼び出したあとに、表示を今の状態に合わせる */
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
        `いま棚に出しているのは ${this.currentCount()}区画。島ごとの並べ替えを覚えておける`, {
        fontSize: '13px', color: '#8899aa',
      }).setOrigin(0, 0.5),
    )

    for (let i = 0; i < PRESET_COUNT; i++) {
      this.buildRow(i, ROWS_TOP + ROW_H / 2 + i * ROW_H, objs)
    }

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(CONTENT_DEPTH)
  }

  private buildRow(index: number, y: number, objs: Phaser.GameObjects.GameObject[]): void {
    const preset = this.presets.get(index)

    objs.push(
      this.scene.add.rectangle(PLACE_CX, y, ROW_W, ROW_H - 14, preset ? 0x232344 : 0x2a2a3a)
        .setStrokeStyle(1, 0x445577),
      this.scene.add.text(CONTENT_L + 28, y - 22, `型 ${index + 1}`, {
        fontSize: '19px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0, 0.5),
      this.scene.add.text(CONTENT_L + 28, y + 10, this.describe(index), {
        fontSize: '13px', color: preset ? '#aabbcc' : '#667788',
      }).setOrigin(0, 0.5),
    )

    // 覚える —— いつでも押せる（空の盤面も「全部下ろす」型として覚えてよい）
    this.button(objs, CONTENT_R - 300, y, 150, 34, 'いまの並びを覚える', 0x3a5a8a, true,
      () => this.onSave(index))

    // 呼び出す —— 覚えていなければ押せない
    this.button(objs, CONTENT_R - 140, y, 130, 34, '呼び出す', 0x3a6a3a, preset !== null,
      () => this.onApply(index))
  }

  private describe(index: number): string {
    const preset = this.presets.get(index)
    if (!preset) return '空 —— まだ覚えていない'
    if (preset.slots.length === 0) return `全部下ろす型　${formatWhen(preset.savedAt)}`
    return `${preset.slots.length}区画　${formatWhen(preset.savedAt)}`
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
        fontSize: '13px', color: enabled ? '#ffffff' : '#777788',
      }).setOrigin(0.5),
    )
  }
}

function formatWhen(savedAt: number): string {
  if (!savedAt) return ''
  const d = new Date(savedAt)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${mi}`
}
