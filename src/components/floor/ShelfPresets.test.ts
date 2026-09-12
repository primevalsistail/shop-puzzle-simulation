import { describe, it, expect } from 'vitest'
import {
  ShelfPresets, capture, PRESET_COUNT, PRESET_NAME_MAX,
  describePreset, defaultPresetLabel, normalizePresetName,
} from './ShelfPresets.js'
import type { DisplaySlot } from '../../types/index.js'

const slot = (id: string, itemId: string, x: number, y: number): DisplaySlot => ({
  id, itemId, shape: [[1, 1]], position: { x, y }, rotation: 1,
})

const LAYOUT: DisplaySlot[] = [
  slot('s1', 'apple', 0, 0),
  slot('s2', 'bread', 2, 3),
]

describe('capture — 覚えるのは3つだけ', () => {
  /**
   * ⚠ **かたちを覚えると、品のかたちを変えたとき型だけが古いまま残る。**
   *   かたちは品から引ける導出値なので、呼び出すときに引き直す。
   */
  it('かたちと区画の名前は落とす', () => {
    expect(capture(LAYOUT)).toEqual([
      { itemId: 'apple', position: { x: 0, y: 0 }, rotation: 1 },
      { itemId: 'bread', position: { x: 2, y: 3 }, rotation: 1 },
    ])
  })

  it('位置は複製する（あとで盤面を動かしても型が変わらない）', () => {
    const src = [slot('s1', 'apple', 1, 1)]
    const taken = capture(src)
    src[0].position.x = 99
    expect(taken[0].position.x).toBe(1)
  })
})

describe('ShelfPresets', () => {
  it('はじめは全部空', () => {
    const p = new ShelfPresets()
    for (let i = 0; i < PRESET_COUNT; i++) expect(p.get(i)).toBeNull()
  })

  it('覚えて、呼び出せる', () => {
    const p = new ShelfPresets()
    p.save(1, LAYOUT, 'ハルヴェラ', 12345)
    expect(p.get(1)?.savedAt).toBe(12345)
    expect(p.get(1)?.slots).toHaveLength(2)
    expect(p.get(0)).toBeNull()
  })

  /** 「全部下ろす」型として使える */
  it('空の盤面も覚えられる', () => {
    const p = new ShelfPresets()
    p.save(0, [])
    expect(p.get(0)).not.toBeNull()
    expect(p.get(0)?.slots).toHaveLength(0)
  })

  it('上書きできる', () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT)
    p.save(0, [slot('s9', 'milk', 4, 4)])
    expect(p.get(0)?.slots).toHaveLength(1)
  })

  it('消せる', () => {
    const p = new ShelfPresets()
    p.save(2, LAYOUT)
    p.clear(2)
    expect(p.get(2)).toBeNull()
  })

  it('範囲の外は何もしない', () => {
    const p = new ShelfPresets()
    p.save(-1, LAYOUT)
    p.save(PRESET_COUNT, LAYOUT)
    p.save(1.5, LAYOUT)
    expect(p.get(-1)).toBeNull()
    expect(p.get(PRESET_COUNT)).toBeNull()
    expect(p.toRecord().filter(Boolean)).toHaveLength(0)
  })
})

describe('セーブとの往復', () => {
  it('書き出して読み直すと同じ', () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT, 'ハルヴェラ', 111)
    p.save(2, [slot('s9', 'milk', 4, 4)], 'ノアキータ', 222)

    const back = new ShelfPresets()
    back.restore(p.toRecord())
    expect(back.get(0)?.slots).toEqual(p.get(0)?.slots)
    expect(back.get(2)?.savedAt).toBe(222)
    expect(back.get(0)?.island).toBe('ハルヴェラ')
    expect(back.get(2)?.island).toBe('ノアキータ')
    expect(back.get(1)).toBeNull()
  })

  it('書き出したものを変えても、元は変わらない', () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT)
    const rec = p.toRecord()
    ;(rec[0]!.slots as unknown[]).length = 0
    expect(p.get(0)?.slots).toHaveLength(2)
  })

  /**
   * ⚠ **古いセーブ・壊れたセーブを素通ししない。**
   *   呼び出した瞬間に落ちるより、無かったことにするほうがよい。
   */
  it('型のないセーブ（古いセーブ）は空で戻る', () => {
    const p = new ShelfPresets()
    p.restore(undefined)
    expect(p.toRecord().filter(Boolean)).toHaveLength(0)
    p.restore('こわれている')
    expect(p.toRecord().filter(Boolean)).toHaveLength(0)
  })

  it('形の合わない区画だけを落とす', () => {
    const p = new ShelfPresets()
    p.restore([
      {
        savedAt: 1,
        slots: [
          { itemId: 'apple', position: { x: 1, y: 2 }, rotation: 0 },
          { itemId: 'bad', position: { x: NaN, y: 0 }, rotation: 0 },
          { itemId: 'bad2', position: { x: 0, y: 0 }, rotation: 7 },
          { itemId: 42, position: { x: 0, y: 0 }, rotation: 0 },
          null,
        ],
      },
    ])
    expect(p.get(0)?.slots).toEqual([{ itemId: 'apple', position: { x: 1, y: 2 }, rotation: 0 }])
  })

  it('数が多すぎるセーブは先頭ぶんだけ読む', () => {
    const p = new ShelfPresets()
    p.restore(Array(PRESET_COUNT + 5).fill({ savedAt: 1, slots: [] }))
    expect(p.toRecord()).toHaveLength(PRESET_COUNT)
  })

  it('savedAt が壊れていても読む', () => {
    const p = new ShelfPresets()
    p.restore([{ savedAt: NaN, slots: [] }])
    expect(p.get(0)?.savedAt).toBe(0)
  })
})

/**
 * **型に島名を付ける**（#67。PO 判断 Q5 のベース案 A）。
 *
 * ⚠ **`12区画` が2つ並ぶと文字が完全に同一になる。**束M で保存日時を消したあと、
 *   見分けは縮小図だけが背負っていた。
 */
describe('describePreset — 升に出す1行（#67）', () => {
  it('覚えた島が出る', () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT, 'ハルヴェラ')
    expect(describePreset(p.get(0))).toBe('ハルヴェラ島 2区画')
  })

  /** ⚠ **型が島を持たない古いセーブがすでに手元にある。**従来どおりでなければならない */
  it('島を持たない古い型は、これまでどおり区画数だけ', () => {
    const p = new ShelfPresets()
    p.restore([{ savedAt: 1, slots: capture(LAYOUT) }])
    expect(p.get(0)?.island).toBeUndefined()
    expect(describePreset(p.get(0))).toBe('2区画')
  })

  it('空の型は「空」', () => {
    expect(describePreset(null)).toBe('空')
  })

  it('「全部下ろす」型にも島が付く', () => {
    const p = new ShelfPresets()
    p.save(0, [], 'リナツィア')
    expect(describePreset(p.get(0))).toBe('リナツィア島 全部下ろす')
    const q = new ShelfPresets()
    q.save(0, [])
    expect(describePreset(q.get(0))).toBe('全部下ろす')
  })

  /** ⚠ **現実の時刻は出さない**（束M・ペルソナ3人。「どの型を呼ぶか」に効かない） */
  it('保存日時は出さない', () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT, 'ハルヴェラ', 1_757_000_000_000)
    expect(describePreset(p.get(0))).not.toMatch(/[0-9]{2}\/[0-9]{2}/)
  })
})

describe('島はセーブを往復する（#67）', () => {
  it('4島に無い値は読み捨てる', () => {
    const p = new ShelfPresets()
    p.restore([
      { savedAt: 1, island: 'どこでもない島', slots: [] },
      { savedAt: 1, island: 42, slots: [] },
      { savedAt: 1, island: 'ノアキータ', slots: [] },
    ])
    expect(p.get(0)?.island).toBeUndefined()
    expect(p.get(1)?.island).toBeUndefined()
    expect(p.get(2)?.island).toBe('ノアキータ')
  })

  it('島を渡さずに覚えた型も読める', () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT)
    const back = new ShelfPresets()
    back.restore(p.toRecord())
    expect(back.get(0)?.island).toBeUndefined()
    expect(back.get(0)?.slots).toHaveLength(2)
  })
})

/**
 * **型に名前を打てるようにする**（#83。PO 判断 Q5「ベースはA、そのあとにユーザが編集できればいい」）。
 *
 * ⚠ **ペルソナ4人中2人が名前そのものに反対している**
 *   （「名前を付けると名前を読むようになり、盤面を見なくなる」）。
 *   だから**既定値が消えないこと**——**空にしたら島名へ戻ること**がこの束の要になる。
 */
describe('名前（#83）', () => {
  it('打った名前が升の字になる', () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT, 'ハルヴェラ')
    p.setName(0, 'ミフユリア用')
    expect(p.get(0)?.name).toBe('ミフユリア用')
    expect(describePreset(p.get(0))).toBe('ミフユリア用')
  })

  /** ⚠ **受入条件3。**既定値が消えると、名前を付けない遊び方ができなくなる */
  it('空にしたら島名（既定値）へ戻る', () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT, 'ハルヴェラ')
    p.setName(0, 'ミフユリア用')
    p.setName(0, '')
    expect(p.get(0)?.name).toBeUndefined()
    expect(describePreset(p.get(0))).toBe('ハルヴェラ島 2区画')
  })

  it('空白だけ打っても既定値へ戻る', () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT, 'ハルヴェラ')
    p.setName(0, '　  ')
    expect(p.get(0)?.name).toBeUndefined()
    expect(describePreset(p.get(0))).toBe('ハルヴェラ島 2区画')
  })

  it('既定値は名前を見ない（入力欄の placeholder に出す字）', () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT, 'ハルヴェラ')
    p.setName(0, 'ミフユリア用')
    expect(defaultPresetLabel(p.get(0))).toBe('ハルヴェラ島 2区画')
    expect(defaultPresetLabel(null)).toBe('空')
  })

  /** ⚠ **受入条件4。**升の文字欄は 308px しかない（幅は `layout.test.ts` が見ている） */
  it(`上限（${PRESET_NAME_MAX}文字）で切る`, () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT)
    p.setName(0, 'あ'.repeat(PRESET_NAME_MAX + 30))
    expect([...(p.get(0)?.name ?? '')]).toHaveLength(PRESET_NAME_MAX)
  })

  /** ⚠ **`slice` で切ると絵文字が割れる**（コードポイントで数える） */
  it('絵文字を割らずに切る', () => {
    const name = '🍎'.repeat(PRESET_NAME_MAX + 5)
    expect(normalizePresetName(name)).toBe('🍎'.repeat(PRESET_NAME_MAX))
  })

  it('前後の空白は落とすが、途中の空白は残す（打った文字を書き換えない）', () => {
    expect(normalizePresetName('  ミフユリア 用  ')).toBe('ミフユリア 用')
  })

  it('文字列でないものは名前にしない', () => {
    expect(normalizePresetName(42)).toBeUndefined()
    expect(normalizePresetName(undefined)).toBeUndefined()
  })

  /** ⚠ **空の升に名前だけ残ると、`削除` したはずの字が残る** */
  it('空の升には付けられない', () => {
    const p = new ShelfPresets()
    p.setName(0, 'あるはずのない名前')
    expect(p.get(0)).toBeNull()
    expect(describePreset(p.get(0))).toBe('空')
  })

  /**
   * ⚠ **島ごとの型は寄港のたびに覚え直す。**上書きで名前が消えると、
   *   付けた名前が**周回ごとに毎回消える。**
   */
  it('上書きしても名前は残る（消えるのは削除したとき）', () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT, 'ハルヴェラ')
    p.setName(0, '作る日用')
    p.save(0, [slot('s9', 'milk', 4, 4)], 'ノアキータ')
    expect(describePreset(p.get(0))).toBe('作る日用')
    expect(p.get(0)?.island).toBe('ノアキータ')

    p.clear(0)
    p.save(0, LAYOUT, 'ハルヴェラ')
    expect(describePreset(p.get(0))).toBe('ハルヴェラ島 2区画')
  })
})

/** ⚠ **受入条件5。**`name?` は任意フィールド（先例は `island?` ／ `orders?` ／ `peddler?`） */
describe('名前はセーブを往復する（#83）', () => {
  it('書き出して読み直しても残る', () => {
    const p = new ShelfPresets()
    p.save(0, LAYOUT, 'ハルヴェラ')
    p.setName(0, 'ミフユリア用')
    const back = new ShelfPresets()
    back.restore(p.toRecord())
    expect(back.get(0)?.name).toBe('ミフユリア用')
    expect(back.get(0)?.island).toBe('ハルヴェラ')
  })

  it('名前を持たない古いセーブは、これまでどおり島名だけ', () => {
    const p = new ShelfPresets()
    p.restore([{ savedAt: 1, island: 'ハルヴェラ', slots: capture(LAYOUT) }])
    expect(p.get(0)?.name).toBeUndefined()
    expect(describePreset(p.get(0))).toBe('ハルヴェラ島 2区画')
  })

  /** ⚠ **手で書き換えたセーブの長い名前をそのまま画面へ出さない**（升からはみ出す） */
  it('壊れた名前・長すぎる名前は読み直しで直す', () => {
    const p = new ShelfPresets()
    p.restore([
      { savedAt: 1, name: 'あ'.repeat(200), slots: [] },
      { savedAt: 1, name: 42, slots: [] },
      { savedAt: 1, name: '  ', slots: [] },
      { savedAt: 1, name: '改行\nあり', slots: [] },
    ])
    expect([...(p.get(0)?.name ?? '')]).toHaveLength(PRESET_NAME_MAX)
    expect(p.get(1)?.name).toBeUndefined()
    expect(p.get(2)?.name).toBeUndefined()
    expect(p.get(3)?.name).toBe('改行 あり')
  })
})
