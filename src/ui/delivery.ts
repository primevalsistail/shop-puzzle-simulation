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
export function orderLineText(itemName: string, order: DeliveryOrder, held: number): string {
  return `納品 ${itemName} ×${order.quantity} → ${order.island}島`
    + `　手持ち ${held}/${order.quantity}　報酬 ${money(order.reward)}`
}
