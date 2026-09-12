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
    // ⚠ 旧13品時代は5本を直書きしていたが、そのIDは #30 で消えた。
    //   この仕掛けはまだクラフトメニューに繋がっていない（全レシピが並ぶ）
    const eco = new EconomyManager()
    const inv = new Inventory()
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock(), new WorldState(), new Upgrades())
    expect(gp.isRecipeUnlocked('recipe_buckwheat_flour')).toBe(false)
    gp.unlockRecipe('recipe_buckwheat_flour')
    expect(gp.isRecipeUnlocked('recipe_buckwheat_flour')).toBe(true)
  })

  it('unlockFeatureで機能をアンロックできる', () => {
    const eco = new EconomyManager()
    const inv = new Inventory()
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock(), new WorldState(), new Upgrades())
    gp.unlockFeature('second_floor')
    expect(gp.isFeatureUnlocked('second_floor')).toBe(true)
    expect(gp.isFeatureUnlocked('other')).toBe(false)
  })

  it('売上に応じてグリッドサイズが拡張される', () => {
    const eco = new EconomyManager()
    const inv = new Inventory()
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock(), new WorldState(), new Upgrades())

    expect(gp.getGridSizeForRevenue(0)).toEqual({ width: 6, height: 5 })
    expect(gp.getGridSizeForRevenue(200000)).toEqual({ width: 9, height: 7 })
    expect(gp.getGridSizeForRevenue(500000)).toEqual({ width: 13, height: 10 })
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
    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock(), new WorldState(), new Upgrades())

    gp.save()
    expect(gp.hasSave()).toBe(true)

    const data = gp.load()
    expect(data).not.toBeNull()
    expect(data!.money).toBe(12345)

    gp.deleteSave()
    expect(gp.hasSave()).toBe(false)

    vi.unstubAllGlobals()
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

    new GameProgress(eco, inv, grid, makeTimeManagerMock(), new WorldState(), up).save(0)

    const restored = new Upgrades()
    const loaded = new GameProgress(eco, inv, grid, makeTimeManagerMock(), new WorldState(), restored).load(0)
    restored.restore(loaded!.upgrades ?? {})
    expect(restored.getStage('棚')).toBe(2)
    expect(restored.getStage('手際')).toBe(1)
    expect(restored.gridSize()).toEqual({ width: 8, height: 7 })
    vi.unstubAllGlobals()
  })
})
