/**
 * Cycle 4 — 加工の難易度と所要時間（S − D 方式）
 *
 * ## 何を解いているか
 *
 * 主人公の **手際 S** と、品の **難易度 D** の差で**加工の所要時間**が決まる。
 *
 * ```
 * 所要時間 : 基準時間 × clamp(2^((D − S) / 5), 0.25, 4.0)
 * ```
 *
 * ⚠ **「難しすぎて着手できない」という決まりは無い**（#111 の PO 判断 2026-09-14 で外した）。
 *   **手際の意味は「加工が速くなる」1つだけ。**
 *   難しい品は **「その日のうちに終わらない加工は着手できない」**（#25 Q3 = B。
 *   `CraftingSystem.fitsInToday`）という**既にある決まり**で止まる。
 *   ⚠ **外しても止まるものはほとんど変わらない**（実測 2026-09-14: 手際10 で
 *   1日に収まらないレシピが 9本 ＝ 以前 `canAttempt` が止めていた tier4 の10本とほぼ同じ）。
 *
 * ## ⚠ 効いているのは指数式ではなく clamp のほう
 *
 * ```
 * 2^((D−S)/5) = 2^(D/5) × 2^(−S/5)
 * ```
 *
 * **S の部分は全品共通の倍率として括り出せる**ので、指数式だけなら
 * 「所要時間 ÷ 手際」と代数的に同じで、品どうしの時間比に S は効かない。
 *
 * **差を作っているのは clamp。**低い D の品は先に 0.25 の床に着いて成長が止まり、
 * 高い D の品はまだ伸びる。**成長するほど格上品が格下品に追いつく。**
 *
 * ## ⚠ D は手書きしない（INV-3）
 *
 * tier・売値と同じく**導出値**。品ごとに難易度を書くと 161品ぶんの手書きデータが増える。
 */

import type { ItemId } from './axes.js'
import { tier } from './derive.js'
import { RECIPES_BY_OUTPUT } from './recipes.js'

/** 難易度は tier から出す。tier1（素材）は加工しないので 5 に落ちるが、参照されない */
const DIFFICULTY_PER_TIER = 5

/** 倍率の下限・上限。これが「格上が格下に追いつく」を作っている本体 */
export const SPEED_FLOOR = 0.25
export const SPEED_CEILING = 4.0

/**
 * 難易度が 5 変わるごとに所要時間が2倍／半分になる。
 *
 * ⚠ **手際の段も同じ物差しで読む。**`Upgrades` はここを使って
 *   段を「作業精度の累計倍率」に直している（`SKILL_SPEEDUPS`）。**別の数を書かない。**
 */
export const HALVING_STEP = 5

/**
 * 手際の初期値と上限。
 *
 * ⚠ **上限は 30 でなければ clamp が仕事をしない。**
 *   床（0.25）に着くのは `S >= D + 10` のとき。D は tier×5 なので
 *   tier2 は S=20、tier3 は S=25、tier4 は S=30 で床に着く。
 *
 *   | 手際 | tier4 ÷ tier2 の所要比 |
 *   |---|---|
 *   | 10 / 15 / 20 | **4.00倍（変わらない）** |
 *   | 25 | 2.00倍 |
 *   | **30** | **1.00倍（追いついた）** |
 *
 *   **上限を 20 にすると比が 4.00 のまま動かず、ただの一律高速化になる**
 *   ＝ 指数式だけを入れたのと同じで、この設計の狙い（格上が格下に追いつく）が出ない。
 */
export const SKILL_INITIAL = 10
export const SKILL_MAX = 30

/** 品の難易度（導出。手書きしない） */
export function difficulty(itemId: ItemId): number {
  return tier(itemId) * DIFFICULTY_PER_TIER
}

/** 所要時間の倍率。clamp が「格上が格下に追いつく」を作る */
export function speedMultiplier(itemId: ItemId, skill: number): number {
  const raw = Math.pow(2, (difficulty(itemId) - skill) / HALVING_STEP)
  return Math.min(SPEED_CEILING, Math.max(SPEED_FLOOR, raw))
}

/**
 * 実際の所要時間（分）。レシピを持たない品は 0。
 *
 * ⚠ これが「その日のうちに終わるか」の判定に使われる。
 *   起きている時間は 1080分/日 しかない（TimeManager）。
 *   **いま着手を止めているのはこれだけ**である（上の注記）。
 */
export function craftMinutes(itemId: ItemId, skill: number): number {
  const recipe = RECIPES_BY_OUTPUT.get(itemId)
  if (!recipe) return 0
  return Math.round(recipe.durationMinutes * speedMultiplier(itemId, skill))
}
