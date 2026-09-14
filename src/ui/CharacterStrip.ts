import Phaser from 'phaser'
import {
  STRIP_L, STRIP_W, STRIP_H, STRIP_SHOPKEEPER_FONT_PX, STRIP_CUSTOMER_FONT_PX,
  STRIP_CUSTOMER_SLOT_H, STRIP_CUSTOMER_SLOT_MAX, STRIP_CUSTOMER_SLOT_TOP_CY,
} from './layout.js'
import type { IslandName } from '../taxonomy/islands.js'
import type { CustomerType } from '../taxonomy/customers.js'
import { CUSTOMER_ART_READY, SHOPKEEPER_KEY, customerKey } from './faces.js'
import { BG_PANEL, LINE_STRONG, LINE_WEAK, TEXT_SUB, TEXT_WEAK, css } from './palette.js'

const STRIP_X = STRIP_L
const STRIP_WIDTH = STRIP_W
const STRIP_HEIGHT = STRIP_H
const MID_Y = STRIP_HEIGHT / 2  // 457.5

export class CharacterStrip {
  /** 店番＝主人公ノエラの立ち姿（#21。PO 回答 2026-09-14「店番は主人公だけでいい」） */
  private shopkeeperImg!: Phaser.GameObjects.Image
  /**
   * 客1人ぶんの見た目。
   * ⚠ **絵と人の形を区別して持つ。**`Graphics` は**描いた座標がそのまま残る**ので、
   *   詰め直すときに `setPosition` ではなく**描き直し**が要る（`Image` は動かすだけでよい）。
   */
  private customerSlots: Map<string, { obj: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics; isImage: boolean }> = new Map()
  /** 枠・見出し・区切り線。**店にいる間だけ出す** */
  private frame: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text | Phaser.GameObjects.Graphics)[] = []
  private shown = true

  constructor(private scene: Phaser.Scene) {}

  /**
   * 店番・来店客の帯を出す／隠す。
   *
   * ⚠ **店を離れている間は隠す。**商人のところに居るのに「店番」「来店客」の枠が
   *   出ているのは、**そこに居ないのだからおかしい**（PO 2026-09-12）。
   * ⚠ **状態を覚えること。**隠している間にも客は増減しうる（`addCustomer`）。
   */
  setVisible(visible: boolean): void {
    this.shown = visible
    for (const obj of this.frame) obj.setVisible(visible)
    this.shopkeeperImg?.setVisible(visible)
    for (const slot of this.customerSlots.values()) slot.obj.setVisible(visible)
  }

  create(): void {
    const cx = STRIP_X + STRIP_WIDTH / 2

    // ── 店番エリア（上半分） ─────────────────────────────
    this.frame.push(
      this.scene.add.rectangle(cx, MID_Y / 2, STRIP_WIDTH, MID_Y, BG_PANEL)
        .setStrokeStyle(1.5, LINE_STRONG).setDepth(1),
      this.scene.add.text(cx, 24, '店番', {
        fontSize: `${STRIP_SHOPKEEPER_FONT_PX}px`, color: css(TEXT_SUB),
      }).setOrigin(0.5, 0).setDepth(2),
    )

    // 店番の立ち姿。⚠ **絵は 162×216 で、上半分（165×約458）にそのまま収まる。**
    //   拡大縮小をかけないこと（かけると輪郭がぼやける）
    this.shopkeeperImg = this.scene.add.image(cx, MID_Y / 2, SHOPKEEPER_KEY)
      .setOrigin(0.5, 0.5).setDepth(2).setVisible(this.shown)

    // ── 来店客エリア（下半分） ───────────────────────────
    this.frame.push(
      this.scene.add.rectangle(cx, MID_Y + (STRIP_HEIGHT - MID_Y) / 2, STRIP_WIDTH, STRIP_HEIGHT - MID_Y, BG_PANEL)
        .setStrokeStyle(1.5, LINE_STRONG).setDepth(1),
      this.scene.add.text(cx, MID_Y + 12, '来店客', {
        fontSize: `${STRIP_CUSTOMER_FONT_PX}px`, color: css(TEXT_SUB),
      }).setOrigin(0.5, 0).setDepth(2),
    )

    // 区切り線
    const divGfx = this.scene.add.graphics().setDepth(2)
    divGfx.lineStyle(1.5, LINE_WEAK, 0.8)
    divGfx.lineBetween(STRIP_X + 6, MID_Y, STRIP_X + STRIP_WIDTH - 6, MID_Y)
    this.frame.push(divGfx)
  }

  // ── 来店客（#21） ───────────────────────────────────────

  /** いま立っている人数。**`GameScene` が「もう入らない」を知るために見る** */
  customerCount(): number {
    return this.customerSlots.size
  }

  /**
   * 客を1人立たせる。
   *
   * ⚠ **絵は等倍で置く**（162×138。拡大縮小をかけると輪郭がぼやける）。
   * ⚠ **絵が揃うまでは人の形**（`faces.ts` の `CUSTOMER_ART_READY`）。
   *   **絵が無い名札で `add.image` を呼ぶと、緑の四角が出る。**
   * ⚠ **4人目は立たせない**（帯からはみ出す）。**売買は今までどおり進む** ——
   *   **ここは見た目だけで、居る／居ないは売れ行きに効かない。**
   */
  addCustomer(id: string, island: IslandName, type: CustomerType): void {
    if (this.customerSlots.size >= STRIP_CUSTOMER_SLOT_MAX) return
    const cx = STRIP_X + STRIP_WIDTH / 2
    const cy = STRIP_CUSTOMER_SLOT_TOP_CY + this.customerSlots.size * STRIP_CUSTOMER_SLOT_H

    if (CUSTOMER_ART_READY) {
      const img = this.scene.add.image(cx, cy, customerKey(island, type))
        .setOrigin(0.5, 0.5).setDepth(2).setVisible(this.shown)
      this.customerSlots.set(id, { obj: img, isImage: true })
      return
    }

    const gfx = this.scene.add.graphics().setDepth(2).setVisible(this.shown)
    this.drawFigure(gfx, cx, cy)
    this.customerSlots.set(id, { obj: gfx, isImage: false })
  }

  /** 絵が来るまでの人の形（丸＋胴） */
  private drawFigure(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    gfx.clear()
    gfx.fillStyle(TEXT_SUB, 1)
    gfx.fillCircle(cx, cy - 24, 18)
    gfx.fillStyle(TEXT_WEAK, 1)
    gfx.fillRoundedRect(cx - 15, cy - 3, 30, 27, 6)
  }

  /**
   * 立っている客を全員帰す。
   *
   * ⚠ **時間が飛ぶところで呼ぶ**（店を離れる・日が変わる）。**呼ばないと、**
   *   **その分の「居る分数」が減らないまま**（減らすのは1分ごとの `GameScene.retireCustomers`）、
   *   **昨日の客が今朝も立っている。**
   */
  clearCustomers(): void {
    for (const slot of this.customerSlots.values()) slot.obj.destroy()
    this.customerSlots.clear()
  }

  removeCustomer(id: string): void {
    const slot = this.customerSlots.get(id)
    if (!slot) return
    slot.obj.destroy()
    this.customerSlots.delete(id)
    this.relayout()
  }

  /** ⚠ **間を詰める。**真ん中の1人が帰ったとき、**空いた枠をそのままにしない** */
  private relayout(): void {
    const cx = STRIP_X + STRIP_WIDTH / 2
    let i = 0
    for (const slot of this.customerSlots.values()) {
      const cy = STRIP_CUSTOMER_SLOT_TOP_CY + i * STRIP_CUSTOMER_SLOT_H
      if (slot.isImage) {
        (slot.obj as Phaser.GameObjects.Image).setPosition(cx, cy)
      } else {
        this.drawFigure(slot.obj as Phaser.GameObjects.Graphics, cx, cy)
      }
      i++
    }
  }
}
