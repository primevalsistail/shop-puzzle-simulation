import Phaser from 'phaser'
import type { ItemDef } from '../components/items/ItemRegistry.js'

const PANEL_X = 20
const PANEL_WIDTH = 200
const ITEM_RIGHT_MARGIN = 12             // アイテム右端の余白
const ITEM_WIDTH = PANEL_WIDTH - PANEL_X - ITEM_RIGHT_MARGIN  // = 168
const ITEM_HEIGHT = 70
const ITEM_START_Y = 136  // フィルタ下端(94)から42px余白
const PREVIEW_CELL = 13
const PREVIEW_CX = PANEL_X + 27

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'food',     label: '食品' },
  { id: 'drink',    label: '飲物' },
  { id: 'misc',     label: '雑貨' },
  { id: 'material', label: '素材' },
]

export class InventoryPanel {
  private allObjects: Phaser.GameObjects.GameObject[] = []
  private filterObjects: Phaser.GameObjects.GameObject[] = []
  private bgRects: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private quantityTexts: Map<string, Phaser.GameObjects.Text> = new Map()
  private selectedItemId: string | null = null
  private onSelectCallback: ((itemId: string) => void) | null = null
  private activeCategories: Set<string> = new Set(CATEGORIES.map(c => c.id))
  private storedItems: ItemDef[] = []
  private storedInventory: Record<string, number> = {}

  constructor(private scene: Phaser.Scene) {}

  onSelect(callback: (itemId: string) => void): void {
    this.onSelectCallback = callback
  }

  render(items: ItemDef[], inventory: Record<string, number>): void {
    this.storedItems = items
    this.storedInventory = { ...inventory }
    this.rebuildFilterBar()
    this.renderItems(this.filtered())
  }

  updateQuantity(itemId: string, qty: number): void {
    if (this.storedInventory[itemId] !== undefined) {
      this.storedInventory[itemId] = qty
    }
    this.quantityTexts.get(itemId)?.setText(`在庫: ${qty}`)
  }

  getSelectedItemId(): string | null { return this.selectedItemId }

  clearSelection(): void {
    if (this.selectedItemId) {
      this.bgRects.get(this.selectedItemId)?.setFillStyle(0x333333)
    }
    this.selectedItemId = null
  }

  private filtered(): ItemDef[] {
    if (this.activeCategories.size === CATEGORIES.length) return this.storedItems
    return this.storedItems.filter(it => this.activeCategories.has(it.category))
  }

  private rebuildFilterBar(): void {
    for (const obj of this.filterObjects) obj.destroy()
    this.filterObjects = []

    const cx = PANEL_X + PANEL_WIDTH / 2

    // タイトル
    const title = this.scene.add.text(cx, 52, 'アイテム', {
      fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5)
    this.filterObjects.push(title)

    // カテゴリトグルボタン（1行 × 4カテゴリ、横幅をアイテムに揃える）
    // ITEM_WIDTH=168: (168 - 3*gap) / 4 = 39px @ gap=4 → total=4*39+3*4=168 ✓
    const btnW = 39, btnH = 18, gap = 4
    const rowY = 76  // ラベル削除分だけ上に詰める

    CATEGORIES.forEach((cat, i) => {
      const bx = PANEL_X + i * (btnW + gap) + btnW / 2
      const by = rowY + btnH / 2

      const isActive = this.activeCategories.has(cat.id)
      const bg = this.scene.add.rectangle(bx, by, btnW, btnH,
        isActive ? 0x336699 : 0x222233,
      ).setStrokeStyle(1, isActive ? 0x5599cc : 0x444455)
        .setInteractive({ useHandCursor: true })
      const label = this.scene.add.text(bx, by, cat.label, {
        fontSize: '10px', color: isActive ? '#aaddff' : '#556677',
      }).setOrigin(0.5)

      bg.on('pointerdown', () => {
        if (this.activeCategories.has(cat.id)) {
          if (this.activeCategories.size > 1) this.activeCategories.delete(cat.id)
        } else {
          this.activeCategories.add(cat.id)
        }
        this.render(this.storedItems, this.storedInventory)
      })
      bg.on('pointerover', () => bg.setStrokeStyle(2, 0x7fbfff))
      bg.on('pointerout',  () => bg.setStrokeStyle(1, this.activeCategories.has(cat.id) ? 0x5599cc : 0x444455))

      this.filterObjects.push(bg, label)
    })
  }

  private renderItems(items: ItemDef[]): void {
    for (const obj of this.allObjects) obj.destroy()
    this.allObjects = []
    this.bgRects.clear()
    this.quantityTexts.clear()
    this.selectedItemId = null

    items.forEach((item, i) => {
      const y = ITEM_START_Y + i * ITEM_HEIGHT
      if (y + ITEM_HEIGHT / 2 > 716) return  // 左パネルはy=720まで
      const qty = this.storedInventory[item.id] ?? 0

      const itemCX = PANEL_X + ITEM_WIDTH / 2  // = 20 + 84 = 104
      const bg = this.scene.add.rectangle(
        itemCX, y, ITEM_WIDTH, ITEM_HEIGHT - 6, 0x333333,
      ).setStrokeStyle(2, 0x555555).setInteractive({ useHandCursor: true })
      this.allObjects.push(bg)
      this.bgRects.set(item.id, bg)

      const shapeGfx = this.scene.add.graphics()
      this.drawShapePreview(shapeGfx, item, y)
      this.allObjects.push(shapeGfx)

      const nameText = this.scene.add.text(PANEL_X + 54, y - 20, item.name, {
        fontSize: '13px', color: '#ffffff',
      })
      const qtyText = this.scene.add.text(PANEL_X + 54, y - 2, `在庫: ${qty}`, {
        fontSize: '11px', color: '#aaaaaa',
      })
      const priceLabel = item.purchasePrice !== undefined
        ? `売¥${item.price} / 仕¥${item.purchasePrice}`
        : `売¥${item.price}`
      const priceText = this.scene.add.text(PANEL_X + 54, y + 16, priceLabel, {
        fontSize: '11px', color: '#778899',
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

  private selectItem(itemId: string): void {
    if (this.selectedItemId && this.selectedItemId !== itemId) {
      this.bgRects.get(this.selectedItemId)?.setFillStyle(0x333333)
    }
    this.selectedItemId = itemId
    this.bgRects.get(itemId)?.setFillStyle(0x555566)
    this.onSelectCallback?.(itemId)
  }
}
