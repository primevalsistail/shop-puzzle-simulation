import Phaser from 'phaser'

const GOAL_AMOUNT = 1_000_000
const PW = 224  // panel width
const PH = 108  // panel height

export class HUD {
  private timeText!: Phaser.GameObjects.Text
  private dayText!: Phaser.GameObjects.Text
  private moneyText!: Phaser.GameObjects.Text
  private barBg!: Phaser.GameObjects.Rectangle
  private barFill!: Phaser.GameObjects.Rectangle
  private barLabel!: Phaser.GameObjects.Text
  private panelX!: number
  private panelY!: number

  constructor(private scene: Phaser.Scene) {}

  create(): void {
    const { width } = this.scene.scale
    this.panelX = width - PW / 2 - 8
    this.panelY = PH / 2 + 8

    const px = this.panelX
    const py = this.panelY

    // Background panel
    this.scene.add.rectangle(px, py, PW, PH, 0x0a0a22, 0.85)
      .setStrokeStyle(1, 0x334477).setDepth(5)

    // Row 1 — Day (left) + Time (right, big)
    this.dayText = this.scene.add.text(px - PW / 2 + 12, py - 38, 'Day 1', {
      fontSize: '13px', color: '#7788aa',
    }).setOrigin(0, 0.5).setDepth(5)

    this.timeText = this.scene.add.text(px + PW / 2 - 12, py - 38, '08:00', {
      fontSize: '26px', color: '#55ddff', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(5)

    // Divider line
    const lineGfx = this.scene.add.graphics().setDepth(5)
    lineGfx.lineStyle(1, 0x334477, 0.7)
    lineGfx.lineBetween(px - PW / 2 + 8, py - 18, px + PW / 2 - 8, py - 18)

    // Row 2 — Money (center, big)
    this.moneyText = this.scene.add.text(px, py + 4, '¥0', {
      fontSize: '22px', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(5)

    // Row 3 — Goal progress bar
    const barW = PW - 24
    const barH = 8
    const barY = py + 34
    this.barBg = this.scene.add.rectangle(px, barY, barW, barH, 0x223344)
      .setDepth(5)
    this.barFill = this.scene.add.rectangle(px - barW / 2, barY, 0, barH, 0x44cc77)
      .setOrigin(0, 0.5).setDepth(5)
    this.barLabel = this.scene.add.text(px + PW / 2 - 8, barY + 12, '目標 0%', {
      fontSize: '11px', color: '#556677',
    }).setOrigin(1, 0.5).setDepth(5)
  }

  updateMoney(money: number): void {
    this.moneyText.setText(`¥${money.toLocaleString()}`)
  }

  updateRevenue(totalRevenue: number, isEndless: boolean): void {
    if (isEndless) {
      this.barFill.setFillStyle(0xffaa44)
      this.barFill.width = (this.barBg.width)
      this.barLabel.setText('∞ endless').setStyle({ color: '#ffaa44' })
      return
    }
    const pct = Math.min(1, totalRevenue / GOAL_AMOUNT)
    const barW = this.barBg.width
    this.barFill.width = Math.round(barW * pct)
    const color = pct > 0.8 ? 0x44ff88 : pct > 0.5 ? 0xffaa44 : 0x44cc77
    this.barFill.setFillStyle(color)
    const labelColor = pct > 0.8 ? '#44ff88' : pct > 0.5 ? '#ffaa44' : '#556677'
    this.barLabel.setText(`目標 ${Math.floor(pct * 100)}%`).setStyle({ color: labelColor })
  }

  updateTime(day: number, hour: number, minute: number): void {
    const h = String(hour).padStart(2, '0')
    const m = String(minute).padStart(2, '0')
    this.timeText.setText(`${h}:${m}`)
    this.dayText.setText(`Day ${day}`)
  }
}
