import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RecipeUnlocks } from './RecipeUnlocks.js'
import { GameProgress } from './GameProgress.js'
import { WorldState } from './WorldState.js'
import { Upgrades } from './Upgrades.js'
import { Inventory } from '../economy/Inventory.js'
import { EconomyManager } from '../economy/EconomyManager.js'
import { FloorGrid } from '../floor/FloorGrid.js'
import { ItemRegistry } from '../items/ItemRegistry.js'
import { EventBus } from '../../services/EventBus.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import { ALL_RECIPES } from '../../taxonomy/recipes.js'
import { stockedByIslandMerchant } from '../../taxonomy/evaluate.js'
import type { TimeManager } from '../core/TimeManager.js'
import { ShelfPresets } from '../floor/ShelfPresets.js'
import { DeliveryOrders } from './DeliveryOrders.js'
import { PeddlerStock } from './PeddlerStock.js'

/**
 * ⚠ ここで確かめている「作れる／作れない」は、**クラフトメニューに並ぶかどうか**である。
 *   `CraftMenu.shown()` の母集合が `unlockedRecipes()` そのものなので、
 *   ここが 0本なら画面にも1行も出ない。`CraftMenu` は Phaser 依存で単体テストできない。
 */

const registry = () => new ItemRegistry(ALL_ITEMS, ALL_RECIPES)

/** `GameProgress` を通さずに解禁だけ持つ置き場（`UnlockStore`） */
function store() {
  const set = new Set<string>()
  return {
    isRecipeUnlocked: (id: string) => set.has(id),
    unlockRecipe: (id: string) => { set.add(id) },
  }
}

function makeTimeManagerMock(): TimeManager {
  return {
    getCurrentTime: vi.fn().mockReturnValue({ day: 1, hour: 6, minute: 0 }),
    isAdvancing: vi.fn(), startAdvancing: vi.fn(), stopAdvancing: vi.fn(), update: vi.fn(),
  } as unknown as TimeManager
}

describe('RecipeUnlocks — 条件（#48「材料を取得したことがあるか」）', () => {
  it('材料を1つも持ったことがなければ、1本も並ばない', () => {
    const unlocks = new RecipeUnlocks(registry(), new Inventory(), store())
    expect(unlocks.unlockEligible()).toEqual([])
    expect(unlocks.unlockedRecipes()).toEqual([])
  })

  it('材料が1つでも欠けていれば解禁されない（「1つでも」ではなく「全部」で読む）', () => {
    const inv = new Inventory()
    inv.add('sheep_milk', 1)   // バターには塩も要る
    const unlocks = new RecipeUnlocks(registry(), inv, store())
    expect(unlocks.unlockEligible()).toEqual([])
    expect(unlocks.unlockedRecipes()).toEqual([])
  })

  it('材料を全部持つと解禁され、並ぶようになる', () => {
    const inv = new Inventory()
    inv.add('sheep_milk', 1); inv.add('salt', 1)
    const unlocks = new RecipeUnlocks(registry(), inv, store())
    unlocks.unlockEligible()
    expect(unlocks.unlockedRecipes().map(r => r.id)).toContain('recipe_butter')
  })
})

/**
 * **#111 で作り替えたところ。**以前は「系統（主種類 × tier）」がまとめて開き、
 * さらに**日付で増える枠**が本数を絞っていた。**どちらも無い。**
 */
describe('RecipeUnlocks — 粒度（1レシピ単位。#111）', () => {
  it('条件を満たしたレシピだけが開く。同じ系統の兄弟は連れて行かない', () => {
    const inv = new Inventory()
    // バターとチーズは材料が違う（バター: 羊の乳＋塩 ／ チーズ: 羊の乳＋塩＋よもぎ）
    inv.add('sheep_milk', 1); inv.add('salt', 1)
    const unlocks = new RecipeUnlocks(registry(), inv, store())

    const opened = unlocks.unlockEligible().map(r => r.id)
    expect(opened).toContain('recipe_butter')
    expect(opened).not.toContain('recipe_salted_salmon')   // 鮭をまだ持っていない
  })

  it('日付を見ないので、同じ日に条件を満たしたぶんはすべて開く', () => {
    const inv = new Inventory()
    for (const item of ALL_ITEMS) inv.add(item.id, 1)   // 全部の条件を満たした状態
    const unlocks = new RecipeUnlocks(registry(), inv, store())
    expect(unlocks.unlockEligible()).toHaveLength(ALL_RECIPES.length)
  })

  it('あとから材料が揃えば、その場で開く（待たされない）', () => {
    const inv = new Inventory()
    inv.add('sheep_milk', 1); inv.add('salt', 1)
    const unlocks = new RecipeUnlocks(registry(), inv, store())
    unlocks.unlockEligible()
    expect(unlocks.unlockedRecipes().map(r => r.id)).not.toContain('recipe_salted_salmon')

    inv.add('salmon', 1)
    expect(unlocks.unlockEligible().map(r => r.id)).toEqual(['recipe_salted_salmon'])
  })

  it('2回呼んでも同じものを2度開かない（知らせが重複しない）', () => {
    const inv = new Inventory()
    inv.add('sheep_milk', 1); inv.add('salt', 1)
    const unlocks = new RecipeUnlocks(registry(), inv, store())
    expect(unlocks.unlockEligible().length).toBeGreaterThan(0)
    expect(unlocks.unlockEligible()).toEqual([])
  })
})

/**
 * ⚠ **段が消えていないこと。**「材料のどれか1つ」にすると Day 1 に半分近くが開く
 *   （実測 2026-09-14: 47/106本、うち tier3以上が 24本）。**「全部」だから 5本で済む。**
 */
describe('RecipeUnlocks — Day 1 の実測（#111 の PO 判断の根拠）', () => {
  /** 初期在庫（`GameScene.INITIAL_STOCK`）＋ 初日の島で買える品を全部手にした状態 */
  const day1Inventory = (): Inventory => {
    const inv = new Inventory()
    inv.setInitialStock({ sheep_milk: 15, apple: 15, buckwheat_bread: 15 })
    const world = new WorldState()
    world.setDay(1)
    for (const item of stockedByIslandMerchant(ALL_ITEMS, world.getState())) inv.add(item.id, 1)
    return inv
  }

  it('初期在庫だけでは1本も開かない（材料が全部そろわない）', () => {
    const inv = new Inventory()
    inv.setInitialStock({ sheep_milk: 15, apple: 15, buckwheat_bread: 15 })
    expect(new RecipeUnlocks(registry(), inv, store()).unlockEligible()).toEqual([])
  })

  it('初日の島の品を全部買うと 5本開き、すべて tier2 に収まる', () => {
    const inv = day1Inventory()
    const reg = registry()
    const opened = new RecipeUnlocks(reg, inv, store()).unlockEligible()
    expect(opened.map(r => r.outputItemId).sort())
      .toEqual(['bamboo_fan', 'butter', 'cheese', 'mugwort_tea', 'wool_yarn'])
    for (const r of opened) expect(reg.tierOf(r.outputItemId)).toBe(2)
  })
})

describe('RecipeUnlocks — セーブ', () => {
  beforeEach(() => { EventBus.removeAllListeners() })

  const progressWith = (inv: Inventory) => new GameProgress(
    new EconomyManager(), inv, new FloorGrid({ width: 6, height: 5 }, registry()),
    makeTimeManagerMock(), new WorldState(), new Upgrades(), new ShelfPresets(),
    new DeliveryOrders(inv, new EconomyManager()), new PeddlerStock(),
  )

  it('解禁がセーブに載り、読み直すと戻る（積まないとクラフトメニューが空に戻る）', () => {
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
    })

    const inv = new Inventory()
    inv.add('sheep_milk', 1); inv.add('salt', 1)
    const gp = progressWith(inv)
    new RecipeUnlocks(registry(), inv, gp).unlockEligible()
    gp.save(0)

    const restoredInv = new Inventory()
    const restored = progressWith(restoredInv)
    const data = restored.load(0)!
    restored.restoreUnlockedRecipes(data.unlockedRecipes ?? [])
    expect(restored.isRecipeUnlocked('recipe_butter')).toBe(true)

    vi.unstubAllGlobals()
  })

  it('解禁が無かった頃のセーブ（空）でも、材料の揃っているぶんまで追いつく', () => {
    const inv = new Inventory()
    for (const item of ALL_ITEMS) inv.add(item.id, 1)
    const gp = progressWith(inv)
    gp.restoreUnlockedRecipes([])   // 古いセーブ

    expect(new RecipeUnlocks(registry(), inv, gp).unlockEligible())
      .toHaveLength(ALL_RECIPES.length)
  })

  /**
   * ⚠ **系統単位で開いていた頃のセーブ**（#111 より前）。形はレシピ id の集合で同じなので、
   *   **そのまま読めて、載っている id は閉じない。**材料を持っていなくても閉じない
   *   —— 閉じると、古いセーブのプレイヤーが**作れていたものを取り上げられる。**
   */
  it('#111 より前のセーブに載っている解禁は、材料が無くても閉じない', () => {
    const inv = new Inventory()   // 何も持っていない
    const gp = progressWith(inv)
    gp.restoreUnlockedRecipes(['recipe_butter', 'recipe_cheese'])

    const unlocks = new RecipeUnlocks(registry(), inv, gp)
    expect(unlocks.unlockEligible()).toEqual([])
    expect(unlocks.unlockedRecipes().map(r => r.id).sort())
      .toEqual(['recipe_butter', 'recipe_cheese'])
  })
})
