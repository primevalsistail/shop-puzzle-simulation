import Phaser from 'phaser'
import type { DisplaySlot, GridCell, GridSize, Rotation } from '../types/index.js'
import type { ItemRegistry } from '../components/items/ItemRegistry.js'

// 13×10 最終グリッドから逆算: min(floor(760/13), floor(610/10)) = 58
export const CELL_SIZE = 58
// グリッドを左上に寄せる（拡張時に右・下に伸びる余地を確保）
export const GRID_ORIGIN_X = 228  // 左パネル右端(220) + 8px
export const GRID_ORIGIN_Y = 8    // 上端から 8px
export const DISCARD_MARGIN = 56  // px from screen edge that counts as the discard zone

// Small rendering depth constants
const DEPTH_GRID = 2
const DEPTH_SLOTS = 3
const DEPTH_PREVIEW = 4
const DEPTH_GHOST = 5
const DEPTH_DISCARD = 6

export class FloorRenderer {
  private gridGraphics!: Phaser.GameObjects.Graphics
  private borderGraphics!: Phaser.GameObjects.Graphics
  private previewGraphics!: Phaser.GameObjects.Graphics
  private dragGhostGraphics!: Phaser.GameObjects.Graphics
  private discardGraphics!: Phaser.GameObjects.Graphics
  private slotGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map()
  private slotTexts: Map<string, Phaser.GameObjects.Text> = new Map()

  constructor(
    private scene: Phaser.Scene,
    private registry: ItemRegistry,
  ) {}

  // Call this AFTER background is drawn so depth ordering is correct
  init(): void {
    this.gridGraphics = this.scene.add.graphics().setDepth(DEPTH_GRID)
    this.borderGraphics = this.scene.add.graphics().setDepth(DEPTH_GRID)
    this.previewGraphics = this.scene.add.graphics().setDepth(DEPTH_PREVIEW)
    this.dragGhostGraphics = this.scene.add.graphics().setDepth(DEPTH_GHOST)
    this.discardGraphics = this.scene.add.graphics().setDepth(DEPTH_DISCARD)
  }

  drawGrid(size: GridSize): void {
    this.gridGraphics.clear()
    // Cell lines (subtle)
    this.gridGraphics.lineStyle(1, 0x446688, 0.7)
    for (let x = 0; x <= size.width; x++) {
      const px = GRID_ORIGIN_X + x * CELL_SIZE
      this.gridGraphics.lineBetween(px, GRID_ORIGIN_Y, px, GRID_ORIGIN_Y + size.height * CELL_SIZE)
    }
    for (let y = 0; y <= size.height; y++) {
      const py = GRID_ORIGIN_Y + y * CELL_SIZE
      this.gridGraphics.lineBetween(GRID_ORIGIN_X, py, GRID_ORIGIN_X + size.width * CELL_SIZE, py)
    }

    // Outer border (bright)
    this.borderGraphics.clear()
    this.borderGraphics.lineStyle(3, 0x88aaff, 1.0)
    this.borderGraphics.strokeRect(
      GRID_ORIGIN_X,
      GRID_ORIGIN_Y,
      size.width * CELL_SIZE,
      size.height * CELL_SIZE,
    )
  }

  drawSlot(slot: DisplaySlot): void {
    this.clearSlot(slot.id)

    const item = this.registry.getItem(slot.itemId)
    const cells = this.getSlotCells(slot)
    const g = this.scene.add.graphics().setDepth(DEPTH_SLOTS)

    for (const cell of cells) {
      const px = GRID_ORIGIN_X + cell.x * CELL_SIZE
      const py = GRID_ORIGIN_Y + cell.y * CELL_SIZE
      g.fillStyle(item.color, slot.quantity > 0 ? 1.0 : 0.3)
      g.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      g.lineStyle(2, 0xffffff, 0.35)
      g.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
    }

    this.slotGraphics.set(slot.id, g)

    if (cells.length > 0) {
      const cx = cells.reduce((s, c) => s + c.x, 0) / cells.length
      const cy = cells.reduce((s, c) => s + c.y, 0) / cells.length
      const tx = GRID_ORIGIN_X + cx * CELL_SIZE + CELL_SIZE / 2
      const ty = GRID_ORIGIN_Y + cy * CELL_SIZE + CELL_SIZE / 2
      const text = this.scene.add.text(tx, ty, `${item.name}\n×${slot.quantity}`, {
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
      }).setOrigin(0.5).setDepth(DEPTH_SLOTS + 1)
      this.slotTexts.set(slot.id, text)
    }
  }

  clearSlot(slotId: string): void {
    this.slotGraphics.get(slotId)?.destroy()
    this.slotGraphics.delete(slotId)
    this.slotTexts.get(slotId)?.destroy()
    this.slotTexts.delete(slotId)
  }

  refreshSlot(slot: DisplaySlot): void {
    this.drawSlot(slot)
  }

  drawAllSlots(slots: DisplaySlot[]): void {
    for (const slot of slots) this.drawSlot(slot)
  }

  drawPreview(itemId: string, position: GridCell, rotation: Rotation, valid: boolean): void {
    this.previewGraphics.clear()
    const item = this.registry.getItem(itemId)
    const rotated = this.registry.getRotatedShape(item.shape, rotation)
    const offsets = this.registry.shapeToOffsets(rotated)
    const color = valid ? 0x00ff88 : 0xff3333

    for (const offset of offsets) {
      const px = GRID_ORIGIN_X + (position.x + offset.x) * CELL_SIZE
      const py = GRID_ORIGIN_Y + (position.y + offset.y) * CELL_SIZE
      this.previewGraphics.fillStyle(color, 0.45)
      this.previewGraphics.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      this.previewGraphics.lineStyle(2, color, 0.9)
      this.previewGraphics.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
    }
  }

  clearPreview(): void {
    this.previewGraphics.clear()
  }

  // Item shape "ghost" — the center block (closest to centroid) sits directly under the cursor
  drawDragGhost(itemId: string, rotation: Rotation, cursorX: number, cursorY: number): void {
    this.dragGhostGraphics.clear()
    const item = this.registry.getItem(itemId)
    const rotated = this.registry.getRotatedShape(item.shape, rotation)
    const offsets = this.registry.shapeToOffsets(rotated)
    if (offsets.length === 0) return

    const ghostSize = CELL_SIZE * 0.7
    const step = ghostSize + 4

    const anchor = this.registry.getAnchorOffset(item.shape, rotation)

    for (const offset of offsets) {
      const px = cursorX + (offset.x - anchor.x) * step - ghostSize / 2
      const py = cursorY + (offset.y - anchor.y) * step - ghostSize / 2
      this.dragGhostGraphics.fillStyle(item.color, 0.80)
      this.dragGhostGraphics.fillRoundedRect(px, py, ghostSize, ghostSize, 6)
      this.dragGhostGraphics.lineStyle(2, 0xffffff, 0.65)
      this.dragGhostGraphics.strokeRoundedRect(px, py, ghostSize, ghostSize, 6)
    }
  }

  clearDragGhost(): void {
    this.dragGhostGraphics.clear()
  }

  // cursorInZone=true → bright highlight (cursor is at edge); false → faint hint
  drawDiscardZone(cursorInZone: boolean): void {
    const { width, height } = this.scene.scale
    const m = DISCARD_MARGIN
    this.discardGraphics.clear()
    const fillAlpha = cursorInZone ? 0.38 : 0.12
    const lineAlpha = cursorInZone ? 0.9 : 0.35
    this.discardGraphics.fillStyle(0xff8822, fillAlpha)
    this.discardGraphics.fillRect(0, 0, width, m)
    this.discardGraphics.fillRect(0, height - m, width, m)
    this.discardGraphics.fillRect(0, m, m, height - m * 2)
    this.discardGraphics.fillRect(width - m, m, m, height - m * 2)
    this.discardGraphics.lineStyle(2, 0xffcc44, lineAlpha)
    this.discardGraphics.strokeRect(m, m, width - m * 2, height - m * 2)
  }

  clearDiscardZone(): void {
    this.discardGraphics.clear()
  }

  worldToGrid(worldX: number, worldY: number): GridCell | null {
    const gx = Math.floor((worldX - GRID_ORIGIN_X) / CELL_SIZE)
    const gy = Math.floor((worldY - GRID_ORIGIN_Y) / CELL_SIZE)
    return { x: gx, y: gy }
  }

  isOverGrid(worldX: number, worldY: number, size: GridSize): boolean {
    return (
      worldX >= GRID_ORIGIN_X &&
      worldX < GRID_ORIGIN_X + size.width * CELL_SIZE &&
      worldY >= GRID_ORIGIN_Y &&
      worldY < GRID_ORIGIN_Y + size.height * CELL_SIZE
    )
  }

  private getSlotCells(slot: DisplaySlot): GridCell[] {
    const rotated = this.registry.getRotatedShape(slot.shape, slot.rotation)
    const offsets = this.registry.shapeToOffsets(rotated)
    return offsets.map(o => ({ x: slot.position.x + o.x, y: slot.position.y + o.y }))
  }
}
