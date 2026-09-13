/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import upgradeSource from './UpgradeMenu.ts?raw'
import sceneSource from '../scenes/GameScene.ts?raw'
import gameServiceSource from '../services/GameService.ts?raw'
import { UPGRADE_KINDS } from '../components/progress/Upgrades.js'
import { UPGRADE_SHIP_NAME, UPGRADE_SHIP_BOUGHT, UPGRADE_SHIP_LABEL } from './layout.js'

/**
 * **#97 —— 商船の購入がエンディングの入口になった。**
 *
 * | | いままで | これから |
 * |---|---|---|
 * | 幕が出る条件 | **所持金が目標額に届く**（自動） | **商船を買う**（改装タブの5行目） |
 * | 幕の上の選択 | `エンドレスモードへ` | **無い。閉じてそのまま遊ぶ** |
 * | `isEndlessMode` | 目標の幕を出さない旗 | **商船を買った＝エンディングを見た** |
 *
 * ⚠ **`UpgradeMenu` も `GameScene` も Phaser を読む**ので、ここから import できない。
 *   `domInput.test.ts` と同じく**ソースとして縛る。**
 */
const strip = (src: string) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')

const menu = strip(upgradeSource)
const scene = strip(sceneSource)
const service = strip(gameServiceSource)

function methodBody(src: string, name: string): string {
  const at = src.indexOf(name)
  expect(at, `${name} が無い`).toBeGreaterThanOrEqual(0)
  const rest = src.slice(at)
  const end = rest.indexOf('\n  }')
  expect(end, `${name} の終わりが見つからない`).toBeGreaterThan(0)
  return rest.slice(0, end)
}

describe('商船は一覧の5行目（#97 受入条件1・3）', () => {
  /**
   * ⚠ **これが要。**商船を `UpgradeKind` に足すと、`Upgrades` の**段・費用の表・
   *   効果の掛け算**が全部「商船の段」を持つことになる —— **どれも意味を持たない。**
   *   `nextCost('商船')` も `effectValue('商船', 1)` も嘘の値を返す。
   */
  it('⚠ 商船は `UpgradeKind` ではない（`Upgrades` に乗せない）', () => {
    expect(UPGRADE_KINDS as readonly string[]).not.toContain(UPGRADE_SHIP_NAME)
    // 段を進める口も呼ばない
    expect(methodBody(menu, 'private buyShip()')).not.toContain('upgrades.advance')
  })

  /** ⚠ **4系統のうしろに、自分で行の番号を足して置く**（`UPGRADE_KINDS` には入らないため） */
  it('5行目として、4系統の次の位置に描く', () => {
    const fn = methodBody(menu, 'private build()')
    expect(fn).toContain('this.buildShipRow(rowY(UPGRADE_KINDS.length), objs)')
  })

  /**
   * ⚠ **`現在値` と `強化後` は空**（決定 2026-09-15）。**段が無いので出す値が無い。**
   *   `●○` も矢印も出さない。
   */
  it('`現在値` `強化後` `●○` は出さない', () => {
    const fn = methodBody(menu, 'private buildShipRow(')
    expect(fn).not.toContain('UPGRADE_NOW_CX')
    expect(fn).not.toContain('UPGRADE_NEXT_CX')
    expect(fn).not.toContain('UPGRADE_ARROW')
    expect(fn).not.toContain('UPGRADE_STAGE_CX')
  })

  /** ⚠ **買えないときはほかの4行と同じ作り**（ボタンの字が理由に変わる／費用が暗くなる） */
  it('買えないときは、ボタンの字が `足りない` になり、費用が暗くなる', () => {
    const fn = methodBody(menu, 'private buildShipRow(')
    expect(fn).toContain('this.economy.canAfford(SHIP_COST)')
    expect(fn).toContain(`afford ? UPGRADE_SHIP_LABEL : UPGRADE_REASON_FUNDS`)
    expect(fn).toContain("afford ? '#ffffff' : '#886666'")
    // 買えないときはボタンを押せない
    expect(fn).toContain('if (afford) {')
  })

  /** ⚠ **買ったあとは `UPGRADE_MAXED` と同じ置き方**（費用もボタンも出さない） */
  it('買ったあとは `購入済み` だけを出す', () => {
    const fn = methodBody(menu, 'private buildShipRow(')
    expect(fn).toContain('if (bought) {')
    expect(fn).toContain('UPGRADE_SHIP_BOUGHT')
    expect(UPGRADE_SHIP_BOUGHT).toBe('購入済み')
    expect(UPGRADE_SHIP_LABEL).toBe('買う')
  })

  /**
   * ⚠ **買ったかを `UpgradeMenu` が覚えないこと。**ロードで戻る値なので、
   *   写しを持つと**クリア前のセーブを読んでも `購入済み` が居座る。**
   */
  it('買ったかは持ち主（`GameService`）に聞く（写しを持たない）', () => {
    expect(menu).not.toMatch(/private\s+shipBought\s*=\s*(true|false)/)
    expect(scene).toContain('() => this.gameService.isInEndlessMode()')
  })
})

/**
 * **#97 受入条件3 —— 商船を買うと幕が出て、閉じると遊びが続く。自由航行が解禁されている。**
 *
 * ⚠ **やることは、以前「エンドレスモードへ」のボタンがやっていたことと同じ。**
 *   **違うのは入口だけ。**
 */
describe('商船を買うとエンディング（#97 受入条件3）', () => {
  it('代金を引いてから、`GameScene` へ知らせる', () => {
    const fn = methodBody(menu, 'private buyShip()')
    expect(fn).toContain('this.economy.spend(SHIP_COST)')
    expect(fn).toContain('this.onShipBought()')
    // 買えなかったら何も起きない
    expect(fn).toContain('if (!this.economy.spend(SHIP_COST)) return')
    // 買ったあとは一覧を描き直す（5行目が `購入済み` に変わる）
    expect(fn).toContain('this.rebuild()')
  })

  /** ⚠ **二重に買わせない。**幕が出ている間も一覧は生きている */
  it('もう買っていたら何もしない', () => {
    expect(methodBody(menu, 'private buyShip()')).toContain('if (this.shipBought()) return')
  })

  /**
   * ⚠ **旗・自由航行・次の寄港地・幕の4つがそろっていること。**
   *   どれか1つ抜けると、**エンディングを見たのに自由航行が解禁されない**などになる。
   */
  it('旗を立て、自由航行を解禁し、次の寄港地を出し直し、幕を出す', () => {
    const fn = methodBody(scene, 'private buyShip()')
    for (const m of [
      'this.gameService.setEndlessMode(true)',
      'this.progress.setEndlessMode(true)',
      'this.world.beginFreeSailing()',
      'this.refreshNextPort()',
      'this.showGoalComplete()',
    ]) expect(fn, `${m} が抜けている`).toContain(m)
  })

  /**
   * ⚠ **代金は `UpgradeMenu` が引き終わっている。**ここで引くと二重に取る。
   */
  it('`GameScene` 側では代金を引かない（二重に取らない）', () => {
    const fn = methodBody(scene, 'private buyShip()')
    expect(fn).not.toContain('spend(')
  })

  /**
   * ⚠ **旗を先に立てる**（#97）。**商船の値段は目標額と同じ**なので、
   *   ぴったりで買うと所持金が 0 になる —— 旗が後だと、
   *   **エンディングの次の分でそのまま GAME OVER** になる。
   */
  it('旗を立てるのは、幕を出すより先', () => {
    const fn = methodBody(scene, 'private buyShip()')
    expect(fn.indexOf('this.gameService.setEndlessMode(true)'))
      .toBeLessThan(fn.indexOf('this.showGoalComplete()'))
  })

  /** ⚠ **幕の上に `エンドレスモードへ` は無い**（決定 2026-09-15。買わないことがそのままエンドレス） */
  it('幕に `エンドレスモードへ` のボタンは無い', () => {
    expect(scene).not.toContain('エンドレスモードへ')
  })
})

/**
 * **#97 受入条件2 —— 目標額に届いても幕は出ない。**
 *
 * ⚠ **`GameService` の目標側の半分を消した。**出す側が残っていないことを、
 *   **出す側のソース**で見る（届いても出ないこと自体は `GameService.test.ts`）。
 */
describe('目標額に届いても幕は出ない（#97 受入条件2）', () => {
  it('`GameService` は `PROGRESS_GOAL_COMPLETE` を出さない', () => {
    expect(service).not.toContain('PROGRESS_GOAL_COMPLETE')
    expect(service).not.toContain('goalShown')
  })

  it('`GameScene` は `PROGRESS_GOAL_COMPLETE` を購読しない', () => {
    expect(scene).not.toContain('PROGRESS_GOAL_COMPLETE')
    expect(scene).not.toContain('goalCompleted')
  })

  /** ⚠ **GAME OVER 側は残っている**（消したのは目標側の半分だけ。#97 受入条件6） */
  it('GAME OVER 側は残っている', () => {
    expect(service).toContain('PROGRESS_GAME_OVER')
    expect(service).toContain('gameOverShown')
    expect(methodBody(service, 'checkGoalAndGameOver()')).toContain('current <= 0')
    expect(scene).toContain('EventBus.on(GameEvents.PROGRESS_GAME_OVER')
  })
})
