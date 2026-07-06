import { describe, it, expect, beforeEach } from 'vitest'
import { Inventory } from './Inventory.js'

describe('Inventory', () => {
  let inv: Inventory

  beforeEach(() => {
    inv = new Inventory()
  })

  it('初期状態で全アイテム0', () => {
    expect(inv.getQuantity('apple')).toBe(0)
    expect(inv.getTypeCount()).toBe(0)
  })

  it('addで数量を追加する', () => {
    inv.add('apple', 5)
    expect(inv.getQuantity('apple')).toBe(5)
  })

  it('addは999を超えない', () => {
    inv.add('apple', 500)
    inv.add('apple', 600)
    expect(inv.getQuantity('apple')).toBe(999)
  })

  it('removeで数量を減らす', () => {
    inv.add('apple', 10)
    const ok = inv.remove('apple', 3)
    expect(ok).toBe(true)
    expect(inv.getQuantity('apple')).toBe(7)
  })

  it('数量不足でremoveはfalseを返す', () => {
    inv.add('apple', 2)
    const ok = inv.remove('apple', 5)
    expect(ok).toBe(false)
    expect(inv.getQuantity('apple')).toBe(2)
  })

  it('0になったらアイテムを削除する', () => {
    inv.add('apple', 3)
    inv.remove('apple', 3)
    expect(inv.getQuantity('apple')).toBe(0)
    expect(inv.getTypeCount()).toBe(0)
  })

  it('hasEnoughで在庫確認', () => {
    inv.add('flour', 5)
    expect(inv.hasEnough('flour', 3)).toBe(true)
    expect(inv.hasEnough('flour', 6)).toBe(false)
  })

  it('getAllStockで全在庫を返す', () => {
    inv.add('apple', 3)
    inv.add('bread', 2)
    const stock = inv.getAllStock()
    expect(stock.apple).toBe(3)
    expect(stock.bread).toBe(2)
  })

  it('getTypeCountで種類数を返す', () => {
    inv.add('apple', 1)
    inv.add('bread', 1)
    expect(inv.getTypeCount()).toBe(2)
  })

  it('setInitialStockで初期在庫を設定する', () => {
    inv.setInitialStock({ apple: 10, bread: 5 })
    expect(inv.getQuantity('apple')).toBe(10)
    expect(inv.getQuantity('bread')).toBe(5)
  })
})
