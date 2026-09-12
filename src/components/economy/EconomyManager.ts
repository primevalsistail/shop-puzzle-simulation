import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'

/**
 * 開始の所持金。
 *
 * ⚠ **大きくしないこと。**初日に島の商人の品を999個ずつ買えてしまうと
 *   「個数で殴る」形になる。5000 なら仕入れは1日数十個が上限で、
 *   **最初の数日は棚を埋められない**ところから始まる。
 */
const STARTING_MONEY = 5000

export class EconomyManager {
  private money: number
  private totalRevenue: number = 0

  constructor(initialMoney: number = STARTING_MONEY) {
    this.money = initialMoney
  }

  getMoney(): number {
    return this.money
  }

  getTotalRevenue(): number {
    return this.totalRevenue
  }

  addRevenue(amount: number): void {
    this.money += amount
    this.totalRevenue += amount
    EventBus.emit(GameEvents.ECONOMY_MONEY_CHANGED, this.money)
  }

  /**
   * **売上に積まない入金**（#28 の納品報酬）。
   *
   * ⚠ **`addRevenue` と分けてある理由**: `totalRevenue` は
   * **「客に売れた額」**であって「入った金」ではない。**納品ぶんを積むと
   * 『どれだけ売ったか』が嘘になる。**
   * ⚠ **客に売れた経路以外の入金は、必ずこちらを通すこと。**
   *
   * ⚠ **#73 以降、進捗バーと目標達成の幕はこれを読まない**（クリア条件と同じ**所持金**を読む）。
   *   いま `totalRevenue` を出しているのはセーブ枠の一覧（`SaveLoadMenu`）だけである。
   */
  addIncome(amount: number): void {
    this.money += amount
    EventBus.emit(GameEvents.ECONOMY_MONEY_CHANGED, this.money)
  }

  spend(amount: number): boolean {
    if (this.money < amount) {
      EventBus.emit(GameEvents.ECONOMY_PURCHASE_FAILED, amount)
      return false
    }
    this.money -= amount
    EventBus.emit(GameEvents.ECONOMY_MONEY_CHANGED, this.money)
    return true
  }

  canAfford(amount: number): boolean {
    return this.money >= amount
  }

  restore(money: number, totalRevenue: number): void {
    this.money = money
    this.totalRevenue = totalRevenue
    EventBus.emit(GameEvents.ECONOMY_MONEY_CHANGED, this.money)
  }
}
