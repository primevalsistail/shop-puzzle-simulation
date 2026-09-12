import { describe, it, expect, beforeEach } from 'vitest'
import { Inventory } from './Inventory.js'

describe('Inventory', () => {
  let inv: Inventory

  beforeEach(() => {
    inv = new Inventory()
  })

  it('初期状態で全アイテム0', () => {
    expect(inv.getQuantity('snap_pea')).toBe(0)
    expect(inv.getTypeCount()).toBe(0)
  })

  it('addで数量を追加する', () => {
    inv.add('snap_pea', 5)
    expect(inv.getQuantity('snap_pea')).toBe(5)
  })

  it('addは上限（99999）を超えない', () => {
    inv.add('snap_pea', 50000)
    inv.add('snap_pea', 60000)
    expect(inv.getQuantity('snap_pea')).toBe(99999)
  })

  it('確認用の初期在庫10000はそのまま入る（上限で切られない）', () => {
    inv.setInitialStock({ snap_pea: 10000 })
    expect(inv.getQuantity('snap_pea')).toBe(10000)
  })

  it('removeで数量を減らす', () => {
    inv.add('snap_pea', 10)
    const ok = inv.remove('snap_pea', 3)
    expect(ok).toBe(true)
    expect(inv.getQuantity('snap_pea')).toBe(7)
  })

  it('数量不足でremoveはfalseを返す', () => {
    inv.add('snap_pea', 2)
    const ok = inv.remove('snap_pea', 5)
    expect(ok).toBe(false)
    expect(inv.getQuantity('snap_pea')).toBe(2)
  })

  it('0になったらアイテムを削除する', () => {
    inv.add('snap_pea', 3)
    inv.remove('snap_pea', 3)
    expect(inv.getQuantity('snap_pea')).toBe(0)
    expect(inv.getTypeCount()).toBe(0)
  })

  it('hasEnoughで在庫確認', () => {
    inv.add('buckwheat', 5)
    expect(inv.hasEnough('buckwheat', 3)).toBe(true)
    expect(inv.hasEnough('buckwheat', 6)).toBe(false)
  })

  it('getAllStockで全在庫を返す', () => {
    inv.add('snap_pea', 3)
    inv.add('buckwheat_flour', 2)
    const stock = inv.getAllStock()
    expect(stock.snap_pea).toBe(3)
    expect(stock.buckwheat_flour).toBe(2)
  })

  it('getTypeCountで種類数を返す', () => {
    inv.add('snap_pea', 1)
    inv.add('buckwheat_flour', 1)
    expect(inv.getTypeCount()).toBe(2)
  })

  it('setInitialStockで初期在庫を設定する', () => {
    inv.setInitialStock({ snap_pea: 10, buckwheat_flour: 5 })
    expect(inv.getQuantity('snap_pea')).toBe(10)
    expect(inv.getQuantity('buckwheat_flour')).toBe(5)
  })

  describe('一度でも手に入れたことがある品', () => {
    it('足すと覚える', () => {
      const inv = new Inventory()
      expect(inv.hasEverHeld('snap_pea')).toBe(false)
      inv.add('snap_pea', 3)
      expect(inv.hasEverHeld('snap_pea')).toBe(true)
    })

    it('⚠ 減って0になっても忘れない（また仕入れられるので一覧に残す）', () => {
      const inv = new Inventory()
      inv.add('snap_pea', 3)
      inv.remove('snap_pea', 3)
      expect(inv.getQuantity('snap_pea')).toBe(0)
      expect(inv.hasEverHeld('snap_pea')).toBe(true)
    })

    it('0個を足しても覚えない', () => {
      const inv = new Inventory()
      inv.add('snap_pea', 0)
      expect(inv.hasEverHeld('snap_pea')).toBe(false)
    })

    it('開始在庫も覚える', () => {
      const inv = new Inventory()
      inv.setInitialStock({ snap_pea: 15, apple: 15 })
      expect(inv.hasEverHeld('snap_pea')).toBe(true)
      expect(inv.hasEverHeld('apple')).toBe(true)
      expect(inv.hasEverHeld('buckwheat')).toBe(false)
    })

    it('保存して読み直すと戻る', () => {
      const inv = new Inventory()
      inv.add('snap_pea', 1); inv.add('apple', 1)
      const restored = new Inventory()
      restored.restoreEverHeld(inv.getEverHeld())
      expect(restored.hasEverHeld('snap_pea')).toBe(true)
      expect(restored.hasEverHeld('apple')).toBe(true)
      expect(restored.hasEverHeld('buckwheat')).toBe(false)
    })
  })
})
