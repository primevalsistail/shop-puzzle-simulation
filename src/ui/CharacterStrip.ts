import Phaser from 'phaser'
import {
  STRIP_L, STRIP_W, STRIP_H, STRIP_SHOPKEEPER_FONT_PX, STRIP_CUSTOMER_FONT_PX,
} from './layout.js'

const STRIP_X = STRIP_L
const STRIP_WIDTH = STRIP_W
const STRIP_HEIGHT = STRIP_H
const MID_Y = STRIP_HEIGHT / 2  // 305

export class CharacterStrip {
  private shopkeeperGfx!: Phaser.GameObjects.Graphics
  private customerSlots: Map<string, Phaser.GameObjects.Graphics> = new Map()
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
    this.shopkeeperGfx?.setVisible(visible)
    for (const gfx of this.customerSlots.values()) gfx.setVisible(visible)
  }

  create(): void {
    const cx = STRIP_X + STRIP_WIDTH / 2

    // ── 店番エリア（上半分） ─────────────────────────────
    this.frame.push(
      this.scene.add.rectangle(cx, MID_Y / 2, STRIP_WIDTH, MID_Y, 0x1a2a3a)
        .setStrokeStyle(1.5, 0x2a4a6a).setDepth(1),
      this.scene.add.text(cx, 24, '店番', {
        fontSize: `${STRIP_SHOPKEEPER_FONT_PX}px`, color: '#7799bb',
      }).setOrigin(0.5, 0).setDepth(2),
    )

    // 店主キャラクタープレースホルダー（丸）
    this.shopkeeperGfx = this.scene.add.graphics().setDepth(2)
    this.drawShopkeeper()

    // ── 来店客エリア（下半分） ───────────────────────────
    this.frame.push(
      this.scene.add.rectangle(cx, MID_Y + (STRIP_HEIGHT - MID_Y) / 2, STRIP_WIDTH, STRIP_HEIGHT - MID_Y, 0x1a3a2a)
        .setStrokeStyle(1.5, 0x2a6a4a).setDepth(1),
      this.scene.add.text(cx, MID_Y + 12, '来店客', {
        fontSize: `${STRIP_CUSTOMER_FONT_PX}px`, color: '#77bb99',
      }).setOrigin(0.5, 0).setDepth(2),
    )

    // 区切り線
    const divGfx = this.scene.add.graphics().setDepth(2)
    divGfx.lineStyle(1.5, 0x445566, 0.8)
    divGfx.lineBetween(STRIP_X + 6, MID_Y, STRIP_X + STRIP_WIDTH - 6, MID_Y)
    this.frame.push(divGfx)
  }

  private drawShopkeeper(): void {
    const cx = STRIP_X + STRIP_WIDTH / 2
    const cy = MID_Y / 2
    this.shopkeeperGfx.clear()
    // 頭
    this.shopkeeperGfx.fillStyle(0x4a7a9b, 1)
    this.shopkeeperGfx.fillCircle(cx, cy - 30, 27)
    // 体
    this.shopkeeperGfx.fillStyle(0x3a6a8b, 1)
    this.shopkeeperGfx.fillRoundedRect(cx - 24, cy + 0, 48, 42, 9)
  }

  // ── 将来の拡張 API ──────────────────────────────────────

  addCustomer(id: string): void {
    const cx = STRIP_X + STRIP_WIDTH / 2
    const baseY = MID_Y + 60 + this.customerSlots.size * 75
    if (baseY > STRIP_HEIGHT - 30) return

    const gfx = this.scene.add.graphics().setDepth(2).setVisible(this.shown)
    gfx.fillStyle(0x3a8b5a, 1)
    gfx.fillCircle(cx, baseY, 18)
    gfx.fillStyle(0x2a7a4a, 1)
    gfx.fillRoundedRect(cx - 15, baseY + 21, 30, 27, 6)
    this.customerSlots.set(id, gfx)
  }

  removeCustomer(id: string): void {
    const gfx = this.customerSlots.get(id)
    if (gfx) {
      gfx.destroy()
      this.customerSlots.delete(id)
    }
  }
}
