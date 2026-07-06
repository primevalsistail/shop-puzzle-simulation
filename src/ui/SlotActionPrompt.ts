import Phaser from 'phaser'
import type { DisplaySlot } from '../types/index.js'
import type { ShopService } from '../services/ShopService.js'
import type { Inventory } from '../components/economy/Inventory.js'

export class SlotActionPrompt {
  private container: Phaser.GameObjects.Container | null = null

  constructor(
    private scene: Phaser.Scene,
    private shopService: ShopService,
    private inventory: Inventory,
    private onAction: (slotId: string, action: 'restock' | 'remove') => void,
  ) {}

  show(slot: DisplaySlot, screenX: number, screenY: number): void {
    this.hide()

    const objs: Phaser.GameObjects.GameObject[] = []
    const bgW = 200
    const bgH = 90

    const bg = this.scene.add.rectangle(screenX, screenY, bgW, bgH, 0x222244)
      .setStrokeStyle(2, 0x8888cc)
    objs.push(bg)

    const available = this.inventory.getQuantity(slot.itemId)
    const label = this.scene.add.text(screenX, screenY - 28, `在庫: ${available}`, {
      fontSize: '13px',
      color: '#ccccff',
    }).setOrigin(0.5)
    objs.push(label)

    if (available > 0) {
      const restockBtn = this.scene.add
        .text(screenX - 44, screenY + 4, '補充', {
          fontSize: '15px',
          color: '#ffffff',
          backgroundColor: '#2a6a2a',
          padding: { x: 12, y: 6 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
      restockBtn.on('pointerdown', () => {
        this.shopService.restockSlot(slot.id, available)
        this.onAction(slot.id, 'restock')
        this.hide()
      })
      objs.push(restockBtn)
    }

    const removeBtn = this.scene.add
      .text(screenX + 44, screenY + 4, '撤去', {
        fontSize: '15px',
        color: '#ffffff',
        backgroundColor: '#6a2a2a',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    removeBtn.on('pointerdown', () => {
      this.shopService.removeSlot(slot.id)
      this.onAction(slot.id, 'remove')
      this.hide()
    })
    objs.push(removeBtn)

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(50)
  }

  hide(): void {
    this.container?.destroy()
    this.container = null
  }

  isVisible(): boolean {
    return this.container !== null
  }
}
