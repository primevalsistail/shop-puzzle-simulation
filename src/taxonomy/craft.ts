/**
 * Cycle 4 → **段階4 作業2 で作り替えた（2026-09-15）** —— 加工の所要時間
 *
 * ## 何を解いているか
 *
 * ```
 * 所要時間 = recipe.durationMinutes ÷ 手際の倍率（1.0 〜 5.0）
 * ```
 *
 * ⚠ **tier は `durationMinutes` にだけ入る。**品ごとの速さの倍率は無い。
 *
 * ## ⚠ なぜ S − D 方式（`2^((tier×5 − 手際)/5)`）をやめたか
 *
 * **1つの数が2つのものを決めていて、片方にだけ tier が二重に掛かっていた。**
 *
 * | | 何で決まるか | tier の入り方 |
 * |---|---|---|
 * | **売値**（当時。`derive.ts` の `craftProfit`） | `durationMinutes`（**素の値**） | 1回 |
 * | **実際の所要時間**（旧） | `durationMinutes` × `clamp(2^((tier×5 − 手際)/5), 0.25, 4)` | ⚠ **2回** |
 *
 * ⚠ **2026-09-15 に、売値の側が `durationMinutes` を見るのをやめた**
 *   （`加工利益 = 係数 × 升数^1.1 × 格の倍率`。計画 `price-model-rework.md`）。
 *   **いま `durationMinutes` が決めるのは「その日に何個作れるか」だけで、値段には一切出ない。**
 *   下の「加工利益の比」の話も、その時点で `craftProfit` の話ではなくなっている。
 *
 * ⚠ **実測（2026-09-15）: tier4 の初期が 840分。**営業は600分、無料枠は240分、
 *   `CraftingSystem.fitsInToday` が 24:00 跨ぎを禁じるので、**1日に収まらず着手すらできない。**
 *   測る道具（`src/sim/`）を 520日回しても **tier4 を一度も作れなかった**のがこれである。
 *
 * **いまは tier が `durationMinutes` にだけ入るので、売値と時間が同じ1本から出る。**
 * 基準（PO 決定。計画 `stage4-start.md`）:
 *
 * | tier | T2 | T3 | T4 | T5 | T6 | T7 |
 * |---|---|---|---|---|---|---|
 * | **初期 1回** | **10分** | 14 | 19 | 27 | 36 | **50分** |
 * | **MAX 1回** | **2分** | 2.8 | 3.8 | 5.4 | 7.2 | **10分** |
 *
 * ⚠ **所要時間の比（T7 ÷ T2）は 5倍**（10分 → 50分）。
 *   ⚠ **これはもう加工利益の比ではない**（上の追記）。**「深く作るほど取り分が増える」は、
 *   いまは材料費の積み上げと `tier↔升数` の相関（r = 0.659）が運んでいる**
 *   （`invariants.test.ts` の「tier ごとの売値の中央値が単調に増える」が見ている）。
 *
 * ## ⚠ 捨てたもの
 *
 * **clamp が作っていた「格上が格下に追いつく」。**
 * **基準が 10〜50分なら最初から全部その日に収まる**ので、追いつかせる必要が無い。
 * ⚠ **同時に「初期の手際では1日に収まらない品がある」という関門も消えた**
 *   （`craft.test.ts` がその向きを固定している）。
 */

import type { ItemId } from './axes.js'
import { RECIPES_BY_OUTPUT } from './recipes.js'

/**
 * 手際の初期値と上限。**段は `Upgrades` が持つ**（`SKILL_VALUES`）。
 *
 * ⚠ **数そのものに意味は無い。**効くのは `SKILL_MAX − SKILL_INITIAL` を
 *   何段で割るかだけで、それを決めるのは `Upgrades` 側である。
 */
export const SKILL_INITIAL = 10
export const SKILL_MAX = 30

/**
 * 手際を上げ切ったときの速さ。**MAX 5倍**（PO 決定 2026-09-15）。
 *
 * ⚠ **`Upgrades` は 6段（初期＋5段）なので、1段は `5^(1/5) = 1.38倍`。**
 *   **旧実装の 1.741倍（`2^(4/5)`）に対する PO の異議に応えた値である。**
 * ⚠ **段の数をここに書かない。**段は `Upgrades.SKILL_VALUES` が持ち、
 *   1段あたりの倍率は**そこから `skillSpeedup()` で出る。**
 */
export const SKILL_MAX_SPEEDUP = 5

/**
 * 手際の**累計倍率**（初期 1.0 → 上限 5.0）。**全品に同じだけ効く。**
 *
 * ⚠ **品を見ない。**ここに tier を戻すと、上の「二重に掛かる」が再発する。
 * ⚠ **改装の画面もここを読む**（`Upgrades` の `SKILL_SPEEDUPS`）。**数を書き写さない。**
 */
export function skillSpeedup(skill: number): number {
  const s = Math.min(SKILL_MAX, Math.max(SKILL_INITIAL, skill))
  return Math.pow(SKILL_MAX_SPEEDUP, (s - SKILL_INITIAL) / (SKILL_MAX - SKILL_INITIAL))
}

/**
 * 所要時間の倍率（1.0 → 0.2）。**`skillSpeedup` の逆数。**
 *
 * ⚠ **引数に品を取らない**（旧 `speedMultiplier(itemId, skill)` から変わった）。
 *   **品ごとの差は `durationMinutes` が全部持っている。**
 */
export function speedMultiplier(skill: number): number {
  return 1 / skillSpeedup(skill)
}

/**
 * 実際の所要時間（分）。レシピを持たない品は 0。
 *
 * ⚠ **1分を下回らせない。**`Math.round` に任せると 0分の加工ができ、
 *   **時間を払わずに作れる**（いちばん速い T2 は上限で `5 ÷ 5 = 1分`）。
 *
 * ⚠ これが「その日のうちに終わるか」の判定に使われる（`CraftingSystem.fitsInToday`）。
 */
export function craftMinutes(itemId: ItemId, skill: number): number {
  const recipe = RECIPES_BY_OUTPUT.get(itemId)
  if (!recipe) return 0
  return Math.max(1, Math.round(recipe.durationMinutes * speedMultiplier(skill)))
}
