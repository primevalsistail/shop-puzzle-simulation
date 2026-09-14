import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameService, GOAL_AMOUNT } from './GameService.js'
import { FloorGrid } from '../components/floor/FloorGrid.js'
import { PlacementManager } from '../components/floor/PlacementManager.js'
import { CustomerSimulator } from '../components/simulation/CustomerSimulator.js'
import { EconomyManager } from '../components/economy/EconomyManager.js'
import { Inventory } from '../components/economy/Inventory.js'
import { ItemRegistry } from '../components/items/ItemRegistry.js'
import { EventBus } from './EventBus.js'
import { GameEvents } from '../types/index.js'
import { WorldState } from '../components/progress/WorldState.js'
import { Upgrades } from '../components/progress/Upgrades.js'
import { ALL_ITEMS } from '../taxonomy/items.js'
import { ALL_RECIPES } from '../taxonomy/recipes.js'

function setup() {
  const reg = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)
  const grid = new FloorGrid({ width: 6, height: 5 }, reg)
  const pm = new PlacementManager(grid, reg)
  const inv = new Inventory()
  const sim = new CustomerSimulator(reg, inv)
  const eco = new EconomyManager(50000)
  const world = new WorldState()
  const upgrades = new Upgrades()
  const gs = new GameService(grid, inv, sim, eco, world, upgrades)
  return { reg, grid, pm, inv, sim, eco, world, upgrades, gs }
}

/**
 * `GameScene.setupEvents()` の `TIME_MINUTE_PASSED` と同じ順序で1分進める（#93）。
 *
 * ⚠ **売買が先、判定が後ろ。**この順序が要点で、**所持金を全部仕入れに突っ込んでも、
 *   その分で売れれば幕は出ない。**
 * ⚠ **判定は `onMinutePassed()` の外。**だから `isOpen` にも棚の空にも遮られない。
 */
function tickMinute(gs: GameService, rng: () => number, isOpen: boolean): void {
  gs.onMinutePassed(rng, isOpen)
  gs.checkGoalAndGameOver()
}

describe('GameService', () => {
  beforeEach(() => {
    EventBus.removeAllListeners()
  })

  it('スロットなしのとき売上ゼロ', () => {
    const { gs, eco } = setup()
    gs.onMinutePassed(() => 0, true) // always trigger customer
    expect(eco.getTotalRevenue()).toBe(0)
  })

  it('顧客が購入するとき売上が計上される', () => {
    const { gs, pm, eco, inv } = setup()
    inv.add('snap_pea', 10); pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01 // arrive + buy
    }
    gs.onMinutePassed(rng, true)
    expect(eco.getTotalRevenue()).toBeGreaterThan(0)
  })

  it('購入でスロット数量が減る', () => {
    const { gs, pm, inv } = setup()
    inv.add('snap_pea', 5); pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng, true)
    expect(inv.getQuantity('snap_pea')).toBe(4)
  })

  it('閉店中（isOpen=false）は客が来ない — 売上も在庫も動かない（#25）', () => {
    const { gs, pm, inv, eco } = setup()
    inv.add('snap_pea', 10); pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
    const sold = vi.fn()
    EventBus.on(GameEvents.FLOOR_SLOT_SOLD, sold)

    // 営業中なら必ず買われる乱数（到着 → 購入）を渡しても、閉店中は何も起きない
    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng, false)

    expect(eco.getTotalRevenue()).toBe(0)
    expect(inv.getQuantity('snap_pea')).toBe(10)
    expect(sold).not.toHaveBeenCalled()
    expect(callCount).toBe(0) // 乱数すら引かれない＝客の判定に入っていない
  })

  it('同じ乱数でも営業中なら売れる（閉店テストの対照）', () => {
    const { gs, pm, eco, inv } = setup()
    inv.add('snap_pea', 10); pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng, true)
    expect(eco.getTotalRevenue()).toBeGreaterThan(0)
  })

  /**
   * **#97 受入条件2 —— 所持金が 1,000万に届いても、幕は出ない。**
   *
   * ⚠ **エンディングの入口は「商船を買う」に移った**（決定 2026-09-15）。
   *   届いた瞬間に幕を出していたのをやめたので、**ここで何も起きないのが正しい。**
   * ⚠ **`PROGRESS_GOAL_COMPLETE` は名前だけ残してある。**
   *   **また出すようになったら、このテストが落ちる。**
   */
  it('所持金が目標額に届いても、目標の幕は出ない（#97 受入条件2）', () => {
    const { gs, eco, pm, inv } = setup()
    const listener = vi.fn()
    EventBus.on(GameEvents.PROGRESS_GOAL_COMPLETE, listener)

    // ⚠ 判定は**所持金**（#26）。**あと1レンで届く**ところまで積み、1品売れて越える形にする
    eco.restore(gs.getGoalAmount() - 1, 0)
    inv.add('snap_pea', 10); pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    tickMinute(gs, rng, true)
    expect(eco.getMoney()).toBeGreaterThanOrEqual(gs.getGoalAmount())
    expect(listener).not.toHaveBeenCalled()
  })

  /** ⚠ **何分刻んでも出ない。**「1回だけ出る」に退行していないことも見る（#97 受入条件2） */
  it('目標額を越えたまま何分刻んでも、幕は1回も出ない（#97 受入条件2）', () => {
    const { gs, eco } = setup()
    const listener = vi.fn()
    EventBus.on(GameEvents.PROGRESS_GOAL_COMPLETE, listener)

    eco.addIncome(gs.getGoalAmount())
    for (let i = 0; i < 10; i++) tickMinute(gs, () => 0.99, true)
    expect(listener).not.toHaveBeenCalled()
  })

  /**
   * #93 —— **詰んだのに画面が何も言わない。**
   *
   * 判定は `onMinutePassed()` の `if (!isOpen) return` と `if (slots.length === 0) return` の
   * **後ろ**にあった。**棚を空にして破産すると、GAME OVER が出ないまま止まる。**
   */
  describe('目標と GAME OVER の判定は、売買の外（#93）', () => {
    it('棚に品が1つも無く、閉店中でも、分が刻まれれば GAME OVER が出る（受入条件1）', () => {
      const { gs, eco, grid } = setup()
      const over = vi.fn()
      EventBus.on(GameEvents.PROGRESS_GAME_OVER, over)

      expect(grid.getAllSlots()).toHaveLength(0)
      expect(eco.spend(50000)).toBe(true)
      expect(eco.getMoney()).toBe(0)
      // ⚠ **払った瞬間には出ない**（下の「残金ちょうど」のテストがその理由を持つ）
      expect(over).not.toHaveBeenCalled()

      // 棚は空・店は閉まっている＝売買は1分も回らない。**それでも判定は走る**
      tickMinute(gs, () => 0, false)
      expect(over).toHaveBeenCalledOnce()
    })

    /**
     * ⚠ **退行よけ**（2026-09-14 に一度入れて戻した）。
     *
     * `EconomyManager.canAfford()` は `this.money >= amount` なので、**残金ちょうどの仕入れが通る。**
     * 判定を `ECONOMY_MONEY_CHANGED` で呼ぶと、**その `spend()` がそのまま GAME OVER になる。**
     * **所持金を全部仕入れに突っ込むのは正当な戦略**で、即死にしてはいけない。
     */
    it('⚠ 棚に品があるとき、残金ちょうどの仕入れをしても、その場では GAME OVER にならない', () => {
      const { gs, eco, pm, inv } = setup()
      const over = vi.fn()
      EventBus.on(GameEvents.PROGRESS_GAME_OVER, over)

      inv.add('snap_pea', 10); pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
      expect(eco.canAfford(50000)).toBe(true)   // ⚠ **ちょうどでも買える**
      expect(eco.spend(50000)).toBe(true)
      expect(eco.getMoney()).toBe(0)
      expect(over).not.toHaveBeenCalled()

      // 次の1分。**売買が先、判定が後ろ**なので、売れて戻れば幕は出ない
      let n = 0
      const rng = () => { n++; return n === 1 ? 0.1 : 0.01 }
      tickMinute(gs, rng, true)
      expect(eco.getMoney()).toBeGreaterThan(0)
      expect(over).not.toHaveBeenCalled()
    })

    /**
     * ⚠ **判定を売買の中（`isOpen` と棚の空判定の後ろ）へ戻さない。**戻すと #93 がそのまま再発する。
     *
     * **棚に品があり・営業中・客が来ない**は、**中にあれば必ず出る条件**である。
     * ここで出ないことが「外に出ている」ことの証拠になる。
     */
    it('`onMinutePassed()` は幕を出さない（判定はその外）', () => {
      const { gs, eco, pm, inv } = setup()
      const over = vi.fn()
      EventBus.on(GameEvents.PROGRESS_GAME_OVER, over)

      inv.add('snap_pea', 10); pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
      eco.spend(50000)
      gs.onMinutePassed(() => 0.99, true)       // 0.99 では客が来ない（到着率 0.15）
      expect(eco.getMoney()).toBe(0)
      expect(over).not.toHaveBeenCalled()

      // **消したのではなく、外へ出しただけ。**呼べば出る
      gs.checkGoalAndGameOver()
      expect(over).toHaveBeenCalledOnce()
    })

    it('GAME OVER の幕も1回だけ（受入条件2）', () => {
      const { gs, eco } = setup()
      const over = vi.fn()
      EventBus.on(GameEvents.PROGRESS_GAME_OVER, over)

      eco.spend(50000)
      for (let i = 0; i < 10; i++) tickMinute(gs, () => 0.99, true)
      expect(over).toHaveBeenCalledOnce()
    })
  })

  /**
   * #94 —— **エンドレスの旗を降ろす口が無かった。**
   *
   * ⚠ **自由航行のほうは前から両方向ある。**`WorldState.restoreVoyage(null)` が
   *   現在地を消して日付からの導出へ戻す（`WorldState.test.ts`
   *   「航路の無いセーブを読むと、自由航行そのものが解ける」）。**足す口は無かった。**
   */
  describe('商船を買った印は両方向（#94 ／ #97）', () => {
    it('クリア済みの印を、クリア前のセーブで降ろせる（#97 受入条件5）', () => {
      const { gs } = setup()
      gs.setEndlessMode(true)                // プレイヤーが商船を買った
      expect(gs.isInEndlessMode()).toBe(true)

      // ロードは `data.isEndlessMode` を**そのまま**渡す
      gs.setEndlessMode(false)
      expect(gs.isInEndlessMode()).toBe(false)
    })

    /**
     * **#97 受入条件5** —— **商船を買ったセーブを読み、そのあとクリア前のセーブを読むと、
     * 状態が戻る。**
     *
     * ⚠ **印が降りることだけでなく、判定が戻ることまで見る。**
     *   印を降ろしても `gameOverShown` が真のままなら、**もう一度詰んでも GAME OVER が出ない。**
     */
    it('印を降ろしたあと、また詰めば GAME OVER が出る（#97 受入条件5）', () => {
      const { gs, eco } = setup()
      const over = vi.fn()
      EventBus.on(GameEvents.PROGRESS_GAME_OVER, over)

      eco.spend(50000)
      tickMinute(gs, () => 0.99, true)
      expect(over).toHaveBeenCalledTimes(1)

      // ── 商船を買ったセーブを読む（印が立ち、所持金も戻る）
      gs.setEndlessMode(true)
      eco.restore(0, 0)
      tickMinute(gs, () => 0.99, true)
      expect(over).toHaveBeenCalledTimes(1)  // ⚠ **買ったあとは出ない**

      // ── クリア前のセーブを読む（印も所持金も戻る）
      gs.setEndlessMode(false)
      eco.restore(5000, 0)
      tickMinute(gs, () => 0.99, true)
      expect(over).toHaveBeenCalledTimes(1)  // 5000 では出ない

      eco.spend(5000)
      tickMinute(gs, () => 0.99, true)
      expect(over).toHaveBeenCalledTimes(2)  // ⚠ **印が降りている証拠**
    })

    /**
     * **#97 受入条件6** —— **GAME OVER は今までどおり出る。**
     *
     * ⚠ **消したのは目標側の半分だけ**（計画「やること 2」）。
     */
    it('商船を買っていなければ、GAME OVER は今までどおり出る（#97 受入条件6）', () => {
      const { gs, eco } = setup()
      const over = vi.fn()
      EventBus.on(GameEvents.PROGRESS_GAME_OVER, over)

      expect(gs.isInEndlessMode()).toBe(false)
      eco.spend(50000)
      expect(eco.getMoney()).toBe(0)
      tickMinute(gs, () => 0.99, true)
      expect(over).toHaveBeenCalledOnce()
    })

    /**
     * ⚠ **商船を買った直後に GAME OVER を出さない**（#97）。
     *   **商船の値段は目標額と同じ**なので、**ぴったりで買うと所持金が 0 になる。**
     *   印を先に立てないと、**エンディングの次の分でそのまま GAME OVER** になる。
     */
    it('⚠ 目標額ぴったりで商船を買っても、GAME OVER にならない（#97）', () => {
      const { gs, eco } = setup()
      const over = vi.fn()
      EventBus.on(GameEvents.PROGRESS_GAME_OVER, over)

      eco.restore(gs.getGoalAmount(), 0)
      expect(eco.spend(gs.getGoalAmount())).toBe(true)   // 商船を買う
      gs.setEndlessMode(true)                            // `GameScene.buyShip()` と同じ順序
      expect(eco.getMoney()).toBe(0)

      for (let i = 0; i < 10; i++) tickMinute(gs, () => 0.99, true)
      expect(over).not.toHaveBeenCalled()
    })
  })

  it('売れた品は累計販売数に積まれる（U2 の解禁条件が読む）', () => {
    const { gs, pm, world, inv } = setup()
    inv.add('snap_pea', 5); pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
    expect(world.getSoldCount('snap_pea')).toBe(0)

    let callCount = 0
    const rng = () => {
      callCount++
      return callCount === 1 ? 0.1 : 0.01
    }
    gs.onMinutePassed(rng, true)
    expect(world.getSoldCount('snap_pea')).toBe(1)
  })

  describe('強化の効き目', () => {
    /** 1日ぶん（営業600分）回して売上を出す。乱数は固定なので毎回同じ結果になる */
    const runDay = (gs: ReturnType<typeof setup>['gs']) => {
      let seed = 1
      const rng = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
      for (let m = 0; m < 600; m++) gs.onMinutePassed(rng, true)
    }

    it('来客の強化を上げると売上が増える', () => {
      const a = setup(); a.inv.add('snap_pea', 999); a.pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0); runDay(a.gs)
      const b = setup(); b.inv.add('snap_pea', 999); b.pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
      for (let i = 0; i < 5; i++) b.upgrades.advance('来客')
      runDay(b.gs)
      expect(b.eco.getTotalRevenue()).toBeGreaterThan(a.eco.getTotalRevenue())
    })

    it('利益率の強化を上げると、1個あたりの売値が上がる', () => {
      const a = setup(); a.inv.add('snap_pea', 999); a.pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0); runDay(a.gs)
      const soldA = 999 - a.inv.getQuantity('snap_pea')

      const b = setup(); b.inv.add('snap_pea', 999); b.pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
      for (let i = 0; i < 5; i++) b.upgrades.advance('利益率')
      runDay(b.gs)
      const soldB = 999 - b.inv.getQuantity('snap_pea')

      // 売れた個数は同じ（利益率は売れやすさに効かない）が、単価が上がる
      expect(soldB).toBe(soldA)
      expect(b.eco.getTotalRevenue()).toBeGreaterThan(a.eco.getTotalRevenue())
    })

    it('⚠ 強化は配置の効き目と別の掛け算になっている（加算の輪に入れない）', () => {
      // 加算に混ぜると、取り合わせ（1.2倍）が強化（3.0倍）に飲まれて誤差になる
      const plain = setup()
      const boosted = setup()
      for (let i = 0; i < 5; i++) boosted.upgrades.advance('利益率')
      plain.inv.add('snap_pea', 999); plain.pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
      boosted.inv.add('snap_pea', 999); boosted.pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
      runDay(plain.gs); runDay(boosted.gs)
      const ratio = boosted.eco.getTotalRevenue() / plain.eco.getTotalRevenue()
      // tier1 は粗利にだけ倍率が乗るので、売値そのものは3倍にはならない
      expect(ratio).toBeGreaterThan(1.5)
      expect(ratio).toBeLessThan(3.0)
    })
  })

  describe('在庫は1つ（店＝船倉）', () => {
    it('売れると持ち物が減る。棚は「どこに出しているか」だけを持つ', () => {
      const { gs, pm, inv, grid } = setup()
      inv.add('snap_pea', 5)
      pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)

      let n = 0
      const rng = () => { n++; return n === 1 ? 0.1 : 0.01 }
      gs.onMinutePassed(rng, true)

      expect(inv.getQuantity('snap_pea')).toBe(4)
      // 区画は残る。数量という概念を持たないので「売り切れ」でも場所は保たれる
      expect(grid.getAllSlots()).toHaveLength(1)
    })

    it('持ち物が0なら、棚に出していても売れない', () => {
      const { gs, pm, inv, eco } = setup()
      pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)   // 持っていないまま場所だけ取る
      expect(inv.getQuantity('snap_pea')).toBe(0)

      let n = 0
      const rng = () => { n++; return n === 1 ? 0.1 : 0.01 }
      gs.onMinutePassed(rng, true)
      expect(eco.getTotalRevenue()).toBe(0)
    })

    it('⚠ 加工で材料を使うと、棚に出している分も減る（同じ持ち物だから）', () => {
      const { pm, inv } = setup()
      inv.add('snap_pea', 10)
      pm.tryPlace('snap_pea', { x: 0, y: 0 }, 0)
      // 加工が材料を引くのと同じこと
      inv.remove('snap_pea', 6)
      expect(inv.getQuantity('snap_pea')).toBe(4)
    })
  })

  /**
   * ⚠ **目標額の出どころは1つ**（#73）。`getGoalAmount()` は `GOAL_AMOUNT` を返すだけで、
   *   自分の数を持たない。**画面側に別書きが増えていないか**は `src/ui/goal.test.ts` が見ている。
   */
  it('getGoalAmountは1000万（GOAL_AMOUNT）を返す', () => {
    const { gs } = setup()
    expect(gs.getGoalAmount()).toBe(GOAL_AMOUNT)
    expect(GOAL_AMOUNT).toBe(2_000_000)
  })
})
