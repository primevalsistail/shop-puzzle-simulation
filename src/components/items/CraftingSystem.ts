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
 * ⚠ **時計を止めないこと。**止めると加工のゲーム内コストがゼロになり、
 *   プレイヤーが払うのは実時間の待ちだけになる。
 *
 * **まとめて作る（`times` 回）**は「レシピを `times` 回繰り返す」ことで、
 * 材料も所要時間も回数分かかる。1回あたりの出来高（`outputQuantity`）は変わらないので、
 * パンなら 3個・6個・9個…と**出力単位でしか増えない**。
 * 着手前に材料と当日の残り時間を**まとめて**検査するので、
 * 途中で足りなくなって材料や時間が一部だけ消えることはない。
 */
/** `CRAFTING_STARTED` / `CRAFTING_COMPLETED` のペイロード */
export interface CraftResult {
  recipeId: string
  /** レシピを繰り返した回数 */
  times: number
  /** 実際に手に入る個数（`outputQuantity × times`） */
  quantity: number
}

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

  canCraft(recipeId: string, times = 1): boolean {
    if (!Number.isInteger(times) || times < 1) return false
    return this.hasIngredients(recipeId, times) && this.fitsInToday(recipeId, times)
  }

  /** `times` 回ぶんの材料が揃っているか */
  hasIngredients(recipeId: string, times = 1): boolean {
    const recipe = this.registry.getRecipe(recipeId)
    return recipe.ingredients.every(ing => this.inventory.hasEnough(ing.itemId, ing.quantity * times))
  }

  /** その日のうちに終わるか（#25 Q3 = B）。24:00 をまたぐ加工は着手できない */
  fitsInToday(recipeId: string, times = 1): boolean {
    const recipe = this.registry.getRecipe(recipeId)
    return recipe.durationMinutes * times <= this.timeManager.minutesUntilEndOfDay()
  }

  /**
   * いま何回まで繰り返せるか。**材料と当日の残り時間の小さいほう。**
   * 0 なら着手できない（材料不足か、今日はもう時間が足りない）。
   */
  maxCraftTimes(recipeId: string): number {
    const recipe = this.registry.getRecipe(recipeId)
    const byIngredients = Math.min(
      ...recipe.ingredients.map(ing =>
        Math.floor(this.inventory.getQuantity(ing.itemId) / ing.quantity),
      ),
    )
    const byTime = Math.floor(this.timeManager.minutesUntilEndOfDay() / recipe.durationMinutes)
    return Math.max(0, Math.min(byIngredients, byTime))
  }

  /**
   * `times` 回ぶんまとめて加工する。**全部できるか、何もしないかのどちらか。**
   * 材料・時間の検査を消費より先に済ませるので、途中で失敗して一部だけ消えることはない。
   */
  startCraft(recipeId: string, times = 1): boolean {
    if (this.activeJob) return false
    if (!this.canCraft(recipeId, times)) return false

    const recipe = this.registry.getRecipe(recipeId)
    for (const ing of recipe.ingredients) {
      this.inventory.remove(ing.itemId, ing.quantity * times)
    }

    const quantity = recipe.outputQuantity * times
    EventBus.emit(GameEvents.CRAFTING_STARTED, { recipeId, times, quantity })

    // ゲーム内時間を消費する。この間は客が来ない（＝店が閉まる）
    this.timeManager.skipMinutes(recipe.durationMinutes * times)

    this.inventory.add(recipe.outputItemId, quantity)
    EventBus.emit(GameEvents.CRAFTING_COMPLETED, { recipeId, times, quantity })
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
