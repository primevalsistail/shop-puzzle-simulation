import Phaser from 'phaser'
import type { DeliveryOrder } from '../components/progress/DeliveryOrders.js'

import { CONTENT_DEPTH } from './PlaceFrame.js'
import {
  PLACE_CX, CONTENT_L, CONTENT_R, ROWS_TOP,
  DELIVERY_HEAD_Y, DELIVERY_ROWS_TOP, DELIVERY_ROW_H,
  DELIVERY_NAME_L, DELIVERY_CLIENT_L, DELIVERY_QTY_R, DELIVERY_REWARD_R,
  DELIVERY_BTN_L, DELIVERY_BTN_W, DELIVERY_DISCARD_L, DELIVERY_DISCARD_W, DELIVERY_BTN_H,
  DELIVERY_HEAD_FONT_PX, DELIVERY_BTN_FONT_PX, DELIVERY_TAB_EMPTY,
  TAB_ROW_TITLE_FONT_PX, TAB_ROW_SUB_FONT_PX,
} from './layout.js'
import {
  DELIVERY_COLS, DELIVERY_BTN_LABEL, DISCARD_BTN_LABEL, deliveryShortLabel,
  discardConfirmLines,
} from './delivery.js'
import { money } from './money.js'
import { ConfirmDialog, confirmNeeded } from './ConfirmDialog.js'

/** 1件ぶん。**品名と手持ちは注文の外から来る**（注文は品IDしか持たない） */
export interface DeliveryRowView {
  readonly order: DeliveryOrder
  readonly itemName: string
  readonly held: number
}

/** 納品タブが読むもの */
export interface DeliveryView {
  readonly rows: readonly DeliveryRowView[]
}

/** 行の帯の幅 */
const ROW_W = CONTENT_R - CONTENT_L
const ROW_BG = 0x2b3048
/** 納められる行。⚠ **納められない行と必ず違う色にすること**（押せるかが色で分かる） */
const ROW_BG_READY = 0x2a3a2a

/**
 * 「取引」の `納品` タブ（#96 の器 → **#98 でミッションの表になった**）。
 *
 * ## 表の形は PO が描いたもの（赤入れ 2026-09-13）
 *
 * **商品 ／ 依頼者 ／ 数量 ／ 報酬 ／ 納品**。
 * ⚠ **島の列は無い**（#98「納品先の島は無くす」）。
 * ⚠ **`廃棄` だけは絵に無い。**#98 本文の「廃棄することも可能とする」から、**右端に**足してある。
 *
 * ⚠ **`数量` の列は `手持ち/必要`**（PO 回答 2026-09-14）。**絵の「必要な数」だけを出す形ではない。**
 *   **2026-09-14 まではボタンの字が `0/7` に変わる形だった**が、
 *   **列に移したのでボタンは `納品` のまま**にしてある（同じ数を1行に2回出さない）。
 *
 * ⚠ **`廃棄` は押した場では実行しない**（PO 指示 2026-09-14「ダイアログ形式で」）。
 *   **確認を通す口は `confirmNeeded('廃棄')` 1つだけ**で、#113（行為ごとの ON/OFF）は
 *   **その表を書き換えるだけ**になる。
 *
 * ⚠ **押したあと自分で作り直す。**手持ちも件数も変わるので、
 *   **`GameScene` 側の作り直しを待たない**（待つと1回ぶん古い表が残る）。
 */
export class DeliveryTab {
  private container: Phaser.GameObjects.Container | null = null
  private isOpen = false
  /** `廃棄` の確認（PO 指示 2026-09-14）。⚠ **タブを出るときに必ず片付ける** */
  private confirm: ConfirmDialog

  constructor(
    private scene: Phaser.Scene,
    /** **入るたびに読み直す。**手持ちは店に戻らなくても（買えば）変わる */
    private view: () => DeliveryView,
    /** 納品ボタン。**納まったら true** */
    private onDeliver: (id: string) => boolean,
    /** 廃棄ボタン */
    private onDiscard: (id: string) => void,
  ) {
    this.confirm = new ConfirmDialog(scene)
  }

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
    // ⚠ **確認も一緒に捨てる。**残すと、タブを離れたあとの画面に暗幕だけが残る
    this.confirm.close()
    this.container?.destroy()
    this.container = null
  }

  /** 開いたまま作り直す（納品・廃棄のあと） */
  refresh(): void {
    if (!this.isOpen) return
    this.container?.destroy()
    this.container = null
    this.build()
  }

  private build(): void {
    const objs: Phaser.GameObjects.GameObject[] = []
    const { rows } = this.view()

    if (rows.length === 0) {
      // ⚠ **まっさらにしない。**タブは自分で開いて来る場所なので、空だと壊れて見える（#48）
      objs.push(
        this.scene.add.text(PLACE_CX, ROWS_TOP + 60, DELIVERY_TAB_EMPTY, {
          fontSize: `${TAB_ROW_SUB_FONT_PX}px`, color: '#889999',
        }).setOrigin(0.5),
      )
    } else {
      this.buildHead(objs)
      rows.forEach((row, i) => this.buildRow(row, DELIVERY_ROWS_TOP + DELIVERY_ROW_H / 2
        + i * DELIVERY_ROW_H, objs))
    }

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(CONTENT_DEPTH)
  }

  /** 見出しの行。⚠ **列の名も位置も1箇所から来る**（`DELIVERY_COLS` ／ `layout.ts`） */
  private buildHead(objs: Phaser.GameObjects.GameObject[]): void {
    const [item, client, qty, reward, deliver, discard] = DELIVERY_COLS
    const head = (x: number, text: string, originX: number) =>
      objs.push(this.scene.add.text(x, DELIVERY_HEAD_Y, text, {
        fontSize: `${DELIVERY_HEAD_FONT_PX}px`, color: '#8899aa',
      }).setOrigin(originX, 0.5))

    head(DELIVERY_NAME_L, item, 0)
    head(DELIVERY_CLIENT_L, client, 0)
    head(DELIVERY_QTY_R, qty, 1)
    head(DELIVERY_REWARD_R, reward, 1)
    head(DELIVERY_BTN_L + DELIVERY_BTN_W / 2, deliver, 0.5)
    head(DELIVERY_DISCARD_L + DELIVERY_DISCARD_W / 2, discard, 0.5)
  }

  private buildRow(row: DeliveryRowView, y: number, objs: Phaser.GameObjects.GameObject[]): void {
    const { order, itemName, held } = row
    const ready = held >= order.quantity

    objs.push(
      this.scene.add.rectangle(PLACE_CX, y, ROW_W, DELIVERY_ROW_H - 6,
        ready ? ROW_BG_READY : ROW_BG)
        .setStrokeStyle(1, ready ? 0x558855 : 0x555555),
    )

    objs.push(
      this.scene.add.text(DELIVERY_NAME_L, y, itemName, {
        fontSize: `${TAB_ROW_TITLE_FONT_PX}px`, color: '#ffffff',
      }).setOrigin(0, 0.5),
      this.scene.add.text(DELIVERY_CLIENT_L, y, order.client, {
        fontSize: `${TAB_ROW_SUB_FONT_PX}px`, color: '#ddccaa',
      }).setOrigin(0, 0.5),
      // ⚠ **必要な数だけではなく `手持ち/必要`**（PO 回答 2026-09-14）。
      //   **あと何個で納められるかは、ここが唯一の出しどころ**（手持ちの列は無い）
      this.scene.add.text(DELIVERY_QTY_R, y, deliveryShortLabel(held, order.quantity), {
        fontSize: `${TAB_ROW_SUB_FONT_PX}px`, color: ready ? '#ffffff' : '#998877',
      }).setOrigin(1, 0.5),
      this.scene.add.text(DELIVERY_REWARD_R, y, money(order.reward), {
        fontSize: `${TAB_ROW_SUB_FONT_PX}px`, color: '#ffdd44',
      }).setOrigin(1, 0.5),
    )

    // ── 納品 ── ⚠ **納められないときは押せない。**字は `納品` のまま
    //   （**足りない数は `数量` の列に出ている。**PO 回答 2026-09-14）
    const btn = this.scene.add.rectangle(
      DELIVERY_BTN_L + DELIVERY_BTN_W / 2, y, DELIVERY_BTN_W, DELIVERY_BTN_H,
      ready ? 0x6a5a2a : 0x3a3a3a,
    ).setStrokeStyle(1, ready ? 0x8a7a3a : 0x4a4a4a)
    objs.push(btn, this.scene.add.text(
      DELIVERY_BTN_L + DELIVERY_BTN_W / 2, y, DELIVERY_BTN_LABEL, {
        fontSize: `${DELIVERY_BTN_FONT_PX}px`, color: ready ? '#ffffff' : '#998877',
      }).setOrigin(0.5))
    if (ready) {
      btn.setInteractive({ useHandCursor: true })
      btn.on('pointerdown', () => {
        if (this.onDeliver(order.id)) this.refresh()
      })
    }

    // ── 廃棄 ── ⚠ **いつでも押せる**（上限10件を自分で空けるための操作。罰は無い）。
    //   ⚠ **押した場では実行しない。**確認を出す（PO 指示 2026-09-14「ダイアログ形式で」）
    const discard = this.scene.add.rectangle(
      DELIVERY_DISCARD_L + DELIVERY_DISCARD_W / 2, y, DELIVERY_DISCARD_W, DELIVERY_BTN_H, 0x3a2a2a,
    ).setStrokeStyle(1, 0x6a4a4a).setInteractive({ useHandCursor: true })
    discard.on('pointerdown', () => this.askDiscard(row))
    objs.push(discard, this.scene.add.text(
      DELIVERY_DISCARD_L + DELIVERY_DISCARD_W / 2, y, DISCARD_BTN_LABEL, {
        fontSize: `${DELIVERY_BTN_FONT_PX}px`, color: '#ddaaaa',
      }).setOrigin(0.5))
  }

  /**
   * `廃棄` を押した。**確認を通してから捨てる。**
   *
   * ⚠ **確認を出すかどうかの判定はここ1つ**（`confirmNeeded('廃棄')`）。
   *   **#113 で OFF にされたときは、押した場で捨てる**（今は既定の ON しかない）。
   */
  private askDiscard(row: DeliveryRowView): void {
    if (!confirmNeeded('廃棄')) {
      this.discardNow(row.order.id)
      return
    }
    this.confirm.open(
      discardConfirmLines(row.itemName, row.order), DISCARD_BTN_LABEL,
      () => this.discardNow(row.order.id),
    )
  }

  /** ⚠ **捨てたあと自分で作り直す**（件数が変わる。`GameScene` 側を待たない） */
  private discardNow(id: string): void {
    this.onDiscard(id)
    this.refresh()
  }
}
