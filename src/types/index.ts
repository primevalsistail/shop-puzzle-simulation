import type { Shape } from '../taxonomy/axes.js'
import type { ShelfPreset } from '../components/floor/ShelfPresets.js'
import type { DeliveryOrder } from '../components/progress/DeliveryOrders.js'
import type { PeddlerRecord } from '../components/progress/PeddlerStock.js'
import type { VoyageRecord } from '../components/progress/WorldState.js'

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
   * マイセット（#27）。⚠ **無いセーブを読めるようにしておくこと**
   * （型が入る前のセーブがすでに手元にある）
   */
  shelfPresets?: (ShelfPreset | null)[]
  /**
   * 納品のミッション（#28 → #98）。⚠ **無いセーブを読めるようにしておくこと**（`shelfPresets` と同じ）。
   *   **10件まで**（`MISSION_CAP`）。⚠ **島があった頃のセーブも来る** ——
   *   `DeliveryOrders.restore` が `island` を捨てて読む。
   */
  orders?: DeliveryOrder[]
  /**
   * **最後に「その日ぶんの確率」を引いた日**（#98）。
   *
   * ⚠ **積まないと歯止めが消える。**ミッションは1日の始まりに確率で1件出るので、
   *   **引いた日を覚えていないと、欲しい品が出るまでロードし直せる**
   *   （`peddler.day` と同じ事故）。⚠ **出たかどうかではなく、引いたかどうか。**
   */
  orderDay?: number
  /**
   * 行商人バレンの、その日の積荷（#9）。⚠ **無いセーブを読めるようにしておくこと**（`orders` と同じ）。
   *
   * ⚠ **持たないと、読み直すたびに品揃えが引き直される。**
   *   欲しい品が出るまでロードし直せるので、**10種類・各10個という上限が意味を失う。**
   */
  peddler?: PeddlerRecord
  /**
   * 自由航行の航路（#7）。**クリア後にしか入らない。**
   * ⚠ **無いセーブを読めるようにしておくこと**（`orders` ／ `peddler` と同じ）。
   *   クリア前のセーブと #7 より前のセーブは、**ここが無いまま来る。**
   *   そのときは日付から出した島から始める（`WorldState.beginFreeSailing`）。
   */
  voyage?: VoyageRecord | null
  unlockedRecipes: string[]
  currentTime: GameTime
  /**
   * **商船を買ったか＝エンディングを見たか**（#97）。
   *
   * ⚠ **意味が変わった**（2026-09-15）。**以前は「目標の幕を出さない旗」**で、
   *   目標額に届いた幕の上で「エンドレスモードへ」を押すと立つものだった。
   *   **いまは「商船を買った」印**で、**目標額に届いただけでは立たない。**
   * ⚠ **名前は変えない。**変えると**今あるセーブが読めなくなる**
   *   （`true` だったものが `undefined` になり、自由航行が解けて `∞ endless` も消える）。
   *   **意味だけが変わっている。**`GameService.isEndlessMode` にも同じ注記がある。
   */
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
  /**
   * ⚠ **もう誰も出さない**（#97。2026-09-15）。**目標額に届いても幕は出さない**ことにしたので、
   *   `GameService` の `emit` も `GameScene` の購読も消えた。
   *   **エンディングの入口は「商船を買う」**（`UpgradeMenu` の5行目 → `GameScene.buyShip()`）で、
   *   **同じ場面なので `EventBus` を挟まずその場で呼んでいる。**
   * ⚠ **名前だけ残してある。**`GameService.test.ts`（受入条件2）が
   *   **「目標額に届いても、これが出ないこと」**をこの名で見張っている。
   */
  PROGRESS_GOAL_COMPLETE: 'progress:goal-complete',
  /**
   * ⚠ **もう誰も出さない**（2026-09-15。計画 `rescue-and-no-gameover.md`）。
   *   **GAME OVER そのものを外した** —— **ただで買える救済の品**（`derive.ts` の `isRescueItem`）
   *   がどの島でも常に並ぶので、**所持金が 0 でも立ち直る手段がある。**
   *   **立ち直れるのに幕を出して終わらせない。**
   * ⚠ **名前だけ残してある**（`PROGRESS_GOAL_COMPLETE` と同じ扱い）。
   *   `GameService.test.ts` が**「所持金が 0 以下でも、これが出ないこと」**をこの名で見張っている。
   * ⚠ **`GameService.checkGoalAndGameOver()` は関数ごと消えた。**戻すなら、
   *   **救済の品で立ち直れないことを先に示すこと。**
   */
  PROGRESS_GAME_OVER: 'progress:game-over',
} as const

export type GameEventName = typeof GameEvents[keyof typeof GameEvents]
