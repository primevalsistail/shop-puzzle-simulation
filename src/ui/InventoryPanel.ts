import Phaser from 'phaser'
import type { ItemDef, ItemRegistry } from '../components/items/ItemRegistry.js'
import { ListPaging, KIND_BUTTONS } from './ListPaging.js'

const PANEL_X = 20
const PANEL_WIDTH = 200
const ITEM_RIGHT_MARGIN = 12             // アイテム右端の余白
const ITEM_WIDTH = PANEL_WIDTH - PANEL_X - ITEM_RIGHT_MARGIN  // = 168
const ITEM_HEIGHT = 70
const ITEM_START_Y = 150  // ページ送り(108)の下端から余白をとる
const LIST_BOTTOM = 716   // 左パネルはy=720まで
const VISIBLE_COUNT = Math.floor((LIST_BOTTOM - ITEM_START_Y) / ITEM_HEIGHT)  // = 8
const PREVIEW_CELL = 13
const PREVIEW_CX = PANEL_X + 27

/**
 * 絞り込みは **`主種類`**（軸1）で行う。決まりは `ListPaging` を参照
 * （既定は絞り込みなし／1つ押すとそれだけ／全部選ぶか全部外すと絞り込みが外れる）。
 *
 * ⚠ **素材かどうかで絞らない。**素材かどうかは `tier` から出る**導出値**なので、
 *   軸（主種類）と混ぜて1列に並べない。
 */
const PAGER_Y = 108

export class InventoryPanel {
  private allObjects: Phaser.GameObjects.GameObject[] = []
  private filterObjects: Phaser.GameObjects.GameObject[] = []
  private bgRects: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private quantityTexts: Map<string, Phaser.GameObjects.Text> = new Map()
  private selectedItemId: string | null = null
  private onSelectCallback: ((itemId: string) => void) | null = null
  private paging = new ListPaging(VISIBLE_COUNT)
  private storedItems: ItemDef[] = []
  private storedInventory: Record<string, number> = {}
  /** いま売り場に出している品。数量は持ち物と同じなので、出しているかどうかだけを持つ */
  private storedOnShelf: Set<string> = new Set()
  /** メニューが開いている間は送らない（背後のリストが動いてしまうため） */
  private scrollBlocked: () => boolean = () => false

  constructor(
    private scene: Phaser.Scene,
    private registry: ItemRegistry,
  ) {
    // ホイールでもページを送れる（ボタンを押さずに流し見できるように）
    this.scene.input.on('wheel', (
      pointer: Phaser.Input.Pointer,
      _over: unknown, _dx: number, dy: number,
    ) => {
      if (this.scrollBlocked()) return
      if (!this.isOverList(pointer.x, pointer.y)) return
      this.turnPage(dy > 0 ? 1 : -1)
    })
  }

  setScrollBlocked(fn: () => boolean): void {
    this.scrollBlocked = fn
  }

  onSelect(callback: (itemId: string) => void): void {
    this.onSelectCallback = callback
  }

  render(
    items: ItemDef[],
    inventory: Record<string, number>,
    onShelf: Set<string> = new Set(),
  ): void {
    this.storedItems = items
    this.storedInventory = { ...inventory }
    this.storedOnShelf = new Set(onShelf)
    this.redraw()
  }

  private countLabel(itemId: string): string {
    const held = this.storedInventory[itemId] ?? 0
    return this.storedOnShelf.has(itemId) ? `${held}個（売り場に出している）` : `${held}個`
  }

  private redraw(): void {
    const shown = this.filtered()
    this.rebuildFilterBar(shown.length)
    this.renderItems(this.paging.slice(shown))
  }

  updateQuantity(itemId: string, qty: number): void {
    if (this.storedInventory[itemId] !== undefined) {
      this.storedInventory[itemId] = qty
    }
    this.quantityTexts.get(itemId)?.setText(this.countLabel(itemId))
  }

  getSelectedItemId(): string | null { return this.selectedItemId }

  clearSelection(): void {
    if (this.selectedItemId) {
      this.bgRects.get(this.selectedItemId)?.setFillStyle(0x333333)
    }
    this.selectedItemId = null
  }

  private isOverList(x: number, y: number): boolean {
    return x >= PANEL_X && x <= PANEL_X + PANEL_WIDTH && y >= PAGER_Y - 12
  }

  private turnPage(delta: number): void {
    if (this.paging.movePage(delta, this.filtered().length)) this.redraw()
  }

  private filtered(): ItemDef[] {
    return this.paging.filter(this.storedItems, it => it.mainKind)
  }

  private rebuildFilterBar(total: number): void {
    for (const obj of this.filterObjects) obj.destroy()
    this.filterObjects = []

    const cx = PANEL_X + PANEL_WIDTH / 2

    // タイトル（右に件数。122品あるので位置が要る）
    this.filterObjects.push(
      this.scene.add.text(cx, 52, `アイテム  ${this.paging.rangeLabel(total)}`, {
        fontSize: '15px', color: '#ffffff',
      }).setOrigin(0.5),
    )

    // 絞り込み（1行 × 4種類、横幅をアイテムに揃える）
    // ITEM_WIDTH=168: (168 - 3*gap) / 4 = 39px @ gap=4 → total=4*39+3*4=168 ✓
    const btnW = 39, btnH = 18, gap = 4
    const rowY = 76

    KIND_BUTTONS.forEach((cat, i) => {
      const bx = PANEL_X + i * (btnW + gap) + btnW / 2
      const by = rowY + btnH / 2
      const on = this.paging.isKindActive(cat.id)

      const bg = this.scene.add.rectangle(bx, by, btnW, btnH, on ? 0x336699 : 0x222233)
        .setStrokeStyle(1, on ? 0x5599cc : 0x444455)
        .setInteractive({ useHandCursor: true })
      const label = this.scene.add.text(bx, by, cat.label, {
        fontSize: '10px', color: on ? '#aaddff' : '#667788',
      }).setOrigin(0.5)

      bg.on('pointerdown', () => {
        this.paging.toggleKind(cat.id)
        this.redraw()
      })
      bg.on('pointerover', () => bg.setStrokeStyle(2, 0x7fbfff))
      bg.on('pointerout',  () => bg.setStrokeStyle(1, this.paging.isKindActive(cat.id) ? 0x5599cc : 0x444455))

      this.filterObjects.push(bg, label)
    })

    // ページ送り
    const pages = this.paging.pageCount(total)
    const cur = this.paging.currentPage(total)
    const arrow = (x: number, text: string, delta: number, enabled: boolean) => {
      const t = this.scene.add.text(x, PAGER_Y, text, {
        fontSize: '14px', color: enabled ? '#aaccee' : '#445566',
      }).setOrigin(0.5)
      if (enabled) {
        t.setInteractive({ useHandCursor: true })
        t.on('pointerdown', () => this.turnPage(delta))
        t.on('pointerover', () => t.setColor('#ffffff'))
        t.on('pointerout', () => t.setColor('#aaccee'))
      }
      this.filterObjects.push(t)
    }
    arrow(PANEL_X + 12, '◀', -1, cur > 0)
    this.filterObjects.push(
      this.scene.add.text(cx, PAGER_Y, this.paging.pageLabel(total), {
        fontSize: '12px', color: '#8899aa',
      }).setOrigin(0.5),
    )
    arrow(PANEL_X + ITEM_WIDTH - 12, '▶', 1, cur < pages - 1)
  }

  private renderItems(items: ItemDef[]): void {
    for (const obj of this.allObjects) obj.destroy()
    this.allObjects = []
    this.bgRects.clear()
    this.quantityTexts.clear()
    this.selectedItemId = null

    items.forEach((item, i) => {
      const y = ITEM_START_Y + i * ITEM_HEIGHT
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
      const qtyText = this.scene.add.text(PANEL_X + 54, y - 2, this.countLabel(item.id), {
        fontSize: '11px', color: this.storedOnShelf.has(item.id) ? '#88bbaa' : '#aaaaaa',
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
