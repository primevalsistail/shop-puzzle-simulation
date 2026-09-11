import Phaser from 'phaser'
import type { ItemDef, ItemRegistry } from '../components/items/ItemRegistry.js'
import type { MainKind } from '../taxonomy/axes.js'

const PANEL_X = 20
const PANEL_WIDTH = 200
const ITEM_RIGHT_MARGIN = 12             // アイテム右端の余白
const ITEM_WIDTH = PANEL_WIDTH - PANEL_X - ITEM_RIGHT_MARGIN  // = 168
const ITEM_HEIGHT = 70
const ITEM_START_Y = 136  // フィルタ下端(94)から42px余白
const LIST_BOTTOM = 716   // 左パネルはy=720まで
const VISIBLE_COUNT = Math.floor((LIST_BOTTOM - ITEM_START_Y) / ITEM_HEIGHT)  // = 8
const PREVIEW_CELL = 13
const PREVIEW_CX = PANEL_X + 27

/**
 * 絞り込みは **`主種類`**（軸1）で行う。
 *
 * ⚠ 旧 `category`（食品・飲物・雑貨・素材）は #30 で消えた。新体系に `category` は無く、
 *   素材かどうかは `tier` から出る**導出値**なので、軸と混ぜて1列に並べない。
 *   ボタンは幅39pxしかないので、表示だけ短く詰める（値そのものは `主種類` のまま）。
 */
const CATEGORIES: { id: MainKind; label: string }[] = [
  { id: '食料',     label: '食料' },
  { id: '飲みもの', label: '飲物' },
  { id: '衣類',     label: '衣類' },
  { id: '道具',     label: '道具' },
]

export class InventoryPanel {
  private allObjects: Phaser.GameObjects.GameObject[] = []
  private filterObjects: Phaser.GameObjects.GameObject[] = []
  private bgRects: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private quantityTexts: Map<string, Phaser.GameObjects.Text> = new Map()
  private selectedItemId: string | null = null
  private onSelectCallback: ((itemId: string) => void) | null = null
  private activeCategories: Set<MainKind> = new Set(CATEGORIES.map(c => c.id))
  private storedItems: ItemDef[] = []
  private storedInventory: Record<string, number> = {}
  private scrollIndex = 0
  /** メニューが開いている間は送らない（背後のリストが動いてしまうため） */
  private scrollBlocked: () => boolean = () => false

  constructor(
    private scene: Phaser.Scene,
    private registry: ItemRegistry,
  ) {
    // 品数が VISIBLE_COUNT を超えるので、ホイールで送れないと下の品に手が届かない（#30）
    this.scene.input.on('wheel', (
      pointer: Phaser.Input.Pointer,
      _over: unknown, _dx: number, dy: number,
    ) => {
      if (this.scrollBlocked()) return
      if (!this.isOverList(pointer.x, pointer.y)) return
      this.scrollBy(dy > 0 ? 1 : -1)
    })
  }

  setScrollBlocked(fn: () => boolean): void {
    this.scrollBlocked = fn
  }

  onSelect(callback: (itemId: string) => void): void {
    this.onSelectCallback = callback
  }

  render(items: ItemDef[], inventory: Record<string, number>): void {
    this.storedItems = items
    this.storedInventory = { ...inventory }
    this.clampScroll()
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

  private isOverList(x: number, y: number): boolean {
    return x >= PANEL_X && x <= PANEL_X + PANEL_WIDTH && y >= ITEM_START_Y - ITEM_HEIGHT / 2
  }

  private scrollBy(delta: number): void {
    const before = this.scrollIndex
    this.scrollIndex += delta
    this.clampScroll()
    if (this.scrollIndex !== before) {
      this.rebuildFilterBar()
      this.renderItems(this.filtered())
    }
  }

  private clampScroll(): void {
    const max = Math.max(0, this.filtered().length - VISIBLE_COUNT)
    this.scrollIndex = Math.min(Math.max(0, this.scrollIndex), max)
  }

  private filtered(): ItemDef[] {
    if (this.activeCategories.size === CATEGORIES.length) return this.storedItems
    return this.storedItems.filter(it => this.activeCategories.has(it.mainKind))
  }

  private rebuildFilterBar(): void {
    for (const obj of this.filterObjects) obj.destroy()
    this.filterObjects = []

    const cx = PANEL_X + PANEL_WIDTH / 2
    const total = this.filtered().length
    const from = total === 0 ? 0 : this.scrollIndex + 1
    const to = Math.min(this.scrollIndex + VISIBLE_COUNT, total)

    // タイトル（右に「いま何件目を見ているか」。品数が画面に収まらないので位置が要る）
    const title = this.scene.add.text(cx, 52, `アイテム  ${from}-${to} / ${total}`, {
      fontSize: '15px', color: '#ffffff',
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
        this.scrollIndex = 0
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

    items.slice(this.scrollIndex, this.scrollIndex + VISIBLE_COUNT).forEach((item, i) => {
      const y = ITEM_START_Y + i * ITEM_HEIGHT
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

      const nameText = this.scene.add.text(PANEL_X + 54, y - 20, item.display.name, {
        fontSize: '13px', color: '#ffffff',
      })
      const qtyText = this.scene.add.text(PANEL_X + 54, y - 2, `在庫: ${qty}`, {
        fontSize: '11px', color: '#aaaaaa',
      })
      // 値段は持ち物ではなく導出値。表示のたびに出す（ItemRegistry の注記を参照）
      const priceLabel =
        `売¥${this.registry.salePriceOf(item.id)} / 仕¥${this.registry.purchasePriceOf(item.id)}`
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
          gfx.fillStyle(item.display.color, 1.0)
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
