import Phaser from 'phaser'
import type { CraftingSystem } from '../components/items/CraftingSystem.js'
import type { Inventory } from '../components/economy/Inventory.js'
import type { ItemRegistry, RecipeDef } from '../components/items/ItemRegistry.js'

const PANEL_W = 480
const PANEL_H = 500
const PANEL_X = 640
const PANEL_Y = 360

export class CraftMenu {
  private container: Phaser.GameObjects.Container | null = null
  private progressBar: Phaser.GameObjects.Rectangle | null = null
  private progressBg: Phaser.GameObjects.Rectangle | null = null
  private progressLabel: Phaser.GameObjects.Text | null = null
  private isOpen = false

  constructor(
    private scene: Phaser.Scene,
    private craftingSystem: CraftingSystem,
    private inventory: Inventory,
    private registry: ItemRegistry,
    private onClose: () => void,
  ) {}

  open(): void {
    if (this.isOpen) return
    this.isOpen = true
    this.build()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.container?.destroy()
    this.container = null
    this.progressBar = null
    this.progressBg = null
    this.progressLabel = null
    this.onClose()
  }

  update(): void {
    if (!this.isOpen || !this.craftingSystem.isActive()) return
    this.updateProgress()
  }

  isVisible(): boolean {
    return this.isOpen
  }

  private build(): void {
    const objs: Phaser.GameObjects.GameObject[] = []

    // Overlay backdrop
    const backdrop = this.scene.add
      .rectangle(0, 0, 1280, 720, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setInteractive()
    objs.push(backdrop)

    // Panel background
    const panel = this.scene.add.rectangle(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 0x1e1e3a)
      .setStrokeStyle(2, 0x4a4a8a)
    objs.push(panel)

    // Title
    objs.push(
      this.scene.add.text(PANEL_X, PANEL_Y - 220, 'クラフトメニュー', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    )

    // Close button
    const closeBtn = this.scene.add.text(PANEL_X + 220, PANEL_Y - 220, '[×]', {
      fontSize: '18px',
      color: '#ff6666',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => this.close())
    objs.push(closeBtn)

    // Recipe rows
    const recipes = this.registry.getAllRecipes()
    recipes.forEach((recipe, i) => {
      const y = PANEL_Y - 160 + i * 64
      this.buildRecipeRow(recipe, y, objs)
    })

    // Progress area
    const progY = PANEL_Y + 180
    objs.push(
      this.scene.add.text(PANEL_X, progY - 24, '作業進捗', {
        fontSize: '14px',
        color: '#aaaaaa',
      }).setOrigin(0.5),
    )

    this.progressBg = this.scene.add.rectangle(PANEL_X, progY, 380, 20, 0x333333)
    this.progressBar = this.scene.add.rectangle(PANEL_X - 190, progY, 0, 18, 0x4a8a4a).setOrigin(0, 0.5)
    this.progressLabel = this.scene.add.text(PANEL_X, progY + 22, '待機中', {
      fontSize: '12px',
      color: '#cccccc',
    }).setOrigin(0.5)
    objs.push(this.progressBg, this.progressBar, this.progressLabel)

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(100)
    this.updateProgress()
  }

  private buildRecipeRow(recipe: RecipeDef, y: number, objs: Phaser.GameObjects.GameObject[]): void {
    const canCraft = this.craftingSystem.canCraft(recipe.id)
    const bgColor = canCraft ? 0x2a3a2a : 0x3a2a2a

    const bg = this.scene.add
      .rectangle(PANEL_X, y, PANEL_W - 40, 56, bgColor)
      .setStrokeStyle(1, 0x555555)
    objs.push(bg)

    // Recipe name
    objs.push(
      this.scene.add.text(PANEL_X - 180, y - 10, recipe.name, {
        fontSize: '14px',
        color: canCraft ? '#ffffff' : '#888888',
      }).setOrigin(0, 0.5),
    )

    // Ingredients
    const ingText = recipe.ingredients
      .map(ing => {
        const item = this.registry.getItem(ing.itemId)
        const have = this.inventory.getQuantity(ing.itemId)
        return `${item.name}x${ing.quantity}(${have})`
      })
      .join('  ')
    objs.push(
      this.scene.add.text(PANEL_X - 180, y + 10, ingText, {
        fontSize: '11px',
        color: '#aaaaaa',
      }).setOrigin(0, 0.5),
    )

    // Duration & output
    const outItem = this.registry.getItem(recipe.outputItemId)
    objs.push(
      this.scene.add.text(PANEL_X + 60, y, `→ ${outItem.name}×${recipe.outputQuantity}  ${recipe.durationMinutes}分`, {
        fontSize: '12px',
        color: '#88ccff',
      }).setOrigin(0, 0.5),
    )

    // Craft button
    if (canCraft && !this.craftingSystem.isActive()) {
      const btn = this.scene.add
        .text(PANEL_X + 190, y, 'クラフト', {
          fontSize: '13px',
          color: '#ffffff',
          backgroundColor: '#4a4a8a',
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
      btn.on('pointerdown', () => {
        this.craftingSystem.startCraft(recipe.id)
        this.refresh()
      })
      objs.push(btn)
    }
  }

  private updateProgress(): void {
    if (!this.progressBar || !this.progressLabel || !this.progressBg) return
    const job = this.craftingSystem.getActiveJob()
    if (!job) {
      this.progressBar.setSize(0, 18)
      this.progressLabel.setText('待機中')
      return
    }
    const pct = this.craftingSystem.getProgress()
    this.progressBar.setSize(380 * pct, 18)
    const recipe = this.craftingSystem.getRecipeDef(job.recipeId)
    this.progressLabel.setText(`${recipe.name} … ${Math.floor(pct * 100)}%`)
  }

  private refresh(): void {
    this.close()
    this.onClose = this.onClose
    this.isOpen = false
    this.open()
  }
}
