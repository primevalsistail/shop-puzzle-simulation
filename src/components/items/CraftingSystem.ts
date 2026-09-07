import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'
import type { ItemRegistry, RecipeDef } from './ItemRegistry.js'
import type { Inventory } from '../economy/Inventory.js'
import type { TimeManager } from '../core/TimeManager.js'

/**
 * 加工はゲーム内時間を消費する（#25）。
 *
 * - **実時間では待たない。**`durationMinutes` ぶん時計を飛ばす（#25 Q2 = B）
 * - **飛ばした分には客が来ない。**これが「**加工している間は店が閉まる**」の実装
 *   ＝ 作る時間はそのまま売る機会の損失になる（#25 Q1 = A）
 * - **その日のうちに終わらない加工は着手できない**（#25 Q3 = B）
 *
 * ⚠ 以前は `TimeManager.pause()` で時計を止めており、**ゲーム内では加工のコストが
 *   ゼロ**だった。プレイヤーが払っていたのは実時間の待ちだけだった。
 */
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
    if (!recipe.ingredients.every(ing => this.inventory.hasEnough(ing.itemId, ing.quantity))) {
      return false
    }
    return this.fitsInToday(recipeId)
  }

  /** その日のうちに終わるか（#25 Q3 = B）。24:00 をまたぐ加工は着手できない */
  fitsInToday(recipeId: string): boolean {
    const recipe = this.registry.getRecipe(recipeId)
    return recipe.durationMinutes <= this.timeManager.minutesUntilEndOfDay()
  }

  startCraft(recipeId: string): boolean {
    if (this.activeJob) return false
    if (!this.canCraft(recipeId)) return false

    const recipe = this.registry.getRecipe(recipeId)
    for (const ing of recipe.ingredients) {
      this.inventory.remove(ing.itemId, ing.quantity)
    }

    EventBus.emit(GameEvents.CRAFTING_STARTED, recipeId)

    // ゲーム内時間を消費する。この間は客が来ない（＝店が閉まる）
    this.timeManager.skipMinutes(recipe.durationMinutes)

    this.inventory.add(recipe.outputItemId, recipe.outputQuantity)
    EventBus.emit(GameEvents.CRAFTING_COMPLETED, recipeId)
    return true
  }

  /** 加工は着手した時点で終わるので、進行の更新は要らない（#25 Q2 = B） */
  update(_deltaMs: number): void {
    // no-op
  }

  /** 加工は着手した時点で終わるので、途中で取り消すことはできない（#25 Q2 = B） */
  cancelCraft(): void {
    // no-op
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

}
