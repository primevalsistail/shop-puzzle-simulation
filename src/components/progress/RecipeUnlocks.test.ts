import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RecipeUnlocks, allowedGroupCount, UNLOCK_INTERVAL_DAYS } from './RecipeUnlocks.js'
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
import { DAYS_PER_PORT } from '../../taxonomy/islands.js'
import type { TimeManager } from '../core/TimeManager.js'

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
    expect(unlocks.advanceTo(1)).toEqual([])
    expect(unlocks.unlockedRecipes()).toEqual([])
  })

  it('材料が1つでも欠けていれば解禁されない（「1つでも」ではなく「全部」で読む）', () => {
    const inv = new Inventory()
    inv.add('sheep_milk', 1)   // バターには塩も要る
    const unlocks = new RecipeUnlocks(registry(), inv, store())
    expect(unlocks.advanceTo(1)).toEqual([])
    expect(unlocks.unlockedRecipes()).toEqual([])
  })

  it('材料を全部持つと解禁され、並ぶようになる', () => {
    const inv = new Inventory()
    inv.add('sheep_milk', 1); inv.add('salt', 1)
    const unlocks = new RecipeUnlocks(registry(), inv, store())
    unlocks.advanceTo(1)
    expect(unlocks.unlockedRecipes().map(r => r.id)).toContain('recipe_butter')
  })
})

describe('RecipeUnlocks — 粒度（系統単位）', () => {
  it('1本ではなく、その系統で条件を満たしたものがまとめて開く', () => {
    const inv = new Inventory()
    // バター・チーズ・塩鮭はどれも「食料 / tier2」
    inv.add('sheep_milk', 1); inv.add('salt', 1); inv.add('salmon', 1)
    const unlocks = new RecipeUnlocks(registry(), inv, store())

    const events = unlocks.advanceTo(1)
    expect(events).toHaveLength(1)
    expect(events[0].mainKind).toBe('食料')
    expect(events[0].tier).toBe(2)
    expect(events[0].recipes.map(r => r.id).sort())
      .toEqual(['recipe_butter', 'recipe_cheese', 'recipe_salted_salmon'])
  })

  it('系統をまたぐと、同じ日には枠のぶんしか開かない（Day 1 の枠は1つ）', () => {
    const inv = new Inventory()
    for (const item of ALL_ITEMS) inv.add(item.id, 1)   // 全部の条件を満たした状態
    const unlocks = new RecipeUnlocks(registry(), inv, store())
    expect(unlocks.advanceTo(1)).toHaveLength(1)
  })

  it('開いている系統に、あとから条件を満たしたものは枠を使わずに足される', () => {
    const inv = new Inventory()
    inv.add('sheep_milk', 1); inv.add('salt', 1)
    const unlocks = new RecipeUnlocks(registry(), inv, store())
    unlocks.advanceTo(1)
    expect(unlocks.unlockedRecipes().map(r => r.id)).not.toContain('recipe_salted_salmon')

    inv.add('salmon', 1)
    // 同じ日（枠は増えていない）でも、すでに開いた「食料 / tier2」には入る
    expect(unlocks.advanceTo(1)).toEqual([])
    expect(unlocks.unlockedRecipes().map(r => r.id)).toContain('recipe_salted_salmon')
  })
})

describe('RecipeUnlocks — 頻度（1寄港あたり2〜3回）', () => {
  it('枠は Day 1 から4日ごとに1つ増える', () => {
    expect(UNLOCK_INTERVAL_DAYS).toBe(4)
    expect(allowedGroupCount(1)).toBe(1)
    expect(allowedGroupCount(4)).toBe(1)
    expect(allowedGroupCount(5)).toBe(2)
    expect(allowedGroupCount(9)).toBe(3)
  })

  it('1寄港（10日）で 2〜3回 起きる', () => {
    const inv = new Inventory()
    for (const item of ALL_ITEMS) inv.add(item.id, 1)   // 待ちの系統を切らさない
    const unlocks = new RecipeUnlocks(registry(), inv, store())

    const perPort: number[] = []
    for (let port = 0; port < 4; port++) {
      let count = 0
      for (let i = 1; i <= DAYS_PER_PORT; i++) {
        count += unlocks.advanceTo(port * DAYS_PER_PORT + i).length
      }
      perPort.push(count)
    }
    // 10 / 4 = 2.5 なので、3回と2回が交互に来る
    expect(perPort).toEqual([3, 2, 3, 2])
    for (const n of perPort) expect(n).toBeGreaterThanOrEqual(2)
    for (const n of perPort) expect(n).toBeLessThanOrEqual(3)
  })

  it('浅い tier から開く（乱数を使わないので順序は毎回同じ）', () => {
    const inv = new Inventory()
    for (const item of ALL_ITEMS) inv.add(item.id, 1)
    const unlocks = new RecipeUnlocks(registry(), inv, store())
    const opened = []
    for (let day = 1; day <= 20; day++) opened.push(...unlocks.advanceTo(day))
    expect(opened.map(e => e.tier)).toEqual([2, 2, 2, 2, 3])
    expect(opened.slice(0, 4).map(e => e.mainKind)).toEqual(['食料', '飲みもの', '衣類', '道具'])
  })
})

describe('RecipeUnlocks — セーブ', () => {
  beforeEach(() => { EventBus.removeAllListeners() })

  const progressWith = (inv: Inventory) => new GameProgress(
    new EconomyManager(), inv, new FloorGrid({ width: 6, height: 5 }, registry()),
    makeTimeManagerMock(), new WorldState(), new Upgrades(),
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
    new RecipeUnlocks(registry(), inv, gp).advanceTo(1)
    gp.save(0)

    const restoredInv = new Inventory()
    const restored = progressWith(restoredInv)
    const data = restored.load(0)!
    restored.restoreUnlockedRecipes(data.unlockedRecipes ?? [])
    expect(restored.isRecipeUnlocked('recipe_butter')).toBe(true)

    vi.unstubAllGlobals()
  })

  it('解禁が無かった頃のセーブ（空）でも、日付から枠のぶんまで追いつく', () => {
    const inv = new Inventory()
    for (const item of ALL_ITEMS) inv.add(item.id, 1)
    const gp = progressWith(inv)
    gp.restoreUnlockedRecipes([])   // 古いセーブ

    // Day 21 のセーブなら枠は 1 + floor(20/4) = 6
    const events = new RecipeUnlocks(registry(), inv, gp).advanceTo(21)
    expect(events).toHaveLength(allowedGroupCount(21))
  })
})
