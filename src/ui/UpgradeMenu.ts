import Phaser from 'phaser'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { Upgrades, UpgradeKind } from '../components/progress/Upgrades.js'
import { UPGRADE_KINDS, MAX_STAGE } from '../components/progress/Upgrades.js'
import { CONTENT_DEPTH } from './PlaceFrame.js'
import { PLACE_CX, CONTENT_L, CONTENT_R, SUBTITLE_Y, ROWS_TOP } from './layout.js'
import { money } from './money.js'

const ROW_H = 100
const ROW_W = CONTENT_R - CONTENT_L

/** その系統が何を良くするか。買う前に分かるようにする */
const WHAT_IT_DOES: Record<UpgradeKind, string> = {
  棚:     '売り場が広がる',
  来客:   '客が来やすくなる',
  利益率: '1個あたりの取り分が増える',
  手際:   '加工が速くなる',
}

/**
 * 改装。**「取引」の `改装` タブ**（#96。それまでは独立した「行く場所」だった。#58）。
 *
 * ⚠ **所持金は目標と同じ通貨。**払えば目標が遠のくので、
 *   「いま買うか、目標まで我慢するか」がここでの判断になる。
 *   だから**いまの所持金と費用を並べて見せる。**
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

    objs.push(
      this.scene.add.text(CONTENT_L, SUBTITLE_Y,
        `所持金 ${money(this.economy.getMoney())}`, {
        fontSize: '15px', color: '#ffdd44',
      }).setOrigin(0, 0.5),
    )

    // ⚠ **消してはいけない。**この画面で下す判断は「いま買うか、目標まで我慢するか」で、
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
          fontSize: '12px', color: '#778899',
        }).setOrigin(1, 0.5),
      )
    }

    UPGRADE_KINDS.forEach((kind, i) => {
      this.buildRow(kind, ROWS_TOP + ROW_H / 2 + i * ROW_H, objs)
    })

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(CONTENT_DEPTH)
  }

  private buildRow(kind: UpgradeKind, y: number, objs: Phaser.GameObjects.GameObject[]): void {
    const stage = this.upgrades.getStage(kind)
    const cost = this.upgrades.nextCost(kind)
    const maxed = cost === null
    const afford = !maxed && this.economy.canAfford(cost)

    objs.push(
      this.scene.add.rectangle(PLACE_CX, y, ROW_W, ROW_H - 12, maxed ? 0x2a2a3a : 0x232344)
        .setStrokeStyle(1, 0x445577),
      this.scene.add.text(CONTENT_L + 28, y - 20, kind, {
        fontSize: '19px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0, 0.5),
      this.scene.add.text(CONTENT_L + 28, y + 10, WHAT_IT_DOES[kind], {
        fontSize: '13px', color: '#8899aa',
      }).setOrigin(0, 0.5),
      // 段の表示。●が買った段、○がまだの段
      this.scene.add.text(PLACE_CX + 40, y, '●'.repeat(stage) + '○'.repeat(MAX_STAGE - stage), {
        fontSize: '20px', color: '#77bbee',
      }).setOrigin(0.5),
    )

    if (maxed) {
      objs.push(this.scene.add.text(CONTENT_R - 28, y, '最大', {
        fontSize: '14px', color: '#667788',
      }).setOrigin(1, 0.5))
      return
    }

    const label = money(cost)
    if (afford) {
      const btn = this.scene.add.text(CONTENT_R - 28, y, label, {
        fontSize: '15px', color: '#ffffff',
        backgroundColor: '#3a5a8a', padding: { x: 14, y: 8 },
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
      btn.on('pointerdown', () => this.buy(kind, cost))
      objs.push(btn)
    } else {
      objs.push(this.scene.add.text(CONTENT_R - 28, y, `${label} 不足`, {
        fontSize: '13px', color: '#886666',
      }).setOrigin(1, 0.5))
    }
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
