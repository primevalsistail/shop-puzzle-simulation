import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameProgress } from './GameProgress.js'
import { EconomyManager } from '../economy/EconomyManager.js'
import { Inventory } from '../economy/Inventory.js'
import { ItemRegistry } from '../items/ItemRegistry.js'
import { FloorGrid } from '../floor/FloorGrid.js'
import { EventBus } from '../../services/EventBus.js'
import { ALL_ITEMS } from '../../data/items.js'
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

  it('初期状態で全レシピがアンロック済み', () => {
    const eco = new EconomyManager()
    const inv = new Inventory()
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock())
    expect(gp.isRecipeUnlocked('recipe_bread')).toBe(true)
  })

  it('unlockFeatureで機能をアンロックできる', () => {
    const eco = new EconomyManager()
    const inv = new Inventory()
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock())
    gp.unlockFeature('second_floor')
    expect(gp.isFeatureUnlocked('second_floor')).toBe(true)
    expect(gp.isFeatureUnlocked('other')).toBe(false)
  })

  it('売上に応じてグリッドサイズが拡張される', () => {
    const eco = new EconomyManager()
    const inv = new Inventory()
    const reg = new ItemRegistry(ALL_ITEMS)
    const grid = new FloorGrid({ width: 6, height: 5 }, reg)
    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock())

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
    const gp = new GameProgress(eco, inv, grid, makeTimeManagerMock())

    gp.save()
    expect(gp.hasSave()).toBe(true)

    const data = gp.load()
    expect(data).not.toBeNull()
    expect(data!.money).toBe(12345)

    gp.deleteSave()
    expect(gp.hasSave()).toBe(false)

    vi.unstubAllGlobals()
  })
})
