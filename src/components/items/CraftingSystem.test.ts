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
    isAdvancing: vi.fn().mockReturnValue(false),
    startAdvancing: vi.fn(),
    stopAdvancing: vi.fn(),
    getCurrentTime: vi.fn().mockReturnValue({ day: 1, hour: 8, minute: 0 }),
    // 8:00 時点なので 24:00 まで 960分ある（#25 Q3 = B の判定に使う）
    minutesUntilEndOfDay: vi.fn().mockReturnValue(960),
    skipMinutes: vi.fn(),
    getPhase: vi.fn().mockReturnValue('作業'),
    isOpen: vi.fn().mockReturnValue(false),
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

  it('startCraftはゲーム内時間を所要分だけ飛ばす（＝その間は客が来ない）', () => {
    inventory.add('flour', 2)
    cs.startCraft('recipe_bread') // bread: 5分
    expect(timeManager.skipMinutes).toHaveBeenCalledWith(5)
  })

  it('その日のうちに終わらない加工は着手できない（#25 Q3 = B）', () => {
    vi.mocked(timeManager.minutesUntilEndOfDay).mockReturnValue(3)
    inventory.add('flour', 2)
    expect(cs.canCraft('recipe_bread')).toBe(false) // 5分 > 残り3分
    expect(cs.startCraft('recipe_bread')).toBe(false)
    expect(inventory.getQuantity('flour')).toBe(2) // 素材は減らない
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

  it('着手した時点で製品が倉庫に入る（実時間では待たない）', () => {
    inventory.add('flour', 2)
    cs.startCraft('recipe_bread') // bread: output 3
    expect(inventory.getQuantity('bread')).toBe(3)
  })

  it('CRAFTING_COMPLETEDはstartCraftの中で発火する', () => {
    const listener = vi.fn()
    EventBus.on(GameEvents.CRAFTING_COMPLETED, listener)
    inventory.add('flour', 2)
    cs.startCraft('recipe_bread')
    expect(listener).toHaveBeenCalledWith('recipe_bread')
  })

  it('加工は途中の状態を持たない（着手＝完了）', () => {
    inventory.add('flour', 2)
    cs.startCraft('recipe_bread')
    expect(cs.isActive()).toBe(false)
    expect(cs.getProgress()).toBe(0)
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
