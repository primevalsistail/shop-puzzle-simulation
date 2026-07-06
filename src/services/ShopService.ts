import type { DisplaySlot } from '../types/index.js'
import type { FloorGrid } from '../components/floor/FloorGrid.js'
import type { PlacementManager } from '../components/floor/PlacementManager.js'
import type { Inventory } from '../components/economy/Inventory.js'
import type { ItemRegistry } from '../components/items/ItemRegistry.js'

export class ShopService {
  constructor(
    private floorGrid: FloorGrid,
    private placementManager: PlacementManager,
    private inventory: Inventory,
    _registry: ItemRegistry,
  ) {}

  restockSlot(slotId: string, quantity: number): boolean {
    const slots = this.floorGrid.getAllSlots()
    const slot = slots.find(s => s.id === slotId)
    if (!slot) return false

    const available = this.inventory.getQuantity(slot.itemId)
    const toAdd = Math.min(quantity, available)
    if (toAdd <= 0) return false

    this.inventory.remove(slot.itemId, toAdd)
    this.placementManager.restock(slotId, toAdd)
    return true
  }

  removeSlot(slotId: string): void {
    this.placementManager.removeSlot(slotId)
  }

  getEmptySlots(): DisplaySlot[] {
    return this.floorGrid.getEmptySlots()
  }

  purchaseMaterial(itemId: string, quantity: number, costPerUnit: number, spendFn: (amount: number) => boolean): boolean {
    const totalCost = quantity * costPerUnit
    if (!spendFn(totalCost)) return false
    this.inventory.add(itemId, quantity)
    return true
  }
}
