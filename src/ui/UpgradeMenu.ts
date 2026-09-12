import Phaser from 'phaser'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { Upgrades, UpgradeKind } from '../components/progress/Upgrades.js'
import { UPGRADE_KINDS, MAX_STAGE } from '../components/progress/Upgrades.js'
import type { PlaceFrame } from './PlaceFrame.js'
import { CONTENT_DEPTH } from './PlaceFrame.js'
import { PLACE_CX, CONTENT_L, CONTENT_R, SUBTITLE_Y, ROWS_TOP } from './layout.js'

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
 * 改装。**ダイアログではなく「行く場所」**（#58）。
 *
 * ⚠ **所持金は目標と同じ通貨。**払えば目標が遠のくので、
 *   「いま買うか、目標まで我慢するか」がここでの判断になる。
 *   だから**いまの所持金と費用を並べて見せる。**
 *
 * ⚠ **場所の名前は「改装」**（PO 判断 2026-09-12 ／ `sessions/questions-58-places.md` Q1）。
 *   中身は 棚・来客・利益率・手際 の4系統で、**改装と呼べるのは棚だけ**である点は
 *   質問票に記録してある。名前を変えるならここと `GameScene` のボタン1つ。
 */
export class UpgradeMenu {
  private container: Phaser.GameObjects.Container | null = null
  private isOpen = false

  constructor(
    private scene: Phaser.Scene,
    private economy: EconomyManager,
    private upgrades: Upgrades,
    private frame: PlaceFrame,
    private onClose: () => void,
    /** 棚を買ったときに盤面を広げる */
    private onShelfExpanded: () => void,
  ) {}

  open(): void {
    if (this.isOpen) return
    this.isOpen = true
    this.frame.show('改装', () => this.close())
    this.build()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.container?.destroy()
    this.container = null
    this.frame.hide()
    this.onClose()
  }

  isVisible(): boolean {
    return this.isOpen
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
        `所持金 ¥${this.economy.getMoney().toLocaleString()}`, {
        fontSize: '15px', color: '#ffdd44',
      }).setOrigin(0, 0.5),
      this.scene.add.text(CONTENT_R, SUBTITLE_Y, '払えば目標が遠のく。いま買うか、我慢するか', {
        fontSize: '12px', color: '#778899',
      }).setOrigin(1, 0.5),
    )

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

    const label = `¥${cost.toLocaleString()}`
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
    this.rebuild()
  }
}
