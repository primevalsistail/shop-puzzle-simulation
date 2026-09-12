import { describe, it, expect } from 'vitest'
import { ListPaging } from './ListPaging.js'
import type { MainKind } from '../taxonomy/axes.js'

type Row = { id: string; kind: MainKind }
const rows: Row[] = [
  { id: 'a', kind: '食料' }, { id: 'b', kind: '食料' }, { id: 'c', kind: '飲みもの' },
  { id: 'd', kind: '衣類' }, { id: 'e', kind: '道具' }, { id: 'f', kind: '食料' },
  { id: 'g', kind: '道具' },
]
const kindOf = (r: Row) => r.kind

describe('ListPaging — 絞り込み', () => {
  it('既定は絞り込みなし（全部出る）', () => {
    const p = new ListPaging(3)
    expect(p.hasFilter()).toBe(false)
    expect(p.filter(rows, kindOf)).toHaveLength(7)
  })

  it('1つ選ぶとそれだけになる', () => {
    const p = new ListPaging(3)
    p.toggleKind('食料')
    expect(p.hasFilter()).toBe(true)
    expect(p.filter(rows, kindOf).map(r => r.id)).toEqual(['a', 'b', 'f'])
  })

  it('同じものをもう一度押すと外れる（＝全部出る）', () => {
    const p = new ListPaging(3)
    p.toggleKind('食料')
    p.toggleKind('食料')
    expect(p.hasFilter()).toBe(false)
    expect(p.filter(rows, kindOf)).toHaveLength(7)
  })

  it('2つ選ぶと両方出る', () => {
    const p = new ListPaging(3)
    p.toggleKind('食料')
    p.toggleKind('道具')
    expect(p.filter(rows, kindOf).map(r => r.id)).toEqual(['a', 'b', 'e', 'f', 'g'])
  })

  it('全部選ぶと絞り込みは外れる（全部外したときと同じ）', () => {
    const p = new ListPaging(3)
    for (const k of ['食料', '飲みもの', '衣類', '道具'] as MainKind[]) p.toggleKind(k)
    expect(p.hasFilter()).toBe(false)
    expect(p.filter(rows, kindOf)).toHaveLength(7)
  })

  it('絞り込みを変えると1ページ目へ戻る', () => {
    const p = new ListPaging(3)
    p.setPage(2, 7)
    expect(p.currentPage(7)).toBe(2)
    p.toggleKind('食料')
    expect(p.currentPage(3)).toBe(0)
  })
})

describe('ListPaging — ページ', () => {
  it('ページ数は切り上げ', () => {
    const p = new ListPaging(3)
    expect(p.pageCount(7)).toBe(3)
    expect(p.pageCount(6)).toBe(2)
    expect(p.pageCount(0)).toBe(1)
  })

  it('slice はそのページぶんだけ返す', () => {
    const p = new ListPaging(3)
    expect(p.slice(rows).map(r => r.id)).toEqual(['a', 'b', 'c'])
    p.movePage(1, 7)
    expect(p.slice(rows).map(r => r.id)).toEqual(['d', 'e', 'f'])
    p.movePage(1, 7)
    expect(p.slice(rows).map(r => r.id)).toEqual(['g'])
  })

  it('端を越えて送れない', () => {
    const p = new ListPaging(3)
    expect(p.movePage(-1, 7)).toBe(false)
    p.setPage(2, 7)
    expect(p.movePage(1, 7)).toBe(false)
  })

  it('件数が減ったら最後のページへ寄る', () => {
    const p = new ListPaging(3)
    p.setPage(2, 7)
    expect(p.currentPage(3)).toBe(0)   // 3件なら1ページしかない
  })

  it('表示', () => {
    const p = new ListPaging(3)
    expect(p.pageLabel(7)).toBe('1 / 3')
    expect(p.rangeLabel(7)).toBe('1-3 / 7')
    p.setPage(2, 7)
    expect(p.rangeLabel(7)).toBe('7-7 / 7')
    expect(p.pageLabel(0)).toBe('- / -')
    expect(p.rangeLabel(0)).toBe('0件')
  })
})

describe('ListPaging — 指定した位置へ飛ぶ（棚から「これを補充したい」と来たとき）', () => {
  it('その位置が映るページへ移る', () => {
    const p = new ListPaging(3)
    p.jumpTo(0, 7); expect(p.currentPage(7)).toBe(0)
    p.jumpTo(4, 7); expect(p.currentPage(7)).toBe(1)
    p.jumpTo(6, 7); expect(p.currentPage(7)).toBe(2)
  })

  it('見つからなかった（-1）ときは動かない', () => {
    const p = new ListPaging(3)
    p.setPage(2, 7)
    p.jumpTo(-1, 7)
    expect(p.currentPage(7)).toBe(2)
  })

  it('範囲を超えても最後のページに収まる', () => {
    const p = new ListPaging(3)
    p.jumpTo(99, 7)
    expect(p.currentPage(7)).toBe(2)
  })
})
