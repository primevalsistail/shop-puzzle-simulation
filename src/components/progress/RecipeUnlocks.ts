import type { MainKind, RecipeDef } from '../../taxonomy/axes.js'
import { MAIN_KINDS } from '../../taxonomy/axes.js'
import { DAYS_PER_PORT } from '../../taxonomy/islands.js'
import type { ItemRegistry } from '../items/ItemRegistry.js'
import type { Inventory } from '../economy/Inventory.js'

/**
 * レシピの解禁（#48 ／ 段4-3・4-4）。
 *
 * ## 条件 — 材料を1つ残らず手にしたことがあるか
 *
 * PO 決定（2026-09-11。原文は `aidlc-docs/audit.md`「#30 の持ち越し3件へのPO判断」）:
 * 「**レシピの材料を取得したことがあればレシピとして出したい**」。
 * 記録は `Inventory.everHeld`（一度でも手に入れた品。0個になっても消えない）。
 *
 * ⚠ **「1つでも」ではなく「全部」で読む。**`aidlc-docs/construction/plans/profit-exponent-question.md`
 *   の実測「解禁は段になっている（tier3 は tier2 を作らないと解禁されない）」は
 *   **材料が全部揃った場合にだけ成り立つ。**1つでも可にすると `塩` を手にした時点で
 *   tier3・tier4 のほとんどが開き、段が消える。
 *
 * ## 粒度 — 系統 ＝ 出力品の `主種類` × `tier`
 *
 * PO 決定「粒度は系統単位（1本ずつではなく、まとまりで開く）」。
 *
 * ⚠ **新しい属性は足していない。**どちらも既存の軸である:
 *   - `主種類`（axes.ts 軸1。`recipes.ts` の区切りコメント ── 食料 ── … と同じ4つ）
 *   - `tier`（axes.ts 軸2。`derive.ts` が出す導出値）
 *
 * `主種類` だけだと4群しかなく、しかも「食料」を開くと材料を持っていない tier4 まで
 * 一緒に開いて上の条件と食い違う。**tier を掛けて初めて、条件と粒度が両立する。**
 * 実データでは 12群（1群あたり 2〜12本）。段5 で tier7 まで伸ばすと 24群になる。
 *
 * ## 頻度 — 1寄港あたり 2〜3回
 *
 * `UNLOCK_INTERVAL_DAYS` の注記を参照。
 */

/**
 * 解禁の枠が1つ増える間隔（日）。
 *
 * **1寄港 ＝ `DAYS_PER_PORT` ＝ 10日**なので、1寄港に入る枠は `10 / 4 = 2.5`。
 * 割り切れないので実際には **3回・2回・3回・2回…** と交互になり、
 * PO 指定「**1寄港あたり2〜3回**」がこの2つの定数から出る。**回数を別に書かない。**
 *
 * 枠が増える日は Day 1, 5, 9, 13, … で、**Day 1 も枠が増える日**。
 * `day % 4 === 0` にすると最初の枠が Day 4 になり、3日間クラフトメニューが空のままになる。
 */
export const UNLOCK_INTERVAL_DAYS = 4

/** 1寄港あたりに増える枠の数（2.5）。整数でないので、実際は 3回と2回が交互になる */
export const UNLOCK_SLOTS_PER_PORT = DAYS_PER_PORT / UNLOCK_INTERVAL_DAYS

/**
 * その日までに開いてよい系統の数。
 *
 * ⚠ **日付だけで決まる。**「これまで何回開いたか」をセーブに持たなくてよく、
 *   解禁が無かった頃のセーブを読んでも、その日にふさわしい数まで自動で追いつく。
 */
export function allowedGroupCount(day: number): number {
  const d = Math.max(1, Math.floor(day))
  return 1 + Math.floor((d - 1) / UNLOCK_INTERVAL_DAYS)
}

/** 系統。`主種類` と `tier` の組であって、新しい属性ではない */
export interface RecipeGroup {
  readonly mainKind: MainKind
  readonly tier: number
}

/** 1回ぶんの解禁。開いた系統と、そこで解禁されたレシピ */
export interface UnlockEvent extends RecipeGroup {
  readonly recipes: readonly RecipeDef[]
}

export function groupLabel(g: RecipeGroup): string {
  return `${g.mainKind}（tier${g.tier}）`
}

const groupKey = (g: RecipeGroup): string => `${g.mainKind}|${g.tier}`

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

  groupOf(recipe: RecipeDef): RecipeGroup {
    const out = this.registry.getItem(recipe.outputItemId)
    return { mainKind: out.mainKind, tier: this.registry.tierOf(out.id) }
  }

  /** いま作れるようになっているレシピ。クラフトメニューはこれを並べる */
  unlockedRecipes(): RecipeDef[] {
    return this.registry.getAllRecipes().filter(r => this.store.isRecipeUnlocked(r.id))
  }

  /**
   * その日までの解禁を済ませる。返すのは**新しく開いた系統**（＝知らせるべき出来事）。
   *
   * 1. **すでに開いている系統**は、あとから条件を満たしたレシピをその場で足す（回数に数えない）。
   *    系統単位で開いた以上、同じ系統をもう一度開くのは出来事ではない。
   * 2. 枠が余っているあいだ、**待っている系統を浅いほうから1つずつ**開く。
   *    同じ tier の中は `MAIN_KINDS` の並び順。**乱数を使わない**（同じ遊び方なら同じ順に開く）。
   */
  advanceTo(day: number): UnlockEvent[] {
    const groups = this.collectGroups()
    const opened = new Set(
      [...groups]
        .filter(([, rs]) => rs.some(r => this.store.isRecipeUnlocked(r.id)))
        .map(([key]) => key),
    )

    // 1. 開いている系統への追加（回数に数えない）
    for (const key of opened) {
      for (const r of groups.get(key) ?? []) {
        if (!this.store.isRecipeUnlocked(r.id) && this.isEligible(r)) this.store.unlockRecipe(r.id)
      }
    }

    // 2. 枠のぶんだけ、新しい系統を開く
    const events: UnlockEvent[] = []
    const limit = allowedGroupCount(day)
    while (opened.size < limit) {
      const next = this.nextPendingGroup(groups, opened)
      if (!next) break
      const recipes = (groups.get(next) ?? []).filter(r => this.isEligible(r))
      for (const r of recipes) this.store.unlockRecipe(r.id)
      opened.add(next)
      events.push({ ...this.groupOf(recipes[0]), recipes })
    }
    return events
  }

  /** 全レシピを系統ごとに束ねる */
  private collectGroups(): Map<string, RecipeDef[]> {
    const groups = new Map<string, RecipeDef[]>()
    for (const r of this.registry.getAllRecipes()) {
      const key = groupKey(this.groupOf(r))
      const bucket = groups.get(key)
      if (bucket) bucket.push(r)
      else groups.set(key, [r])
    }
    return groups
  }

  /** 次に開く系統。条件を満たしたレシピを1本以上抱えていて、まだ開いていないもの */
  private nextPendingGroup(
    groups: ReadonlyMap<string, RecipeDef[]>,
    opened: ReadonlySet<string>,
  ): string | null {
    const pending = [...groups]
      .filter(([key, rs]) => !opened.has(key) && rs.some(r => this.isEligible(r)))
      .map(([key, rs]) => ({ key, group: this.groupOf(rs[0]) }))
    if (pending.length === 0) return null
    pending.sort((a, b) =>
      a.group.tier - b.group.tier
      || MAIN_KINDS.indexOf(a.group.mainKind) - MAIN_KINDS.indexOf(b.group.mainKind),
    )
    return pending[0].key
  }
}
