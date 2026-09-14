import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameProgress } from './GameProgress.js'
import { EconomyManager } from '../economy/EconomyManager.js'
import { Inventory } from '../economy/Inventory.js'
import { ItemRegistry } from '../items/ItemRegistry.js'
import { FloorGrid } from '../floor/FloorGrid.js'
import { EventBus } from '../../services/EventBus.js'
import { WorldState } from './WorldState.js'
import { Upgrades } from './Upgrades.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import type { TimeManager } from '../core/TimeManager.js'
import { ShelfPresets } from '../floor/ShelfPresets.js'
import { DeliveryOrders } from './DeliveryOrders.js'
import { PeddlerStock } from './PeddlerStock.js'
import { RescueSupply } from './RescueSupply.js'

function makeTimeManagerMock(): TimeManager {
  return {
    getCurrentTime: vi.fn().mockReturnValue({ day: 1, hour: 8, minute: 0 }),
    pause: vi.fn(), resume: vi.fn(), isCrafting: vi.fn(), isAdvancing: vi.fn(),
    startAdvancing: vi.fn(), stopAdvancing: vi.fn(), update: vi.fn(),
  } as unknown as TimeManager
}

describe('GameProgress', () => {
  beforeEach(() => {
    EventBus.removeAllListeners()
  })

  it('レシピの解禁は空で始まり、unlockRecipe で足せる', () => {
    // ⚠ 旧13品時代は5本を直書きしていたが、そのIDは #30 で消えた。**空で始まるのが正しい。**
    //   条件と速さの判定は `RecipeUnlocks`（#48）。ここは結果の置き場としての振る舞いだけを見る
    const eco = new EconomyManager()
    const inv = new Inventory()
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock(), new WorldState(), new Upgrades(), new ShelfPresets(), new DeliveryOrders(inv, eco), new PeddlerStock(), new RescueSupply())
    expect(gp.isRecipeUnlocked('recipe_buckwheat_flour')).toBe(false)
    gp.unlockRecipe('recipe_buckwheat_flour')
    expect(gp.isRecipeUnlocked('recipe_buckwheat_flour')).toBe(true)
  })

  it('エンドレスはセーブに載り、読み直すと戻る（戻らないと達成の幕がまた出る。#80）', () => {
    const eco = new EconomyManager()
    const inv = new Inventory()
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const storageMock: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storageMock[k] ?? null,
      setItem: (k: string, v: string) => { storageMock[k] = v },
      removeItem: (k: string) => { delete storageMock[k] },
    })

    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock(), new WorldState(), new Upgrades(), new ShelfPresets(), new DeliveryOrders(inv, eco), new PeddlerStock(), new RescueSupply())
    gp.setEndlessMode(true)
    gp.save(0)

    const loaded = gp.load(0)
    expect(loaded!.isEndlessMode).toBe(true)
  })

  /** ⚠ 積まないと、ロードで**選んだ島が順どおりの島へ巻き戻る**（#7） */
  it('自由航行の航路がセーブに載り、読み直すと戻る', () => {
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
    })
    const eco = new EconomyManager()
    const inv = new Inventory()
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const world = new WorldState()
    world.setDay(1)
    world.beginFreeSailing()
    world.chooseNextPort('ミフユリア')

    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock(), world, new Upgrades(), new ShelfPresets(), new DeliveryOrders(inv, eco), new PeddlerStock(), new RescueSupply())
    gp.save(0)

    const restored = new WorldState()
    restored.setDay(1)
    restored.restoreVoyage(gp.load(0)!.voyage)
    expect(restored.getLocation().next).toBe('ミフユリア')
    restored.setDay(11)
    expect(restored.getIsland()).toBe('ミフユリア')
    vi.unstubAllGlobals()
  })

  /**
   * ⚠ **引いた日を積まないと、欲しい依頼が出るまでロードし直せる**（#98）。
   *   **1日1件しか出ないことが、島を無くしたあとの唯一の歯止め**なので、ここが抜けると効かなくなる。
   */
  it('納品ミッションを引いた日がセーブに載り、読み直すと同じ日は引き直せない', () => {
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
    })
    const eco = new EconomyManager()
    const inv = new Inventory()
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const world = new WorldState()
    world.setDay(1)
    const orders = new DeliveryOrders(inv, eco)
    orders.rollDaily(ALL_ITEMS, world.getState(), 1, new Set(), () => 0)

    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock(), world, new Upgrades(), new ShelfPresets(), orders, new PeddlerStock(), new RescueSupply())
    gp.save(0)
    const data = gp.load(0)!
    expect(data.orderDay).toBe(1)
    expect(data.orders).toHaveLength(1)

    const restored = new DeliveryOrders(inv, eco)
    restored.restore(data.orders, data.orderDay)
    expect(restored.rollDaily(ALL_ITEMS, world.getState(), 1, new Set(), () => 0)).toBeNull()
    expect(restored.list()).toHaveLength(1)
    vi.unstubAllGlobals()
  })

  /** ⚠ 航路が入る前のセーブがすでに手元にある。読めなくなってはいけない（`orders` と同じ） */
  it('航路の無い古いセーブも読める', () => {
    const world = new WorldState()
    world.setDay(23)
    world.restoreVoyage(undefined)
    expect(world.isFreeSailing()).toBe(false)
    expect(world.getIsland()).toBe('ノアキータ')
  })

  it('save/loadがLocalStorageを使う (モック)', () => {
    const storageMock: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storageMock[k] ?? null,
      setItem: (k: string, v: string) => { storageMock[k] = v },
      removeItem: (k: string) => { delete storageMock[k] },
    })

    const eco = new EconomyManager(12345)
    const inv = new Inventory()
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock(), new WorldState(), new Upgrades(), new ShelfPresets(), new DeliveryOrders(inv, eco), new PeddlerStock(), new RescueSupply())

    gp.save()
    expect(gp.hasSave()).toBe(true)

    const data = gp.load()
    expect(data).not.toBeNull()
    expect(data!.money).toBe(12345)

    gp.deleteSave()
    expect(gp.hasSave()).toBe(false)

    vi.unstubAllGlobals()
  })

  /** ⚠ 積まないと、ロードのたびに覚えた型が消える（#27） */
  it('マイセットがセーブに載り、読み直すと戻る', () => {
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
    })
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const presets = new ShelfPresets()
    presets.save(1, [{
      id: 's1', itemId: 'apple', shape: [[1]], position: { x: 2, y: 3 }, rotation: 2,
    }], 'ミフユリア', 999)

    new GameProgress(
      new EconomyManager(), new Inventory(), grid, makeTimeManagerMock(),
      new WorldState(), new Upgrades(), presets, new DeliveryOrders(new Inventory(), new EconomyManager()), new PeddlerStock(), new RescueSupply(),
    ).save(0)

    const restored = new ShelfPresets()
    const loaded = new GameProgress(
      new EconomyManager(), new Inventory(), grid, makeTimeManagerMock(),
      new WorldState(), new Upgrades(), restored, new DeliveryOrders(new Inventory(), new EconomyManager()), new PeddlerStock(), new RescueSupply(),
    ).load(0)
    restored.restore(loaded!.shelfPresets)

    expect(restored.get(1)?.savedAt).toBe(999)
    // ⚠ **覚えた島もセーブを往復する**（#67）。落ちると `12区画` が2つ並んで見分けられない
    expect(restored.get(1)?.island).toBe('ミフユリア')
    expect(restored.get(1)?.slots).toEqual([
      { itemId: 'apple', position: { x: 2, y: 3 }, rotation: 2 },
    ])
    expect(restored.get(0)).toBeNull()
    vi.unstubAllGlobals()
  })

  /** ⚠ 型が入る前のセーブがすでに手元にある。読めなくなってはいけない */
  it('型の無い古いセーブも読める', () => {
    const presets = new ShelfPresets()
    presets.restore(undefined)
    expect(presets.get(0)).toBeNull()
  })

  it('強化の段がセーブに載り、読み直すと戻る（積まないと買った強化が消える）', () => {
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
    })
    const eco = new EconomyManager()
    const inv = new Inventory()
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const up = new Upgrades()
    up.advance('棚'); up.advance('棚'); up.advance('手際')

    new GameProgress(eco, inv, grid, makeTimeManagerMock(), new WorldState(), up, new ShelfPresets(), new DeliveryOrders(inv, eco), new PeddlerStock(), new RescueSupply()).save(0)

    const restored = new Upgrades()
    const loaded = new GameProgress(eco, inv, grid, makeTimeManagerMock(), new WorldState(), restored, new ShelfPresets(), new DeliveryOrders(inv, eco), new PeddlerStock(), new RescueSupply()).load(0)
    restored.restore(loaded!.upgrades ?? {})
    expect(restored.getStage('棚')).toBe(2)
    expect(restored.getStage('手際')).toBe(1)
    expect(restored.gridSize()).toEqual({ width: 8, height: 7 })
    vi.unstubAllGlobals()
  })
})
