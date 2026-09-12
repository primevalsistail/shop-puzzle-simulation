/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import { goalRatio, goalBarLabel, GOAL_TUTORIAL_LINE, goalReachedLine } from './goal.js'
import { GOAL_AMOUNT } from '../services/GameService.js'
import { money } from './money.js'

/**
 * #73 —— **進捗バーが実際のクリア条件と違うものを測っていた。**
 *
 * | | 測っていたもの | 目標額 |
 * |---|---|---|
 * | 画面の `目標 N%` | 累計売上 | 100万 |
 * | チュートリアル | 累計売上 | 100万 |
 * | 実際のクリア判定 | **所持金** | **1000万** |
 *
 * **軸も桁も違う。**バーが 100% になってもクリアしなかった。
 * ここは直したあとの形（**所持金 ÷ 1000万**）と、**目標額の出どころが1つ**であることを縛る。
 */
describe('目標の見せ方（#73）', () => {
  it('測るのは所持金。目標額に届いたら 100%', () => {
    expect(goalRatio(GOAL_AMOUNT)).toBe(1)
    expect(goalBarLabel(GOAL_AMOUNT)).toBe('目標 100%')
  })

  it('半分持っていれば 50%', () => {
    expect(goalRatio(GOAL_AMOUNT / 2)).toBe(0.5)
    expect(goalBarLabel(GOAL_AMOUNT / 2)).toBe('目標 50%')
  })

  /**
   * ⚠ **所持金は使えば減るので、バーも戻る。**これが実際のクリア条件なので正しい。
   *   累計売上を測っていた頃は**減ることが無かった**ので、この向きは新しい。
   */
  it('所持金が減れば進みも戻る', () => {
    const before = goalRatio(5_000_000)
    const after = goalRatio(5_000_000 - 2_236_000) // 強化を全段買った額
    expect(after).toBeLessThan(before)
    expect(goalBarLabel(3_000_000)).toBe('目標 30%')
  })

  /** ⚠ **負の幅で図形を描かせない。**所持金が0を割っても 0% で止まる */
  it('0 より下には行かない', () => {
    expect(goalRatio(0)).toBe(0)
    expect(goalRatio(-1)).toBe(0)
    expect(goalBarLabel(-1)).toBe('目標 0%')
  })

  /** ⚠ **届く前に 100% と出さない。**切り上げると「100%なのにクリアしない」に戻る */
  it('目標の直前は 99% で、100% にならない', () => {
    expect(goalBarLabel(GOAL_AMOUNT - 1)).toBe('目標 99%')
  })

  it('目標を超えても 100% で止まる（エンドレス中の表示が壊れない）', () => {
    expect(goalRatio(GOAL_AMOUNT * 3)).toBe(1)
    expect(goalBarLabel(GOAL_AMOUNT * 3)).toBe('目標 100%')
  })

  /** ⚠ **初日に必ず見る画面。**ここが違うと遊び始めた瞬間から嘘をつく */
  it('チュートリアルは「所持金」と目標額を、どちらも出どころから出す', () => {
    expect(GOAL_TUTORIAL_LINE).toContain('所持金')
    expect(GOAL_TUTORIAL_LINE).toContain(money(GOAL_AMOUNT))
    expect(GOAL_TUTORIAL_LINE).not.toContain('累計売上')
  })

  /** ⚠ **クリアした瞬間に、クリア条件と違う数字を見せない** */
  it('目標達成の幕も所持金を出す', () => {
    expect(goalReachedLine(GOAL_AMOUNT)).toBe(`所持金 ${money(GOAL_AMOUNT)}`)
    expect(goalReachedLine(GOAL_AMOUNT)).not.toContain('累計売上')
  })
})

// ─── 目標額の出どころが1つであること ─────────────────────────

/**
 * `src/` 以下の `.ts` を、**中身の文字列のまま**読む（キーは `../ui/HUD.ts` のような相対パス）。
 * ⚠ **テストは除く。**額を書き写して比べるのはテストの仕事である。
 */
const SOURCES: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob('../**/*.ts', { query: '?raw', import: 'default', eager: true }),
  )
    .filter(([path]) => !path.endsWith('.test.ts'))
    // ⚠ **キーはこのテストからの相対パス**（`./HUD.ts` ／ `../scenes/GameScene.ts`）。
    //   `src/` からの形に直す。**このテストが `src/ui/` にあること**が前提
    .map(([path, text]) => [path.replace(/^\.\//, 'ui/').replace(/^\.\.\//, ''), text as string]),
)

/** 注記は数えない（説明として額を書くのは構わない。**引いてはいけないだけ**） */
function code(rel: string): string {
  const text = SOURCES[rel]
  expect(text, `${rel} が見つからない`).toBeTypeOf('string')
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
}

/**
 * そのコードに書かれている「百万以上の数」。
 * ⚠ `0x44cc77` のような色は拾わない（`\b` が効くので 16進の中には入らない）。
 */
function bigNumbers(source: string): number[] {
  const found: number[] = []
  for (const m of source.matchAll(/\b\d[\d_]*\b/g)) {
    const n = Number(m[0].replace(/_/g, ''))
    if (n >= 1_000_000) found.push(n)
  }
  // `10,000,000` のように手で桁区切りを書いた文字列も拾う
  for (const m of source.matchAll(/\b\d{1,3}(?:,\d{3})+\b/g)) {
    found.push(Number(m[0].replace(/,/g, '')))
  }
  return found
}

/**
 * ⚠ **これは「また別書きが増える」のを止めるための検査**（#73 の付随）。
 *
 * 直す前は **3箇所に別書き**があった（`GameService`=1000万 ／ `HUD`=100万 ／
 * `Tutorial`=文字列 `1,000,000レン`）。**画面ごとに目標が違う**状態は、
 * 誰かが1箇所を直しても残り2箇所が黙って古いまま残ることで生まれる。
 */
describe('目標額の出どころは1つ（#73）', () => {
  /** 目標額を**書いてよい**ファイル。ここ以外に百万以上の数を書かない */
  const ALLOWED = new Map<string, string>([
    ['services/GameService.ts', 'クリア条件そのもの。ここが唯一の出どころ'],
    ['debug/DebugTools.ts', '確認用の道具（`M` で金+100万）。出荷前に丸ごと外す（#51）'],
  ])

  it('百万以上の数を書いているのは GameService と DebugTools だけ', () => {
    // ⚠ **1本も読めていないのに「違反ゼロ」と言わせない**
    expect(Object.keys(SOURCES).length).toBeGreaterThan(30)
    const offenders = Object.keys(SOURCES)
      .map(rel => ({ rel, numbers: bigNumbers(code(rel)) }))
      .filter(f => f.numbers.length > 0 && !ALLOWED.has(f.rel))
      .map(f => `${f.rel}: ${f.numbers.join(', ')}`)
    expect(offenders, '目標額を別書きしない。`GameService.GOAL_AMOUNT` を引くこと').toEqual([])
  })

  it('GameService が持っている数は 1000万だけ', () => {
    expect(bigNumbers(code('services/GameService.ts'))).toEqual([10_000_000])
    expect(GOAL_AMOUNT).toBe(10_000_000)
  })

  /** ⚠ **目標を出す画面は3つある。**どれも `goal.ts` を通す（自前の数を持たない） */
  it('目標を出す3画面は、どれも goal.ts を通している', () => {
    const screens = {
      'ui/HUD.ts': "./goal.js",
      'ui/Tutorial.ts': "./goal.js",
      'scenes/GameScene.ts': "../ui/goal.js",
    }
    for (const [rel, from] of Object.entries(screens)) {
      expect(SOURCES[rel], rel).toContain(`from '${from}'`)
    }
  })
})
