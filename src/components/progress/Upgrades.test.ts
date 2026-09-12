import { describe, it, expect } from 'vitest'
import { Upgrades, UPGRADE_KINDS, MAX_STAGE } from './Upgrades.js'
import { SKILL_INITIAL, SKILL_MAX } from '../../taxonomy/craft.js'

describe('Upgrades', () => {
  it('どの系統も0段から始まる', () => {
    const u = new Upgrades()
    for (const k of UPGRADE_KINDS) expect(u.getStage(k)).toBe(0)
  })

  it('初期の効き目は素のまま', () => {
    const u = new Upgrades()
    expect(u.gridSize()).toEqual({ width: 6, height: 5 })
    expect(u.customerMultiplier()).toBe(1.0)
    expect(u.marginMultiplier()).toBe(1.0)
    expect(u.skill()).toBe(SKILL_INITIAL)
  })

  it('最大まで進めると 13×10・3.0倍・手際30 になる', () => {
    const u = new Upgrades()
    for (const k of UPGRADE_KINDS) for (let i = 0; i < MAX_STAGE; i++) u.advance(k)
    expect(u.gridSize()).toEqual({ width: 13, height: 10 })
    expect(u.customerMultiplier()).toBe(3.0)
    expect(u.marginMultiplier()).toBe(3.0)
    // ⚠ 上限まで刻む。途中で止めると深い品だけが倍率の床に届かない
    expect(u.skill()).toBe(SKILL_MAX)
  })

  it('上限を超えて進められない', () => {
    const u = new Upgrades()
    for (let i = 0; i < MAX_STAGE; i++) expect(u.advance('棚')).toBe(true)
    expect(u.advance('棚')).toBe(false)
    expect(u.isMaxed('棚')).toBe(true)
    expect(u.nextCost('棚')).toBeNull()
  })

  it('費用は段が進むほど高い', () => {
    for (const k of UPGRADE_KINDS) {
      const u = new Upgrades()
      let prev = 0
      for (let i = 0; i < MAX_STAGE; i++) {
        const cost = u.nextCost(k)!
        expect(cost, `${k} の ${i + 1}段目`).toBeGreaterThan(prev)
        prev = cost
        u.advance(k)
      }
    }
  })

  it('棚は1辺ずつ交互に伸び、縦横比が 6:5 から離れない', () => {
    const u = new Upgrades()
    const ratios: number[] = []
    const areas: number[] = []
    for (let i = 0; i <= MAX_STAGE; i++) {
      const g = u.gridSize()
      ratios.push(g.width / g.height)
      areas.push(g.width * g.height)
      u.advance('棚')
    }
    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(1.1)
    expect(Math.max(...ratios)).toBeLessThanOrEqual(1.3)
    // 升目は単調に増え、全体で約4.3倍
    for (let i = 1; i < areas.length; i++) expect(areas[i]).toBeGreaterThan(areas[i - 1])
    expect(areas[areas.length - 1] / areas[0]).toBeCloseTo(4.33, 1)
  })

  it('⚠ 画面に入る大きさに収まっている（最大 14×10）', () => {
    const u = new Upgrades()
    for (let i = 0; i < MAX_STAGE; i++) u.advance('棚')
    const g = u.gridSize()
    expect(g.width).toBeLessThanOrEqual(14)
    expect(g.height).toBeLessThanOrEqual(10)
  })

  it('保存して読み直すと段が戻る', () => {
    const u = new Upgrades()
    u.advance('棚'); u.advance('棚'); u.advance('手際')
    const restored = new Upgrades()
    restored.restore(u.toRecord())
    expect(restored.getStage('棚')).toBe(2)
    expect(restored.getStage('手際')).toBe(1)
    expect(restored.getStage('来客')).toBe(0)
  })

  it('壊れた保存データを読んでも段の範囲に収まる', () => {
    const u = new Upgrades()
    u.restore({ 棚: 99, 来客: -3, 利益率: 1.7, 手際: NaN })
    expect(u.getStage('棚')).toBe(MAX_STAGE)
    expect(u.getStage('来客')).toBe(0)
    expect(u.getStage('利益率')).toBe(1)
    expect(u.getStage('手際')).toBe(0)
  })
})
