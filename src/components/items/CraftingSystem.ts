import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'
import type { ItemRegistry, RecipeDef } from './ItemRegistry.js'
import type { Inventory } from '../economy/Inventory.js'
import type { TimeManager } from '../core/TimeManager.js'
import type { Upgrades } from '../progress/Upgrades.js'
import { craftMinutes, canAttempt } from '../../taxonomy/craft.js'

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
 * 着手前に材料・在庫の空き・当日の残り時間を**まとめて**検査するので、
 * 途中で足りなくなって材料や時間が一部だけ消えることはない。
 *
 * ⚠ **在庫の上限（1品 999個）も着手前に見る**（#64）。
 *   以前は作ってから `Inventory.add` が丸めていたので、**溢れたぶんが黙って消えていた。**
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
    private upgrades?: Upgrades,
  ) {}

  /**
   * このレシピ1回の所要時間。**手際（作業効率の強化）で縮む。**
   *
   * ⚠ **利益額は素の `durationMinutes` から出る**（`derive.ts`）ので、
   *   手際を上げると**時間あたりの儲けが増える。**
   */
  minutesFor(recipeId: string): number {
    const recipe = this.registry.getRecipe(recipeId)
    if (!this.upgrades) return recipe.durationMinutes
    return craftMinutes(recipe.outputItemId, this.upgrades.skill())
  }

  /** 手際が足りていて着手できるか。深い品ほど高い手際が要る */
  canAttemptRecipe(recipeId: string): boolean {
    if (!this.upgrades) return true
    return canAttempt(this.registry.getRecipe(recipeId).outputItemId, this.upgrades.skill())
  }

  canCraft(recipeId: string, times = 1): boolean {
    if (!Number.isInteger(times) || times < 1) return false
    if (!this.canAttemptRecipe(recipeId)) return false
    return this.hasIngredients(recipeId, times)
      && this.fitsInStock(recipeId, times)
      && this.fitsInToday(recipeId, times)
  }

  /** `times` 回ぶんの材料が揃っているか */
  hasIngredients(recipeId: string, times = 1): boolean {
    const recipe = this.registry.getRecipe(recipeId)
    return recipe.ingredients.every(ing => this.inventory.hasEnough(ing.itemId, ing.quantity * times))
  }

  /**
   * 出来上がったぶんが**在庫に入りきるか**（#64）。
   *
   * ⚠ **作る前に見る。**以前は作ってから `Inventory.add` が上限で丸めていたので、
   *   **材料と時間だけ払って、溢れたぶんは消えていた**（仕入れ側では
   *   `PurchaseMenu` が `spaceFor` で先に止めているのと同じ「黙って消える」）。
   * ⚠ **`fitsInToday` と混ぜないこと。**「時間が足りない」と「在庫がいっぱい」は
   *   別の理由で、**待てば直るかどうかが違う**（在庫は明日になっても空かない）。
   */
  fitsInStock(recipeId: string, times = 1): boolean {
    const recipe = this.registry.getRecipe(recipeId)
    return recipe.outputQuantity * times <= this.inventory.spaceFor(recipe.outputItemId)
  }

  /** その日のうちに終わるか（#25 Q3 = B）。24:00 をまたぐ加工は着手できない */
  fitsInToday(recipeId: string, times = 1): boolean {
    return this.minutesFor(recipeId) * times <= this.timeManager.minutesUntilEndOfDay()
  }

  /**
   * いま何回まで繰り返せるか。**材料・在庫の空き・当日の残り時間のいちばん小さいもの。**
   * 0 なら着手できない（材料不足か、在庫がいっぱいか、今日はもう時間が足りない）。
   *
   * ⚠ **在庫の空きを必ず数に入れること**（#64）。時間と材料だけで割ると、
   *   工房の「最大」ボタンが**押した瞬間に溢れる回数**を入れる。
   *   出来上がりは `outputQuantity` 個ずつなので、**空きも出来高で割る。**
   */
  maxCraftTimes(recipeId: string): number {
    const recipe = this.registry.getRecipe(recipeId)
    const byIngredients = Math.min(
      ...recipe.ingredients.map(ing =>
        Math.floor(this.inventory.getQuantity(ing.itemId) / ing.quantity),
      ),
    )
    if (!this.canAttemptRecipe(recipeId)) return 0
    const byTime = Math.floor(this.timeManager.minutesUntilEndOfDay() / this.minutesFor(recipeId))
    const byRoom = Math.floor(
      this.inventory.spaceFor(recipe.outputItemId) / recipe.outputQuantity,
    )
    return Math.max(0, Math.min(byIngredients, byTime, byRoom))
  }

  /**
   * `times` 回ぶんまとめて加工する。**全部できるか、何もしないかのどちらか。**
   * 材料・在庫の空き・時間の検査を消費より先に済ませるので、
   * 途中で失敗して一部だけ消えることはない。
   *
   * ⚠ **`canCraft` が在庫の空きも見ている**（#64）ので、
   *   ここから先で `Inventory.add` が上限に丸めることはない。
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
    this.timeManager.skipMinutes(this.minutesFor(recipeId) * times)

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
