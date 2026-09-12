import Phaser from 'phaser'
import type { ItemDef, ItemRegistry } from '../components/items/ItemRegistry.js'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { Inventory } from '../components/economy/Inventory.js'
import { ListPaging, KIND_BUTTONS } from './ListPaging.js'
import { MAX_QUANTITY } from '../components/economy/Inventory.js'
import type { IslandName } from '../taxonomy/islands.js'
import { SearchBox } from './SearchBox.js'
import type { PlaceFrame } from './PlaceFrame.js'
import { CONTENT_DEPTH } from './PlaceFrame.js'
import {
  PLACE_CX, CONTENT_L, CONTENT_R,
  SUBTITLE_Y, FILTER_Y, ROWS_TOP, PAGER_Y, rowsThatFit,
} from './layout.js'

const ROW_H = 52
/** ⚠ **決め打ちしない。**領域の高さから出す（`layout.ts`） */
const VISIBLE_COUNT = rowsThatFit(ROW_H)
const BUY_QTY = 5
/** 検索の入力欄。絞り込みの行の右端に置く */
const SEARCH_W = 160
const SEARCH_H = 24

/** 1行の中の列 */
const ROW_W = CONTENT_R - CONTENT_L
const NAME_X = CONTENT_L + 16
const STOCK_X = CONTENT_R - 250
const BUY_CX = CONTENT_R - 80

/**
 * 島の商人のところ。**ダイアログではなく「行く場所」**（#58）。
 *
 * ⚠ **品揃えは固定ではない。**`stockedByIslandMerchant` が現在地と累計販売数から出す（#30）。
 *   ハルヴェラ・累計販売0の時点で **18品**。売るほど U2 で増えるので、
 *   画面に収まらない。**ホイールで送れないと下の品に手が届かない。**
 */
export class PurchaseMenu {
  private container: Phaser.GameObjects.Container | null = null
  private isOpen = false
  private materials: ItemDef[] = []
  private islandName: IslandName = 'ハルヴェラ'
  private paging = new ListPaging(VISIBLE_COUNT)
  /** 棚から「これを補充したい」と来た品。1行だけ目立たせる */
  private focusId: string | null = null
  /** ⚠ **一覧とは別に持つ。**一緒に作り直すと打鍵のたびにカーソルが飛ぶ（#55） */
  private search: SearchBox

  constructor(
    private scene: Phaser.Scene,
    private registry: ItemRegistry,
    private economy: EconomyManager,
    private inventory: Inventory,
    private frame: PlaceFrame,
    private onClose: () => void,
  ) {
    this.search = new SearchBox(scene)
    this.scene.input.on('wheel', (
      _pointer: Phaser.Input.Pointer,
      _over: unknown, _dx: number, dy: number,
    ) => {
      if (!this.isOpen) return
      if (this.paging.movePage(dy > 0 ? 1 : -1, this.shown().length)) this.rebuild()
    })
  }

  open(materials: ItemDef[], islandName: IslandName, focusId?: string): void {
    if (this.isOpen) return
    this.isOpen = true
    this.materials = materials
    this.islandName = islandName
    this.focusId = focusId ?? null
    this.paging.clearKinds()
    this.paging.setQuery('')
    if (focusId) this.paging.jumpTo(this.shown().findIndex(m => m.id === focusId), this.shown().length)
    this.frame.show(`${islandName}島の商人のところ`, () => this.close())
    this.search.place(
      CONTENT_R - SEARCH_W / 2, FILTER_Y, SEARCH_W, SEARCH_H, '名前で探す',
      q => { this.paging.setQuery(q); this.rebuild() },
      CONTENT_DEPTH,
    )
    this.rebuild()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.container?.destroy()
    this.container = null
    this.search.destroy()
    this.frame.hide()
    this.onClose()
  }

  isVisible(): boolean {
    return this.isOpen
  }

  private shown(): ItemDef[] {
    return this.paging.filter(this.materials, m => m.mainKind, m => m.display.name)
  }

  private turnPage(delta: number): void {
    if (this.paging.movePage(delta, this.shown().length)) this.rebuild()
  }

  private rebuild(): void {
    this.container?.destroy()
    this.container = null
    this.build(this.shown())
  }

  private build(materials: ItemDef[]): void {
    const objs: Phaser.GameObjects.GameObject[] = []
    const total = materials.length

    // ── 見出しの下の1行 — 所持金 ／ 何件目を見ているか ──
    objs.push(
      this.scene.add.text(CONTENT_L, SUBTITLE_Y, `所持金: ¥${this.economy.getMoney().toLocaleString()}`, {
        fontSize: '15px', color: '#ffdd44',
      }).setOrigin(0, 0.5),
      this.scene.add.text(CONTENT_R, SUBTITLE_Y, this.paging.rangeLabel(total), {
        fontSize: '13px', color: '#aa9977',
      }).setOrigin(1, 0.5),
    )

    // ── 絞り込み（主種類） ──
    const btnW = 64, btnH = 22, gap = 8
    const groupW = KIND_BUTTONS.length * btnW + (KIND_BUTTONS.length - 1) * gap
    KIND_BUTTONS.forEach((cat, i) => {
      const bx = PLACE_CX - groupW / 2 + btnW / 2 + i * (btnW + gap)
      const on = this.paging.isKindActive(cat.id)
      const bg = this.scene.add.rectangle(bx, FILTER_Y, btnW, btnH, on ? 0x6a5a2a : 0x232338)
        .setStrokeStyle(1, on ? 0xbb9944 : 0x444455)
        .setInteractive({ useHandCursor: true })
      const label = this.scene.add.text(bx, FILTER_Y, cat.label, {
        fontSize: '12px', color: on ? '#ffdd88' : '#778899',
      }).setOrigin(0.5)
      bg.on('pointerdown', () => { this.paging.toggleKind(cat.id); this.rebuild() })
      objs.push(bg, label)
    })

    this.paging.slice(materials).forEach((mat, i) => {
      this.buildRow(mat, ROWS_TOP + ROW_H / 2 + i * ROW_H, objs)
    })

    this.buildPager(total, objs)

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(CONTENT_DEPTH)
  }

  private buildPager(total: number, objs: Phaser.GameObjects.GameObject[]): void {
    const pages = this.paging.pageCount(total)
    const cur = this.paging.currentPage(total)
    const arrow = (x: number, text: string, delta: number, enabled: boolean) => {
      const t = this.scene.add.text(x, PAGER_Y, text, {
        fontSize: '18px', color: enabled ? '#ffdd88' : '#555566',
      }).setOrigin(0.5)
      if (enabled) {
        t.setInteractive({ useHandCursor: true })
        t.on('pointerdown', () => this.turnPage(delta))
      }
      objs.push(t)
    }
    arrow(PLACE_CX - 60, '◀', -1, cur > 0)
    objs.push(this.scene.add.text(PLACE_CX, PAGER_Y, this.paging.pageLabel(total), {
      fontSize: '13px', color: '#aa9977',
    }).setOrigin(0.5))
    arrow(PLACE_CX + 60, '▶', 1, cur < pages - 1)
  }

  private buildRow(mat: ItemDef, y: number, objs: Phaser.GameObjects.GameObject[]): void {
    // **いまいる島**の買値。産地の島にいる品だけ安い（段4-6 / derive.ts `ORIGIN_DISCOUNT`）
    const unitCost = this.registry.purchasePriceOf(mat.id, this.islandName)
    const isLocal = mat.origin === this.islandName
    const totalCost = unitCost * BUY_QTY
    const canAfford = this.economy.canAfford(totalCost)
    // **上限を超える買い物はさせない。**払ってから溢れて消える、を起こさないため（段4-7）
    const stock = this.inventory.getQuantity(mat.id)
    const hasRoom = this.inventory.spaceFor(mat.id) >= BUY_QTY
    const buyable = canAfford && hasRoom

    const focused = mat.id === this.focusId
    objs.push(
      this.scene.add.rectangle(PLACE_CX, y, ROW_W, ROW_H - 6, buyable ? 0x2a3a2a : 0x3a2a2a)
        .setStrokeStyle(focused ? 2 : 1, focused ? 0xffdd88 : 0x555555),
    )

    const nameText = this.scene.add.text(NAME_X, y, mat.display.name, {
      fontSize: '15px', color: '#ffffff',
    }).setOrigin(0, 0.5)
    objs.push(nameText)

    // 産地の島であることを、値引きの理由として見せる。**品に島の名前を足してはいない**
    // （`産地` は元からある軸。ここは値の一致を表示しているだけ）
    if (isLocal) {
      objs.push(
        this.scene.add.text(nameText.x + nameText.width + 8, y, 'この島の産', {
          fontSize: '11px', color: '#88ddaa',
        }).setOrigin(0, 0.5),
      )
    }

    objs.push(
      this.scene.add.text(STOCK_X, y, `在庫: ${stock}/${MAX_QUANTITY}`, {
        fontSize: '13px', color: hasRoom ? '#aaaaaa' : '#dd8866',
      }).setOrigin(0, 0.5),
    )

    if (buyable) {
      const btn = this.scene.add
        .text(BUY_CX, y, `¥${totalCost} × ${BUY_QTY}個`, {
          fontSize: '13px',
          color: isLocal ? '#bbffcc' : '#ffffff',
          backgroundColor: isLocal ? '#3a6a3a' : '#6a5a2a',
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
      btn.on('pointerdown', () => {
        if (this.economy.spend(totalCost)) {
          this.inventory.add(mat.id, BUY_QTY)
          this.rebuild()
        }
      })
      objs.push(btn)
    } else {
      objs.push(
        this.scene.add.text(BUY_CX, y, hasRoom ? `¥${totalCost} 不足` : `上限${MAX_QUANTITY}`, {
          fontSize: '12px', color: '#888888',
        }).setOrigin(0.5),
      )
    }
  }
}
