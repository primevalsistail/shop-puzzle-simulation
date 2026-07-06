import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EconomyManager } from './EconomyManager.js'
import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'

describe('EconomyManager', () => {
  let em: EconomyManager

  beforeEach(() => {
    EventBus.removeAllListeners()
    em = new EconomyManager(10000)
  })

  it('初期資金が設定される', () => {
    expect(em.getMoney()).toBe(10000)
  })

  it('addRevenueで資金と累計売上が増える', () => {
    em.addRevenue(500)
    expect(em.getMoney()).toBe(10500)
    expect(em.getTotalRevenue()).toBe(500)
  })

  it('addRevenueでMONEY_CHANGEDを発火する', () => {
    const listener = vi.fn()
    EventBus.on(GameEvents.ECONOMY_MONEY_CHANGED, listener)
    em.addRevenue(200)
    expect(listener).toHaveBeenCalledWith(10200)
  })

  it('spendで資金を減らす', () => {
    const ok = em.spend(1000)
    expect(ok).toBe(true)
    expect(em.getMoney()).toBe(9000)
  })

  it('資金不足でspendはfalseを返す', () => {
    const ok = em.spend(99999)
    expect(ok).toBe(false)
    expect(em.getMoney()).toBe(10000)
  })

  it('資金不足でPURCHASE_FAILEDを発火する', () => {
    const listener = vi.fn()
    EventBus.on(GameEvents.ECONOMY_PURCHASE_FAILED, listener)
    em.spend(99999)
    expect(listener).toHaveBeenCalledWith(99999)
  })

  it('canAffordで資金確認', () => {
    expect(em.canAfford(5000)).toBe(true)
    expect(em.canAfford(50000)).toBe(false)
  })

  it('累計売上はspendに影響されない', () => {
    em.addRevenue(1000)
    em.spend(500)
    expect(em.getTotalRevenue()).toBe(1000)
  })
})
