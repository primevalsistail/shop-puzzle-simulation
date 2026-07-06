import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CraftingSystem } from './CraftingSystem.js'
import { ItemRegistry } from './ItemRegistry.js'
import { Inventory } from '../economy/Inventory.js'
import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'
import { ALL_ITEMS } from '../../data/items.js'
import { ALL_RECIPES } from '../../data/recipes.js'
import type { TimeManager } from '../core/TimeManager.js'

function makeTimeManagerMock(): TimeManager {
  return {
    pause: vi.fn(),
    resume: vi.fn(),
    isCrafting: vi.fn().mockReturnValue(false),
    isAdvancing: vi.fn().mockReturnValue(false),
    startAdvancing: vi.fn(),
    stopAdvancing: vi.fn(),
    getCurrentTime: vi.fn().mockReturnValue({ day: 1, hour: 8, minute: 0 }),
    update: vi.fn(),
  } as unknown as TimeManager
}

describe('CraftingSystem', () => {
  let registry: ItemRegistry
  let inventory: Inventory
  let timeManager: TimeManager
  let cs: CraftingSystem

  beforeEach(() => {
    EventBus.removeAllListeners()
    registry = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)
    inventory = new Inventory()
    timeManager = makeTimeManagerMock()
    cs = new CraftingSystem(registry, inventory, timeManager)
  })

  it('素材不足のときcanCraftはfalse', () => {
    expect(cs.canCraft('recipe_bread')).toBe(false)
  })

  it('素材が揃っているときcanCraftはtrue', () => {
    inventory.add('flour', 2)
    expect(cs.canCraft('recipe_bread')).toBe(true)
  })

  it('startCraftで素材を消費する', () => {
    inventory.add('flour', 5)
    cs.startCraft('recipe_bread')
    expect(inventory.getQuantity('flour')).toBe(3) // 5 - 2
  })

  it('startCraftでTimeManagerをpauseする', () => {
    inventory.add('flour', 2)
    cs.startCraft('recipe_bread')
    expect(timeManager.pause).toHaveBeenCalledOnce()
  })

  it('startCraftでCRAFTING_STARTEDを発火する', () => {
    const listener = vi.fn()
    EventBus.on(GameEvents.CRAFTING_STARTED, listener)
    inventory.add('flour', 2)
    cs.startCraft('recipe_bread')
    expect(listener).toHaveBeenCalledWith('recipe_bread')
  })

  it('素材不足のときstartCraftはfalseを返す', () => {
    const result = cs.startCraft('recipe_bread')
    expect(result).toBe(false)
    expect(cs.isActive()).toBe(false)
  })

  it('進捗が正しく更新される', () => {
    inventory.add('flour', 2)
    cs.startCraft('recipe_bread') // 5min * 1000ms = 5000ms
    cs.update(2500)
    expect(cs.getProgress()).toBeCloseTo(0.5, 1)
  })

  it('完了したとき製品を倉庫に追加する', () => {
    inventory.add('flour', 2)
    cs.startCraft('recipe_bread') // bread: 5min = 5000ms, output 3
    cs.update(6000) // over completion
    expect(inventory.getQuantity('bread')).toBe(3)
  })

  it('完了したときTimeManagerをresumeする', () => {
    inventory.add('flour', 2)
    cs.startCraft('recipe_bread')
    cs.update(6000)
    expect(timeManager.resume).toHaveBeenCalledOnce()
  })

  it('完了したときCRAFTING_COMPLETEDを発火する', () => {
    const listener = vi.fn()
    EventBus.on(GameEvents.CRAFTING_COMPLETED, listener)
    inventory.add('flour', 2)
    cs.startCraft('recipe_bread')
    cs.update(6000)
    expect(listener).toHaveBeenCalledWith('recipe_bread')
  })

  it('cancelCraftで素材を返却する', () => {
    inventory.add('flour', 5)
    cs.startCraft('recipe_bread')
    cs.cancelCraft()
    expect(inventory.getQuantity('flour')).toBe(5) // refunded
    expect(cs.isActive()).toBe(false)
  })

  it('isActiveはジョブ実行中にtrue', () => {
    inventory.add('flour', 2)
    cs.startCraft('recipe_bread')
    expect(cs.isActive()).toBe(true)
    cs.update(6000)
    expect(cs.isActive()).toBe(false)
  })

  it('複数素材レシピが動作する', () => {
    inventory.add('bread', 1)
    inventory.add('tomato', 1)
    const ok = cs.startCraft('recipe_sandwich')
    expect(ok).toBe(true)
    cs.update(4000) // 3min = 3000ms
    expect(inventory.getQuantity('sandwich')).toBe(2)
  })
})
