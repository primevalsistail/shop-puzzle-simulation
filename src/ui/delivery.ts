import type { DeliveryOrder } from '../components/progress/DeliveryOrders.js'
import { money } from './money.js'

/**
 * 納品の文字を組み立てるところ。**Phaser を読まない**ので、`layout.test.ts` が実物の幅を測れる
 * （`goal.ts` ／ `money.ts` と同じ形）。
 *
 * ⚠ **画面下の帯（`OrderBar`）は 2026-09-14 に消した**（PO 指示「帯要らない」）。
 *   **納品を見る場所は「取引」の納品タブだけ。**
 * ⚠ **言い回しは仮置き**（#79）。
 */

/**
 * 納品タブの見出し行（**PO 赤入れ 2026-09-13。原文の語をそのまま使う**）。
 *
 * ⚠ **列を増やさないこと。**PO が描いた表は**この5つ**で、
 *   **島の列は無い**（#98「納品先の島は無くす」）。
 * ⚠ **`廃棄` だけは PO の絵に無い**（#98 本文の「廃棄することも可能とする」から足した）。
 *   **右端に置く**ので、5列の並びは絵のままになる。→ 確認は質問票へ
 */
export const DELIVERY_COLS = ['商品', '依頼者', '数量', '報酬', '納品', '廃棄'] as const

/** 納品ボタンの字。⚠ **タブの名と同じ語**（`TRADE_TABS` の `納品`）。言い換えない */
export const DELIVERY_BTN_LABEL = '納品'
/** 廃棄ボタンの字 */
export const DISCARD_BTN_LABEL = '廃棄'

/**
 * **納められないとき**にボタンの字と差し替える、手持ちの数。
 *
 * ⚠ **語を足さない。**`足りない` と書く代わりに**数だけを出す** ——
 *   商人タブで「**買えないときだけボタンの字が理由に変わる**」（PO 指示 2026-09-13）と
 *   同じ作りで、**表の `数量` 列（必要な数）と並べて読める。**
 * ⚠ **これが唯一の手持ちの出しどころ。**PO の絵には手持ちの列が無いので、
 *   ここを消すと**あと何個で納められるのかが画面から消える。**→ 確認は質問票へ
 */
export function deliveryShortLabel(held: number, quantity: number): string {
  return `${held}/${quantity}`
}

/** ミッションを受け取ったときの知らせ。⚠ **窓は出さない**（#24 の既決） */
export function orderIssuedText(itemName: string, order: DeliveryOrder): string {
  return `${order.client}から ${itemName} ×${order.quantity} の依頼が入った`
    + `（納めると ${money(order.reward)}）`
}

/** 納めたときの知らせ */
export function orderDeliveredText(itemName: string, order: DeliveryOrder): string {
  return `${order.client}へ ${itemName} ×${order.quantity} を納めた　+${money(order.reward)}`
}

/** 捨てたときの知らせ */
export function orderDiscardedText(itemName: string, order: DeliveryOrder): string {
  return `${order.client}の ${itemName} ×${order.quantity} の依頼を断った`
}
