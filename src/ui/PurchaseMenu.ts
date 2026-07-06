import Phaser from 'phaser'
import type { ItemDef } from '../components/items/ItemRegistry.js'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { Inventory } from '../components/economy/Inventory.js'

const PANEL_W = 420
const PANEL_H = 480
const PANEL_X = 640
const PANEL_Y = 360

export class PurchaseMenu {
  private container: Phaser.GameObjects.Container | null = null
  private isOpen = false

  constructor(
    private scene: Phaser.Scene,
    private economy: EconomyManager,
    private inventory: Inventory,
    private onClose: () => void,
  ) {}

  open(materials: ItemDef[]): void {
    if (this.isOpen) return
    this.isOpen = true
    this.build(materials)
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

    objs.push(
      this.scene.add.text(PANEL_X, PANEL_Y - 210, '仕入れメニュー', {
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
      this.scene.add.text(PANEL_X - 180, PANEL_Y - 170, `所持金: ¥${this.economy.getMoney().toLocaleString()}`, {
        fontSize: '14px',
        color: '#ffdd44',
      }).setOrigin(0, 0),
    )

    const BUY_QTY = 5
    materials.forEach((mat, i) => {
      const y = PANEL_Y - 120 + i * 56
      const totalCost = mat.price * BUY_QTY
      const canAfford = this.economy.canAfford(totalCost)

      const bg = this.scene.add.rectangle(PANEL_X, y, PANEL_W - 40, 48, canAfford ? 0x2a3a2a : 0x3a2a2a)
        .setStrokeStyle(1, 0x555555)
      objs.push(bg)

      objs.push(
        this.scene.add.text(PANEL_X - 170, y, mat.name, {
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
            this.close()
            this.open(materials)
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
