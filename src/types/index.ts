import type { Shape } from '../taxonomy/axes.js'
import type { ShelfPreset } from '../components/floor/ShelfPresets.js'

// ─── グリッド ─────────────────────────────────────────
export type GridCell = { x: number; y: number }
export type GridSize = { width: number; height: number }
export type Rotation = 0 | 1 | 2 | 3 // 0=0°, 1=90°, 2=180°, 3=270°

// ─── 時間 ─────────────────────────────────────────────
export type GameTime = { day: number; hour: number; minute: number }

// ─── アイテム・陳列 ────────────────────────────────────
/**
 * 売り場に出している区画。
 *
 * ⚠ **数量を持たない。**世界観のとおり **店＝船倉**で、倉と売り場は同じ場所。
 *   持ち物は `Inventory` が1つだけ持ち、区画は「**どの品を、どこに、どの向きで出しているか**」
 *   だけを表す。数量を別に持つと、同じ物が2箇所にある形になり、
 *   **自分の荷物を自分の荷物に移す「補充」という無意味な操作**が生まれる。
 */
export interface DisplaySlot {
  id: string
  itemId: string
  shape: Shape         // 2次元boolean配列（1=占有, 0=空き）
  position: GridCell   // グリッド上の左上基準点
  rotation: Rotation
}

// 効き目は `src/taxonomy/evaluate.ts` の `Modifiers`（売れやすさ・値段・集客）が表す。
// ⚠ **隣接ボーナスを品IDで直書きしない**（INV-4）。効き目は規則側（`rules.ts`）に置く。

// ─── 販売 ─────────────────────────────────────────────
export interface SaleResult {
  slotId: string
  itemId: string
  qtySold: number
  revenue: number
}

// ─── クラフト ─────────────────────────────────────────
export interface CraftJob {
  id: string
  recipeId: string
  startTime: GameTime
  completionMinutes: number  // 完成まで何分かかるか
}

// ─── UI ───────────────────────────────────────────────
export interface HUDState {
  money: number
  totalRevenue: number
  goalAmount: number
  day: number
}

// ─── セーブデータ ──────────────────────────────────────
export interface SaveData {
  money: number
  totalRevenue: number
  inventory: Record<string, number>
  /** 品ごとの累計販売数。U2（売った実績で解禁）がこれを読むので、積まないとロードで解禁が巻き戻る */
  soldCounts?: Record<string, number>
  /** 強化の段。積まないとロードで買った強化が消える */
  upgrades?: Record<string, number>
  /** 一度でも手に入れたことがある品。アイテム一覧の絞り込みとレシピの解禁が読む */
  everHeld?: string[]
  floor: DisplaySlot[]
  /**
   * 品出しの型（マイセット。#27）。⚠ **無いセーブを読めるようにしておくこと**
   * （型が入る前のセーブがすでに手元にある）
   */
  shelfPresets?: (ShelfPreset | null)[]
  unlockedFeatures: string[]
  unlockedRecipes: string[]
  currentTime: GameTime
  isEndlessMode: boolean
  savedAt?: number  // Unix timestamp ms
}

export interface SlotMeta {
  savedAt: number
  totalRevenue: number
  day: number
}

// ─── ショップ状態 ──────────────────────────────────────
export interface ShopState {
  slots: DisplaySlot[]
  inventory: Map<string, number>
  gridSize: GridSize
}

// ─── イベント名定数 ────────────────────────────────────
export const GameEvents = {
  // 時間
  TIME_MINUTE_PASSED: 'time:minute-passed',
  TIME_ADVANCE_STARTED: 'time:advance-started',
  TIME_ADVANCE_STOPPED: 'time:advance-stopped',
  // 経済
  ECONOMY_MONEY_CHANGED: 'economy:money-changed',
  ECONOMY_PURCHASE_FAILED: 'economy:purchase-failed',
  // フロア
  FLOOR_SLOT_PLACED: 'floor:slot-placed',
  FLOOR_SLOT_REMOVED: 'floor:slot-removed',
  FLOOR_SLOT_EMPTIED: 'floor:slot-emptied',
  FLOOR_SLOT_SOLD: 'floor:slot-sold',
  // 時間
  TIME_PHASE_CHANGED: 'time:phase-changed',
  TIME_DAY_CHANGED: 'time:day-changed',
  TIME_SKIPPED: 'time:skipped',
  // クラフト
  CRAFTING_STARTED: 'crafting:started',
  CRAFTING_COMPLETED: 'crafting:completed',
  // 進行
  PROGRESS_GOAL_COMPLETE: 'progress:goal-complete',
  PROGRESS_GAME_OVER: 'progress:game-over',
} as const

export type GameEventName = typeof GameEvents[keyof typeof GameEvents]
