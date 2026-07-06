import type { SaveData, SlotMeta } from '../../types/index.js'
import type { EconomyManager } from '../economy/EconomyManager.js'
import type { Inventory } from '../economy/Inventory.js'
import type { FloorGrid } from '../floor/FloorGrid.js'
import type { TimeManager } from '../core/TimeManager.js'

const SAVE_KEY = 'shop_puzzle_save'
const slotKey = (slot: number) => `${SAVE_KEY}_${slot}`

export class GameProgress {
  private unlockedFeatures: Set<string> = new Set()
  private unlockedRecipes: Set<string> = new Set(['recipe_bread', 'recipe_wine', 'recipe_tomato_sauce', 'recipe_sandwich', 'recipe_book'])
  private isEndlessMode = false

  constructor(
    private economy: EconomyManager,
    private inventory: Inventory,
    private floorGrid: FloorGrid,
    private timeManager: TimeManager,
  ) {}

  save(slot = 0): void {
    const data: SaveData = {
      money: this.economy.getMoney(),
      totalRevenue: this.economy.getTotalRevenue(),
      inventory: this.inventory.getAllStock(),
      floor: this.floorGrid.getAllSlots(),
      unlockedFeatures: Array.from(this.unlockedFeatures),
      unlockedRecipes: Array.from(this.unlockedRecipes),
      currentTime: this.timeManager.getCurrentTime(),
      isEndlessMode: this.isEndlessMode,
      savedAt: Date.now(),
    }
    try {
      localStorage.setItem(slotKey(slot), JSON.stringify(data))
    } catch {
      // localStorage unavailable (e.g. tests)
    }
  }

  load(slot = 0): SaveData | null {
    try {
      const raw = localStorage.getItem(slotKey(slot))
      if (!raw) return null
      return JSON.parse(raw) as SaveData
    } catch {
      return null
    }
  }

  getSlotMeta(slot: number): SlotMeta | null {
    const data = this.load(slot)
    if (!data) return null
    return {
      savedAt: data.savedAt ?? 0,
      totalRevenue: data.totalRevenue,
      day: data.currentTime.day,
    }
  }

  hasSave(slot = 0): boolean {
    try {
      return localStorage.getItem(slotKey(slot)) !== null
    } catch {
      return false
    }
  }

  deleteSave(slot = 0): void {
    try {
      localStorage.removeItem(slotKey(slot))
    } catch {
      // ignore
    }
  }

  isRecipeUnlocked(recipeId: string): boolean {
    return this.unlockedRecipes.has(recipeId)
  }

  unlockRecipe(recipeId: string): void {
    this.unlockedRecipes.add(recipeId)
  }

  isFeatureUnlocked(feature: string): boolean {
    return this.unlockedFeatures.has(feature)
  }

  unlockFeature(feature: string): void {
    this.unlockedFeatures.add(feature)
  }

  setEndlessMode(value: boolean): void {
    this.isEndlessMode = value
  }

  getGridSizeForRevenue(totalRevenue: number): { width: number; height: number } {
    if (totalRevenue >= 500000) return { width: 13, height: 10 }
    if (totalRevenue >= 200000) return { width: 9, height: 7 }
    return { width: 6, height: 5 }
  }
}
