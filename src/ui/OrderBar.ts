import type Phaser from 'phaser'
import type { DeliveryOrder } from '../components/progress/DeliveryOrders.js'
import { money } from './money.js'
import {
  ORDER_BAR_L, ORDER_BAR_R, ORDER_BAR_W, ORDER_BAR_H, ORDER_BAR_CY,
  ORDER_BAR_PAD, ORDER_BAR_FONT_PX,
} from './layout.js'

/**
 * 帯に出す1行。**幅の検査（`OrderBar.test.ts`）が読むので、ここを純粋な関数にしてある。**
 *
 * ⚠ **金額は `money()` を通す**（`1,234レン`）。手書きしない。
 * ⚠ **言い回しは仮置き。**画面に足す文言は PO が指示する（#79）。
 */
export function orderLineText(itemName: string, order: DeliveryOrder, held: number): string {
  return `納品 ${itemName} ×${order.quantity} → ${order.island}島`
    + `　手持ち ${held}/${order.quantity}　報酬 ${money(order.reward)}`
}

/**
 * いま受けている納品の注文を1行で出す帯（#28）。
 *
 * ⚠ **無いときは帯ごと消す。**「注文なし」と書くと、常に1行が居座るのに読む意味が無い。
 * ⚠ **店にいる間だけ出す**（`setShopVisible`）。場所（商人のところ・工房・改装）の領域は
 *   y604 まで来るので、出したままだと枠の上に文字だけが残る。
 */
export class OrderBar {
  private bg!: Phaser.GameObjects.Rectangle
  private text!: Phaser.GameObjects.Text
  private shopVisible = true
  private hasOrder = false

  constructor(private scene: Phaser.Scene) {}

  create(): void {
    const cx = (ORDER_BAR_L + ORDER_BAR_R) / 2
    this.bg = this.scene.add
      .rectangle(cx, ORDER_BAR_CY, ORDER_BAR_W, ORDER_BAR_H, 0x1b2440)
      .setStrokeStyle(1, 0x3a4a77)
      .setDepth(4)
      .setVisible(false)
    this.text = this.scene.add
      .text(ORDER_BAR_L + ORDER_BAR_PAD, ORDER_BAR_CY, '', {
        fontSize: `${ORDER_BAR_FONT_PX}px`, color: '#bbccee',
      })
      .setOrigin(0, 0.5)
      .setDepth(4)
      .setVisible(false)
  }

  /**
   * 表示を作り直す。**注文が無ければ帯ごと消える。**
   *
   * `held` が足りていれば色を変える —— **着いた時点で自動的に納まる**ので、
   * プレイヤーが見たいのは「積み終わったかどうか」だけ。
   */
  update(order: DeliveryOrder | null, itemName: string, held: number): void {
    this.hasOrder = order !== null
    if (order) {
      this.text.setText(orderLineText(itemName, order, held))
      this.text.setColor(held >= order.quantity ? '#88ddaa' : '#bbccee')
    }
    this.applyVisibility()
  }

  setShopVisible(visible: boolean): void {
    this.shopVisible = visible
    this.applyVisibility()
  }

  private applyVisibility(): void {
    const show = this.hasOrder && this.shopVisible
    this.bg.setVisible(show)
    this.text.setVisible(show)
  }
}
