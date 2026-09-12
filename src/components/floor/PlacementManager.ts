import type { DisplaySlot, GridCell, Rotation } from '../../types/index.js'
import { GameEvents } from '../../types/index.js'
import { EventBus } from '../../services/EventBus.js'
import type { FloorGrid } from './FloorGrid.js'
import type { ItemRegistry } from '../items/ItemRegistry.js'

/** 1区画に積める上限。これを超えるぶんは**手持ちに残す**（消してはならない） */
export const MAX_SLOT_QUANTITY = 999

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

  tryPlace(itemId: string, position: GridCell, rotation: Rotation, quantity: number): DisplaySlot | null {
    if (this.isDisplayed(itemId)) return null
    const item = this.registry.getItem(itemId)
    if (!this.grid.canPlace(item.shape, position, rotation)) return null

    const slot: DisplaySlot = {
      id: this.generateId(),
      itemId,
      shape: item.shape,
      position,
      rotation,
      quantity: Math.min(quantity, MAX_SLOT_QUANTITY),
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

  /**
   * 区画に積み増す。**実際に積めた数を返す。**
   *
   * ⚠ 上限 999 で頭打ちになるので、**渡した数と返る数は一致しないことがある。**
   *   呼び出し側は**返った数だけを手持ちから引くこと。**渡した数を引くと差が消滅する。
   */
  restock(slotId: string, quantity: number): number {
    const slots = this.grid.getAllSlots()
    const slot = slots.find(s => s.id === slotId)
    if (!slot) return 0

    const newQty = Math.min(slot.quantity + quantity, MAX_SLOT_QUANTITY)
    const added = newQty - slot.quantity
    this.grid.updateQuantity(slotId, newQty)
    return added
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
    // すでに出ている品はどこにも置けない。**プレビューの段階で弾く**
    if (this.isDisplayed(itemId)) return false
    const item = this.registry.getItem(itemId)
    return this.grid.canPlace(item.shape, position, rotation)
  }

  private generateId(): string {
    return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  }
}
