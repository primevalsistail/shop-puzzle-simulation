import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'

const STARTING_MONEY = 50000

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
