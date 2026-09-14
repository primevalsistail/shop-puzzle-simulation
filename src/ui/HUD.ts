import Phaser from 'phaser'
import { phaseOf } from '../components/core/TimeManager.js'
import type { Location } from '../components/progress/WorldState.js'
import type { IslandName } from '../taxonomy/islands.js'
import { money } from './money.js'
import {
  HUD_PANEL_W, HUD_MONEY_FONT_PX, phaseLabel,
  HUD_NEXT_PORT_FONT_PX, HUD_NEXT_PORT_H, nextPortLabel,
  HUD_PANEL_T, HUD_PANEL_H, HUD_ROW_TIME_Y, HUD_ROW_PLACE_Y, HUD_RULE_Y, HUD_ROW_MONEY_Y,
  HUD_PHASE_FONT_PX, HUD_TIME_FONT_PX, HUD_PLACE_FONT_PX,
} from './layout.js'
import {
  BG_WINDOW,
  BTN_BACK,
  BTN_BACK_HOVER,
  BTN_TEXT,
  LINE_STRONG,
  LINE_WEAK,
  TEXT_BODY,
  TEXT_MONEY,
  TEXT_SUB,
  css,
} from './palette.js'

/** panel width（右パネル 285px - 余白 24px）。⚠ **値は `layout.ts` にある**（テストが見ている） */
const PW = HUD_PANEL_W
/** panel height。⚠ **値は `layout.ts` にある**（`layout.test.ts` が行の重なりを見ている） */
const PH = HUD_PANEL_H

export class HUD {
  private timeText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private placeText!: Phaser.GameObjects.Text
  private moneyText!: Phaser.GameObjects.Text
  /** 次の寄港地を選ぶところ（#7）。⚠ **クリア後にだけ出す** */
  private nextPortBg!: Phaser.GameObjects.Rectangle
  private nextPortText!: Phaser.GameObjects.Text
  private onNextPortClick: (() => void) | null = null
  /** ⚠ **次の寄港地が出た／消えたときに、現在地の行を出し直すために覚えておく** */
  private lastLocation: Location | null = null
  private panelX!: number
  private panelY!: number

  constructor(private scene: Phaser.Scene) {}

  /**
   * ⚠ **作ったあとに `updateMoney` / `updateGoal` / `updateTime` / `updateLocation` を必ず呼ぶこと。**
   *   ここは器を置くだけで、値は持っていない。呼ばないと所持金が 0レン のまま出る。
   */
  create(): void {
    const { width } = this.scene.scale
    this.panelX = width - PW / 2 - 12
    this.panelY = HUD_PANEL_T + PH / 2

    const px = this.panelX
    const py = this.panelY

    // Background panel
    this.scene.add.rectangle(px, py, PW, PH, BG_WINDOW, 1)
      .setStrokeStyle(1.5, LINE_STRONG).setDepth(5)

    // Row 1 — 区分（左・小）＋ 時刻（右・大）
    // ⚠ **この行に長い文字を足さないこと。**時刻が 39px で右寄せなので、
    //   左の文字と重なる（幅は 261px しかない）
    this.phaseText = this.scene.add.text(px - PW / 2 + 15, HUD_ROW_TIME_Y, `D1 ${phaseLabel('作業')}`, {
      fontSize: `${HUD_PHASE_FONT_PX}px`, color: css(TEXT_SUB),
    }).setOrigin(0, 0.5).setDepth(5)

    this.timeText = this.scene.add.text(px + PW / 2 - 18, HUD_ROW_TIME_Y, '06:00', {
      fontSize: `${HUD_TIME_FONT_PX}px`, color: css(TEXT_BODY), fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(5)

    // Row 2 — 現在地（#44）。島名は正式名のみ。**季節名は出さない**（#2 の確定事項）
    this.placeText = this.scene.add.text(px - PW / 2 + 18, HUD_ROW_PLACE_Y, '', {
      fontSize: `${HUD_PLACE_FONT_PX}px`, color: css(TEXT_SUB),
    }).setOrigin(0, 0.5).setDepth(5)

    // Divider line
    const lineGfx = this.scene.add.graphics().setDepth(5)
    lineGfx.lineStyle(1.5, LINE_WEAK, 0.7)
    lineGfx.lineBetween(px - PW / 2 + 12, HUD_RULE_Y, px + PW / 2 - 12, HUD_RULE_Y)

    // Row 3 — Money (center, big)
    // ⚠ **大きさは `layout.ts` の `HUD_MONEY_FONT_PX`。**`10,000,000レン`（見込む最大の桁）が
    //   枠 261px に収まるかを `layout.test.ts` が見ている
    this.moneyText = this.scene.add.text(px, HUD_ROW_MONEY_Y, money(0), {
      fontSize: `${HUD_MONEY_FONT_PX}px`, color: css(TEXT_MONEY), fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(5)

    // 次の寄港地（#7）。**クリア後だけ出す。**
    // ⚠ **現在地の行の右に置く**（PO 指示 2026-09-14）。
    //   **クリア後は `あと N日` が消えて島名だけになる**ので、そこが空く。
    // ⚠ **キャラ絵の枠は動かない。**枠の外に行を足すと、絵の置き場所が変わる
    const npW = 108
    const npY = HUD_ROW_PLACE_Y
    this.nextPortBg = this.scene.add.rectangle(px + PW / 2 - 12 - npW / 2, npY, npW, HUD_NEXT_PORT_H, BTN_BACK)
      .setStrokeStyle(1.5, LINE_STRONG).setDepth(5).setVisible(false)
      .setInteractive({ useHandCursor: true })
    this.nextPortBg.on('pointerover', () => this.nextPortBg.setFillStyle(BTN_BACK_HOVER))
    this.nextPortBg.on('pointerout', () => this.nextPortBg.setFillStyle(BTN_BACK))
    this.nextPortBg.on('pointerdown', () => this.onNextPortClick?.())
    this.nextPortText = this.scene.add.text(px + PW / 2 - 12 - npW / 2, npY, '', {
      fontSize: `${HUD_NEXT_PORT_FONT_PX}px`, color: css(BTN_TEXT),
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
    this.nextPortBg.setVisible(on)
    this.nextPortText.setVisible(on)
    if (on) this.nextPortText.setText(nextPortLabel(next))
    // ⚠ **現在地の行も書き換わる**（`あと N日` が消える）ので、出し直す
    if (this.lastLocation) this.updateLocation(this.lastLocation)
  }

  updateMoney(amount: number): void {
    this.moneyText.setText(money(amount))
  }

  /**
   * 現在地の表示（#44）。
   *
   * ⚠ **季節名を出さない。**この世界に四季という観念はなく「春島」のような呼び名も無い（#2 の確定事項）。
   *   出すのは正式名（ハルヴェラ島…）と、次の寄港までの残り日数だけ。
   */
  updateLocation(location: Location): void {
    // ⚠ **クリア後は `あと N日` を出さない**（PO 指示 2026-09-14）。
    //   **空いたところに次の寄港地を置く。**枠もキャラ絵の枠も動かさずに済む
    this.placeText.setText(this.nextPortBg.visible
      ? `${location.island}島`
      : `${location.island}島  あと${location.daysLeftAtPort}日`)
    this.lastLocation = location
    this.placeText.setStyle({ color: css(TEXT_SUB) })
  }

  updateTime(day: number, hour: number, minute: number): void {
    const h = String(hour).padStart(2, '0')
    const m = String(minute).padStart(2, '0')
    this.timeText.setText(`${h}:${m}`)
    // 客が来るのは 10:00-20:00 の「営業」だけ（#25）
    // ⚠ **画面に出すのは 開店 / 閉店 の2つだけ**（`layout.ts` の `phaseLabel`）。
    //   `DayPhase` は時間の仕組みが読む値なので、そのまま
    this.phaseText.setText(`D${day} ${phaseLabel(phaseOf(hour))}`)
  }
}
