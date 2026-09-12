import { describe, it, expect } from 'vitest'
import { subtractRect, contains, type Rect } from './rects.js'
import { GRID_ORIGIN_X, GRID_ORIGIN_Y, CELL_SIZE, DISCARD_MARGIN } from './FloorRenderer.js'
import { SCREEN_W, SCREEN_H } from './layout.js'

const area = (rs: Rect[]) => rs.reduce((s, r) => s + r.w * r.h, 0)

describe('subtractRect', () => {
  const outer: Rect = { x: 0, y: 0, w: 10, h: 10 }

  it('重なっていなければ、そのまま返す', () => {
    expect(subtractRect(outer, { x: 20, y: 20, w: 5, h: 5 })).toEqual([outer])
  })

  it('辺で接しているだけなら、そのまま返す', () => {
    expect(subtractRect(outer, { x: 10, y: 0, w: 5, h: 10 })).toEqual([outer])
  })

  it('丸ごと覆われたら空', () => {
    expect(subtractRect(outer, { x: -1, y: -1, w: 12, h: 12 })).toEqual([])
  })

  it('真ん中をくり抜くと4つに割れる', () => {
    const parts = subtractRect(outer, { x: 3, y: 3, w: 4, h: 4 })
    expect(parts).toHaveLength(4)
    expect(area(parts)).toBe(10 * 10 - 4 * 4)
  })

  it('角を欠くと2つ', () => {
    const parts = subtractRect(outer, { x: -2, y: -2, w: 5, h: 5 })
    expect(area(parts)).toBe(100 - 3 * 3)
  })

  it('残った矩形どうしは重ならない', () => {
    const parts = subtractRect(outer, { x: 3, y: 3, w: 4, h: 4 })
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const hit = parts.filter(r => contains(r, x, y)).length
        const inHole = x >= 3 && x < 7 && y >= 3 && y < 7
        expect(hit, `(${x},${y})`).toBe(inHole ? 0 : 1)
      }
    }
  })

  it('幅か高さが0なら空', () => {
    expect(subtractRect({ x: 0, y: 0, w: 0, h: 5 }, { x: 0, y: 0, w: 1, h: 1 })).toEqual([])
  })
})

/**
 * ⚠ **この不具合そのもののテスト。**
 *   破棄ゾーンの上端は y 0〜56、盤面の1行目は y 8〜66。
 *   **1行目の 82% が破棄ゾーンに重なっていて、
 *   「一番上の行へ動かそうとすると棚から外れる」**状態だった。
 */
describe('破棄ゾーンと盤面（この不具合の再発を止める）', () => {
  const gridRect = (w: number, h: number): Rect => ({
    x: GRID_ORIGIN_X, y: GRID_ORIGIN_Y, w: w * CELL_SIZE, h: h * CELL_SIZE,
  })
  const topBand: Rect = { x: 0, y: 0, w: SCREEN_W, h: DISCARD_MARGIN }

  it('盤面の1行目は、そのままだと上端の帯に食い込む', () => {
    const g = gridRect(6, 5)
    expect(g.y).toBeLessThan(DISCARD_MARGIN)          // 8 < 56
    expect(g.y + CELL_SIZE).toBeGreaterThan(DISCARD_MARGIN)  // 66 > 56
  })

  it('盤面をくり抜けば、1行目の上に破棄ゾーンが残らない', () => {
    for (const [w, h] of [[6, 5], [7, 6], [9, 8], [13, 10]] as const) {
      const g = gridRect(w, h)
      const parts = subtractRect(topBand, g)
      // 盤面の1行目の真ん中の点が、どの破棄ゾーンにも入らない
      const cx = g.x + CELL_SIZE / 2
      const cy = g.y + CELL_SIZE / 2
      expect(parts.some(r => contains(r, cx, cy)), `${w}x${h}`).toBe(false)
    }
  })

  it('盤面の外の上端は、破棄ゾーンのまま残る', () => {
    const parts = subtractRect(topBand, gridRect(6, 5))
    expect(parts.some(r => contains(r, 10, 10))).toBe(true)            // 左パネルの上
    expect(parts.some(r => contains(r, SCREEN_W - 10, 10))).toBe(true) // 右パネルの上
    expect(parts.some(r => contains(r, GRID_ORIGIN_X + 10, 2))).toBe(true) // 盤面の真上の細い帯
  })

  it('左・右・下の帯は盤面と重ならない（重なったら同じ不具合が起きる）', () => {
    const g = gridRect(13, 10)   // いちばん広い盤面
    expect(g.x).toBeGreaterThanOrEqual(DISCARD_MARGIN)
    expect(g.x + g.w).toBeLessThanOrEqual(SCREEN_W - DISCARD_MARGIN)
    expect(g.y + g.h).toBeLessThanOrEqual(SCREEN_H - DISCARD_MARGIN)
  })
})
