import Phaser from 'phaser'
import { phaseOf } from '../components/core/TimeManager.js'
import type { Location } from '../components/progress/WorldState.js'
import type { IslandName } from '../taxonomy/islands.js'
import { money } from './money.js'
import { goalRatio, goalBarLabel } from './goal.js'
import {
  HUD_PANEL_W, HUD_MONEY_FONT_PX, HUD_BAR_W,
  HUD_NEXT_PORT_FONT_PX, HUD_NEXT_PORT_H, nextPortLabel,
} from './layout.js'

/** panel width（右パネル 190px - 余白 16px）。⚠ **値は `layout.ts` にある**（テストが見ている） */
const PW = HUD_PANEL_W
const PH = 126  // panel height（#44 の場所表示ぶん 108 から広げた）

export class HUD {
  private timeText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private placeText!: Phaser.GameObjects.Text
  private moneyText!: Phaser.GameObjects.Text
  private barBg!: Phaser.GameObjects.Rectangle
  private barFill!: Phaser.GameObjects.Rectangle
  private barLabel!: Phaser.GameObjects.Text
  /** 次の寄港地を選ぶところ（#7）。⚠ **クリア後にだけ出す** */
  private nextPortBg!: Phaser.GameObjects.Rectangle
  private nextPortText!: Phaser.GameObjects.Text
  private onNextPortClick: (() => void) | null = null
  private panelX!: number
  private panelY!: number

  constructor(private scene: Phaser.Scene) {}

  /**
   * ⚠ **作ったあとに `updateMoney` / `updateGoal` / `updateTime` / `updateLocation` を必ず呼ぶこと。**
   *   ここは器を置くだけで、値は持っていない。呼ばないと所持金が 0レン のまま出る。
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
    // ⚠ **大きさは `layout.ts` の `HUD_MONEY_FONT_PX`。**`10,000,000レン`（クリア条件の額）が
    //   枠 174px に収まるかを `layout.test.ts` が見ている
    this.moneyText = this.scene.add.text(px, py + 10, money(0), {
      fontSize: `${HUD_MONEY_FONT_PX}px`, color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(5)

    // Row 4 — 目標までの進み（#73。**所持金 ÷ 目標額**。累計売上ではない）
    const barW = HUD_BAR_W
    const barH = 8
    const barY = py + 40
    this.barBg = this.scene.add.rectangle(px, barY, barW, barH, 0x223344)
      .setDepth(5)
    this.barFill = this.scene.add.rectangle(px - barW / 2, barY, 0, barH, 0x44cc77)
      .setOrigin(0, 0.5).setDepth(5)
    this.barLabel = this.scene.add.text(px + PW / 2 - 8, barY + 12, goalBarLabel(0), {
      fontSize: '11px', color: '#556677',
    }).setOrigin(1, 0.5).setDepth(5)

    // Row 4'（#7）— 次の寄港地。**目標が無くなったら、この場所がここに変わる**
    // ⚠ **バーと入れ替える。**行を増やすと枠が下へ伸び、キャラ絵の枠（`CHAR_ART_T`）が縮む
    const npY = barY + 6
    this.nextPortBg = this.scene.add.rectangle(px, npY, barW, HUD_NEXT_PORT_H, 0x2a2a4a)
      .setStrokeStyle(1, 0x5566aa).setDepth(5).setVisible(false)
      .setInteractive({ useHandCursor: true })
    this.nextPortBg.on('pointerover', () => this.nextPortBg.setFillStyle(0x3a3a6a))
    this.nextPortBg.on('pointerout', () => this.nextPortBg.setFillStyle(0x2a2a4a))
    this.nextPortBg.on('pointerdown', () => this.onNextPortClick?.())
    this.nextPortText = this.scene.add.text(px, npY, '', {
      fontSize: `${HUD_NEXT_PORT_FONT_PX}px`, color: '#ffdd88',
    }).setOrigin(0.5, 0.5).setDepth(6).setVisible(false)
  }

  /** 次の寄港地のところを押したとき。**押すたびに次の候補へ回す**（`GameScene`） */
  onNextPort(cb: () => void): void {
    this.onNextPortClick = cb
  }

  /**
   * 次の寄港地の表示（#7・自由航行）。
   *
   * ⚠ **`null` のあいだ（クリア前）は何も出さない。**出すと、選べないものが選べるように見える。
   * ⚠ **出すときは目標のバーを消す。**目標に届いたあとのバーは満杯で止まったままで、
   *   読む意味が無い（`∞ endless` も同じ）。**同じ場所を使うので、枠は広がらない。**
   */
  updateNextPort(next: IslandName | null): void {
    const on = next !== null
    this.barBg.setVisible(!on)
    this.barFill.setVisible(!on)
    this.barLabel.setVisible(!on)
    this.nextPortBg.setVisible(on)
    this.nextPortText.setVisible(on)
    if (on) this.nextPortText.setText(nextPortLabel(next))
  }

  updateMoney(amount: number): void {
    this.moneyText.setText(money(amount))
  }

  /**
   * 目標までの進み（#73）。**測るのは所持金で、累計売上ではない。**
   *
   * ⚠ **バーは縮む。**所持金は改装や仕入れで減るので、進みも戻る。
   *   幅は毎回 `0〜barW` で置き直すので、縮んだぶんが残ることはない
   *   （`goalRatio` が 0 で下げ止めるので、負の幅にもならない）。
   * ⚠ **割合も文字もここで計算しない。**`goal.ts` が出したものを置くだけ。
   *   ここに数字を書くと、また画面ごとに別の目標額を持つことになる（それが #73）。
   */
  updateGoal(currentMoney: number, isEndless: boolean): void {
    if (isEndless) {
      this.barFill.setFillStyle(0xffaa44)
      this.barFill.width = (this.barBg.width)
      this.barLabel.setText('∞ endless').setStyle({ color: '#ffaa44' })
      return
    }
    const pct = goalRatio(currentMoney)
    const barW = this.barBg.width
    this.barFill.width = Math.round(barW * pct)
    const color = pct > 0.8 ? 0x44ff88 : pct > 0.5 ? 0xffaa44 : 0x44cc77
    this.barFill.setFillStyle(color)
    const labelColor = pct > 0.8 ? '#44ff88' : pct > 0.5 ? '#ffaa44' : '#556677'
    this.barLabel.setText(goalBarLabel(currentMoney)).setStyle({ color: labelColor })
  }

  /**
   * 現在地の表示（#44）。
   *
   * ⚠ **季節名を出さない。**この世界に四季という観念はなく「春島」のような呼び名も無い（#2 の確定事項）。
   *   出すのは正式名（ハルヴェラ島…）と、次の寄港までの残り日数だけ。
   */
  updateLocation(location: Location): void {
    this.placeText.setText(`${location.island}島  あと${location.daysLeftAtPort}日`)
    this.placeText.setStyle({ color: '#88bbdd' })
  }

  updateTime(day: number, hour: number, minute: number): void {
    const h = String(hour).padStart(2, '0')
    const m = String(minute).padStart(2, '0')
    this.timeText.setText(`${h}:${m}`)
    // 客が来るのは 10:00-20:00 の「営業」だけ（#25）
    this.phaseText.setText(`D${day} ${phaseOf(hour)}`)
  }
}
