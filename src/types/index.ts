// ─── グリッド ─────────────────────────────────────────
export type GridCell = { x: number; y: number }
export type GridSize = { width: number; height: number }
export type Rotation = 0 | 1 | 2 | 3 // 0=0°, 1=90°, 2=180°, 3=270°

// ─── 時間 ─────────────────────────────────────────────
export type GameTime = { day: number; hour: number; minute: number }

// ─── アイテム・陳列 ────────────────────────────────────
export interface DisplaySlot {
  id: string
  itemId: string
  shape: number[][]    // 2次元boolean配列（1=占有, 0=空き）
  position: GridCell   // グリッド上の左上基準点
  rotation: Rotation
  quantity: number     // 0〜999
}

export interface AdjacencyBonus {
  slotId: string
  bonusType: 'sales_rate' | 'customer_attraction' | 'price_up'
  multiplier: number   // 1.0 = ボーナスなし, 1.2 = 20%UP など
  sourceSlotIds: string[]
}

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
  floor: DisplaySlot[]
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
  // クラフト
  CRAFTING_STARTED: 'crafting:started',
  CRAFTING_COMPLETED: 'crafting:completed',
  // 進行
  PROGRESS_GOAL_COMPLETE: 'progress:goal-complete',
  PROGRESS_GAME_OVER: 'progress:game-over',
} as const

export type GameEventName = typeof GameEvents[keyof typeof GameEvents]
