/**
 * 目標（クリア条件）を**画面に出すための1箇所**（#73）。
 *
 * ## なぜこのファイルがあるか
 *
 * 目標を出す画面は3つある —— **進捗バー**（`HUD`）／**チュートリアル**（`Tutorial`）／
 * **目標達成の幕**（`GameScene`）。以前はこの3つが**それぞれ別の数字を持っていて**、
 * 進捗バーとチュートリアルは `累計売上 / 100万`、実際のクリア判定は `所持金 / 1000万` だった。
 * **軸も桁も違う。**バーが 100% になってもクリアしない。
 *
 * ⚠ **額の正は `GameService.GOAL_AMOUNT` の1つだけ。**ここはそれを読んで文字にするだけで、
 *   自分の数字を持たない。**別書きが増えていないかは `goal.test.ts` が見ている。**
 *
 * ⚠ **Phaser を読まない。**読むと `goal.test.ts` が実物の文字列を測れなくなる。
 */

import { GOAL_AMOUNT } from '../services/GameService.js'
import { money } from './money.js'

/**
 * 目標までの進み（0〜1）。**測るのは所持金**で、累計売上ではない。
 *
 * ⚠ **この値は減る。**所持金は改装や仕入れで使えば減るので、バーも縮む。
 *   **それが実際のクリア条件**（`GameService.onMinutePassed`）なので、縮むのが正しい。
 *   「払えば目標が遠のく」という改装画面の文言とも、ここで初めて辻褄が合う。
 * ⚠ **0 で下げ止める。**負の幅で図形を描かせない。
 */
export function goalRatio(currentMoney: number): number {
  return Math.min(1, Math.max(0, currentMoney / GOAL_AMOUNT))
}

/** 進捗バーの右下に出す `目標 N%`。⚠ **切り上げない。**届く前に 100% と出さないため */
export function goalBarLabel(currentMoney: number): string {
  return `目標 ${Math.floor(goalRatio(currentMoney) * 100)}%`
}

/**
 * チュートリアル最後の行。⚠ **初日に必ず見る画面**なので、ここが実際の条件と違うと
 * **遊び始めた瞬間から嘘をつく**ことになる。
 */
export const GOAL_TUTORIAL_LINE = `目標: 所持金 ${money(GOAL_AMOUNT)} を達成しよう！`

/**
 * 目標達成の幕に出す1行。⚠ **クリアした瞬間に、クリア条件と違う数字を見せない。**
 * 届いたのは所持金なので、出すのも所持金。
 */
export function goalReachedLine(currentMoney: number): string {
  return `所持金 ${money(currentMoney)}`
}
