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
 * `数量` の列に出す **`手持ち/必要`**（PO 回答 2026-09-14「`数量` の列を `0/7` にする」）。
 *
 * ⚠ **語を足さない。**`足りない` と書く代わりに**数だけを出す。**
 * ⚠ **出しどころは `数量` の列1箇所だけ。**2026-09-14 まで**納められないときのボタンの字**が
 *   同じ `0/7` だった（手持ちの列が無かったため）。**列に移したので、ボタンは `納品` に戻した** ——
 *   **同じ数を1つの行に2回出さない。**
 */
export function deliveryShortLabel(held: number, quantity: number): string {
  return `${held}/${quantity}`
}

/**
 * `廃棄` を押したときの確認の本文（PO 指示 2026-09-14「ダイアログ形式で」）。
 *
 * ⚠ **2行に分ける。**1行にすると**いちばん長い品名と依頼者**で面（`CONFIRM_TEXT_MAX_W`）を超える。
 * ⚠ **「戻せない」とは書かない。**依頼はまた入るので、脅す文になる（罰は無い。#98）。
 */
export function discardConfirmLines(itemName: string, order: DeliveryOrder): readonly string[] {
  return [`${itemName} ×${order.quantity}`, `${order.client}の依頼を断りますか`]
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
