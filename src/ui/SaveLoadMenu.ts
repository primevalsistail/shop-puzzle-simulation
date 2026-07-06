import Phaser from 'phaser'
import type { SlotMeta } from '../types/index.js'

const SLOT_COUNT = 3
const DEPTH = 50
const MW = 480  // menu width
const MH = 310  // menu height

export class SaveLoadMenu {
  private objects: Phaser.GameObjects.GameObject[] = []
  private mode: 'save' | 'load' = 'save'

  constructor(
    private scene: Phaser.Scene,
    private getSlotMeta: (slot: number) => SlotMeta | null,
    private onSave: (slot: number) => void,
    private onLoad: (slot: number) => void,
  ) {}

  openSave(): void { this.mode = 'save'; this.build() }
  openLoad(): void { this.mode = 'load'; this.build() }

  close(): void {
    for (const obj of this.objects) obj.destroy()
    this.objects = []
  }

  isVisible(): boolean { return this.objects.length > 0 }

  private build(): void {
    this.close()

    const { width, height } = this.scene.scale
    const cx = width / 2
    const cy = height / 2
    const push = (...objs: Phaser.GameObjects.GameObject[]) => {
      objs.forEach(o => { this.objects.push(o) })
    }

    // Full-screen overlay
    const overlay = this.scene.add.rectangle(cx, cy, width, height, 0x000000, 0.65)
      .setInteractive().setDepth(DEPTH)
    push(overlay)

    // Panel
    push(
      this.scene.add.rectangle(cx, cy, MW, MH, 0x16213e)
        .setStrokeStyle(2, 0x5566cc).setDepth(DEPTH),
    )

    // Title
    const title = this.mode === 'save' ? 'セーブ' : 'ロード'
    push(
      this.scene.add.text(cx, cy - MH / 2 + 26, title, {
        fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(DEPTH),
    )

    // Slot buttons
    const slotW = MW - 40
    const slotH = 52
    const firstSlotY = cy - MH / 2 + 74
    const slotGap = slotH + 8

    for (let i = 0; i < SLOT_COUNT; i++) {
      const sy = firstSlotY + i * slotGap
      const meta = this.getSlotMeta(i)
      const isEmpty = meta === null
      const disabled = this.mode === 'load' && isEmpty

      const fillNormal = disabled ? 0x222233 : isEmpty ? 0x2a2a55 : 0x253a25
      const fillHover  = disabled ? 0x222233 : isEmpty ? 0x4040aa : 0x3a5a3a
      const strokeCol  = disabled ? 0x333344 : isEmpty ? 0x5566aa : 0x44aa44

      const bg = this.scene.add.rectangle(cx, sy, slotW, slotH, fillNormal)
        .setStrokeStyle(1, strokeCol).setDepth(DEPTH)
      push(bg)

      // Slot number (left)
      push(
        this.scene.add.text(cx - slotW / 2 + 14, sy - 10, `スロット ${i + 1}`, {
          fontSize: '12px', color: disabled ? '#555566' : '#7799ff', fontStyle: 'bold',
        }).setOrigin(0, 0.5).setDepth(DEPTH),
      )

      // Slot info (center-left)
      const info = meta ? this.formatMeta(meta) : '--- 空スロット ---'
      push(
        this.scene.add.text(cx - slotW / 2 + 14, sy + 10, info, {
          fontSize: '12px', color: disabled ? '#444455' : meta ? '#cccccc' : '#777788',
        }).setOrigin(0, 0.5).setDepth(DEPTH),
      )

      if (!disabled) {
        bg.setInteractive({ useHandCursor: true })
        bg.on('pointerover', () => bg.setFillStyle(fillHover))
        bg.on('pointerout',  () => bg.setFillStyle(fillNormal))
        bg.on('pointerdown', () => {
          if (this.mode === 'save') { this.onSave(i); this.close() }
          else                     { this.onLoad(i); this.close() }
        })
      }
    }

    // Cancel button
    const cancelY = cy + MH / 2 - 30
    const cancelBg = this.scene.add.rectangle(cx, cancelY, 130, 36, 0x3a3a4a)
      .setStrokeStyle(1, 0x666677).setInteractive({ useHandCursor: true }).setDepth(DEPTH)
    push(
      cancelBg,
      this.scene.add.text(cx, cancelY, 'キャンセル', {
        fontSize: '14px', color: '#bbbbcc',
      }).setOrigin(0.5).setDepth(DEPTH),
    )
    cancelBg.on('pointerover', () => cancelBg.setFillStyle(0x555566))
    cancelBg.on('pointerout',  () => cancelBg.setFillStyle(0x3a3a4a))
    cancelBg.on('pointerdown', () => this.close())
  }

  private formatMeta(meta: SlotMeta): string {
    const d = new Date(meta.savedAt)
    const mm  = String(d.getMonth() + 1).padStart(2, '0')
    const dd  = String(d.getDate()).padStart(2, '0')
    const hh  = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    const rev = meta.totalRevenue.toLocaleString()
    return `Day ${meta.day}  ¥${rev}  ${mm}/${dd} ${hh}:${min}`
  }
}
