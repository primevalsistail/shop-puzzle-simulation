/// <reference types="vite/client" />
import { describe, it, expect, beforeEach } from 'vitest'
import playerSource from './SePlayer.ts?raw'
import gameSceneSource from '../scenes/GameScene.ts?raw'
import bootSource from '../scenes/BootScene.ts?raw'
import {
  SE_KEYS, AUTO_KEYS, TAP_GAP_MS, AUTO_GAP_MS,
  SeThrottle, minGapMs, sePath, type SeKey,
} from './se.js'
import {
  SE_VOLUME_DEFAULT, SE_VOLUME_MAX,
  getSeVolume, isSeOn, seGain, setSeOn, setSeVolume, watchSe, _resetSeForTest,
} from './seSettings.js'
import { isMusicOn, setMusicOn, _resetMusicForTest } from './musicSettings.js'
import { AUDIO_CREDITS } from './bgm.js'
import { optionSections } from '../ui/options.js'

/**
 * **効果音**（#124。選んだ経緯は `aidlc-docs/inception/worldbuilding/se-candidates.md`、
 * PO 判断は `aidlc-docs/sessions/questions-se.md`）。
 *
 * ⚠ **`SePlayer` は Phaser の `Game` が要るのでここから動かせない。**
 *   `bgm.test.ts` と同じく**ソースとして縛る。**
 */
const strip = (src: string) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')

const player = strip(playerSource)
const scene = strip(gameSceneSource)
const boot = strip(bootSource)

describe('12音が揃っている', () => {
  it('鍵は12個で、重複しない', () => {
    expect(SE_KEYS).toHaveLength(12)
    expect(new Set(SE_KEYS).size).toBe(12)
  })

  it('置き場は public/audio/<鍵>.mp3', () => {
    for (const key of SE_KEYS) expect(sePath(key)).toBe(`audio/${key}.mp3`)
  })

  it('⚠ BGM と違って形式は1つ（mp3 はどのブラウザでも鳴るので m4a を作らない）', () => {
    for (const key of SE_KEYS) expect(sePath(key).endsWith('.mp3')).toBe(true)
  })
})

describe('間引き（Question 2 = B。⚠ 速さを見ない）', () => {
  it('勝手に起きた音は3つだけで、すべて SE_KEYS にある', () => {
    expect(AUTO_KEYS).toEqual(['sold', 'crafted', 'port-open'])
    for (const key of AUTO_KEYS) expect(SE_KEYS).toContain(key)
  })

  it('勝手に起きた音は 0.5秒に1回まで', () => {
    expect(AUTO_GAP_MS).toBe(500)
    for (const key of AUTO_KEYS) expect(minGapMs(key)).toBe(AUTO_GAP_MS)
  })

  it('押した音は間引かない（押したのに無音にしない）', () => {
    const tap = SE_KEYS.filter(k => !AUTO_KEYS.includes(k))
    expect(tap.length).toBe(9)
    for (const key of tap) expect(minGapMs(key)).toBe(TAP_GAP_MS)
    expect(TAP_GAP_MS).toBeLessThan(AUTO_GAP_MS)
  })

  it('⚠ 10倍速で売れ続けても 0.5秒に1回しか通らない', () => {
    const t = new SeThrottle()
    let played = 0
    // 5秒のあいだ、50ミリ秒おきに売れた（＝100回）
    for (let ms = 0; ms < 5000; ms += 50) if (t.allow('sold', ms)) played++
    expect(played).toBe(10)   // 5秒 ÷ 0.5秒
  })

  it('押した音は連打しても通る', () => {
    const t = new SeThrottle()
    let played = 0
    for (let ms = 0; ms < 1000; ms += 100) if (t.allow('button', ms)) played++
    expect(played).toBe(10)
  })

  it('鍵ごとに別々に数える（売れた音が仕上がった音を消さない）', () => {
    const t = new SeThrottle()
    expect(t.allow('sold', 0)).toBe(true)
    expect(t.allow('crafted', 0)).toBe(true)
    expect(t.allow('sold', 100)).toBe(false)
  })

  it('reset で持ち越さない（場面をまたいだ直後の1音を消さない）', () => {
    const t = new SeThrottle()
    expect(t.allow('sold', 0)).toBe(true)
    t.reset()
    expect(t.allow('sold', 10)).toBe(true)
  })
})

describe('設定（Question 3 = A。音楽と分ける）', () => {
  beforeEach(() => { _resetSeForTest(); _resetMusicForTest() })

  it('⚠ 既定は 入・50（音楽と同じ。PO 判断 2026-09-16）', () => {
    expect(isSeOn()).toBe(true)
    expect(getSeVolume()).toBe(SE_VOLUME_DEFAULT)
    expect(SE_VOLUME_DEFAULT).toBe(50)
  })

  it('⚠ 音楽を切っても効果音は鳴る（分けた理由そのもの）', () => {
    setMusicOn(false)
    expect(isMusicOn()).toBe(false)
    expect(isSeOn()).toBe(true)
    expect(seGain()).toBeGreaterThan(0)
  })

  it('⚠ 効果音を切っても音楽は鳴る', () => {
    setSeOn(false)
    expect(isSeOn()).toBe(false)
    expect(isMusicOn()).toBe(true)
  })

  it('切ってあれば gain は 0（入／切と音量を2箇所で見ないで済む）', () => {
    setSeVolume(80)
    expect(seGain()).toBeCloseTo(80 / SE_VOLUME_MAX)
    setSeOn(false)
    expect(seGain()).toBe(0)
    // ⚠ **入れ直すと前の音量に戻る**（0 まで下げるのと、切るのは別）
    setSeOn(true)
    expect(getSeVolume()).toBe(80)
  })

  it('範囲の外を弾く', () => {
    setSeVolume(-10); expect(getSeVolume()).toBe(0)
    setSeVolume(999); expect(getSeVolume()).toBe(SE_VOLUME_MAX)
    setSeVolume(Number.NaN); expect(getSeVolume()).toBe(SE_VOLUME_DEFAULT)
  })

  it('開いたまま触られても、その場で知らせる', () => {
    let called = 0
    const off = watchSe(() => { called++ })
    setSeVolume(20)
    expect(called).toBe(1)
    off()
    setSeVolume(30)
    expect(called).toBe(1)
  })
})

describe('設定の面に効果音の行が出る', () => {
  it('音の区分に「音楽」と「効果音」が1行ずつ並ぶ', () => {
    const sound = optionSections().find(s => s.title === '音')
    expect(sound).toBeDefined()
    expect(sound!.levels?.map(l => l.label)).toEqual(['音楽', '効果音'])
  })

  it('⚠ 配布元は2行（音楽の卵 ＋ 効果音ラボ）', () => {
    expect(AUDIO_CREDITS).toHaveLength(2)
    expect(AUDIO_CREDITS.some(c => c.includes('効果音ラボ'))).toBe(true)
    const credits = optionSections().find(s => s.notes && s.notes.length > 0)
    expect(credits!.notes).toEqual(AUDIO_CREDITS)
  })
})

describe('鳴らす側の約束（ソースとして縛る）', () => {
  it('⚠ 切ってあれば鳴らさない', () => {
    expect(player).toMatch(/if\s*\(!isSeOn\(\)\)\s*return/)
  })

  it('⚠ 音量は鳴らすたびに読む（控えを持たない）', () => {
    expect(player).toMatch(/volume:\s*seGain\(\)/)
  })

  it('⚠ 間引きを通ってから鳴らす', () => {
    expect(player).toMatch(/this\.throttle\.allow\(/)
  })

  it('⚠ 速さ（1・3・10倍）を引数に取らない（Question 2 = B）', () => {
    expect(player).not.toMatch(/speed|倍速|timeScale/)
    expect(strip(playerSource) + strip(String(SE_KEYS))).not.toMatch(/speed/)
  })

  it('⚠ SePlayer は1つだけ作る（間引きの記録が割れる）', () => {
    expect(player).toMatch(/let instance: SePlayer \| null = null/)
    expect(player).toMatch(/instance \?\?= new SePlayer/)
  })

  it('⚠ 12音は BootScene でまとめて読む（1回目が鳴らないのを防ぐ）', () => {
    expect(boot).toMatch(/se\(this\)\.preload\(this\)/)
  })
})

describe('鳴る場所が GameScene に入っている', () => {
  const expected: [SeKey, string][] = [
    ['button', 'ボタン・タブ'],
    ['place', '棚に置けた'],
    ['deny', '置けない'],
    ['grab', 'つかむ'],
    ['discard', '捨てる'],
    ['confirm', '納品'],
    ['fanfare', '商船'],
    ['sold', '客が買った'],
    ['crafted', '加工が仕上がった'],
    ['port-open', '寄港の板'],
  ]
  for (const [key, where] of expected) {
    it(`${where} → ${key}`, () => {
      expect(scene).toContain(`playSe(this, '${key}')`)
    })
  }

  it('⚠ 売れた音は FLOOR_SLOT_SOLD から鳴る（売れた経路は1つ）', () => {
    const sold = scene.slice(scene.indexOf('FLOOR_SLOT_SOLD'))
    expect(sold.slice(0, 600)).toContain("playSe(this, 'sold')")
  })
})
