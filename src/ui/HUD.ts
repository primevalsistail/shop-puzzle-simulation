import Phaser from 'phaser'
import { phaseOf } from '../components/core/TimeManager.js'
import type { Location } from '../components/progress/WorldState.js'

const GOAL_AMOUNT = 1_000_000
const PW = 174  // panel width (右パネル 190px - 余白 16px)
const PH = 126  // panel height（#44 の場所表示ぶん 108 から広げた）

export class HUD {
  private timeText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private placeText!: Phaser.GameObjects.Text
  private moneyText!: Phaser.GameObjects.Text
  private barBg!: Phaser.GameObjects.Rectangle
  private barFill!: Phaser.GameObjects.Rectangle
  private barLabel!: Phaser.GameObjects.Text
  private panelX!: number
  private panelY!: number

  constructor(private scene: Phaser.Scene) {}

  /**
   * ⚠ **作ったあとに `updateMoney` / `updateTime` / `updateLocation` を必ず呼ぶこと。**
   *   ここは器を置くだけで、値は持っていない。呼ばないと所持金が ¥0 のまま出る。
   */
  create(): void {
    const { width } = this.scene.scale
    this.panelX = width - PW / 2 - 8
    this.panelY = PH / 2 + 8

    const px = this.panelX
    const py = this.panelY

    // Background panel
    this.scene.add.rectangle(px, py, PW, PH, 0x0a0a22, 0.85)
      .setStrokeStyle(1, 0x334477).setDepth(5)

    // Row 1 — 区分（左・小）＋ 時刻（右・大）
    // ⚠ **この行に長い文字を足さないこと。**時刻が 26px で右寄せなので、
    //   左の文字と重なる（幅は 174px しかない）
    this.phaseText = this.scene.add.text(px - PW / 2 + 10, py - 47, 'D1 作業', {
      fontSize: '12px', color: '#7788aa',
    }).setOrigin(0, 0.5).setDepth(5)

    this.timeText = this.scene.add.text(px + PW / 2 - 12, py - 47, '06:00', {
      fontSize: '26px', color: '#55ddff', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(5)

    // Row 2 — 現在地（#44）。島名は正式名のみ。**季節名は出さない**（#2 の確定事項）
    this.placeText = this.scene.add.text(px - PW / 2 + 12, py - 25, '', {
      fontSize: '13px', color: '#88bbdd',
    }).setOrigin(0, 0.5).setDepth(5)

    // Divider line
    const lineGfx = this.scene.add.graphics().setDepth(5)
    lineGfx.lineStyle(1, 0x334477, 0.7)
    lineGfx.lineBetween(px - PW / 2 + 8, py - 12, px + PW / 2 - 8, py - 12)

    // Row 3 — Money (center, big)
    this.moneyText = this.scene.add.text(px, py + 10, '¥0', {
      fontSize: '22px', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(5)

    // Row 4 — Goal progress bar
    const barW = PW - 24
    const barH = 8
    const barY = py + 40
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

  /**
   * 現在地の表示（#44）。
   *
   * ⚠ **季節名を出さない。**この世界に四季という観念はなく「春島」のような呼び名も無い（#2 の確定事項）。
   *   出すのは正式名（ハルヴェラ島…）と、次の寄港までの残り日数だけ。
   */
  updateLocation(location: Location): void {
    this.placeText.setText(location.atSea
      ? `航海中 → ${location.next}島`
      : `${location.island}島  あと${location.daysLeftAtPort}日`)
    this.placeText.setStyle({ color: location.atSea ? '#7799cc' : '#88bbdd' })
  }

  updateTime(day: number, hour: number, minute: number): void {
    const h = String(hour).padStart(2, '0')
    const m = String(minute).padStart(2, '0')
    this.timeText.setText(`${h}:${m}`)
    // 客が来るのは 10:00-20:00 の「営業」だけ（#25）
    this.phaseText.setText(`D${day} ${phaseOf(hour)}`)
  }
}
