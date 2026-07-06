import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'
import type { ItemRegistry, RecipeDef } from './ItemRegistry.js'
import type { Inventory } from '../economy/Inventory.js'
import type { TimeManager } from '../core/TimeManager.js'

const CRAFT_MS_PER_MINUTE = 1000

interface ActiveCraftJob {
  recipeId: string
  outputItemId: string
  outputQuantity: number
  elapsedMs: number
  totalMs: number
}

export class CraftingSystem {
  private activeJob: ActiveCraftJob | null = null

  constructor(
    private registry: ItemRegistry,
    private inventory: Inventory,
    private timeManager: TimeManager,
  ) {}

  canCraft(recipeId: string): boolean {
    const recipe = this.registry.getRecipe(recipeId)
    return recipe.ingredients.every(ing => this.inventory.hasEnough(ing.itemId, ing.quantity))
  }

  startCraft(recipeId: string): boolean {
    if (this.activeJob) return false
    if (!this.canCraft(recipeId)) return false

    const recipe = this.registry.getRecipe(recipeId)
    for (const ing of recipe.ingredients) {
      this.inventory.remove(ing.itemId, ing.quantity)
    }

    this.activeJob = {
      recipeId,
      outputItemId: recipe.outputItemId,
      outputQuantity: recipe.outputQuantity,
      elapsedMs: 0,
      totalMs: recipe.durationMinutes * CRAFT_MS_PER_MINUTE,
    }

    this.timeManager.pause()
    EventBus.emit(GameEvents.CRAFTING_STARTED, recipeId)
    return true
  }

  update(deltaMs: number): void {
    if (!this.activeJob) return

    this.activeJob.elapsedMs += deltaMs
    if (this.activeJob.elapsedMs >= this.activeJob.totalMs) {
      this.completeCraft()
    }
  }

  cancelCraft(): void {
    if (!this.activeJob) return
    // Refund ingredients
    const recipe = this.registry.getRecipe(this.activeJob.recipeId)
    for (const ing of recipe.ingredients) {
      this.inventory.add(ing.itemId, ing.quantity)
    }
    this.activeJob = null
    this.timeManager.resume()
  }

  getActiveJob(): ActiveCraftJob | null {
    return this.activeJob
  }

  getProgress(): number {
    if (!this.activeJob) return 0
    return Math.min(1, this.activeJob.elapsedMs / this.activeJob.totalMs)
  }

  isActive(): boolean {
    return this.activeJob !== null
  }

  getRecipeDef(recipeId: string): RecipeDef {
    return this.registry.getRecipe(recipeId)
  }

  private completeCraft(): void {
    if (!this.activeJob) return
    const { outputItemId, outputQuantity, recipeId } = this.activeJob
    this.inventory.add(outputItemId, outputQuantity)
    this.activeJob = null
    this.timeManager.resume()
    EventBus.emit(GameEvents.CRAFTING_COMPLETED, recipeId)
  }
}
