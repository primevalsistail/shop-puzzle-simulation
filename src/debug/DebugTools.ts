import Phaser from 'phaser'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { Inventory } from '../components/economy/Inventory.js'
import type { TimeManager } from '../components/core/TimeManager.js'
import type { ItemRegistry } from '../components/items/ItemRegistry.js'
import type { WorldState } from '../components/progress/WorldState.js'
import type { Upgrades } from '../components/progress/Upgrades.js'
import { UPGRADE_KINDS } from '../components/progress/Upgrades.js'
import { stockedByIslandMerchant } from '../taxonomy/evaluate.js'

/**
 * 確認用の道具一式。**出荷前に丸ごと外す**（issue #51）。
 *
 * ⚠ **外すときに触るのは2箇所だけ**にしてある:
 *   1. `src/debug/` を消す
 *   2. `GameScene` の `installDebugTools(...)` の呼び出し1箇所を消す
 *
 * ⚠ **ここに遊びの仕様を書かないこと。**ここにあるものは全部消える前提なので、
 *   仕様がここにしか無い状態になると、外した瞬間に遊びが壊れる。
 */
export interface DebugDeps {
  readonly economy: EconomyManager
  readonly inventory: Inventory
  readonly timeManager: TimeManager
  readonly registry: ItemRegistry
  readonly world: WorldState
  readonly upgrades: Upgrades
  /** 画面を作り直す。在庫・HUD・盤面を呼び出し側で更新する */
  readonly refresh: (message: string) => void
  /** 盤面の大きさを反映する */
  readonly applyShelfSize: () => void
  /** メニューが開いている間はキーを効かせない */
  readonly isMenuOpen: () => boolean
  /**
   * できごとを名指しで起こす（#24）。起こせたら `true`。
   *
   * ⚠ **id を渡すだけ。**できごとの中身は `STORY_EVENTS` にあり、ここには持たない
   *   （ここは丸ごと消える場所なので、仕様を置くと外した瞬間に壊れる）。
   */
  readonly raiseStoryEvent: (id: string) => boolean
}

const MONEY_STEP = 1_000_000
const ITEM_STEP = 100

export function installDebugTools(scene: Phaser.Scene, deps: DebugDeps): void {
  const keys: { key: string; label: string; run: () => string }[] = [
    {
      key: 'M', label: '金+100万',
      run: () => {
        deps.economy.addRevenue(MONEY_STEP)
        return `所持金 +¥${MONEY_STEP.toLocaleString()}`
      },
    },
    {
      key: 'N', label: '1日',
      run: () => {
        deps.timeManager.skipMinutes(deps.timeManager.minutesUntilEndOfDay())
        return `Day ${deps.timeManager.getCurrentTime().day} へ`
      },
    },
    {
      key: 'B', label: '10日(島が変わる)',
      run: () => {
        for (let i = 0; i < 10; i++) {
          deps.timeManager.skipMinutes(deps.timeManager.minutesUntilEndOfDay())
        }
        const t = deps.timeManager.getCurrentTime()
        deps.world.setDay(t.day)
        return `Day ${t.day} ／ ${deps.world.getIsland()}島`
      },
    },
    {
      key: 'I', label: 'この島の品を各100',
      run: () => {
        const stocked = stockedByIslandMerchant(deps.registry.getAllItems(), deps.world.getState())
        for (const item of stocked) deps.inventory.add(item.id, ITEM_STEP)
        return `${stocked.length}品を ${ITEM_STEP}個ずつ`
      },
    },
    {
      key: 'O', label: '全品を各100',
      run: () => {
        const all = deps.registry.getAllItems()
        for (const item of all) deps.inventory.add(item.id, ITEM_STEP)
        return `全${all.length}品を ${ITEM_STEP}個ずつ`
      },
    },
    {
      key: 'P', label: '行商人を呼ぶ',
      run: () => deps.raiseStoryEvent('peddler_visit')
        ? '行商人バレンを呼んだ'
        : '行商人は呼べなかった（窓が開いている）',
    },
    {
      key: 'U', label: '強化を全系統1段',
      run: () => {
        const done = UPGRADE_KINDS.filter(k => deps.upgrades.advance(k))
        deps.applyShelfSize()
        return done.length ? `強化: ${done.join('・')} を1段` : '強化はすべて最大'
      },
    },
  ]

  for (const { key, run } of keys) {
    scene.input.keyboard!.addKey(key).on('down', () => {
      if (deps.isMenuOpen()) return
      deps.refresh(`[確認用] ${run()}`)
    })
  }

  // 画面にも出しておく。押せるキーが分からないと使えない。
  // ⚠ メッセージログ（y=610〜）にかからない位置に置くこと
  scene.add.text(228, 598, '確認用 ' + keys.map(k => `${k.key}:${k.label}`).join('  '), {
    fontSize: '10px', color: '#667788',
  }).setOrigin(0, 1).setDepth(50)
}
