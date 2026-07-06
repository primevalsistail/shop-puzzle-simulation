import type { DisplaySlot, AdjacencyBonus } from '../../types/index.js'
import type { FloorGrid } from './FloorGrid.js'
import type { ItemRegistry } from '../items/ItemRegistry.js'

const NEIGHBOR_OFFSETS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
]

export class AdjacencyEngine {
  constructor(
    private grid: FloorGrid,
    private registry: ItemRegistry,
  ) {}

  calculateAllBonuses(slots: DisplaySlot[]): Map<string, AdjacencyBonus[]> {
    const result = new Map<string, AdjacencyBonus[]>()
    for (const slot of slots) {
      result.set(slot.id, this.getBonusesForSlot(slot, slots))
    }
    return result
  }

  getAdjacentSlots(slot: DisplaySlot, allSlots: DisplaySlot[]): DisplaySlot[] {
    const occupiedCells = this.grid.getOccupiedCells(slot)
    const adjacentIds = new Set<string>()

    for (const cell of occupiedCells) {
      for (const offset of NEIGHBOR_OFFSETS) {
        const neighbor = this.grid.getSlotAt({ x: cell.x + offset.x, y: cell.y + offset.y })
        if (neighbor && neighbor.id !== slot.id) {
          adjacentIds.add(neighbor.id)
        }
      }
    }

    return allSlots.filter(s => adjacentIds.has(s.id))
  }

  private getBonusesForSlot(slot: DisplaySlot, allSlots: DisplaySlot[]): AdjacencyBonus[] {
    const item = this.registry.getItem(slot.itemId)
    if (!item.adjacencyBonuses?.length) return []

    const adjacentSlots = this.getAdjacentSlots(slot, allSlots)
    const bonuses: AdjacencyBonus[] = []

    for (const rule of item.adjacencyBonuses) {
      const matching = adjacentSlots.filter(s => s.itemId === rule.adjacentItemId)
      if (matching.length > 0) {
        bonuses.push({
          slotId: slot.id,
          bonusType: rule.bonusType,
          multiplier: rule.multiplier,
          sourceSlotIds: matching.map(s => s.id),
        })
      }
    }

    return bonuses
  }
}
