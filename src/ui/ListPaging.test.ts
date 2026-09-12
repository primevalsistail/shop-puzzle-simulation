import { describe, it, expect } from 'vitest'
import { ListPaging } from './ListPaging.js'
import type { ItemDef, MainKind } from '../taxonomy/axes.js'
import { ALL_ITEMS } from '../taxonomy/items.js'

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

describe('名前での検索（#55）', () => {
  type Named = { name: string; kind: MainKind }
  const shelf: Named[] = [
    { name: '羊の乳',      kind: '飲みもの' },
    { name: '山羊の乳',    kind: '飲みもの' },
    { name: '蕎麦粉のパン', kind: '食料' },
    { name: 'りんご',      kind: '食料' },
    { name: '麻のシャツ',  kind: '衣類' },
  ]
  const nameOf = (r: Named) => r.name
  const kindOf = (r: Named) => r.kind

  it('既定では効かない（全部出る）', () => {
    const p = new ListPaging(3)
    expect(p.hasQuery()).toBe(false)
    expect(p.filter(shelf, kindOf, nameOf)).toHaveLength(5)
  })

  it('名前の一部で絞れる', () => {
    const p = new ListPaging(3)
    p.setQuery('乳')
    expect(p.filter(shelf, kindOf, nameOf).map(nameOf)).toEqual(['羊の乳', '山羊の乳'])
  })

  it('前後の空白は落とす', () => {
    const p = new ListPaging(3)
    p.setQuery('  りんご  ')
    expect(p.getQuery()).toBe('りんご')
    expect(p.filter(shelf, kindOf, nameOf)).toHaveLength(1)
  })

  it('空文字に戻すと全部出る', () => {
    const p = new ListPaging(3)
    p.setQuery('乳')
    p.setQuery('')
    expect(p.hasQuery()).toBe(false)
    expect(p.filter(shelf, kindOf, nameOf)).toHaveLength(5)
  })

  /** ⚠ 片方だけで絞ると、押した絞り込みが無視されたように見える */
  it('主種類の絞り込みと AND で効く', () => {
    const p = new ListPaging(3)
    p.toggleKind('飲みもの')
    p.setQuery('羊')
    expect(p.filter(shelf, kindOf, nameOf).map(nameOf)).toEqual(['羊の乳', '山羊の乳'])
    p.setQuery('パン')  // 食料なので、飲みものの絞り込みとは両立しない
    expect(p.filter(shelf, kindOf, nameOf)).toHaveLength(0)
  })

  it('nameOf を渡さない画面では効かない', () => {
    const p = new ListPaging(3)
    p.setQuery('乳')
    expect(p.filter(shelf, kindOf)).toHaveLength(5)
  })

  /** ⚠ 絞った結果が1ページに収まるのに、2ページ目のままだと空に見える */
  it('問い合わせが変わるとページが先頭へ戻る', () => {
    const p = new ListPaging(2)
    p.setPage(1, 5)
    expect(p.currentPage(5)).toBe(1)
    p.setQuery('乳')
    expect(p.currentPage(2)).toBe(0)
  })

  it('同じ文字で呼び直してもページは動かない', () => {
    const p = new ListPaging(2)
    p.setQuery('の')
    p.setPage(1, 4)
    p.setQuery('の')
    expect(p.currentPage(4)).toBe(1)
  })
})

describe('読みでの検索（#65）', () => {
  type Yomi = { name: string; reading: string; kind: MainKind }
  const shelf: Yomi[] = [
    { name: '羊の乳',        reading: 'ひつじのちち',   kind: '飲みもの' },
    { name: '蕎麦粉のパン',  reading: 'そばこのぱん',   kind: '食料' },
    { name: 'アスパラガス',  reading: 'あすぱらがす',   kind: '食料' },
    { name: 'りんご',        reading: 'りんご',         kind: '食料' },
    { name: '毛皮裏の外套',  reading: 'けがわうらのがいとう', kind: '衣類' },
  ]
  const kindOf = (r: Yomi) => r.kind
  const nameOf = (r: Yomi) => r.name
  const readingOf = (r: Yomi) => r.reading
  const names = (rows: Yomi[]) => rows.map(nameOf)

  it('漢字の品をかなで引ける（#65 本文の例）', () => {
    const p = new ListPaging(5)
    p.setQuery('ひつじ')
    expect(names(p.filter(shelf, kindOf, nameOf, readingOf))).toEqual(['羊の乳'])
    p.setQuery('そば')
    expect(names(p.filter(shelf, kindOf, nameOf, readingOf))).toEqual(['蕎麦粉のパン'])
  })

  it('カタカナだけの品もかなで引ける（一律に持たせた効き目）', () => {
    const p = new ListPaging(5)
    p.setQuery('あすぱら')
    expect(names(p.filter(shelf, kindOf, nameOf, readingOf))).toEqual(['アスパラガス'])
  })

  it('名前でも従来どおり引ける（退行防止）', () => {
    const p = new ListPaging(5)
    p.setQuery('羊')
    expect(names(p.filter(shelf, kindOf, nameOf, readingOf))).toEqual(['羊の乳'])
    p.setQuery('パン')
    expect(names(p.filter(shelf, kindOf, nameOf, readingOf))).toEqual(['蕎麦粉のパン'])
    p.setQuery('アスパラ')
    expect(names(p.filter(shelf, kindOf, nameOf, readingOf))).toEqual(['アスパラガス'])
  })

  it('読みを渡さない呼び方なら、従来どおり名前だけで引く', () => {
    const p = new ListPaging(5)
    p.setQuery('ひつじ')
    expect(p.filter(shelf, kindOf, nameOf)).toHaveLength(0)
  })

  it('主種類の絞り込みとは AND のまま', () => {
    const p = new ListPaging(5)
    p.toggleKind('衣類')
    p.setQuery('けがわ')
    expect(names(p.filter(shelf, kindOf, nameOf, readingOf))).toEqual(['毛皮裏の外套'])
    p.setQuery('ひつじ')   // 飲みものなので両立しない
    expect(p.filter(shelf, kindOf, nameOf, readingOf)).toHaveLength(0)
  })
})

describe('読みでの検索 — 実データ（#65）', () => {
  const kindOf = (i: ItemDef) => i.mainKind
  const nameOf = (i: ItemDef) => i.display.name
  const readingOf = (i: ItemDef) => i.display.reading
  const hit = (q: string): string[] => {
    const p = new ListPaging(ALL_ITEMS.length)
    p.setQuery(q)
    return p.filter(ALL_ITEMS, kindOf, nameOf, readingOf).map(nameOf)
  }

  it('漢字の品をかなで引ける', () => {
    expect(hit('ひつじのちち')).toContain('羊の乳')
    expect(hit('そば')).toEqual(expect.arrayContaining(['蕎麦の実', '蕎麦粉', '蕎麦粉のパン']))
    expect(hit('はちみつ')).toEqual(expect.arrayContaining(['蜂蜜', '蜂蜜レモン', '蜂蜜の乳']))
    expect(hit('こおり')).toContain('氷')
  })

  it('カタカナの品もかなで引ける', () => {
    expect(hit('あすぱらがす')).toEqual(['アスパラガス'])
    expect(hit('ちーず')).toEqual(['チーズ'])
    expect(hit('となかい')).toEqual(
      expect.arrayContaining(['トナカイの肉', 'トナカイの角', 'トナカイの革']))
  })

  it('名前でも従来どおり引ける（退行防止）', () => {
    expect(hit('羊')).toEqual(expect.arrayContaining(['羊毛', '羊の乳', '羊毛のフェルト']))
    expect(hit('パン')).toEqual(expect.arrayContaining(['蕎麦粉のパン', 'ジャムパン']))
    expect(hit('アスパラガス')).toEqual(['アスパラガス'])
    expect(hit('氷')).toEqual(expect.arrayContaining(['氷', 'いちごのかき氷']))
  })
})
