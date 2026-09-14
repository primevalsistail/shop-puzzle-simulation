import type { FloorGrid } from '../components/floor/FloorGrid.js'
import type { Inventory } from '../components/economy/Inventory.js'
import type { CustomerSimulator } from '../components/simulation/CustomerSimulator.js'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { WorldState } from '../components/progress/WorldState.js'
import type { Upgrades } from '../components/progress/Upgrades.js'
import { EventBus } from './EventBus.js'
import { GameEvents } from '../types/index.js'
import type { DisplaySlot } from '../types/index.js'
import type { EvaluationResult, GameState, Placement } from '../taxonomy/evaluate.js'
import { evaluate } from '../taxonomy/evaluate.js'

/**
 * クリアの基準。**所持金**がこれに届いたら、**商船が買えるようになる**（#26 ／ #97）。
 *
 * ⚠ **届いただけでは何も起きない**（#97。2026-09-15）。**エンディングの入口は「商船を買う」**で、
 *   **商船の値段がこの額**（`ui/goal.ts` の `SHIP_COST`）。
 *   **届いた瞬間に幕を出していたのをやめた**ので、**目標額を見る判定はどこにも無い。**
 *
 * ⚠ **累計売上ではなく所持金で見る。**強化に払った金は目標から遠ざかるので、
 *   「いま強化を買うか、目標まで我慢するか」という判断がここから生まれる。
 *
 * ⚠ **目標額を書いてよいのはここだけ**（#73）。画面（チュートリアル・商船の値段・
 *   エンディングの幕）は `src/ui/goal.ts` を通して**この定数を引く。**
 *   以前は3箇所に別書きがあり、**画面は累計売上/100万・判定は所持金/1000万**という
 *   「軸も桁も違う」状態だった。**別書きが増えていないかは `goal.test.ts` が見ている。**
 *
 * ⚠ **この額はプレイ日数から逆算した値**（PO 2026-09-15「**プレイ日数から逆算したもの。
 *   切りのいい数字であればいい**」）。**1,000万は値段の決まり方を変える前の釣り合いから
 *   出た値で、そのままにはできなかった。**
 * ⚠ **測って決めた**（`src/sim/`。種1・400日）——
 *   **並べ方を工夫する遊び方で Day 185。**想定は
 *   `what-players-should-do.md` の「最短120日・理想160〜200日」で、**その帯の中央。**
 *   **工夫しない遊び方では Day 262。**⚠ **比 1.42倍はどの額でも変わらない。**
 * ⚠ **商船の値段もここから来る**（#97）。**変えると両方が動く。**
 */
export const GOAL_AMOUNT = 2_000_000

export class GameService {
  /**
   * **商船を買ったか＝エンディングを見たか**（#97）。
   *
   * ⚠ **意味が変わった**（2026-09-15）。**以前は「目標の幕を出さない旗」**で、
   *   目標額に届いた幕の上で「エンドレスモードへ」を押すと立つものだった。
   *   **いまは「商船（`ui/goal.ts` の `SHIP_COST`）を買った」印。**
   *   **目標額に届いただけでは立たないし、幕も出ない。**
   * ⚠ **名前は変えていない。**`SaveData.isEndlessMode` と同じ名で保存するので、
   *   **変えると今あるセーブが読めなくなる**（`src/types/index.ts` にも同じ注記）。
   * ⚠ **これが読まれるのは画面だけになった**（2026-09-15）。
   *   **GAME OVER そのものを外した**ので、「買った直後に幕を出さない」ための番も要らない
   *   （下の `setEndlessMode` の注記）。**読むのは HUD と改装タブの5行目。**
   */
  private isEndlessMode = false

  constructor(
    private floorGrid: FloorGrid,
    private inventory: Inventory,
    private customerSim: CustomerSimulator,
    private economy: EconomyManager,
    private world: WorldState,
    private upgrades: Upgrades,
  ) {}

  /**
   * 1ゲーム分ぶんの売買を回す。
   *
   * ⚠ `isOpen` が false の分には**客が来ない**（#25）。
   *   営業は 10:00-20:00 のみ。加工で飛ばした分も呼ばれない（TimeManager.skipMinutes）。
   *
   * ⚠ `isOpen` に既定値を置かない。既定 `true` は「渡し忘れたら営業中」＝
   *   呼び出し漏れが**閉店中の売買**として静かに通ってしまうため（SE-7）。
   */
  onMinutePassed(rng: () => number, isOpen: boolean): void {
    if (!isOpen) return
    const slots = this.floorGrid.getAllSlots()
    if (slots.length === 0) return

    const evaluation = this.evaluateFloor(slots)
    const sales = this.customerSim.simulateMinute(slots, evaluation, rng, {
      来客: this.upgrades.customerMultiplier(),
      利益率: this.upgrades.marginMultiplier(),
    })

    for (const sale of sales) {
      // 売れたら持ち物が減る。棚は「どこに出しているか」だけなので触らない
      this.inventory.remove(sale.itemId, sale.qtySold)
      this.economy.addRevenue(sale.revenue)
      // U2（その品を一定数売ると買えるようになる）が読む
      this.world.recordSale(sale.itemId, sale.qtySold)
      EventBus.emit(GameEvents.FLOOR_SLOT_SOLD, sale)
    }
  }

  /**
   * ⚠ **`checkGoalAndGameOver()` は 2026-09-15 に関数ごと消した**
   *   （計画 `construction/plans/rescue-and-no-gameover.md`）。
   *
   *   **目標側は #97 で外れ**（エンディングの入口は「商船を買う」）、
   *   **GAME OVER 側は「詰みを無くす」ことで要らなくなった** ——
   *   **ただで買える救済の品**（`derive.ts` の `isRescueItem`）が**どの島でも常に並ぶ**ので、
   *   **所持金が 0 でも、買って・並べて・売る手が残っている。**
   *   **立ち直る手段があるのに終わらせない**、というのがこの削除の中身である。
   *
   * ⚠ **戻すなら、救済の品で立ち直れないことを先に示すこと。**
   *   **`GameScene` の毎分の購読からも呼びを消してある**（`setupEvents`）。
   * ⚠ **`GameEvents.PROGRESS_GAME_OVER` は名前だけ残っている**（`src/types/index.ts`）。
   *   **誰も出さない**ことを `GameService.test.ts` が見張っている。
   */

  /** 盤面を規則にかける。**中身は下の `evaluateFloor()`**（写しを作らせないため外に出してある） */
  private evaluateFloor(slots: DisplaySlot[]) {
    return evaluateFloor(this.floorGrid, slots, this.world.getState())
  }

  /**
   * **商船を買った印**を立てる／降ろす（#94 ／ #97）。
   *
   * **立てる口は2つ** —— **商船を買ったとき**（`GameScene.buyShip()`）と、
   * **ロード**（`data.isEndlessMode` をそのまま渡す）。
   *
   * ⚠ **両方向あること。**以前は立てる口（`enterEndlessMode`）しか無く、
   *   **クリア済みのセーブを読んだあとにクリア前のセーブを読むと `∞ endless` が居座った。**
   *   ロードは `data.isEndlessMode` を**そのまま**渡すこと（`true` も `false` も）。
   * ⚠ **幕の控えを一緒に戻す必要はもう無い**（2026-09-15）。
   *   **GAME OVER の幕が無くなった**ので、降ろすものが印だけになった。
   * ⚠ **`enterEndlessMode()` は 2026-09-15 に消した**（#97）。
   *   **「エンドレスモードへ」のボタンが消えた**ので、**呼ぶ本番コードが無くなった。**
   */
  setEndlessMode(value: boolean): void {
    this.isEndlessMode = value
  }

  /** **商船を買ったか**（#97）。**改装タブの5行目**（`UpgradeMenu`）と HUD がこれを読む */
  isInEndlessMode(): boolean {
    return this.isEndlessMode
  }

  getGoalAmount(): number {
    return GOAL_AMOUNT
  }
}

/**
 * 盤面を規則にかける。**売買が毎分呼ぶのはこれ。**
 *
 * ⚠ **隣接はこちらで出して渡す。**`evaluate()` 既定の `adjacentPairs` は
 *   品の回転前のかたちで見るので、回転した品があると食い違う（#30）。
 *   **盤面を持っているのは `FloorGrid`** なので、実際の占有升目で出した組を渡す。
 *
 * ⚠ **`GameService` の外に出してあるのは、写しを作らせないため。**
 *   `src/sim/`（測る道具）が「いまの盤面で効き目が何倍か」を読むのにこれが要る。
 *   **中で組み立て直すと、#30 の直しが片側だけ古くなる。**
 */
export function evaluateFloor(
  floorGrid: FloorGrid, slots: readonly DisplaySlot[], state: GameState,
): EvaluationResult {
  const placements: Placement[] = slots.map(s => ({
    slotId: s.id,
    itemId: s.itemId,
    x: s.position.x,
    y: s.position.y,
  }))
  const byId = new Map(placements.map(p => [p.slotId, p]))

  const pairs: [Placement, Placement][] = []
  const seen = new Set<string>()
  for (const slot of slots) {
    for (const otherId of floorGrid.getAdjacentSlotIds(slot)) {
      const key = slot.id < otherId ? `${slot.id}|${otherId}` : `${otherId}|${slot.id}`
      if (seen.has(key)) continue
      seen.add(key)
      const a = byId.get(slot.id)
      const b = byId.get(otherId)
      if (a && b) pairs.push([a, b])
    }
  }

  return evaluate(placements, state, undefined, pairs)
}
