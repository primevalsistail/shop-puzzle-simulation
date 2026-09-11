import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CraftingSystem } from './CraftingSystem.js'
import { ItemRegistry } from './ItemRegistry.js'
import { Inventory } from '../economy/Inventory.js'
import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import { ALL_RECIPES } from '../../taxonomy/recipes.js'
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
    expect(cs.canCraft('recipe_buckwheat_flour')).toBe(false)
  })

  it('素材が揃っているときcanCraftはtrue', () => {
    inventory.add('buckwheat', 3)
    expect(cs.canCraft('recipe_buckwheat_flour')).toBe(true)
  })

  it('startCraftで素材を消費する', () => {
    inventory.add('buckwheat', 5)
    cs.startCraft('recipe_buckwheat_flour')
    expect(inventory.getQuantity('buckwheat')).toBe(2) // 5 - 3
  })

  it('startCraftはゲーム内時間を所要分だけ飛ばす（＝その間は客が来ない）', () => {
    inventory.add('buckwheat', 3)
    cs.startCraft('recipe_buckwheat_flour') // 蕎麦粉: 90分
    expect(timeManager.skipMinutes).toHaveBeenCalledWith(90)
  })

  it('その日のうちに終わらない加工は着手できない（#25 Q3 = B）', () => {
    vi.mocked(timeManager.minutesUntilEndOfDay).mockReturnValue(60)
    inventory.add('buckwheat', 3)
    expect(cs.canCraft('recipe_buckwheat_flour')).toBe(false) // 90分 > 残り60分
    expect(cs.startCraft('recipe_buckwheat_flour')).toBe(false)
    expect(inventory.getQuantity('buckwheat')).toBe(3) // 素材は減らない
  })

  it('startCraftでCRAFTING_STARTEDを発火する', () => {
    const listener = vi.fn()
    EventBus.on(GameEvents.CRAFTING_STARTED, listener)
    inventory.add('buckwheat', 3)
    cs.startCraft('recipe_buckwheat_flour')
    expect(listener).toHaveBeenCalledWith({ recipeId: 'recipe_buckwheat_flour', times: 1, quantity: 3 })
  })

  it('素材不足のときstartCraftはfalseを返す', () => {
    const result = cs.startCraft('recipe_buckwheat_flour')
    expect(result).toBe(false)
    expect(cs.isActive()).toBe(false)
  })

  it('着手した時点で製品が倉庫に入る（実時間では待たない）', () => {
    inventory.add('buckwheat', 3)
    cs.startCraft('recipe_buckwheat_flour') // 蕎麦粉: output 3
    expect(inventory.getQuantity('buckwheat_flour')).toBe(3)
  })

  it('CRAFTING_COMPLETEDはstartCraftの中で発火する', () => {
    const listener = vi.fn()
    EventBus.on(GameEvents.CRAFTING_COMPLETED, listener)
    inventory.add('buckwheat', 3)
    cs.startCraft('recipe_buckwheat_flour')
    expect(listener).toHaveBeenCalledWith({ recipeId: 'recipe_buckwheat_flour', times: 1, quantity: 3 })
  })

  it('加工は途中の状態を持たない（着手＝完了）', () => {
    inventory.add('buckwheat', 3)
    cs.startCraft('recipe_buckwheat_flour')
    expect(cs.isActive()).toBe(false)
    expect(cs.getProgress()).toBe(0)
  })

  // ── まとめて作る（回数指定） ───────────────────────────
  describe('まとめて作る', () => {
    it('材料も所要時間も回数分かかり、出来高は出力単位で増える', () => {
      inventory.add('buckwheat', 10)
      expect(cs.startCraft('recipe_buckwheat_flour', 3)).toBe(true)
      expect(inventory.getQuantity('buckwheat')).toBe(1) // 10 − 3×3
      expect(inventory.getQuantity('buckwheat_flour')).toBe(9) // 3個 × 3回
      expect(timeManager.skipMinutes).toHaveBeenCalledWith(270) // 90分 × 3回
    })

    it('CRAFTING_COMPLETED は回数と総個数を伝える', () => {
      const listener = vi.fn()
      EventBus.on(GameEvents.CRAFTING_COMPLETED, listener)
      inventory.add('buckwheat', 6)
      cs.startCraft('recipe_buckwheat_flour', 2)
      expect(listener).toHaveBeenCalledWith({ recipeId: 'recipe_buckwheat_flour', times: 2, quantity: 6 })
    })

    it('材料が1回分足りないときは何も起きない（材料も時間も減らない）', () => {
      inventory.add('buckwheat', 8) // 2回ぶん(6)はあるが3回ぶん(9)は無い
      expect(cs.startCraft('recipe_buckwheat_flour', 3)).toBe(false)
      expect(inventory.getQuantity('buckwheat')).toBe(8)
      expect(inventory.getQuantity('buckwheat_flour')).toBe(0)
      expect(timeManager.skipMinutes).not.toHaveBeenCalled()
    })

    it('当日に収まらない回数は着手できない（材料も時間も減らない）', () => {
      vi.mocked(timeManager.minutesUntilEndOfDay).mockReturnValue(200) // 90分なら2回まで
      inventory.add('buckwheat', 20)
      expect(cs.startCraft('recipe_buckwheat_flour', 3)).toBe(false)
      expect(inventory.getQuantity('buckwheat')).toBe(20)
      expect(timeManager.skipMinutes).not.toHaveBeenCalled()
      expect(cs.startCraft('recipe_buckwheat_flour', 2)).toBe(true)
    })

    it('maxCraftTimes は材料と当日の残り時間の小さいほうを返す', () => {
      inventory.add('buckwheat', 7) // 材料では2回、時間では10回 → 材料が効く
      expect(cs.maxCraftTimes('recipe_buckwheat_flour')).toBe(2)

      inventory.add('buckwheat', 100) // 材料では35回だが、960分では10回 → 時間が効く
      expect(cs.maxCraftTimes('recipe_buckwheat_flour')).toBe(10)

      vi.mocked(timeManager.minutesUntilEndOfDay).mockReturnValue(200) // 時間では2回
      expect(cs.maxCraftTimes('recipe_buckwheat_flour')).toBe(2)
    })

    it('材料が1回分も無ければ maxCraftTimes は 0', () => {
      expect(cs.maxCraftTimes('recipe_buckwheat_flour')).toBe(0)
      expect(cs.canCraft('recipe_buckwheat_flour', 1)).toBe(false)
    })

    it('0回・負の回数・小数は受け付けない', () => {
      inventory.add('buckwheat', 10)
      expect(cs.startCraft('recipe_buckwheat_flour', 0)).toBe(false)
      expect(cs.startCraft('recipe_buckwheat_flour', -1)).toBe(false)
      expect(cs.startCraft('recipe_buckwheat_flour', 1.5)).toBe(false)
      expect(inventory.getQuantity('buckwheat')).toBe(10)
    })

    it('複数素材レシピでは一番足りない材料が上限を決める', () => {
      // 塩鮭: salmon×2 + salt×1 → salted_salmon×3、180分
      inventory.add('salmon', 10) // 材料では5回
      inventory.add('salt', 3)    // 材料では3回 ← こちらが上限を決める
      expect(cs.maxCraftTimes('recipe_salted_salmon')).toBe(3)
      expect(cs.startCraft('recipe_salted_salmon', 4)).toBe(false)
      expect(cs.startCraft('recipe_salted_salmon', 3)).toBe(true)
      expect(inventory.getQuantity('salted_salmon')).toBe(9) // 3個 × 3回
      expect(inventory.getQuantity('salt')).toBe(0)
      expect(inventory.getQuantity('salmon')).toBe(4) // 10 − 2×3
    })
  })

  it('複数素材レシピが動作する', () => {
    inventory.add('salmon', 2)
    inventory.add('salt', 1)
    const ok = cs.startCraft('recipe_salted_salmon')
    expect(ok).toBe(true)
    cs.update(4000)
    expect(inventory.getQuantity('salted_salmon')).toBe(3)
  })
})
