/// <reference types="vite/client" />
import { describe, it, expect, beforeEach, vi } from 'vitest'
import playerSource from './BgmPlayer.ts?raw'
import titleSource from '../scenes/TitleScene.ts?raw'
import openingSource from '../scenes/OpeningScene.ts?raw'
import gameSceneSource from '../scenes/GameScene.ts?raw'
import optionsSource from '../ui/options.ts?raw'
import { BGM_KEYS, bandOf, bgmFor, bgmPaths, AUDIO_CREDITS } from './bgm.js'
import { ROUTE } from '../taxonomy/islands.js'
import { isMusicOn, setMusicOn, watchMusicOn, _resetMusicOnForTest } from './musicOn.js'
import { optionSections as optionSectionsForCredits } from '../ui/options.js'
import { CLOSE_HOUR, OPEN_HOUR, WAKE_HOUR } from '../components/core/TimeManager.js'

/**
 * **BGM**（#14。仕様は `aidlc-docs/inception/worldbuilding/bgm.md`）。
 *
 * ⚠ **`BgmPlayer` は Phaser の `Game` が要るのでここから動かせない。**
 *   `OptionsMenu.test.ts` と同じく**ソースとして縛る。**
 *   **どの曲を鳴らすかの判断は `bgm.ts` にあり、そちらは直に呼べる。**
 */
const strip = (src: string) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')

const player = strip(playerSource)
const scene = strip(gameSceneSource)
const registry = strip(optionsSource)

describe('時間帯で曲が決まる（受入条件1）', () => {
  it('6:00〜10:00 は朝', () => {
    for (let h = WAKE_HOUR; h < OPEN_HOUR; h++) {
      expect(bandOf(h), `${h}時`).toBe('朝')
      expect(bgmFor(h, 'ハルヴェラ')).toBe('morning')
    }
  })

  it('10:00〜20:00 は昼（島のもの）', () => {
    for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
      expect(bandOf(h), `${h}時`).toBe('昼')
      expect(bgmFor(h, 'ハルヴェラ')).toBe('day-halvela')
    }
  })

  it('20:00〜24:00 は夜', () => {
    for (let h = CLOSE_HOUR; h < 24; h++) {
      expect(bandOf(h), `${h}時`).toBe('夜')
      expect(bgmFor(h, 'ハルヴェラ')).toBe('night')
    }
  })

  /**
   * ⚠ **24:00 で 6:00 へ飛ぶので、0〜5時は本来来ない。**
   *   それでも**曲の無い時間帯を作らない** —— 来たときに無音になるより朝で困らない。
   */
  it('0:00〜6:00 も曲が決まる（無音の穴を作らない）', () => {
    for (let h = 0; h < WAKE_HOUR; h++) expect(bandOf(h), `${h}時`).toBe('朝')
  })
})

describe('島ごとの昼（受入条件2）', () => {
  it('4島すべてに別の曲がある', () => {
    const keys = ROUTE.map(island => bgmFor(OPEN_HOUR, island))
    expect(keys).toHaveLength(4)
    expect(new Set(keys).size).toBe(4)
  })

  /** ⚠ **朝と夜は島で変わらない**（島の色は昼に置く。PO 判断 2026-09-15） */
  it('朝と夜は島で変わらない', () => {
    for (const island of ROUTE) {
      expect(bgmFor(WAKE_HOUR, island)).toBe('morning')
      expect(bgmFor(CLOSE_HOUR, island)).toBe('night')
    }
  })
})

describe('鳴らす側（受入条件3・4・5）', () => {
  /** ⚠ **同じ曲なら何もしない。**毎フレーム呼ばれるので、鳴らし直すと頭に戻り続ける */
  it('同じ曲を続けて頼まれても鳴らし直さない', () => {
    expect(player).toContain('if (this.currentKey === key) return')
  })

  /**
   * ⚠ **受入条件3「昼は毎日その頭から」。**
   *   **前の日の続きにしない** —— 夜→朝と挟まって曲が変わるので、
   *   **替わったときに頭から鳴らす**この作りがそのまま条件になっている。
   */
  it('曲が替わるときは頭から鳴らす（途中から再開しない）', () => {
    expect(player).toContain('next.play()')
    expect(player).not.toMatch(/\.resume\(\)/)
    expect(player).not.toMatch(/seek/)
  })

  /** ⚠ **受入条件4。**速さを変えても曲の速さは変えない */
  it('速さに触っていない', () => {
    expect(player).not.toMatch(/\brate\b/)
    expect(player).not.toMatch(/detune/)
    expect(player).not.toMatch(/getSpeed/)
  })

  /** ⚠ **受入条件5。**替わり目は1秒ほどかけて前の曲から次へ */
  it('替わり目は1秒かける', () => {
    expect(player).toContain('const FADE_MS = 1000')
    expect(player).toContain("from: this.current.volume, to: 0")
  })

  /**
   * ⚠ **場面の `tweens` を使わない。**場面が終わると淡くする処理が途中で止まり、
   *   **小さいまま鳴り続ける。**
   */
  it('淡くするのに場面のトゥイーンを使わない', () => {
    expect(player).not.toContain('tweens')
    expect(player).toContain("this.game.events.on('step'")
  })

  it('ループする', () => {
    expect(player).toContain('loop: true')
  })
})

describe('音楽を鳴らす／鳴らさない（受入条件6）', () => {
  // ⚠ **node には `localStorage` が無い**（`ConfirmDialog.test.ts` と同じ形）
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v) },
      removeItem: (k: string) => { store.delete(k) },
    })
    _resetMusicOnForTest()
  })

  it('はじめは入', () => {
    expect(isMusicOn()).toBe(true)
  })

  it('切ると覚えている', () => {
    setMusicOn(false)
    expect(isMusicOn()).toBe(false)
    _resetMusicOnForTest()          // 開き直したつもり
    expect(isMusicOn()).toBe(false)
  })

  it('入に戻すと覚えている', () => {
    setMusicOn(false)
    setMusicOn(true)
    _resetMusicOnForTest()
    expect(isMusicOn()).toBe(true)
  })

  /** ⚠ **設定の面を開いたまま切られる。**閉じるのを待たずにその場で止めること */
  it('切られたことがその場で伝わる', () => {
    const seen: boolean[] = []
    const off = watchMusicOn(on => seen.push(on))
    setMusicOn(false)
    setMusicOn(true)
    off()
    setMusicOn(false)
    expect(seen).toEqual([false, true])
  })

  it('切られていたら鳴らさない', () => {
    expect(player).toContain('if (!isMusicOn()) return')
    expect(player).toContain('watchMusicOn(on => { if (!on) this.stopAll() })')
  })
})

describe('素材', () => {
  it('8曲ある', () => {
    expect(BGM_KEYS).toHaveLength(8)
    expect(new Set(BGM_KEYS).size).toBe(8)
  })

  /** ⚠ **ogg だけだと Safari で鳴らない**（`bgm.md` §2） */
  it('1曲につき ogg と m4a の2本', () => {
    for (const key of BGM_KEYS) {
      expect(bgmPaths(key)).toEqual([`audio/${key}.ogg`, `audio/${key}.m4a`])
    }
  })

  /** ⚠ **配布元を出す場所が要る**（`bgm.md` §4。設定の面のいちばん下） */
  it('配布元の表記がある', () => {
    expect(AUDIO_CREDITS.length).toBeGreaterThan(0)
  })
})

describe('場面との配線（受入条件8）', () => {
  it('タイトルとはじまりの場面は同じ曲', () => {
    expect(strip(titleSource)).toContain("bgm(this).play('title', this)")
    expect(strip(openingSource)).toContain("bgm(this).play('title', this)")
  })

  /**
   * ⚠ **`DayPhase` も `TIME_PHASE_CHANGED` も使えない。**
   *   **朝（6-10）と夜（20-24）がどちらも `作業`** で、24:00→6:00 の飛びでは何も出ない。
   *   → **毎フレーム時刻から出すこと。**
   */
  it('時刻から毎フレーム出す（区分の知らせに頼らない）', () => {
    const at = scene.indexOf('private syncBgm()')
    expect(at).toBeGreaterThan(0)
    const body = scene.slice(at, at + 600)
    expect(body).toContain('this.timeManager.getCurrentTime()')
    expect(body).toContain('bgmFor(hour, this.world.getLocation().island)')
    expect(body).not.toContain('getPhase')
    expect(scene).toContain('this.syncBgm()')
  })

  /** ⚠ **商船を買った幕のあいだだけエンディング。**閉じれば島の曲へ帰る */
  it('商船を買った幕はエンディング', () => {
    const at = scene.indexOf('private syncBgm()')
    expect(scene.slice(at, at + 600)).toContain("if (this.curtainShown) {")
    expect(scene.slice(at, at + 600)).toContain("bgm(this).play('ending', this)")
  })
})

describe('設定への出しかた（受入条件6・7）', () => {
  /** ⚠ **音量つまみは作らない**（PO 判断 2026-09-15。入／切の1行だけ） */
  it('音楽は入／切の1行だけ', () => {
    expect(registry).toContain("label: '音楽を鳴らす', isOn: isMusicOn, set: setMusicOn")
    expect(registry).not.toMatch(/volume|音量/)
  })

  /** ⚠ **配布元は設定の面のいちばん下**（`bgm.md` §4。タイトル画面には出さない） */
  it('配布元は設定のいちばん下に出る', () => {
    const sections = optionSectionsForCredits()
    expect(sections[sections.length - 1].notes).toEqual([...AUDIO_CREDITS])
    expect(strip(titleSource)).not.toMatch(/AUDIO_CREDITS/)
  })
})
