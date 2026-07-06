import type { DisplaySlot, GridCell, Rotation } from '../../types/index.js'
import { GameEvents } from '../../types/index.js'
import { EventBus } from '../../services/EventBus.js'
import type { FloorGrid } from './FloorGrid.js'
import type { ItemRegistry } from '../items/ItemRegistry.js'

const MAX_QUANTITY = 999

export class PlacementManager {
  constructor(
    private grid: FloorGrid,
    private registry: ItemRegistry,
  ) {}

  tryPlace(itemId: string, position: GridCell, rotation: Rotation, quantity: number): DisplaySlot | null {
    const item = this.registry.getItem(itemId)
    if (!this.grid.canPlace(item.shape, position, rotation)) return null

    const slot: DisplaySlot = {
      id: this.generateId(),
      itemId,
      shape: item.shape,
      position,
      rotation,
      quantity: Math.min(quantity, MAX_QUANTITY),
    }
    this.grid.place(slot)
    EventBus.emit(GameEvents.FLOOR_SLOT_PLACED, slot)
    return slot
  }

  removeSlot(slotId: string): void {
    const slots = this.grid.getAllSlots()
    const slot = slots.find(s => s.id === slotId)
    if (!slot) return
    this.grid.remove(slotId)
    EventBus.emit(GameEvents.FLOOR_SLOT_REMOVED, slotId)
  }

  restock(slotId: string, quantity: number): boolean {
    const slots = this.grid.getAllSlots()
    const slot = slots.find(s => s.id === slotId)
    if (!slot) return false

    const newQty = Math.min(slot.quantity + quantity, MAX_QUANTITY)
    this.grid.updateQuantity(slotId, newQty)
    return true
  }

  depleteOne(slotId: string): boolean {
    const slots = this.grid.getAllSlots()
    const slot = slots.find(s => s.id === slotId)
    if (!slot || slot.quantity === 0) return false

    const newQty = slot.quantity - 1
    this.grid.updateQuantity(slotId, newQty)
    if (newQty === 0) {
      EventBus.emit(GameEvents.FLOOR_SLOT_EMPTIED, slotId)
    }
    return true
  }

  canPlaceAt(itemId: string, position: GridCell, rotation: Rotation): boolean {
    const item = this.registry.getItem(itemId)
    return this.grid.canPlace(item.shape, position, rotation)
  }

  private generateId(): string {
    return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  }
}
