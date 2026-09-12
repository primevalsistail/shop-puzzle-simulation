import type { DisplaySlot, GridCell, Rotation } from '../../types/index.js'
import { GameEvents } from '../../types/index.js'
import { EventBus } from '../../services/EventBus.js'
import type { FloorGrid } from './FloorGrid.js'
import type { ItemRegistry } from '../items/ItemRegistry.js'

export class PlacementManager {
  constructor(
    private grid: FloorGrid,
    private registry: ItemRegistry,
  ) {}

  /**
   * その品がすでに棚に出ているか。
   *
   * **1つの品は棚に1区画まで。**同じ品を2箇所に分けて並べられない。
   * 増やすときは**その区画に補充する**（`ShopService.restockSlot`）。
   */
  isDisplayed(itemId: string): boolean {
    return this.grid.getAllSlots().some(s => s.itemId === itemId)
  }

  tryPlace(itemId: string, position: GridCell, rotation: Rotation): DisplaySlot | null {
    if (this.isDisplayed(itemId)) return null
    const item = this.registry.getItem(itemId)
    if (!this.grid.canPlace(item.shape, position, rotation)) return null

    const slot: DisplaySlot = {
      id: this.generateId(),
      itemId,
      shape: item.shape,
      position,
      rotation,
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

  canPlaceAt(itemId: string, position: GridCell, rotation: Rotation): boolean {
    // すでに出ている品はどこにも置けない。**プレビューの段階で弾く**
    if (this.isDisplayed(itemId)) return false
    const item = this.registry.getItem(itemId)
    return this.grid.canPlace(item.shape, position, rotation)
  }

  private generateId(): string {
    return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  }
}
