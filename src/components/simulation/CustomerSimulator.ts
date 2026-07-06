import type { DisplaySlot, SaleResult, AdjacencyBonus } from '../../types/index.js'
import type { ItemRegistry } from '../items/ItemRegistry.js'

// Chance per minute that a customer arrives
const CUSTOMER_ARRIVAL_RATE = 0.3

// Fallback probability when item has no baseSaleProb set
const DEFAULT_BASE_PURCHASE_PROB = 0.4

export class CustomerSimulator {
  constructor(private registry: ItemRegistry) {}

  simulateMinute(
    slots: DisplaySlot[],
    bonuses: Map<string, AdjacencyBonus[]>,
    rng: () => number = Math.random,
  ): SaleResult[] {
    if (rng() > CUSTOMER_ARRIVAL_RATE) return []

    const results: SaleResult[] = []
    const activeSlots = slots.filter(s => s.quantity > 0)

    for (const slot of activeSlots) {
      const purchaseProb = this.calcPurchaseProb(slot, bonuses.get(slot.id) ?? [])
      if (rng() < purchaseProb) {
        const item = this.registry.getItem(slot.itemId)
        const effectivePrice = this.calcEffectivePrice(item.price, bonuses.get(slot.id) ?? [])
        results.push({
          slotId: slot.id,
          itemId: slot.itemId,
          qtySold: 1,
          revenue: effectivePrice,
        })
      }
    }

    return results
  }

  private calcPurchaseProb(slot: DisplaySlot, bonuses: AdjacencyBonus[]): number {
    const item = this.registry.getItem(slot.itemId)
    let prob = item.baseSaleProb ?? DEFAULT_BASE_PURCHASE_PROB
    for (const bonus of bonuses) {
      if (bonus.bonusType === 'sales_rate') prob *= bonus.multiplier
      if (bonus.bonusType === 'customer_attraction') prob = Math.min(1, prob * bonus.multiplier)
    }
    return Math.min(1, prob)
  }

  private calcEffectivePrice(basePrice: number, bonuses: AdjacencyBonus[]): number {
    let price = basePrice
    for (const bonus of bonuses) {
      if (bonus.bonusType === 'price_up') price *= bonus.multiplier
    }
    return Math.round(price)
  }
}
