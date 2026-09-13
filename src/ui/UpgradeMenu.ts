import Phaser from 'phaser'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { Upgrades, UpgradeKind } from '../components/progress/Upgrades.js'
import { UPGRADE_KINDS, MAX_STAGE, effectValue } from '../components/progress/Upgrades.js'
import { CONTENT_DEPTH } from './PlaceFrame.js'
import {
  PLACE_CX, CONTENT_R, SUBTITLE_Y,
  TAB_ROW_TITLE_FONT_PX, TAB_ROW_SUB_FONT_PX, TAB_NOTE_FONT_PX,
  BUY_FONT_PX,
  UPGRADE_COLS, UPGRADE_HEAD_Y, UPGRADE_HEAD_FONT_PX, UPGRADE_ROWS_TOP,
  UPGRADE_ROW_H, UPGRADE_ROW_W, UPGRADE_NAME_X, UPGRADE_TITLE_DY, UPGRADE_SUB_DY,
  UPGRADE_NOW_CX, UPGRADE_NEXT_CX, UPGRADE_ARROW_CX, UPGRADE_ARROW, UPGRADE_VALUE_FONT_PX,
  UPGRADE_STAGE_CX, UPGRADE_STAGE_FONT_PX,
  UPGRADE_BTN_W, UPGRADE_BTN_H, UPGRADE_BTN_L, UPGRADE_BTN_R,
  UPGRADE_COST_R, UPGRADE_COST_FONT_PX,
  UPGRADE_LABEL, UPGRADE_REASON_FUNDS, UPGRADE_MAXED, UPGRADE_WHAT_IT_DOES,
} from './layout.js'
import { money } from './money.js'

/**
 * 改装。**「取引」の `改装` タブ**（#96。それまでは独立した「行く場所」だった。#58）。
 *
 * ⚠ **所持金は目標と同じ通貨。**払えば目標が遠のくので、
 *   「いま買うか、目標まで我慢するか」がここでの判断になる。
 *   ⚠ **所持金そのものはここに出さない**（PO 指示 2026-09-13。右パネルの HUD が出している）。
 *   代わりに**見出しの下の1行**が、その判断のほうだけを言う。
 *
 * ⚠ **名前は「改装」**（PO 判断 2026-09-12 ／ `sessions/questions-58-places.md` Q1）。
 *   中身は 棚・来客・利益率・手際 の4系統で、**改装と呼べるのは棚だけ**である点は
 *   質問票に記録してある。⚠ **名前は `layout.ts` の `TRADE_TABS` 1箇所だけが持つ。**
 */
export class UpgradeMenu {
  private container: Phaser.GameObjects.Container | null = null
  private isOpen = false

  constructor(
    private scene: Phaser.Scene,
    private economy: EconomyManager,
    private upgrades: Upgrades,
    /** 棚を買ったときに盤面を広げる */
    private onShelfExpanded: () => void,
    /**
     * **1段買った直後**に呼ぶ。
     *
     * ⚠ **持ち物一覧の売値がここで変わる**（#76）。利益率を上げると一覧に出す額が上がるので、
     *   呼ばないと**買った直後だけ古い値段が左に残る。**
     *   ⚠ 閉じるときではなく**買った時点**で呼ぶこと。左パネルはこの画面を開いている間も見えている
     */
    private onBought: () => void = () => {},
  ) {}

  /**
   * タブに入る。**中身だけ作る。**
   *
   * ⚠ **枠（`PlaceFrame`）には触らない。**枠を出すのも片付けるのも `TradeMenu` の仕事で、
   *   ここで `frame.show()` を呼ぶと**タブを切り替えただけで枠が作り直される。**
   */
  enter(): void {
    if (this.isOpen) return
    this.isOpen = true
    this.build()
  }

  /** タブを出る。**中身だけ捨てる**（枠には触らない） */
  leave(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.container?.destroy()
    this.container = null
  }

  private rebuild(): void {
    this.container?.destroy()
    this.container = null
    this.build()
  }

  private build(): void {
    const objs: Phaser.GameObjects.GameObject[] = []

    // ⚠ **`所持金` はここに出さない**（PO 指示 2026-09-13「不要」）。
    //   **右パネルの HUD が常に出している**ので、ここに出すと同じ額が2つ並ぶ。
    //   ⚠ **一覧の上端（`ROWS_TOP` ＝ 見出しの行の位置）は動かさないこと。**
    //     取引は3タブが同じ枠を使うので、改装だけ上げると**切り替えるたびに一覧が跳ねる。**

    // ⚠ **下の1行は消してはいけない。**この画面で下す判断は「いま買うか、目標まで我慢するか」で、
    //   その「目標まで我慢する」側を担う文字はここにしか無い。
    //   ⚠ **#73 を直してから、右パネルの目標バーは所持金を測っている。**
    //   つまり**ここで払うとバーが実際に縮む。**この文字とバーの動きは、いま初めて一致している
    // ⚠ **1つも買えないときは出さない。**買える段が無いなら「いま買うか」という選択自体が無く、
    //   問いだけが出ることになる（束M・ペルソナ2巡目 ⑮）
    if (UPGRADE_KINDS.some(k => {
      const c = this.upgrades.nextCost(k)
      return c !== null && this.economy.canAfford(c)
    })) {
      objs.push(
        this.scene.add.text(CONTENT_R, SUBTITLE_Y, '払えば目標が遠のく。いま買うか、我慢するか', {
          fontSize: `${TAB_NOTE_FONT_PX}px`, color: '#778899',
        }).setOrigin(1, 0.5),
      )
    }

    this.buildHead(objs)
    UPGRADE_KINDS.forEach((kind, i) => {
      this.buildRow(kind, UPGRADE_ROWS_TOP + UPGRADE_ROW_H / 2 + i * UPGRADE_ROW_H, objs)
    })

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(CONTENT_DEPTH)
  }

  /**
   * 見出しの行。⚠ **一覧の上に1回だけ**（PO 回答 2026-09-14 Q8 = A）。
   *   **行の中に入れると同じ3語が4回出る。**列の名も位置も `layout.ts` から来る。
   */
  private buildHead(objs: Phaser.GameObjects.GameObject[]): void {
    const [now, next, cost] = UPGRADE_COLS
    const head = (x: number, text: string, originX: number) =>
      objs.push(this.scene.add.text(x, UPGRADE_HEAD_Y, text, {
        fontSize: `${UPGRADE_HEAD_FONT_PX}px`, color: '#8899aa',
      }).setOrigin(originX, 0.5))

    head(UPGRADE_NOW_CX, now, 0.5)
    head(UPGRADE_NEXT_CX, next, 0.5)
    head(UPGRADE_COST_R, cost, 1)
  }

  private buildRow(kind: UpgradeKind, y: number, objs: Phaser.GameObjects.GameObject[]): void {
    const stage = this.upgrades.getStage(kind)
    const cost = this.upgrades.nextCost(kind)
    const maxed = cost === null
    const afford = !maxed && this.economy.canAfford(cost)

    objs.push(
      this.scene.add.rectangle(PLACE_CX, y, UPGRADE_ROW_W, UPGRADE_ROW_H - 12,
        maxed ? 0x2a2a3a : 0x232344).setStrokeStyle(1, 0x445577),
      this.scene.add.text(UPGRADE_NAME_X, y + UPGRADE_TITLE_DY, kind, {
        fontSize: `${TAB_ROW_TITLE_FONT_PX}px`, color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0, 0.5),
      // 何が良くなるかの一言。⚠ **数はここに混ぜない**（列で揃えるため。`layout.ts`）
      this.scene.add.text(UPGRADE_NAME_X, y + UPGRADE_SUB_DY, UPGRADE_WHAT_IT_DOES[kind], {
        fontSize: `${TAB_ROW_SUB_FONT_PX}px`, color: '#8899aa',
      }).setOrigin(0, 0.5),
      // 段の表示。●が買った段、○がまだの段
      this.scene.add.text(UPGRADE_STAGE_CX, y, '●'.repeat(stage) + '○'.repeat(MAX_STAGE - stage), {
        fontSize: `${UPGRADE_STAGE_FONT_PX}px`, color: '#77bbee',
      }).setOrigin(0.5),
    )

    // ⚠ **`現在値` と `強化後` は列で揃える**（PO 赤入れ 2026-09-13「表にする」）。
    //   **数は `Upgrades.effectValue` が持つ。**ここは置くだけ。
    const value = (x: number, text: string, color: string) =>
      objs.push(this.scene.add.text(x, y, text, {
        fontSize: `${UPGRADE_VALUE_FONT_PX}px`, color,
      }).setOrigin(0.5))

    value(UPGRADE_NOW_CX, effectValue(kind, stage) ?? '', '#ffffff')
    // 最大まで買った行には `強化後` が無いので、矢印もろとも出さない
    const nextValue = maxed ? null : effectValue(kind, stage + 1)
    if (nextValue !== null) {
      value(UPGRADE_ARROW_CX, UPGRADE_ARROW, '#667788')
      value(UPGRADE_NEXT_CX, nextValue, '#aaddff')
    }

    if (maxed) {
      objs.push(this.scene.add.text(UPGRADE_BTN_R, y, UPGRADE_MAXED, {
        fontSize: `${TAB_ROW_SUB_FONT_PX}px`, color: '#667788',
      }).setOrigin(1, 0.5))
      return
    }

    // ⚠ **費用はボタンの外**（PO 指示 2026-09-13）。右そろえで、ボタンとのあいだを空ける。
    //   ⚠ **`不足` を付けないこと。**付けると費用が「あと足りない額」と読まれる
    //     （`layout.ts` の `UPGRADE_LABEL` に経緯）。**買えるかどうかは色とボタンの字で出す。**
    objs.push(this.scene.add.text(UPGRADE_COST_R, y, money(cost), {
      fontSize: `${UPGRADE_COST_FONT_PX}px`, color: afford ? '#ffffff' : '#886666',
    }).setOrigin(1, 0.5))

    // ⚠ **ボタンは `改装` とだけ書く。**買えないときだけ理由に差し替わる（商人タブと同じ作り）
    const bg = this.scene.add.rectangle(UPGRADE_BTN_L + UPGRADE_BTN_W / 2, y,
      UPGRADE_BTN_W, UPGRADE_BTN_H, afford ? 0x3a5a8a : 0x3a3a3a)
      .setStrokeStyle(1, afford ? 0x5a7aaa : 0x4a4a4a)
    const label = this.scene.add.text(UPGRADE_BTN_L + UPGRADE_BTN_W / 2, y,
      afford ? UPGRADE_LABEL : UPGRADE_REASON_FUNDS, {
      fontSize: `${BUY_FONT_PX}px`, color: afford ? '#ffffff' : '#998877',
    }).setOrigin(0.5)
    if (afford) {
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => this.buy(kind, cost))
    }
    objs.push(bg, label)
  }

  private buy(kind: UpgradeKind, cost: number): void {
    if (!this.economy.spend(cost)) return
    this.upgrades.advance(kind)
    // ⚠ **ここで盤面が描き直される。**いま店を離れているので、
    //   `FloorRenderer` が「隠れている」状態を覚えていないと棚がこの画面の上に出る
    if (kind === '棚') this.onShelfExpanded()
    this.onBought()
    this.rebuild()
  }
}
