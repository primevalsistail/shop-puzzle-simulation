import Phaser from 'phaser'
import type { ItemDef, ItemRegistry } from '../components/items/ItemRegistry.js'
import { ListPaging, KIND_BUTTONS } from './ListPaging.js'
import { SearchBox } from './SearchBox.js'
import { money } from './money.js'
import {
  INV_RANGE_FONT_PX, INV_FILTER_FONT_PX, INV_PAGER_ARROW_FONT_PX, INV_PAGER_FONT_PX,
  INV_ITEM_NAME_FONT_PX, INV_ITEM_QTY_FONT_PX, INV_ITEM_PRICE_FONT_PX,
} from './layout.js'

const PANEL_X = 30
const PANEL_WIDTH = 300
const ITEM_RIGHT_MARGIN = 18             // アイテム右端の余白
const ITEM_WIDTH = PANEL_WIDTH - PANEL_X - ITEM_RIGHT_MARGIN  // = 252
const ITEM_HEIGHT = 105
const ITEM_START_Y = 225  // ページ送り(162)の下端から余白をとる
const LIST_BOTTOM = 1074   // 左パネルはy=1080まで
const VISIBLE_COUNT = Math.floor((LIST_BOTTOM - ITEM_START_Y) / ITEM_HEIGHT)  // = 8
const PREVIEW_CELL = 19.5
const PREVIEW_CX = PANEL_X + 40.5

/**
 * 絞り込みは **`主種類`**（軸1）で行う。決まりは `ListPaging` を参照
 * （既定は絞り込みなし／1つ押すとそれだけ／全部選ぶか全部外すと絞り込みが外れる）。
 *
 * ⚠ **素材かどうかで絞らない。**素材かどうかは `tier` から出る**導出値**なので、
 *   軸（主種類）と混ぜて1列に並べない。
 */
const PAGER_Y = 162

/**
 * 検索の入力欄（#55）。**見出しの行に置く。**
 *
 * ⚠ **行を1本足さないこと。**品の行は `ITEM_START_Y`(225) から `ITEM_HEIGHT`(105) 刻みなので、
 *   間に1行入れると **8行 → 7行に減る。**「アイテム」という見出しの語は無くても分かる。
 */
const SEARCH_X = PANEL_X
const SEARCH_W = 165
const SEARCH_H = 30
const HEAD_Y = 78

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
  /**
   * いまいる島。**買値の表示にだけ使う**（産地の島では安い。段4-6）。
   *
   * ⚠ 渡さないと仕入れ画面と**同じ品に別の値段**が出る。`GameScene` が毎回渡す。
   */
  /** ⚠ **`filterObjects` に入れないこと。**打鍵のたびに作り直されてカーソルが飛ぶ（#55） */
  private search: SearchBox

  constructor(
    private scene: Phaser.Scene,
    private registry: ItemRegistry,
    /**
     * いまの**強化の利益率**（`Upgrades.marginMultiplier()`）。
     *
     * ⚠ **渡さないと、一覧の売値と実際に売れる額がずれる**（#76）。
     *   売れたときの額は `CustomerSimulator` が `finalPriceOf(id, 配置の効き目 × 利益率)` で出す。
     *   ⚠ **強化を買うほどずれが広がる**ので、既定の 1 に頼らないこと。
     */
    private marginOf: () => number = () => 1,
  ) {
    this.search = new SearchBox(scene)
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
    // ⚠ **棚に出しているかは色（`#88bbaa`）で示す。**文字では言わない（束M）
    return `${held}個`
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
    return x >= PANEL_X && x <= PANEL_X + PANEL_WIDTH && y >= PAGER_Y - 18
  }

  private turnPage(delta: number): void {
    if (this.paging.movePage(delta, this.filtered().length)) this.redraw()
  }

  private filtered(): ItemDef[] {
    return this.paging.filter(
      this.storedItems,
      it => it.mainKind,
      it => it.display.name,
      it => it.display.reading,   // 読みでも引ける（#65）。⚠ 画面には出さない
    )
  }

  private rebuildFilterBar(total: number): void {
    for (const obj of this.filterObjects) obj.destroy()
    this.filterObjects = []

    const cx = PANEL_X + PANEL_WIDTH / 2

    // 見出しの行 — 検索の入力欄 ＋ 件数（161品あるので位置が要る）
    this.search.place(
      SEARCH_X + SEARCH_W / 2, HEAD_Y, SEARCH_W, SEARCH_H, '名前で探す',
      q => { this.paging.setQuery(q); this.redraw() },
      20,
    )
    this.filterObjects.push(
      this.scene.add.text(PANEL_X + ITEM_WIDTH, HEAD_Y, this.paging.rangeLabel(total), {
        fontSize: `${INV_RANGE_FONT_PX}px`, color: '#aabbcc',
      }).setOrigin(1, 0.5),
    )

    // 絞り込み（1行 × 4種類、横幅をアイテムに揃える）
    // ITEM_WIDTH=252: (252 - 3*gap) / 4 = 58.5px @ gap=6 → total=4*58.5+3*6=252 ✓
    const btnW = 58.5, btnH = 27, gap = 6
    const rowY = 114

    KIND_BUTTONS.forEach((cat, i) => {
      const bx = PANEL_X + i * (btnW + gap) + btnW / 2
      const by = rowY + btnH / 2
      const on = this.paging.isKindActive(cat.id)

      const bg = this.scene.add.rectangle(bx, by, btnW, btnH, on ? 0x336699 : 0x222233)
        .setStrokeStyle(1.5, on ? 0x5599cc : 0x444455)
        .setInteractive({ useHandCursor: true })
      const label = this.scene.add.text(bx, by, cat.label, {
        fontSize: `${INV_FILTER_FONT_PX}px`, color: on ? '#aaddff' : '#667788',
      }).setOrigin(0.5)

      bg.on('pointerdown', () => {
        this.paging.toggleKind(cat.id)
        this.redraw()
      })
      bg.on('pointerover', () => bg.setStrokeStyle(3, 0x7fbfff))
      bg.on('pointerout',  () => bg.setStrokeStyle(1.5, this.paging.isKindActive(cat.id) ? 0x5599cc : 0x444455))

      this.filterObjects.push(bg, label)
    })

    // ページ送り
    const pages = this.paging.pageCount(total)
    const cur = this.paging.currentPage(total)
    const arrow = (x: number, text: string, delta: number, enabled: boolean) => {
      const t = this.scene.add.text(x, PAGER_Y, text, {
        fontSize: `${INV_PAGER_ARROW_FONT_PX}px`, color: enabled ? '#aaccee' : '#445566',
      }).setOrigin(0.5)
      if (enabled) {
        t.setInteractive({ useHandCursor: true })
        t.on('pointerdown', () => this.turnPage(delta))
        t.on('pointerover', () => t.setColor('#ffffff'))
        t.on('pointerout', () => t.setColor('#aaccee'))
      }
      this.filterObjects.push(t)
    }
    arrow(PANEL_X + 18, '◀', -1, cur > 0)
    this.filterObjects.push(
      this.scene.add.text(cx, PAGER_Y, this.paging.pageLabel(total), {
        fontSize: `${INV_PAGER_FONT_PX}px`, color: '#8899aa',
      }).setOrigin(0.5),
    )
    arrow(PANEL_X + ITEM_WIDTH - 18, '▶', 1, cur < pages - 1)
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
        itemCX, y, ITEM_WIDTH, ITEM_HEIGHT - 9, 0x333333,
      ).setStrokeStyle(3, 0x555555).setInteractive({ useHandCursor: true })
      this.allObjects.push(bg)
      this.bgRects.set(item.id, bg)

      const shapeGfx = this.scene.add.graphics()
      this.drawShapePreview(shapeGfx, item, y)
      this.allObjects.push(shapeGfx)

      const nameText = this.scene.add.text(PANEL_X + 81, y - 30, item.display.name, {
        fontSize: `${INV_ITEM_NAME_FONT_PX}px`, color: '#ffffff',
      })
      // ⚠ **個数と売値は同じ行**（PO 指示 2026-09-14）。行は**品名と、この1行の2行だけ。**
      //   個数は左、売値は右端にそろえる
      const qtyText = this.scene.add.text(PANEL_X + 81, y + 3, this.countLabel(item.id), {
        fontSize: `${INV_ITEM_QTY_FONT_PX}px`, color: this.storedOnShelf.has(item.id) ? '#88bbaa' : '#aaaaaa',
      })
      // 値段は持ち物ではなく導出値。表示のたびに出す（ItemRegistry の注記を参照）
      // ⚠ **売値だけ。**仕入れ値と産地は「買う判断」で、棚に出す判断には効かない（束M）。
      //   ⚠ **産地は色にも残さない。**残すと、同じ行に意味の違う緑が2つ並ぶ
      //   （数量の緑＝棚に出している）。色で見分けさせるものは1行に1つ
      //
      // ⚠ **強化の利益率を乗せる**（#76）。素の `salePriceOf` は**手に入る額ではない**ので、
      //   `売120レン` と出ている品が `+156レン` で売れていた。売れたときの額を出すのと
      //   **同じ経路**（`finalPriceOf`）を通す。残る差は配置の効き目と島の需要だけで、
      //   これは**どこへ置くかで変わる**ので、置く前のこの一覧では確定しない。
      //
      // ⚠ **`derive.ts` に引数を足して解決していない。**強化の段は**品の性質ではない**ので、
      //   導出（`salePrice`）は品だけを見るまま置き、**倍率は表示側で渡す。**
      //   `finalPrice` はもとから倍率を受け取る形なので、掛ける関数は1本も増やしていない
      // ⚠ **`売` の字は付けない**（PO 指示 2026-09-14）。この一覧に出る額は売値しか無い
      const priceText = this.scene.add.text(
        PANEL_X + 81 + ITEM_WIDTH - 99, y + 3,
        money(this.registry.finalPriceOf(item.id, this.marginOf())), {
        fontSize: `${INV_ITEM_PRICE_FONT_PX}px`, color: '#778899',
      }).setOrigin(1, 0)
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
          gfx.fillRect(px + 1.5, py + 1.5, PREVIEW_CELL - 3, PREVIEW_CELL - 3)
          gfx.lineStyle(1.5, 0xffffff, 0.45)
          gfx.strokeRect(px + 1.5, py + 1.5, PREVIEW_CELL - 3, PREVIEW_CELL - 3)
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
