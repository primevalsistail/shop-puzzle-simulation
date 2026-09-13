import Phaser from 'phaser'
import type { DisplaySlot, GridCell, GridSize, Rotation } from '../types/index.js'
import type { ItemRegistry } from '../components/items/ItemRegistry.js'
// ⚠ 盤面の座標は `layout.ts` が持つ（**Phaser を読まないので単体テストから見える**）。
//   ここは使う場所に近い名前で通すためだけに出し直している
export { CELL_SIZE, GRID_ORIGIN_X, GRID_ORIGIN_Y, DISCARD_MARGIN } from './layout.js'
import { CELL_SIZE, GRID_ORIGIN_X, GRID_ORIGIN_Y, DISCARD_MARGIN } from './layout.js'
import { subtractRect } from './rects.js'

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
  /** 売り場が見えているか。**場所へ行っている間は false**（#58） */
  private shown = true

  constructor(
    private scene: Phaser.Scene,
    private registry: ItemRegistry,
    /** 持ち物。棚は数量を持たないので、表示する数はここから引く */
    private inventory: { getQuantity: (itemId: string) => number },
  ) {}

  // Call this AFTER background is drawn so depth ordering is correct
  init(): void {
    this.gridGraphics = this.scene.add.graphics().setDepth(DEPTH_GRID)
    this.borderGraphics = this.scene.add.graphics().setDepth(DEPTH_GRID)
    this.previewGraphics = this.scene.add.graphics().setDepth(DEPTH_PREVIEW)
    this.dragGhostGraphics = this.scene.add.graphics().setDepth(DEPTH_GHOST)
    this.discardGraphics = this.scene.add.graphics().setDepth(DEPTH_DISCARD)
  }

  /**
   * 売り場の表示を丸ごと消す／戻す。**行った先の画面は棚を覆うのではなく、棚を消す**（#58）。
   *
   * ⚠ **覆う方式にしないこと。**盤面は最大 13×10 ＝ x228〜982 まで伸び、
   *   場所の領域の右端（`PLACE_R` ＝ 976）を6px はみ出す。覆うとその帯だけ残る。
   *
   * ⚠ **状態を覚えること。**隠している間にも区画は作り直される
   *   （改装で棚を買うと `applyShelfSize` が全区画を `drawSlot` し直す）。
   *   覚えていないと、**隠したはずの棚が場所の画面の上に出てくる。**
   */
  setVisible(visible: boolean): void {
    this.shown = visible
    this.gridGraphics.setVisible(visible)
    this.borderGraphics.setVisible(visible)
    this.previewGraphics.setVisible(visible)
    this.dragGhostGraphics.setVisible(visible)
    this.discardGraphics.setVisible(visible)
    for (const g of this.slotGraphics.values()) g.setVisible(visible)
    for (const t of this.slotTexts.values()) t.setVisible(visible)
  }

  drawGrid(size: GridSize): void {
    this.gridGraphics.clear()
    // Cell lines (subtle)
    this.gridGraphics.lineStyle(1.5, 0x446688, 0.7)
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
    this.borderGraphics.lineStyle(4.5, 0x88aaff, 1.0)
    this.borderGraphics.strokeRect(
      GRID_ORIGIN_X,
      GRID_ORIGIN_Y,
      size.width * CELL_SIZE,
      size.height * CELL_SIZE,
    )
  }

  /**
   * 残りが少ないとみなす数。
   *
   * ⚠ **枠の色だけで「補充すべき場所」が分かるようにする。**
   *   棚は最大52区画になるので、数字を1つずつ読ませると探すのが苦痛になる。
   */
  private static readonly LOW_STOCK = 10

  drawSlot(slot: DisplaySlot): void {
    this.clearSlot(slot.id)

    const item = this.registry.getItem(slot.itemId)
    const quantity = this.inventory.getQuantity(slot.itemId)
    const cells = this.getSlotCells(slot)
    const g = this.scene.add.graphics().setDepth(DEPTH_SLOTS).setVisible(this.shown)

    for (const cell of cells) {
      const px = GRID_ORIGIN_X + cell.x * CELL_SIZE
      const py = GRID_ORIGIN_Y + cell.y * CELL_SIZE
      g.fillStyle(item.display.color, quantity > 0 ? 1.0 : 0.25)
      g.fillRect(px + 1.5, py + 1.5, CELL_SIZE - 3, CELL_SIZE - 3)
      // 空 → 赤 ／ 残りわずか → 橙 ／ ふつう → 白
      if (quantity === 0) g.lineStyle(4.5, 0xff6655, 0.95)
      else if (quantity < FloorRenderer.LOW_STOCK) g.lineStyle(4.5, 0xffaa33, 0.9)
      else g.lineStyle(3, 0xffffff, 0.35)
      g.strokeRect(px + 1.5, py + 1.5, CELL_SIZE - 3, CELL_SIZE - 3)
    }

    this.slotGraphics.set(slot.id, g)

    if (cells.length > 0) {
      const cx = cells.reduce((s, c) => s + c.x, 0) / cells.length
      const cy = cells.reduce((s, c) => s + c.y, 0) / cells.length
      const tx = GRID_ORIGIN_X + cx * CELL_SIZE + CELL_SIZE / 2
      const ty = GRID_ORIGIN_Y + cy * CELL_SIZE + CELL_SIZE / 2
      const label = quantity === 0 ? '売り切れ' : `×${quantity}`
      const text = this.scene.add.text(tx, ty, `${item.display.name}\n${label}`, {
        fontSize: '15px',
        color: quantity === 0 ? '#ffbbaa'
          : quantity < FloorRenderer.LOW_STOCK ? '#ffdd99' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
      }).setOrigin(0.5).setDepth(DEPTH_SLOTS + 1).setVisible(this.shown)
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
      this.previewGraphics.fillRect(px + 1.5, py + 1.5, CELL_SIZE - 3, CELL_SIZE - 3)
      this.previewGraphics.lineStyle(3, color, 0.9)
      this.previewGraphics.strokeRect(px + 1.5, py + 1.5, CELL_SIZE - 3, CELL_SIZE - 3)
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
    const step = ghostSize + 6

    const anchor = this.registry.getAnchorOffset(item.shape, rotation)

    for (const offset of offsets) {
      const px = cursorX + (offset.x - anchor.x) * step - ghostSize / 2
      const py = cursorY + (offset.y - anchor.y) * step - ghostSize / 2
      this.dragGhostGraphics.fillStyle(item.display.color, 0.80)
      this.dragGhostGraphics.fillRoundedRect(px, py, ghostSize, ghostSize, 9)
      this.dragGhostGraphics.lineStyle(3, 0xffffff, 0.65)
      this.dragGhostGraphics.strokeRoundedRect(px, py, ghostSize, ghostSize, 9)
    }
  }

  clearDragGhost(): void {
    this.dragGhostGraphics.clear()
  }

  /**
   * 外周の「ここで離すと棚から下ろす」帯を描く。
   * `cursorInZone` が true なら濃く、false なら薄い手がかりとして出す。
   *
   * ⚠ **盤面をくり抜くこと。**上端の帯（y 0〜56）は**盤面の1行目（y 8〜66）に食い込む**ので、
   *   くり抜かないと「**一番上の行へ動かそうとすると棚から外れる**」。
   *   判定（`GameScene.isOverDiscardZone`）も同じく盤面を除いている。**片方だけ直さないこと。**
   * ⚠ **内側の枠線は引かない。**盤面を避けて線を引けないので、引くと棚を横切る。
   */
  drawDiscardZone(cursorInZone: boolean, size: GridSize): void {
    const { width, height } = this.scene.scale
    const m = DISCARD_MARGIN
    this.discardGraphics.clear()
    this.discardGraphics.fillStyle(0xff8822, cursorInZone ? 0.38 : 0.12)

    const grid = {
      x: GRID_ORIGIN_X, y: GRID_ORIGIN_Y,
      w: size.width * CELL_SIZE, h: size.height * CELL_SIZE,
    }
    const bands = [
      { x: 0, y: 0, w: width, h: m },
      { x: 0, y: height - m, w: width, h: m },
      { x: 0, y: m, w: m, h: height - m * 2 },
      { x: width - m, y: m, w: m, h: height - m * 2 },
    ]
    for (const band of bands) {
      for (const r of subtractRect(band, grid)) {
        this.discardGraphics.fillRect(r.x, r.y, r.w, r.h)
      }
    }
  }

  /**
   * そこで離したら棚から下ろすか。
   *
   * ⚠ **盤面の上は含めない。**`drawDiscardZone` と同じ規則。
   */
  isOverDiscardZone(x: number, y: number, size: GridSize): boolean {
    if (this.isOverGrid(x, y, size)) return false
    const { width, height } = this.scene.scale
    const m = DISCARD_MARGIN
    return x < m || x > width - m || y < m || y > height - m
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
