import Phaser from 'phaser'
import type { ItemDef, ItemRegistry } from '../components/items/ItemRegistry.js'
import { ListPaging, KIND_BUTTONS } from './ListPaging.js'
import { SearchBox } from './SearchBox.js'
import { money } from './money.js'
import {
  INV_RANGE_FONT_PX, INV_FILTER_FONT_PX, INV_PAGER_ARROW_FONT_PX, INV_PAGER_FONT_PX,
  INV_ITEM_NAME_FONT_PX, INV_ITEM_QTY_FONT_PX, INV_ITEM_PRICE_FONT_PX,
  INV_PANEL_L, INV_PANEL_W, INV_ITEM_W, INV_ITEM_H, INV_ITEM_GAP,
  INV_ITEM_TOP, INV_VISIBLE_COUNT, INV_ITEM_TEXT_L, INV_ITEM_PRICE_R,
  INV_PREVIEW_CELL, INV_PREVIEW_CX, INV_PAGER_Y, INV_HEAD_Y,
  INV_SEARCH_L, INV_SEARCH_W, INV_SEARCH_H,
  INV_FILTER_BTN_W, INV_FILTER_BTN_H, INV_FILTER_GAP, INV_FILTER_TOP,
} from './layout.js'
import {
  BG_PANEL,
  BG_WINDOW,
  FILTER_OFF_BG,
  FILTER_OFF_TEXT,
  FILTER_ON_BG,
  FILTER_ON_TEXT,
  LINE_STRONG,
  LINE_WEAK,
  ROW_LOCAL,
  ROW_UPCOMING,
  ST_HOVER,
  ST_OK,
  TEXT_BODY,
  TEXT_SUB,
  TEXT_WEAK,
  css,
  kindColor,
} from './palette.js'

/**
 * ⚠ **区画の値をここに持たない**（#120。2026-09-15 に `layout.ts` の `INV_*` へ移した）。
 *   **写しを持つと、片方を動かしてももう片方が気づかない**（`layout.ts` 冒頭の約束）。
 *   **左パネルの右端は `LEFT_PANEL_R` が持っている**のに、ここが `PANEL_X`(30) と
 *   `PANEL_WIDTH`(300) を別に持っていた —— **同じ 330 を2箇所で決めていた。**
 *   移したことで **`layout.test.ts` が一覧の収まりを測れる**ようになっている。
 *
 * 絞り込みは **`主種類`**（軸1）で行う。決まりは `ListPaging` を参照
 * （既定は絞り込みなし／1つ押すとそれだけ／全部選ぶか全部外すと絞り込みが外れる）。
 *
 * ⚠ **素材かどうかで絞らない。**素材かどうかは `tier` から出る**導出値**なので、
 *   軸（主種類）と混ぜて1列に並べない。
 *
 * ⚠ **検索の入力欄は見出しの行に置く**（#55）。**行を1本足さないこと。**
 *   品の行は `INV_ITEM_TOP`(225) から `INV_ITEM_H`(105) 刻みなので、
 *   間に1行入れると **8行 → 7行に減る。**「アイテム」という見出しの語は無くても分かる。
 */
export class InventoryPanel {
  private allObjects: Phaser.GameObjects.GameObject[] = []
  private filterObjects: Phaser.GameObjects.GameObject[] = []
  private bgRects: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private quantityTexts: Map<string, Phaser.GameObjects.Text> = new Map()
  private selectedItemId: string | null = null
  private onSelectCallback: ((itemId: string) => void) | null = null
  private paging = new ListPaging(INV_VISIBLE_COUNT)
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
      this.bgRects.get(this.selectedItemId)?.setFillStyle(BG_PANEL)
    }
    this.selectedItemId = null
  }

  private isOverList(x: number, y: number): boolean {
    return x >= INV_PANEL_L && x <= INV_PANEL_L + INV_PANEL_W && y >= INV_PAGER_Y - 18
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

    const cx = INV_PANEL_L + INV_PANEL_W / 2

    // 見出しの行 — 検索の入力欄 ＋ 件数（161品あるので位置が要る）
    this.search.place(
      INV_SEARCH_L + INV_SEARCH_W / 2, INV_HEAD_Y, INV_SEARCH_W, INV_SEARCH_H, '名前で探す',
      q => { this.paging.setQuery(q); this.redraw() },
      20,
    )
    this.filterObjects.push(
      this.scene.add.text(INV_PANEL_L + INV_ITEM_W, INV_HEAD_Y, this.paging.rangeLabel(total), {
        fontSize: `${INV_RANGE_FONT_PX}px`, color: css(TEXT_SUB),
      }).setOrigin(1, 0.5),
    )

    // 絞り込み（1行 × 4種類、横幅をアイテムに揃える）
    // ⚠ **4つと隙間3つで行の幅ちょうど**（`layout.ts` の `INV_FILTER_*`。`layout.test.ts` が見る）
    const btnW = INV_FILTER_BTN_W, btnH = INV_FILTER_BTN_H, gap = INV_FILTER_GAP
    const rowY = INV_FILTER_TOP

    KIND_BUTTONS.forEach((cat, i) => {
      const bx = INV_PANEL_L + i * (btnW + gap) + btnW / 2
      const by = rowY + btnH / 2
      const on = this.paging.isKindActive(cat.id)

      const bg = this.scene.add.rectangle(bx, by, btnW, btnH, on ? FILTER_ON_BG : FILTER_OFF_BG)
        .setStrokeStyle(1.5, LINE_STRONG)
        .setInteractive({ useHandCursor: true })
      const label = this.scene.add.text(bx, by, cat.label, {
        fontSize: `${INV_FILTER_FONT_PX}px`, color: on ? css(FILTER_ON_TEXT) : css(FILTER_OFF_TEXT),
      }).setOrigin(0.5)

      bg.on('pointerdown', () => {
        this.paging.toggleKind(cat.id)
        this.redraw()
      })
      bg.on('pointerover', () => bg.setStrokeStyle(3, ST_HOVER))
      bg.on('pointerout',  () => bg.setStrokeStyle(1.5, LINE_STRONG))

      this.filterObjects.push(bg, label)
    })

    // ページ送り
    const pages = this.paging.pageCount(total)
    const cur = this.paging.currentPage(total)
    const arrow = (x: number, text: string, delta: number, enabled: boolean) => {
      const t = this.scene.add.text(x, INV_PAGER_Y, text, {
        fontSize: `${INV_PAGER_ARROW_FONT_PX}px`, color: enabled ? css(TEXT_SUB) : css(TEXT_WEAK),
      }).setOrigin(0.5)
      if (enabled) {
        t.setInteractive({ useHandCursor: true })
        t.on('pointerdown', () => this.turnPage(delta))
        t.on('pointerover', () => t.setColor(css(TEXT_BODY)))
        t.on('pointerout', () => t.setColor(css(TEXT_SUB)))
      }
      this.filterObjects.push(t)
    }
    arrow(INV_PANEL_L + 18, '◀', -1, cur > 0)
    this.filterObjects.push(
      this.scene.add.text(cx, INV_PAGER_Y, this.paging.pageLabel(total), {
        fontSize: `${INV_PAGER_FONT_PX}px`, color: css(TEXT_SUB),
      }).setOrigin(0.5),
    )
    arrow(INV_PANEL_L + INV_ITEM_W - 18, '▶', 1, cur < pages - 1)
  }

  private renderItems(items: ItemDef[]): void {
    for (const obj of this.allObjects) obj.destroy()
    this.allObjects = []
    this.bgRects.clear()
    this.quantityTexts.clear()
    this.selectedItemId = null

    items.forEach((item, i) => {
      const y = INV_ITEM_TOP + i * INV_ITEM_H
      const itemCX = INV_PANEL_L + INV_ITEM_W / 2
      const bg = this.scene.add.rectangle(
        itemCX, y, INV_ITEM_W, INV_ITEM_H - INV_ITEM_GAP, BG_PANEL,
      ).setStrokeStyle(3, LINE_WEAK).setInteractive({ useHandCursor: true })
      this.allObjects.push(bg)
      this.bgRects.set(item.id, bg)

      const shapeGfx = this.scene.add.graphics()
      this.drawShapePreview(shapeGfx, item, y)
      this.allObjects.push(shapeGfx)

      const nameText = this.scene.add.text(INV_ITEM_TEXT_L, y - 30, item.display.name, {
        fontSize: `${INV_ITEM_NAME_FONT_PX}px`, color: css(TEXT_BODY),
      })
      // ⚠ **個数と売値は同じ行**（PO 指示 2026-09-14）。行は**品名と、この1行の2行だけ。**
      //   個数は左、売値は右端にそろえる
      const qtyText = this.scene.add.text(INV_ITEM_TEXT_L, y + 3, this.countLabel(item.id), {
        fontSize: `${INV_ITEM_QTY_FONT_PX}px`, color: this.storedOnShelf.has(item.id) ? css(ST_OK) : css(TEXT_SUB),
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
        INV_ITEM_PRICE_R, y + 3,
        money(this.registry.finalPriceOf(item.id, this.marginOf())), {
        fontSize: `${INV_ITEM_PRICE_FONT_PX}px`, color: css(TEXT_SUB),
      }).setOrigin(1, 0)
      this.allObjects.push(nameText, qtyText, priceText)
      this.quantityTexts.set(item.id, qtyText)

      bg.on('pointerdown', () => this.selectItem(item.id))
      bg.on('pointerover', () => {
        if (this.selectedItemId !== item.id) bg.setFillStyle(ROW_LOCAL)
      })
      bg.on('pointerout', () => {
        bg.setFillStyle(this.selectedItemId === item.id ? ROW_UPCOMING : BG_PANEL)
      })
    })
  }

  private drawShapePreview(gfx: Phaser.GameObjects.Graphics, item: ItemDef, rowY: number): void {
    const shape = item.shape
    const rows = shape.length
    const cols = shape[0]?.length ?? 0
    if (rows === 0 || cols === 0) return

    const shapeW = cols * INV_PREVIEW_CELL
    const shapeH = rows * INV_PREVIEW_CELL
    const startX = INV_PREVIEW_CX - shapeW / 2
    const startY = rowY - shapeH / 2

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < (shape[r]?.length ?? 0); c++) {
        if (shape[r][c]) {
          const px = startX + c * INV_PREVIEW_CELL
          const py = startY + r * INV_PREVIEW_CELL
          gfx.fillStyle(kindColor(item.mainKind), 1.0)
          gfx.fillRect(px + 1.5, py + 1.5, INV_PREVIEW_CELL - 3, INV_PREVIEW_CELL - 3)
          gfx.lineStyle(1.5, BG_WINDOW, 0.45)
          gfx.strokeRect(px + 1.5, py + 1.5, INV_PREVIEW_CELL - 3, INV_PREVIEW_CELL - 3)
        }
      }
    }
  }

  private selectItem(itemId: string): void {
    if (this.selectedItemId && this.selectedItemId !== itemId) {
      this.bgRects.get(this.selectedItemId)?.setFillStyle(BG_PANEL)
    }
    this.selectedItemId = itemId
    this.bgRects.get(itemId)?.setFillStyle(ROW_UPCOMING)
    this.onSelectCallback?.(itemId)
  }
}
