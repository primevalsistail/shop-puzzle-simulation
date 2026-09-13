import type { SaveData, SlotMeta } from '../../types/index.js'
import type { EconomyManager } from '../economy/EconomyManager.js'
import type { Inventory } from '../economy/Inventory.js'
import type { FloorGrid } from '../floor/FloorGrid.js'
import type { TimeManager } from '../core/TimeManager.js'
import type { WorldState } from './WorldState.js'
import type { Upgrades } from './Upgrades.js'
import type { ShelfPresets } from '../floor/ShelfPresets.js'
import type { DeliveryOrders } from './DeliveryOrders.js'
import type { PeddlerStock } from './PeddlerStock.js'

const SAVE_KEY = 'shop_puzzle_save'
const slotKey = (slot: number) => `${SAVE_KEY}_${slot}`

export class GameProgress {
  /**
   * 解禁済みのレシピ。**クラフトメニューはここにあるものだけを並べる**（#48 ／ 段4-3）。
   *
   * 条件（材料を全部手にしたことがあるか）と、開く速さ（1寄港あたり2〜3回・系統単位）は
   * `RecipeUnlocks` が持つ。ここは**結果の置き場**であって、判定はしない。
   */
  private unlockedRecipes: Set<string> = new Set()
  private isEndlessMode = false

  constructor(
    private economy: EconomyManager,
    private inventory: Inventory,
    private floorGrid: FloorGrid,
    private timeManager: TimeManager,
    private world: WorldState,
    private upgrades: Upgrades,
    /** 品出しの型（#27）。⚠ 積まないとロードで覚えた型が消える */
    private presets: ShelfPresets,
    /** 納品の注文（#28）。⚠ **必須。**任意にすると渡し忘れてもコンパイルが通り、ロードで注文が消える */
    private orders: DeliveryOrders,
    /** 行商人の積荷（#9）。⚠ **必須。**`orders` と同じ理由（渡し忘れが静かに通る） */
    private peddler: PeddlerStock,
  ) {}

  save(slot = 0): void {
    const data: SaveData = {
      money: this.economy.getMoney(),
      totalRevenue: this.economy.getTotalRevenue(),
      inventory: this.inventory.getAllStock(),
      // U2（売った実績で解禁）が読む。積まないとロードで解禁が巻き戻る
      soldCounts: this.world.toRecord(),
      upgrades: this.upgrades.toRecord(),
      everHeld: this.inventory.getEverHeld(),
      floor: this.floorGrid.getAllSlots(),
      shelfPresets: this.presets.toRecord(),
      orders: this.orders.toRecord(),
      peddler: this.peddler.toRecord(),
      // 自由航行の航路（#7）。⚠ **積まないとロードで順どおりの島へ戻る**
      voyage: this.world.voyageRecord(),
      unlockedRecipes: Array.from(this.unlockedRecipes),
      currentTime: this.timeManager.getCurrentTime(),
      isEndlessMode: this.isEndlessMode,
      savedAt: Date.now(),
    }
    try {
      localStorage.setItem(slotKey(slot), JSON.stringify(data))
    } catch {
      // localStorage unavailable (e.g. tests)
    }
  }

  load(slot = 0): SaveData | null {
    try {
      const raw = localStorage.getItem(slotKey(slot))
      if (!raw) return null
      return JSON.parse(raw) as SaveData
    } catch {
      return null
    }
  }

  getSlotMeta(slot: number): SlotMeta | null {
    const data = this.load(slot)
    if (!data) return null
    return {
      savedAt: data.savedAt ?? 0,
      totalRevenue: data.totalRevenue,
      day: data.currentTime.day,
    }
  }

  hasSave(slot = 0): boolean {
    try {
      return localStorage.getItem(slotKey(slot)) !== null
    } catch {
      return false
    }
  }

  deleteSave(slot = 0): void {
    try {
      localStorage.removeItem(slotKey(slot))
    } catch {
      // ignore
    }
  }

  isRecipeUnlocked(recipeId: string): boolean {
    return this.unlockedRecipes.has(recipeId)
  }

  unlockRecipe(recipeId: string): void {
    this.unlockedRecipes.add(recipeId)
  }

  getUnlockedRecipes(): string[] {
    return Array.from(this.unlockedRecipes)
  }

  /**
   * ロードで解禁を戻す。積まないと**読み直すたびにクラフトメニューが空に戻る。**
   *
   * 解禁が無かった頃のセーブは空で来るが、`RecipeUnlocks.allowedGroupCount` が
   * 日付から枠を出すので、ロード直後の判定でその日ぶんまで追いつく。
   */
  restoreUnlockedRecipes(ids: readonly string[]): void {
    this.unlockedRecipes = new Set(ids)
  }

  setEndlessMode(value: boolean): void {
    this.isEndlessMode = value
  }
}
