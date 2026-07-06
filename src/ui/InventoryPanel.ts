import Phaser from 'phaser'
import type { ItemDef } from '../components/items/ItemRegistry.js'

const PANEL_X = 20
const PANEL_WIDTH = 200
const ITEM_HEIGHT = 72
const ITEM_START_Y = 124
const PREVIEW_CELL = 13  // px per shape cell in the mini-preview
const PREVIEW_CX = PANEL_X + 27  // horizontal center of the 46px preview zone

export class InventoryPanel {
  private allObjects: Phaser.GameObjects.GameObject[] = []
  private bgRects: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private quantityTexts: Map<string, Phaser.GameObjects.Text> = new Map()
  private selectedItemId: string | null = null
  private onSelectCallback: ((itemId: string) => void) | null = null

  constructor(private scene: Phaser.Scene) {}

  onSelect(callback: (itemId: string) => void): void {
    this.onSelectCallback = callback
  }

  render(items: ItemDef[], inventory: Record<string, number>): void {
    this.clear()

    const title = this.scene.add.text(PANEL_X + PANEL_WIDTH / 2, 80, 'アイテム', {
      fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5)
    this.allObjects.push(title)

    items.forEach((item, i) => {
      const y = ITEM_START_Y + i * ITEM_HEIGHT
      const qty = inventory[item.id] ?? 0

      const bg = this.scene.add.rectangle(
        PANEL_X + PANEL_WIDTH / 2, y, PANEL_WIDTH - 10, ITEM_HEIGHT - 6, 0x333333,
      ).setStrokeStyle(2, 0x555555).setInteractive({ useHandCursor: true })
      this.allObjects.push(bg)
      this.bgRects.set(item.id, bg)

      // Mini shape preview
      const shapeGfx = this.scene.add.graphics()
      this.drawShapePreview(shapeGfx, item, y)
      this.allObjects.push(shapeGfx)

      const nameText = this.scene.add.text(PANEL_X + 54, y - 16, item.name, {
        fontSize: '13px', color: '#ffffff',
      })
      const qtyText = this.scene.add.text(PANEL_X + 54, y, `在庫: ${qty}`, {
        fontSize: '11px', color: '#aaaaaa',
      })
      const priceLabel = item.purchasePrice !== undefined
        ? `売¥${item.price} / 仕¥${item.purchasePrice}`
        : `売¥${item.price}`
      const probLabel = item.baseSaleProb !== undefined
        ? `  売れ${Math.round(item.baseSaleProb * 100)}%`
        : ''
      const priceText = this.scene.add.text(PANEL_X + 54, y + 14, priceLabel + probLabel, {
        fontSize: '10px', color: '#778899',
      })
      this.allObjects.push(nameText, qtyText, priceText)
      this.quantityTexts.set(item.id, qtyText)

      bg.on('pointerdown', () => this.selectItem(item.id))
      bg.on('pointerover', () => {
        if (this.selectedItemId !== item.id) bg.setFillStyle(0x444444)
      })
      bg.on('pointerout', () => {
        bg.setFillStyle(this.selectedItemId === item.id ? 0x555566 : 0x333333)
      })
    })
  }

  private drawShapePreview(gfx: Phaser.GameObjects.Graphics, item: ItemDef, rowY: number): void {
    const shape = item.shape
    const rows = shape.length
    const cols = shape[0]?.length ?? 0
    if (rows === 0 || cols === 0) return

    const shapeW = cols * PREVIEW_CELL
    const shapeH = rows * PREVIEW_CELL
    const startX = PREVIEW_CX - shapeW / 2
    const startY = rowY - shapeH / 2

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < (shape[r]?.length ?? 0); c++) {
        if (shape[r][c]) {
          const px = startX + c * PREVIEW_CELL
          const py = startY + r * PREVIEW_CELL
          gfx.fillStyle(item.color, 1.0)
          gfx.fillRect(px + 1, py + 1, PREVIEW_CELL - 2, PREVIEW_CELL - 2)
          gfx.lineStyle(1, 0xffffff, 0.45)
          gfx.strokeRect(px + 1, py + 1, PREVIEW_CELL - 2, PREVIEW_CELL - 2)
        }
      }
    }
  }

  updateQuantity(itemId: string, qty: number): void {
    this.quantityTexts.get(itemId)?.setText(`在庫: ${qty}`)
  }

  getSelectedItemId(): string | null {
    return this.selectedItemId
  }

  clearSelection(): void {
    if (this.selectedItemId) {
      this.bgRects.get(this.selectedItemId)?.setFillStyle(0x333333)
    }
    this.selectedItemId = null
  }

  private selectItem(itemId: string): void {
    if (this.selectedItemId && this.selectedItemId !== itemId) {
      this.bgRects.get(this.selectedItemId)?.setFillStyle(0x333333)
    }
    this.selectedItemId = itemId
    this.bgRects.get(itemId)?.setFillStyle(0x555566)
    this.onSelectCallback?.(itemId)
  }

  private clear(): void {
    for (const obj of this.allObjects) {
      obj.destroy()
    }
    this.allObjects = []
    this.bgRects.clear()
    this.quantityTexts.clear()
  }
}
