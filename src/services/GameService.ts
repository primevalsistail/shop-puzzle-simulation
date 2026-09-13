import type { FloorGrid } from '../components/floor/FloorGrid.js'
import type { Inventory } from '../components/economy/Inventory.js'
import type { CustomerSimulator } from '../components/simulation/CustomerSimulator.js'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { WorldState } from '../components/progress/WorldState.js'
import type { Upgrades } from '../components/progress/Upgrades.js'
import { EventBus } from './EventBus.js'
import { GameEvents } from '../types/index.js'
import type { DisplaySlot } from '../types/index.js'
import type { Placement } from '../taxonomy/evaluate.js'
import { evaluate } from '../taxonomy/evaluate.js'

/**
 * クリアの基準。**所持金**がこれに届いたら、**商船が買えるようになる**（#26 ／ #97）。
 *
 * ⚠ **届いただけでは何も起きない**（#97。2026-09-15）。**エンディングの入口は「商船を買う」**で、
 *   **商船の値段がこの額**（`ui/goal.ts` の `SHIP_COST`）。
 *   **届いた瞬間に幕を出していたのをやめた**ので、`checkGoalAndGameOver()` は目標を見ない。
 *
 * ⚠ **累計売上ではなく所持金で見る。**強化に払った金は目標から遠ざかるので、
 *   「いま強化を買うか、目標まで我慢するか」という判断がここから生まれる。
 *
 * ⚠ **目標額を書いてよいのはここだけ**（#73）。画面（チュートリアル・商船の値段・
 *   エンディングの幕）は `src/ui/goal.ts` を通して**この定数を引く。**
 *   以前は3箇所に別書きがあり、**画面は累計売上/100万・判定は所持金/1000万**という
 *   「軸も桁も違う」状態だった。**別書きが増えていないかは `goal.test.ts` が見ている。**
 */
export const GOAL_AMOUNT = 10_000_000

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
   * ⚠ **立っているあいだは GAME OVER も出ない**（下の `checkGoalAndGameOver`）。
   *   **商船の値段は目標額と同じ**なので、ぴったりで買うと所持金が 0 になる ——
   *   **エンディングの直後に GAME OVER を出さないため**に、ここで止めている。
   */
  private isEndlessMode = false
  /**
   * GAME OVER の幕を出したか。**`checkGoalAndGameOver()` を何度呼んでも、幕は1回だけ**
   * （#93 受入条件2）。
   *
   * ⚠ **ロードで降ろす**（`setEndlessMode`）。読み直したら幕はまた出せる状態に戻る。
   * ⚠ **目標側の控え（`goalShown`）は 2026-09-15 に消した**（#97）。
   *   **目標額に届いても幕を出さなくなった**ので、数える幕が無い。
   */
  private gameOverShown = false

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
   * GAME OVER を見る。**所持金だけを見る**（#93）。
   *
   * ⚠ **目標側の半分は 2026-09-15 に消した**（#97）。**所持金が目標額に届いても何も起きない。**
   *   **エンディングの入口は「商船を買う」**（`UpgradeMenu` の5行目 → `GameScene.buyShip()`）。
   *   ⚠ **戻さないこと。**戻すと、**商船を買う前に幕が出てしまう。**
   *   **「届いても幕が出ない」ことは `GameService.test.ts`（受入条件2）が見ている。**
   * ⚠ **名前は `checkGoalAndGameOver` のまま。**見るものは GAME OVER だけになった。
   *
   * ⚠ **売買の中に戻さないこと。**以前はこの判定が `onMinutePassed()` の
   *   `if (!isOpen) return` と `if (slots.length === 0) return` の**後ろ**にあり、
   *   **棚が空だと詰んでも GAME OVER が出ず、閉店中も出なかった。**
   *   **目標も破産も、営業時間とも棚の中身とも関係が無い。**
   * ⚠ **判定はここ1箇所。**呼ぶのは `TIME_MINUTE_PASSED` の購読（`GameScene.setupEvents`）で、
   *   **`onMinutePassed()` のすぐ後ろ、その外**。
   *   - **外**だから、`isOpen` にも棚の空にも遮られない（これが #93 の直し）
   *   - **後ろ**だから、**その分で売れて所持金が戻れば幕は出ない**
   * ⚠ **`ECONOMY_MONEY_CHANGED` で呼ばないこと。**`canAfford()` は `>=` なので
   *   **残金ちょうどの仕入れが通り、その `spend()` がそのまま GAME OVER になる。**
   *   **所持金を全部仕入れに突っ込むのは正当な戦略**で、即死にしてはいけない
   *   （2026-09-14 に一度入れて戻した。`GameService.test.ts` の「残金ちょうど」が見ている）。
   * ⚠ **届いたあとは毎分通る。**同じ幕を2回出さないよう、出したかをここで覚える。
   */
  checkGoalAndGameOver(): void {
    // ⚠ **商船を買ったあとは GAME OVER も出さない**（#97）。**商船の値段は目標額と同じ**なので、
    //   ぴったりで買うと所持金が 0 になる —— ここを外すと**エンディングの次の分で GAME OVER** になる
    if (this.isEndlessMode) return
    const current = this.economy.getMoney()
    if (!this.gameOverShown && current <= 0) {
      this.gameOverShown = true
      EventBus.emit(GameEvents.PROGRESS_GAME_OVER, current)
    }
  }

  /**
   * 盤面を規則にかける。
   *
   * ⚠ **隣接はこちらで出して渡す。**`evaluate()` 既定の `adjacentPairs` は
   *   品の回転前のかたちで見るので、回転した品があると食い違う（#30）。
   */
  private evaluateFloor(slots: DisplaySlot[]) {
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
      for (const otherId of this.floorGrid.getAdjacentSlotIds(slot)) {
        const key = slot.id < otherId ? `${slot.id}|${otherId}` : `${otherId}|${slot.id}`
        if (seen.has(key)) continue
        seen.add(key)
        const a = byId.get(slot.id)
        const b = byId.get(otherId)
        if (a && b) pairs.push([a, b])
      }
    }

    return evaluate(placements, this.world.getState(), undefined, pairs)
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
   * ⚠ **幕を出したかも一緒に戻す。**戻さないと、旗を降ろしたのに
   *   **もう一度詰んでも GAME OVER が出ない**（#94 受入条件4 の形）。
   * ⚠ **`enterEndlessMode()` は 2026-09-15 に消した**（#97）。
   *   **「エンドレスモードへ」のボタンが消えた**ので、**呼ぶ本番コードが無くなった。**
   */
  setEndlessMode(value: boolean): void {
    this.isEndlessMode = value
    this.gameOverShown = false
  }

  /** **商船を買ったか**（#97）。**改装タブの5行目**（`UpgradeMenu`）と HUD がこれを読む */
  isInEndlessMode(): boolean {
    return this.isEndlessMode
  }

  getGoalAmount(): number {
    return GOAL_AMOUNT
  }
}
