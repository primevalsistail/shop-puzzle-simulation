import Phaser from 'phaser'

const STRIP_X = 980
const STRIP_WIDTH = 110
const STRIP_HEIGHT = 610
const MID_Y = STRIP_HEIGHT / 2  // 305

export class CharacterStrip {
  private shopkeeperGfx!: Phaser.GameObjects.Graphics
  private customerSlots: Map<string, Phaser.GameObjects.Graphics> = new Map()

  constructor(private scene: Phaser.Scene) {}

  create(): void {
    const cx = STRIP_X + STRIP_WIDTH / 2

    // ── 店番エリア（上半分） ─────────────────────────────
    this.scene.add.rectangle(cx, MID_Y / 2, STRIP_WIDTH, MID_Y, 0x1a2a3a)
      .setStrokeStyle(1, 0x2a4a6a).setDepth(1)

    this.scene.add.text(cx, 16, '店番', {
      fontSize: '11px', color: '#7799bb',
    }).setOrigin(0.5, 0).setDepth(2)

    // 店主キャラクタープレースホルダー（丸）
    this.shopkeeperGfx = this.scene.add.graphics().setDepth(2)
    this.drawShopkeeper()

    // ── 来店客エリア（下半分） ───────────────────────────
    this.scene.add.rectangle(cx, MID_Y + (STRIP_HEIGHT - MID_Y) / 2, STRIP_WIDTH, STRIP_HEIGHT - MID_Y, 0x1a3a2a)
      .setStrokeStyle(1, 0x2a6a4a).setDepth(1)

    this.scene.add.text(cx, MID_Y + 8, '来店客', {
      fontSize: '11px', color: '#77bb99',
    }).setOrigin(0.5, 0).setDepth(2)

    // 区切り線
    const divGfx = this.scene.add.graphics().setDepth(2)
    divGfx.lineStyle(1, 0x445566, 0.8)
    divGfx.lineBetween(STRIP_X + 4, MID_Y, STRIP_X + STRIP_WIDTH - 4, MID_Y)
  }

  private drawShopkeeper(): void {
    const cx = STRIP_X + STRIP_WIDTH / 2
    const cy = MID_Y / 2
    this.shopkeeperGfx.clear()
    // 頭
    this.shopkeeperGfx.fillStyle(0x4a7a9b, 1)
    this.shopkeeperGfx.fillCircle(cx, cy - 20, 18)
    // 体
    this.shopkeeperGfx.fillStyle(0x3a6a8b, 1)
    this.shopkeeperGfx.fillRoundedRect(cx - 16, cy + 0, 32, 28, 6)
  }

  // ── 将来の拡張 API ──────────────────────────────────────

  addCustomer(id: string): void {
    const cx = STRIP_X + STRIP_WIDTH / 2
    const baseY = MID_Y + 40 + this.customerSlots.size * 50
    if (baseY > STRIP_HEIGHT - 20) return

    const gfx = this.scene.add.graphics().setDepth(2)
    gfx.fillStyle(0x3a8b5a, 1)
    gfx.fillCircle(cx, baseY, 12)
    gfx.fillStyle(0x2a7a4a, 1)
    gfx.fillRoundedRect(cx - 10, baseY + 14, 20, 18, 4)
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
