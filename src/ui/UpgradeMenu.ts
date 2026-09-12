import Phaser from 'phaser'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { Upgrades, UpgradeKind } from '../components/progress/Upgrades.js'
import { UPGRADE_KINDS, MAX_STAGE } from '../components/progress/Upgrades.js'

const PANEL_W = 460
const PANEL_H = 420
const PANEL_X = 640
const PANEL_Y = 360

const ROW_H = 72
const ROWS_TOP = PANEL_Y - 110

/** その系統が何を良くするか。買う前に分かるようにする */
const WHAT_IT_DOES: Record<UpgradeKind, string> = {
  棚:     '売り場が広がる',
  来客:   '客が来やすくなる',
  利益率: '1個あたりの取り分が増える',
  手際:   '加工が速くなる',
}

/**
 * 強化を買うメニュー。
 *
 * ⚠ **所持金は目標と同じ通貨。**払えば目標が遠のくので、
 *   「いま買うか、目標まで我慢するか」がここでの判断になる。
 *   だから**いまの所持金と費用を並べて見せる。**
 */
export class UpgradeMenu {
  private container: Phaser.GameObjects.Container | null = null
  private isOpen = false

  constructor(
    private scene: Phaser.Scene,
    private economy: EconomyManager,
    private upgrades: Upgrades,
    private onClose: () => void,
    /** 棚を買ったときに盤面を広げる */
    private onShelfExpanded: () => void,
  ) {}

  open(): void {
    if (this.isOpen) return
    this.isOpen = true
    this.build()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.container?.destroy()
    this.container = null
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
      this.scene.add.rectangle(0, 0, 1280, 720, 0x000000, 0.6).setOrigin(0, 0).setInteractive(),
      this.scene.add.rectangle(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 0x1e1e3a).setStrokeStyle(2, 0x5a7ab0),
      this.scene.add.text(PANEL_X, PANEL_Y - PANEL_H / 2 + 26, '強化', {
        fontSize: '20px', color: '#aaccff', fontStyle: 'bold',
      }).setOrigin(0.5),
      this.scene.add.text(PANEL_X, PANEL_Y - PANEL_H / 2 + 52,
        `所持金 ¥${this.economy.getMoney().toLocaleString()}`, {
        fontSize: '14px', color: '#ffdd44',
      }).setOrigin(0.5),
    )

    const closeBtn = this.scene.add.text(PANEL_X + PANEL_W / 2 - 20, PANEL_Y - PANEL_H / 2 + 26, '[×]', {
      fontSize: '18px', color: '#ff6666',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => this.close())
    objs.push(closeBtn)

    UPGRADE_KINDS.forEach((kind, i) => {
      const y = ROWS_TOP + i * ROW_H
      const stage = this.upgrades.getStage(kind)
      const cost = this.upgrades.nextCost(kind)
      const maxed = cost === null
      const afford = !maxed && this.economy.canAfford(cost)

      objs.push(
        this.scene.add.rectangle(PANEL_X, y, PANEL_W - 40, ROW_H - 8, maxed ? 0x2a2a3a : 0x232344)
          .setStrokeStyle(1, 0x445577),
        this.scene.add.text(PANEL_X - PANEL_W / 2 + 32, y - 16, kind, {
          fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0, 0.5),
        this.scene.add.text(PANEL_X - PANEL_W / 2 + 32, y + 8, WHAT_IT_DOES[kind], {
          fontSize: '11px', color: '#8899aa',
        }).setOrigin(0, 0.5),
        // 段の表示。●が買った段、○がまだの段
        this.scene.add.text(PANEL_X - 10, y - 16,
          '●'.repeat(stage) + '○'.repeat(MAX_STAGE - stage), {
          fontSize: '13px', color: '#77bbee',
        }).setOrigin(0, 0.5),
      )

      if (maxed) {
        objs.push(this.scene.add.text(PANEL_X + PANEL_W / 2 - 40, y, '最大', {
          fontSize: '13px', color: '#667788',
        }).setOrigin(1, 0.5))
        return
      }

      const label = `¥${cost.toLocaleString()}`
      if (afford) {
        const btn = this.scene.add.text(PANEL_X + PANEL_W / 2 - 40, y, label, {
          fontSize: '13px', color: '#ffffff',
          backgroundColor: '#3a5a8a', padding: { x: 10, y: 6 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
        btn.on('pointerdown', () => this.buy(kind, cost))
        objs.push(btn)
      } else {
        objs.push(this.scene.add.text(PANEL_X + PANEL_W / 2 - 40, y, `${label} 不足`, {
          fontSize: '12px', color: '#886666',
        }).setOrigin(1, 0.5))
      }
    })

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(100)
  }

  private buy(kind: UpgradeKind, cost: number): void {
    if (!this.economy.spend(cost)) return
    this.upgrades.advance(kind)
    if (kind === '棚') this.onShelfExpanded()
    this.rebuild()
  }
}
