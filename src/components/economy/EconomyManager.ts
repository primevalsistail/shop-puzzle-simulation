import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'

/**
 * 開始の所持金。
 *
 * ⚠ **50000 から下げた**（2026-09-11）。50000 あると初日に島の商人の品を
 *   999個ずつ買えてしまい、**テスト用の全品所持と同じ「個数で殴る」形**に戻る。
 *   5000 なら仕入れは1日数十個が上限で、**最初の数日は棚を埋められない**ところから始まる。
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
