import type { GridCell, GridSize, DisplaySlot, Rotation } from '../../types/index.js'
import type { Shape } from '../../taxonomy/axes.js'
import type { ItemRegistry } from '../items/ItemRegistry.js'

const NEIGHBOR_OFFSETS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
]

export class FloorGrid {
  private size: GridSize
  private cells: (string | null)[][]
  private slots: Map<string, DisplaySlot>

  constructor(
    initialSize: GridSize,
    private registry: ItemRegistry,
  ) {
    this.size = { ...initialSize }
    this.slots = new Map()
    this.cells = this.createEmptyCells(initialSize)
  }

  canPlace(shape: Shape, position: GridCell, rotation: Rotation): boolean {
    const offsets = this.getOffsets(shape, rotation)
    for (const offset of offsets) {
      const x = position.x + offset.x
      const y = position.y + offset.y
      if (x < 0 || x >= this.size.width || y < 0 || y >= this.size.height) return false
      if (this.cells[y][x] !== null) return false
    }
    return true
  }

  place(slot: DisplaySlot): void {
    const offsets = this.getOffsets(slot.shape, slot.rotation)
    for (const offset of offsets) {
      this.cells[slot.position.y + offset.y][slot.position.x + offset.x] = slot.id
    }
    this.slots.set(slot.id, { ...slot })
  }

  remove(slotId: string): void {
    const slot = this.slots.get(slotId)
    if (!slot) return
    const offsets = this.getOffsets(slot.shape, slot.rotation)
    for (const offset of offsets) {
      this.cells[slot.position.y + offset.y][slot.position.x + offset.x] = null
    }
    this.slots.delete(slotId)
  }

  getSlotAt(cell: GridCell): DisplaySlot | null {
    if (cell.x < 0 || cell.x >= this.size.width || cell.y < 0 || cell.y >= this.size.height) return null
    const slotId = this.cells[cell.y][cell.x]
    return slotId ? (this.slots.get(slotId) ?? null) : null
  }

  getAllSlots(): DisplaySlot[] {
    return Array.from(this.slots.values())
  }

  getEmptySlots(): DisplaySlot[] {
    return this.getAllSlots().filter(s => s.quantity === 0)
  }

  getGridSize(): GridSize {
    return { ...this.size }
  }

  expandGrid(newSize: GridSize): void {
    const newCells = this.createEmptyCells(newSize)
    for (let y = 0; y < this.size.height; y++) {
      for (let x = 0; x < this.size.width; x++) {
        newCells[y][x] = this.cells[y][x]
      }
    }
    this.cells = newCells
    this.size = { ...newSize }
  }

  /**
   * 辺で接している区画のID。
   *
   * ⚠ **回転後の実際の占有升目で見る。**`evaluate()` 既定の `adjacentPairs` は
   *   品の**回転前**のかたちで隣接を出すので、回転した品があると食い違う（#30）。
   *   盤面を持っているのはこちらなので、隣接はこちらが出して `evaluate()` に渡す。
   */
  getAdjacentSlotIds(slot: DisplaySlot): string[] {
    const ids = new Set<string>()
    for (const cell of this.getOccupiedCells(slot)) {
      for (const offset of NEIGHBOR_OFFSETS) {
        const neighbor = this.getSlotAt({ x: cell.x + offset.x, y: cell.y + offset.y })
        if (neighbor && neighbor.id !== slot.id) ids.add(neighbor.id)
      }
    }
    return Array.from(ids)
  }

  getOccupiedCells(slot: DisplaySlot): GridCell[] {
    return this.getOffsets(slot.shape, slot.rotation).map(offset => ({
      x: slot.position.x + offset.x,
      y: slot.position.y + offset.y,
    }))
  }

  clear(): void {
    this.slots.clear()
    this.cells = this.createEmptyCells(this.size)
  }

  updateQuantity(slotId: string, newQty: number): void {
    const slot = this.slots.get(slotId)
    if (slot) slot.quantity = newQty
  }

  private getOffsets(shape: Shape, rotation: Rotation): GridCell[] {
    const rotated = this.registry.getRotatedShape(shape, rotation)
    return this.registry.shapeToOffsets(rotated)
  }

  private createEmptyCells(size: GridSize): (string | null)[][] {
    return Array.from({ length: size.height }, () => Array(size.width).fill(null))
  }
}
