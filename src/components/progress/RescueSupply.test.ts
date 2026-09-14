/// <reference types="vite/client" />
import { describe, it, expect, vi } from 'vitest'
import { RESCUE_DAILY_LIMIT, RescueSupply } from './RescueSupply.js'
import { GameProgress } from './GameProgress.js'
import { DeliveryOrders } from './DeliveryOrders.js'
import { PeddlerStock } from './PeddlerStock.js'
import { WorldState } from './WorldState.js'
import { Upgrades } from './Upgrades.js'
import { ShelfPresets } from '../floor/ShelfPresets.js'
import { EconomyManager } from '../economy/EconomyManager.js'
import { Inventory } from '../economy/Inventory.js'
import { ItemRegistry } from '../items/ItemRegistry.js'
import { FloorGrid } from '../floor/FloorGrid.js'
import type { TimeManager } from '../core/TimeManager.js'
import { ALL_ITEMS, getItem } from '../../taxonomy/items.js'
import { ALL_RECIPES } from '../../taxonomy/recipes.js'
import { RESCUE_ITEM_ID, isRescueItem, purchasePrice, salePrice, tier } from '../../taxonomy/derive.js'
import { stockedByIslandMerchant } from '../../taxonomy/evaluate.js'
import { ROUTE } from '../../taxonomy/islands.js'
/** ⚠ **`PurchaseMenu` は Phaser を読む**ので import できない。**ソースとして縛る**（`domInput.test.ts` と同じ手） */
import purchaseSource from '../../ui/PurchaseMenu.ts?raw'

/**
 * **救済の品**（計画 `construction/plans/rescue-and-no-gameover.md`）。
 *
 * **詰みを無くすために、ただで買える品を1つ置いた。**
 * ここで見るのは**受入条件1〜3** —— **所持金0でも買えること／1日の上限があること／
 * ロードで買い直せないこと。**
 * （受入条件4「GAME OVER が出ない」は `GameService.test.ts`、
 *   受入条件5「加工の稼ぎを超えない」は `src/sim/` の `--policy=rescue`。）
 */
describe('救済の品（買値0・1日に20個）', () => {
  it('品が1つだけあり、tier1・1升・売値5レンである', () => {
    const item = getItem(RESCUE_ITEM_ID)
    expect(ALL_ITEMS.filter(i => isRescueItem(i.id))).toHaveLength(1)
    expect(tier(item.id)).toBe(1)
    expect(item.shape).toEqual([[1]])
    expect(salePrice(item.id)).toBe(5)
    // ⚠ **いちばん安い仕入れ品よりはっきり下**（「店に並べたくない」水準。PO 指示）
    const cheapest = Math.min(
      ...ALL_ITEMS.filter(i => !isRescueItem(i.id)).map(i => salePrice(i.id)),
    )
    expect(salePrice(item.id)).toBeLessThan(cheapest)
  })

  /**
   * **受入条件1 —— 所持金0でも、買って並べて売れる。**
   *
   * ⚠ **規則を1本も足していない。**産地 `なし` ＋ tier1 なので、
   *   **U4（産地を持たない品はどこでも並ぶ）と U1（並ぶのは素材だけ）だけで常に並ぶ。**
   */
  it('4島すべてで、売った実績ゼロでも商人が並べている', () => {
    for (const island of ROUTE) {
      const stocked = stockedByIslandMerchant(
        ALL_ITEMS, { 現在地: island, 累計販売数: new Map() },
      )
      expect(stocked.map(i => i.id), island).toContain(RESCUE_ITEM_ID)
    }
  })

  /**
   * ⚠ **例外は買値だけ。**「率が3つ目に増えた」ではないことの検査
   *   （`derive.ts` の `PURCHASE_RATE` の注記）。
   */
  it('買値0 はこの品だけ。ほかの全品は今までどおり 売値 × 0.7', () => {
    expect(purchasePrice(RESCUE_ITEM_ID)).toBe(0)
    for (const island of ROUTE) {
      expect(purchasePrice(RESCUE_ITEM_ID, island), island).toBe(0)
    }
    const free = ALL_ITEMS.filter(i => purchasePrice(i.id) === 0)
    expect(free.map(i => i.id)).toEqual([RESCUE_ITEM_ID])
  })

  /**
   * **受入条件2 —— 1日に買える数に上限があり、超えると買えない。日が変わると戻る。**
   */
  describe('1日の上限', () => {
    it('上限まで買える。超えるぶんは買えない', () => {
      const supply = new RescueSupply()
      supply.refresh(1)
      expect(supply.remaining()).toBe(RESCUE_DAILY_LIMIT)

      expect(supply.take(RESCUE_DAILY_LIMIT - 1)).toBe(true)
      expect(supply.remaining()).toBe(1)
      // ⚠ **払う前に止める**（`PeddlerStock.take` と同じ作り。部分的には買わせない）
      expect(supply.take(2)).toBe(false)
      expect(supply.remaining()).toBe(1)
      expect(supply.take(1)).toBe(true)
      expect(supply.remaining()).toBe(0)
    })

    it('日が変わると戻る。同じ日に2度配らない', () => {
      const supply = new RescueSupply()
      supply.refresh(1)
      supply.take(RESCUE_DAILY_LIMIT)
      expect(supply.remaining()).toBe(0)

      // ⚠ **同じ日に呼び直しても戻らない**（ロードと日の変わり目の両方から呼ばれる）
      expect(supply.refresh(1)).toBe(false)
      expect(supply.remaining()).toBe(0)

      expect(supply.refresh(2)).toBe(true)
      expect(supply.remaining()).toBe(RESCUE_DAILY_LIMIT)
    })
  })

  /**
   * **買う画面の関**（`PurchaseMenu`）。
   *
   * ⚠ **島の商人でも行商人でも、同じ1本を通ること。**この画面は両方を組み立てるので、
   *   片方だけ通すと**行商人から上限なしで買える**（値段は `買値 × 1.5 = 0`）。
   */
  describe('買う画面は、上限を1本で通す', () => {
    it('今日の残りは `remainingToday()` 1本で出す（行商人の積荷と同じ関）', () => {
      expect(purchaseSource).toContain('private remainingToday(')
      // 買える数・買えない理由・行の `残り N個` の3箇所がこれを読む
      expect(purchaseSource.match(/this\.remainingToday\(/g)?.length ?? 0).toBeGreaterThanOrEqual(3)
    })

    it('買ったぶんをその場で減らす（減らさないと何度でも買える）', () => {
      expect(purchaseSource).toContain('if (isRescueItem(row.item.id)) this.rescue.take(qty)')
    })
  })

  /**
   * **受入条件3 —— ロードで買い直せない。**
   *
   * ⚠ **引いた日と数がセーブに載っていること**（`SaveData.rescue`）。
   *   載せないと、**買ってからロードし直すだけで上限が戻る**
   *   （`peddler.day` ／ `orderDay` と同じ事故）。
   */
  describe('ロードで買い直せない（受入条件3）', () => {
    const makeTime = (day: number): TimeManager => ({
      getCurrentTime: vi.fn().mockReturnValue({ day, hour: 8, minute: 0 }),
      pause: vi.fn(), resume: vi.fn(), isCrafting: vi.fn(), isAdvancing: vi.fn(),
      startAdvancing: vi.fn(), stopAdvancing: vi.fn(), update: vi.fn(),
    } as unknown as TimeManager)

    const makeProgress = (supply: RescueSupply, day: number): GameProgress => {
      const eco = new EconomyManager()
      const inv = new Inventory()
      const reg = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)
      return new GameProgress(
        eco, inv, new FloorGrid({ width: 6, height: 5 }, reg), makeTime(day),
        new WorldState(), new Upgrades(), new ShelfPresets(),
        new DeliveryOrders(inv, eco), new PeddlerStock(), supply,
      )
    }

    it('その日に買った数はセーブに載り、読み直しても戻らない', () => {
      const store: Record<string, string> = {}
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v },
        removeItem: (k: string) => { delete store[k] },
      })

      const supply = new RescueSupply()
      supply.refresh(3)
      supply.take(RESCUE_DAILY_LIMIT)
      makeProgress(supply, 3).save(0)

      const data = makeProgress(new RescueSupply(), 3).load(0)!
      expect(data.rescue).toEqual({ day: 3, taken: RESCUE_DAILY_LIMIT })

      // ロード（`GameScene` と同じ順序: 戻してから、その日ぶんを配る）
      const loaded = new RescueSupply()
      loaded.restore(data.rescue)
      loaded.refresh(data.currentTime.day)
      expect(loaded.remaining()).toBe(0)        // ⚠ **買い直せない**

      // 翌日になれば戻る
      loaded.refresh(data.currentTime.day + 1)
      expect(loaded.remaining()).toBe(RESCUE_DAILY_LIMIT)
      vi.unstubAllGlobals()
    })

    it('救済の品が無かった頃のセーブ（`rescue` が無い）でも落ちない', () => {
      const supply = new RescueSupply()
      supply.restore(undefined)
      expect(supply.getDay()).toBe(0)
      // 日は 0 のままなので、呼ぶ側の `refresh(今日)` がその日ぶんを配る
      expect(supply.refresh(7)).toBe(true)
      expect(supply.remaining()).toBe(RESCUE_DAILY_LIMIT)
    })

    it('壊れた値・上限を超えた値は丸めて読む', () => {
      const supply = new RescueSupply()
      supply.restore({ day: 2, taken: RESCUE_DAILY_LIMIT + 999 })
      expect(supply.remaining()).toBe(0)
      supply.restore({ day: 2, taken: -5 })
      expect(supply.remaining()).toBe(RESCUE_DAILY_LIMIT)
    })
  })
})
