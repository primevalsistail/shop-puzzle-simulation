import Phaser from 'phaser'
import type { ItemDef, ItemRegistry } from '../components/items/ItemRegistry.js'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { Inventory } from '../components/economy/Inventory.js'
import { ListPaging, KIND_BUTTONS } from './ListPaging.js'
import { MAX_QUANTITY } from '../components/economy/Inventory.js'
import type { IslandName } from '../taxonomy/islands.js'

const PANEL_W = 420
const PANEL_H = 480
const PANEL_X = 640
const PANEL_Y = 360

const ROW_H = 52
const ROWS_TOP = PANEL_Y - 128          // 先頭行の中心（絞り込みの行を入れたぶん下げた）
const VISIBLE_COUNT = 6                 // 6行目の下端 546 < パネル下端 600
const BUY_QTY = 5
const FILTER_Y = PANEL_Y - 166   // 1行目（中心 PANEL_Y-128、高さ46）に食い込まない位置

/**
 * 島の商人が並べる品を買う。
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

  constructor(
    private scene: Phaser.Scene,
    private registry: ItemRegistry,
    private economy: EconomyManager,
    private inventory: Inventory,
    private onClose: () => void,
  ) {
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
    if (focusId) this.paging.jumpTo(this.shown().findIndex(m => m.id === focusId), this.shown().length)
    this.rebuild()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.container?.destroy()
    this.container = null
    this.onClose()
  }

  isVisible(): boolean {
    return this.isOpen
  }

  private shown(): ItemDef[] {
    return this.paging.filter(this.materials, m => m.mainKind)
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

    const backdrop = this.scene.add
      .rectangle(0, 0, 1280, 720, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setInteractive()
    objs.push(backdrop)

    const panel = this.scene.add.rectangle(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 0x1e1e3a)
      .setStrokeStyle(2, 0x8a6a2a)
    objs.push(panel)

    const total = materials.length

    objs.push(
      this.scene.add.text(PANEL_X, PANEL_Y - 210, `${this.islandName}の商人  ${this.paging.rangeLabel(total)}`, {
        fontSize: '20px',
        color: '#ffdd88',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    )

    const closeBtn = this.scene.add.text(PANEL_X + 190, PANEL_Y - 210, '[×]', {
      fontSize: '18px',
      color: '#ff6666',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => this.close())
    objs.push(closeBtn)

    objs.push(
      this.scene.add.text(PANEL_X - 190, PANEL_Y - 185, `所持金: ¥${this.economy.getMoney().toLocaleString()}`, {
        fontSize: '14px',
        color: '#ffdd44',
      }).setOrigin(0, 0.5),
    )

    // ── 絞り込み（主種類）＋ ページ送り ──
    const btnW = 54, btnH = 20, gap = 6
    const groupW = KIND_BUTTONS.length * btnW + (KIND_BUTTONS.length - 1) * gap
    KIND_BUTTONS.forEach((cat, i) => {
      const bx = PANEL_X - groupW / 2 + btnW / 2 + i * (btnW + gap)
      const on = this.paging.isKindActive(cat.id)
      const bg = this.scene.add.rectangle(bx, FILTER_Y, btnW, btnH, on ? 0x6a5a2a : 0x232338)
        .setStrokeStyle(1, on ? 0xbb9944 : 0x444455)
        .setInteractive({ useHandCursor: true })
      const label = this.scene.add.text(bx, FILTER_Y, cat.label, {
        fontSize: '11px', color: on ? '#ffdd88' : '#778899',
      }).setOrigin(0.5)
      bg.on('pointerdown', () => { this.paging.toggleKind(cat.id); this.rebuild() })
      objs.push(bg, label)
    })

    const pages = this.paging.pageCount(total)
    const cur = this.paging.currentPage(total)
    const arrow = (x: number, text: string, delta: number, enabled: boolean) => {
      const t = this.scene.add.text(x, PANEL_Y + 218, text, {
        fontSize: '18px', color: enabled ? '#ffdd88' : '#555566',
      }).setOrigin(0.5)
      if (enabled) {
        t.setInteractive({ useHandCursor: true })
        t.on('pointerdown', () => this.turnPage(delta))
      }
      objs.push(t)
    }
    arrow(PANEL_X - 60, '◀', -1, cur > 0)
    objs.push(this.scene.add.text(PANEL_X, PANEL_Y + 218, this.paging.pageLabel(total), {
      fontSize: '13px', color: '#aa9977',
    }).setOrigin(0.5))
    arrow(PANEL_X + 60, '▶', 1, cur < pages - 1)

    this.paging.slice(materials).forEach((mat, i) => {
      const y = ROWS_TOP + i * ROW_H
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
      const bg = this.scene.add.rectangle(PANEL_X, y, PANEL_W - 40, ROW_H - 6, buyable ? 0x2a3a2a : 0x3a2a2a)
        .setStrokeStyle(focused ? 2 : 1, focused ? 0xffdd88 : 0x555555)
      objs.push(bg)

      const nameText = this.scene.add.text(PANEL_X - 170, y, mat.display.name, {
        fontSize: '14px',
        color: '#ffffff',
      }).setOrigin(0, 0.5)
      objs.push(nameText)

      // 産地の島であることを、値引きの理由として見せる。**品に島の名前を足してはいない**
      // （`産地` は元からある軸。ここは値の一致を表示しているだけ）
      if (isLocal) {
        objs.push(
          this.scene.add.text(nameText.x + nameText.width + 6, y, 'この島の産', {
            fontSize: '10px', color: '#88ddaa',
          }).setOrigin(0, 0.5),
        )
      }

      objs.push(
        this.scene.add.text(PANEL_X - 40, y, `在庫: ${stock}/${MAX_QUANTITY}`, {
          fontSize: '12px',
          color: hasRoom ? '#aaaaaa' : '#dd8866',
        }).setOrigin(0, 0.5),
      )

      if (buyable) {
        const btn = this.scene.add
          .text(PANEL_X + 130, y, `¥${totalCost} × ${BUY_QTY}個`, {
            fontSize: '13px',
            color: isLocal ? '#bbffcc' : '#ffffff',
            backgroundColor: isLocal ? '#3a6a3a' : '#6a5a2a',
            padding: { x: 8, y: 5 },
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
          this.scene.add.text(PANEL_X + 130, y, hasRoom ? `¥${totalCost} 不足` : `上限${MAX_QUANTITY}`, {
            fontSize: '12px',
            color: '#888888',
          }).setOrigin(0.5),
        )
      }
    })

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(100)
  }
}
