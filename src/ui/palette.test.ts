/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import { MAIN_KINDS } from '../taxonomy/axes.js'
import { ALL_ITEMS } from '../taxonomy/items.js'
import {
  BG_SCREEN, BG_PANEL, BG_FLOOR, BG_WINDOW, LINE_STRONG, LINE_WEAK,
  TEXT_BODY, TEXT_SUB, TEXT_WEAK, ST_OK, ST_LOW, ST_NG, ST_SELECTED, ST_HOVER, ST_DISCARD,
  kindColor, css,
} from './palette.js'

const sources = {
  ...import.meta.glob('./*.ts', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('../scenes/*.ts', { eager: true, query: '?raw', import: 'default' }),
}

const strip = (src: string) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')

// ── 色の計算（`palette.ts` が正しいかを外から測るためだけに置く） ──
const chan = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255].map(v => v / 255)
const luminance = (c: number) => {
  const [r, g, b] = chan(c).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: number, b: number) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const lab = (c: number): [number, number, number] => {
  const [r, g, b] = chan(c).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047)
  const y = f(r * 0.2126 + g * 0.7152 + b * 0.0722)
  const z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}
const deltaE = (a: number, b: number) =>
  Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]))

const GROUNDS = { 画面: BG_SCREEN, 区画: BG_PANEL, 売り場: BG_FLOOR, 窓: BG_WINDOW }

describe('色は役割で呼ぶ', () => {
  /**
   * ⚠ **これが機構である。**以前は `src/ui` と `src/scenes` に **232箇所・155色**が
   *   直書きで、**同じ役割に別の値が当たっていても気づけなかった**（2026-09-14 に直した）。
   *   ここが落ちたら、**`palette.ts` に役割を足してからそれを呼ぶ。**値を直書きに戻さない。
   */
  it('⚠ `palette.ts` の外に生の色を書かない', () => {
    const offenders: string[] = []
    for (const [path, src] of Object.entries(sources)) {
      if (path.endsWith('/palette.ts') || path.includes('.test.')) continue
      const hits = strip(src as string)
        .match(/0x[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,8}\b/g)
      if (hits) offenders.push(`${path}: ${hits.join(' ')}`)
    }
    expect(offenders).toEqual([])
  })

  /** ⚠ **Phaser の文字色は文字列。**定数から作ること（片方だけ直す事故を防ぐ） */
  it('`css()` が Phaser に渡せる形を返す', () => {
    expect(css(TEXT_BODY)).toBe('#303a36')
    expect(css(0x0a0b0c)).toBe('#0a0b0c')
  })
})

describe('読めること・見分けが付くこと', () => {
  /** ⚠ **本文はどの地の上でも読める**（4.5 は普通の字の下限） */
  it('本文と副文がすべての地の上で読める', () => {
    for (const [name, bg] of Object.entries(GROUNDS)) {
      expect(contrast(TEXT_BODY, bg), `本文 / ${name}`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(TEXT_SUB, bg), `副文 / ${name}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  /**
   * ⚠ **弱い字は「読ませない字」。**押せないラベルにだけ使う。
   *   **理由の説明に使うと読めない**ので、3.0 を下限にして意図を残す。
   */
  it('弱い字は本文より薄いが、輪郭は追える', () => {
    for (const bg of Object.values(GROUNDS)) {
      expect(contrast(TEXT_WEAK, bg)).toBeGreaterThanOrEqual(3.0)
      expect(contrast(TEXT_WEAK, bg)).toBeLessThan(contrast(TEXT_BODY, bg))
    }
  })

  /** ⚠ **合図はどの地の上でも見える**（3.0 は線や枠の下限） */
  it('状態の6色がすべての地の上で見える', () => {
    for (const st of [ST_OK, ST_LOW, ST_NG, ST_SELECTED, ST_HOVER, ST_DISCARD]) {
      for (const bg of Object.values(GROUNDS)) {
        expect(contrast(st, bg)).toBeGreaterThanOrEqual(3.0)
      }
    }
  })

  /** ⚠ **升目の線は 130本引く。**品より目立つと盤面が網になる */
  it('升目の線は売り場の地から浮きすぎない', () => {
    expect(contrast(LINE_WEAK, BG_FLOOR)).toBeLessThan(contrast(LINE_STRONG, BG_FLOOR))
    expect(contrast(LINE_WEAK, BG_FLOOR)).toBeGreaterThan(1.1)
  })

  /** ⚠ **奥から手前へ明るくなる。**逆転すると窓が沈む */
  it('地は 画面 → 売り場 → 区画 → 窓 の順に明るい', () => {
    const order = [BG_SCREEN, BG_FLOOR, BG_PANEL, BG_WINDOW].map(luminance)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })
})

describe('品の色は主種類の4色', () => {
  /**
   * ⚠ **品ごとに色を持たせないこと**（PO 判断 2026-09-14「4色でいいよ」）。
   *   **161品それぞれに色を振っていた頃、見分けられない組が多数あった。**
   */
  it('品の定義が色を持たない', () => {
    for (const item of ALL_ITEMS) {
      expect(item.display).not.toHaveProperty('color')
    }
  })

  it('4色どうしが一目で見分けられる（ΔE 10 以上）', () => {
    const cols = MAIN_KINDS.map(kindColor)
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        expect(deltaE(cols[i], cols[j])).toBeGreaterThanOrEqual(10)
      }
    }
  })

  /** ⚠ **合図の上に品が乗る。**混ざると「置けない」の枠が品に見える */
  it('4色が状態の6色と混ざらない（ΔE 15 以上）', () => {
    for (const kind of MAIN_KINDS) {
      for (const st of [ST_OK, ST_LOW, ST_NG, ST_SELECTED, ST_HOVER, ST_DISCARD]) {
        expect(deltaE(kindColor(kind), st)).toBeGreaterThanOrEqual(15)
      }
    }
  })

  it('4色が売り場の地の上で見える', () => {
    for (const kind of MAIN_KINDS) {
      expect(contrast(kindColor(kind), BG_FLOOR)).toBeGreaterThan(1.3)
    }
  })
})
