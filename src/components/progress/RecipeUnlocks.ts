import type { RecipeDef } from '../../taxonomy/axes.js'
import type { ItemRegistry } from '../items/ItemRegistry.js'
import type { Inventory } from '../economy/Inventory.js'

/**
 * レシピの解禁（#48 ／ 段4-3・4-4 → **#111 で作り替えた**）。
 *
 * ## 条件 — そのレシピの材料を1つ残らず手にしたことがあるか
 *
 * PO 決定（2026-09-11。原文は `aidlc-docs/audit.md`「#30 の持ち越し3件へのPO判断」）:
 * 「**レシピの材料を取得したことがあればレシピとして出したい**」。
 * 記録は `Inventory.everHeld`（一度でも手に入れた品。0個になっても消えない）。
 *
 * ⚠ **「1つでも」ではなく「全部」で読む**（PO 回答 2026-09-14）。
 *   **実測: どれか1つでも可にすると Day 1 に 47/106本が開き、うち tier3以上が 24本**
 *   —— 塩を手にした時点で上の tier まで雪崩れて、段が消える。
 *   **全部そろった場合だけなら Day 1 は 5本**（`butter` `cheese` `mugwort_tea`
 *   `wool_yarn` `bamboo_fan`。ハルヴェラで買える19品＋初期在庫3品を全部持った状態）。
 *
 * ## 粒度 — **1レシピ**（#111。PO 判断 2026-09-14）
 *
 * ⚠ **材料が全種そろった瞬間に、そのレシピ**だけ**が開く。**
 *   以前は「**主種類 × tier の系統**」を単位にして、さらに**日付で増える枠**
 *   （`allowedGroupCount` ／ `UNLOCK_INTERVAL_DAYS`）で本数を絞っていた。
 *   **関門が2つあるせいで、材料を揃えても開かない日**が生まれていたのが #111。
 *
 * ⚠ **枠が無くなったので「1寄港あたり2〜3回」という PO 指定は無効。**
 *   開く回数は**プレイヤーが何を手に入れたか**だけで決まり、日付は一切見ない。
 *
 * ## セーブ
 *
 * 解禁済みの記録は `GameProgress.unlockedRecipes`（レシピ id の集合）で、
 * **形は変えていない。**系統単位だった頃のセーブもそのまま読め、
 * ⚠ **一度開いたものを閉じることはしない**ので、古いセーブが不利になることも無い。
 */

/** 解禁済みの置き場。`GameProgress` がこれを満たす */
export interface UnlockStore {
  isRecipeUnlocked(recipeId: string): boolean
  unlockRecipe(recipeId: string): void
}

export class RecipeUnlocks {
  constructor(
    private registry: ItemRegistry,
    private inventory: Inventory,
    private store: UnlockStore,
  ) {}

  /** #48 の条件。材料を**1つ残らず**手にしたことがあること */
  isEligible(recipe: RecipeDef): boolean {
    return recipe.ingredients.every(ing => this.inventory.hasEverHeld(ing.itemId))
  }

  /** いま作れるようになっているレシピ。クラフトメニューはこれを並べる */
  unlockedRecipes(): RecipeDef[] {
    return this.registry.getAllRecipes().filter(r => this.store.isRecipeUnlocked(r.id))
  }

  /**
   * 条件を満たしたレシピを開く。返すのは**この呼び出しで新しく開いたもの**
   * （＝知らせるべき出来事）。
   *
   * ⚠ **日付を見ない**（#111）。何度呼んでも、条件を満たしていないものは開かないし、
   *   条件を満たしたものは待たされない。**呼ぶ回数で結果が変わらない。**
   */
  unlockEligible(): RecipeDef[] {
    const opened: RecipeDef[] = []
    for (const recipe of this.registry.getAllRecipes()) {
      if (this.store.isRecipeUnlocked(recipe.id)) continue
      if (!this.isEligible(recipe)) continue
      this.store.unlockRecipe(recipe.id)
      opened.push(recipe)
    }
    return opened
  }
}
