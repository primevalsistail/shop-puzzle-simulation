import Phaser from 'phaser'
import type { DeliveryOrder } from '../components/progress/DeliveryOrders.js'
import { orderLineText } from './OrderBar.js'
import { CONTENT_DEPTH } from './PlaceFrame.js'
import {
  PLACE_CX, CONTENT_L, ROWS_TOP,
  DELIVERY_TAB_FONT_PX, DELIVERY_TAB_LINE_H, DELIVERY_TAB_EMPTY, deliveryTabLines,
  TAB_ROW_SUB_FONT_PX,
} from './layout.js'

/** 納品タブが読むもの。**注文・品名・手持ち** —— 帯（`OrderBar`）が読むものと同じ */
export interface DeliveryView {
  readonly order: DeliveryOrder | null
  readonly itemName: string
  readonly held: number
}

/**
 * 「取引」の `納品` タブ（#96）。
 *
 * ⚠ **いまの帯（`OrderBar`）と同じ情報を出すだけ。**注文の受け直しも、
 *   複数件も、ミッションへの作り直しも**ここではやらない**（#98）。
 * ⚠ **帯は残す**（`OrderBar`）。一目で見える情報を失わないため、**タブは足すだけ。**
 * ⚠ **文言を発明しない**（#79）。出す文字列は `orderLineText` を
 *   `deliveryTabLines` が全角空白で折ったものだけで、**語は1つも増やしていない。**
 */
export class DeliveryTab {
  private container: Phaser.GameObjects.Container | null = null
  private isOpen = false

  constructor(
    private scene: Phaser.Scene,
    /** **入るたびに読み直す。**手持ちは店に戻らなくても（買えば）変わる */
    private view: () => DeliveryView,
  ) {}

  /** タブに入る。**中身だけ作る**（枠は `TradeMenu` が持つ） */
  enter(): void {
    if (this.isOpen) return
    this.isOpen = true
    this.build()
  }

  /** タブを出る。**中身だけ捨てる** */
  leave(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.container?.destroy()
    this.container = null
  }

  private build(): void {
    const objs: Phaser.GameObjects.GameObject[] = []
    const { order, itemName, held } = this.view()

    if (!order) {
      // ⚠ **帯は無いとき消えるが、タブはまっさらにしない**（`layout.ts` の注記）
      objs.push(
        this.scene.add.text(PLACE_CX, ROWS_TOP + 60, DELIVERY_TAB_EMPTY, {
          fontSize: `${TAB_ROW_SUB_FONT_PX}px`, color: '#889999',
        }).setOrigin(0.5),
      )
    } else {
      // **積み終わったかどうか**だけを色で言う（帯と同じ判定）
      const done = held >= order.quantity
      deliveryTabLines(orderLineText(itemName, order, held)).forEach((line, i) => {
        objs.push(
          this.scene.add.text(CONTENT_L + 16, ROWS_TOP + 24 + i * DELIVERY_TAB_LINE_H, line, {
            fontSize: `${i === 0 ? DELIVERY_TAB_FONT_PX : TAB_ROW_SUB_FONT_PX}px`,
            color: i === 0 ? '#ffffff' : (done ? '#88ddaa' : '#bbccee'),
          }).setOrigin(0, 0.5),
        )
      })
    }

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(CONTENT_DEPTH)
  }
}
