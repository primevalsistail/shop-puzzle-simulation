import Phaser from 'phaser'
import type { ItemDef, ItemRegistry } from '../components/items/ItemRegistry.js'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { Inventory } from '../components/economy/Inventory.js'

const PANEL_W = 420
const PANEL_H = 480
const PANEL_X = 640
const PANEL_Y = 360

const ROW_H = 52
const ROWS_TOP = PANEL_Y - 140          // 先頭行の中心
const VISIBLE_COUNT = 7                 // 7行目の下端 558 < パネル下端 600
const BUY_QTY = 5

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
  private islandName = ''
  private scrollIndex = 0

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
      const max = Math.max(0, this.materials.length - VISIBLE_COUNT)
      const next = Math.min(Math.max(0, this.scrollIndex + (dy > 0 ? 1 : -1)), max)
      if (next === this.scrollIndex) return
      this.scrollIndex = next
      this.rebuild()
    })
  }

  open(materials: ItemDef[], islandName: string): void {
    if (this.isOpen) return
    this.isOpen = true
    this.materials = materials
    this.islandName = islandName
    this.scrollIndex = 0
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

  private rebuild(): void {
    this.container?.destroy()
    this.container = null
    this.build(this.materials)
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
    const from = total === 0 ? 0 : this.scrollIndex + 1
    const to = Math.min(this.scrollIndex + VISIBLE_COUNT, total)

    objs.push(
      this.scene.add.text(PANEL_X, PANEL_Y - 210, `${this.islandName}の商人  ${from}-${to} / ${total}`, {
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
      this.scene.add.text(PANEL_X - 180, PANEL_Y - 178, `所持金: ¥${this.economy.getMoney().toLocaleString()}`, {
        fontSize: '14px',
        color: '#ffdd44',
      }).setOrigin(0, 0),
    )

    materials.slice(this.scrollIndex, this.scrollIndex + VISIBLE_COUNT).forEach((mat, i) => {
      const y = ROWS_TOP + i * ROW_H
      const unitCost = this.registry.purchasePriceOf(mat.id)
      const totalCost = unitCost * BUY_QTY
      const canAfford = this.economy.canAfford(totalCost)

      const bg = this.scene.add.rectangle(PANEL_X, y, PANEL_W - 40, ROW_H - 6, canAfford ? 0x2a3a2a : 0x3a2a2a)
        .setStrokeStyle(1, 0x555555)
      objs.push(bg)

      objs.push(
        this.scene.add.text(PANEL_X - 170, y, mat.display.name, {
          fontSize: '14px',
          color: '#ffffff',
        }).setOrigin(0, 0.5),
      )

      const stock = this.inventory.getQuantity(mat.id)
      objs.push(
        this.scene.add.text(PANEL_X - 40, y, `在庫: ${stock}`, {
          fontSize: '12px',
          color: '#aaaaaa',
        }).setOrigin(0, 0.5),
      )

      if (canAfford) {
        const btn = this.scene.add
          .text(PANEL_X + 130, y, `¥${totalCost} × ${BUY_QTY}個`, {
            fontSize: '13px',
            color: '#ffffff',
            backgroundColor: '#6a5a2a',
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
          this.scene.add.text(PANEL_X + 130, y, `¥${totalCost} 不足`, {
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
