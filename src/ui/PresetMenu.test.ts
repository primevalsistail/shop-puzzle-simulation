/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import menuSource from './PresetMenu.ts?raw'

/**
 * #83 —— **型の名前をプレイヤーが打てるようにした。**
 *
 * ⚠ **いちばんの難所は器。**`PresetMenu.refresh()` は中身をまるごと `destroy()` して
 *   作り直すので、そこに `<input>` を10個入れると**打鍵のたびに作り直されてカーソルが飛ぶ**
 *   （`aidlc-state.md`「知らないと踏むこと」／`SearchBox.ts` の既知の地雷）。
 *
 * ⚠ **`PresetMenu` は Phaser を読むのでここから import できない。**
 *   **名前の中身は `ShelfPresets.test.ts`、幅は `layout.test.ts`、
 *   器の作りはここでソースとして縛る**（`InventoryPanel.test.ts` と同じやり方）。
 */
const body = menuSource
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')

/** メソッド1本ぶんのソース。インデント2の `}` で終わるのを使う */
function methodBody(name: string): string {
  const at = body.indexOf(name)
  expect(at, `${name} が無い`).toBeGreaterThanOrEqual(0)
  const rest = body.slice(at)
  const end = rest.indexOf('\n  }')
  expect(end, `${name} の終わりが見つからない`).toBeGreaterThan(0)
  return rest.slice(0, end)
}

describe('名前の入力欄は、打鍵で作り直されない（#83・受入条件2）', () => {
  /**
   * ⚠ **これが受入条件2そのもの。**打鍵でカーソルが飛ばないことは実機でしか見えないが、
   *   **原因は「作り直していること」1つ**なので、作らないことで代用する。
   */
  it('入力欄を作るのは placeNameInputs() の中だけ', () => {
    expect(body.match(/createInput\(/g)).toHaveLength(1)
    expect(methodBody('private placeNameInputs()')).toContain('createInput(')
  })

  it('placeNameInputs() を呼ぶのは open() だけ', () => {
    expect(body.match(/this\.placeNameInputs\(\)/g)).toHaveLength(1)
    expect(methodBody('open(): void')).toContain('this.placeNameInputs()')
  })

  /** ⚠ **`build()` は `refresh()` から毎回呼ばれる。**ここで DOM に触ったら終わり */
  it('build() と buildCell() は入力欄を作らない', () => {
    for (const m of ['private build()', 'private buildCell(']) {
      expect(methodBody(m)).not.toContain('createInput')
      expect(methodBody(m)).not.toContain('tryAddDom')
      expect(methodBody(m)).not.toContain('placeNameInputs')
    }
  })

  /** ⚠ **`refresh()` は値と placeholder を合わせ直すだけ** */
  it('refresh() は入力欄を捨てず、合わせ直すだけ', () => {
    const refresh = methodBody('refresh(): void')
    expect(refresh).toContain('this.syncNameInputs()')
    expect(refresh).not.toContain('destroyNameInputs')
    expect(refresh).not.toContain('placeNameInputs')
  })

  /** ⚠ **入力欄は `container` に入れない。**入れたら `refresh()` の `destroy()` で消える */
  it('入力欄は container とは別に持つ', () => {
    const place = methodBody('private placeNameInputs()')
    expect(place).not.toContain('objs')
    expect(place).not.toContain('this.container')
    expect(body).toContain('private nameDoms')
    expect(body).toContain('private nameInputs')
  })

  /** ⚠ **打っている最中の欄に `value` を入れ直すとカーソルが末尾へ飛ぶ** */
  it('打っている最中の欄には触らない', () => {
    expect(methodBody('private syncNameInputs()')).toContain('document.activeElement === el')
  })
})

describe('入力欄は domInput.ts を通す（#83・受入条件1）', () => {
  /**
   * ⚠ **打鍵をゲームへ漏らさない／DOM が無くても落ちない／消すときキー入力を戻す／
   *   ESC の逃げ道 —— 1箇所でも忘れると操作が効かなくなる。**
   *   だから `<input>` を自前で作らない。
   */
  it('`<input>` を自前で作らない', () => {
    expect(body).toContain("from './domInput.js'")
    expect(body).not.toContain("createElement('input')")
    expect(body).not.toContain('createElement("input")')
  })

  /** ⚠ **DOM が使えないときに落ちない**（`tryAddDom` が null を返す） */
  it('DOM に載せるのは tryAddDom、載らなければ文字で出す', () => {
    expect(body).toContain('tryAddDom(')
    expect(methodBody('private placeNameInputs()')).toContain('if (!dom) continue')
    // 入力欄が置けなかった升は、これまでどおり文字を出す
    expect(methodBody('private buildCell(')).toContain('!this.nameInputs[index]')
    expect(methodBody('private buildCell(')).toContain('describePreset(preset)')
  })

  /**
   * ⚠ **入力中の要素を消すと `blur` が来ないことがある。**
   *   止めたままだと ESC も速度切り替えも効かなくなる。
   */
  it('片付けるときにゲームのキー入力を戻す', () => {
    expect(methodBody('private destroyNameInputs()')).toContain('setGameKeyboard(this.scene, true)')
    expect(methodBody('close(): void')).toContain('this.destroyNameInputs()')
    // シーンが終わるときにも DOM を残さない
    expect(body).toContain('Phaser.Scenes.Events.SHUTDOWN')
    expect(body).toContain('Phaser.Scenes.Events.DESTROY')
  })

  /** ⚠ **升からはみ出させない**（長さの根拠は `ShelfPresets.ts` の `PRESET_NAME_MAX`） */
  it('長さの上限を入力欄にも掛ける', () => {
    expect(body).toContain('el.maxLength = PRESET_NAME_MAX')
  })
})

describe('既定値が消えない（#83・受入条件3）', () => {
  /**
   * ⚠ **ペルソナ4人中2人が名前に反対している**
   *   （「名前を付けると名前を読むようになり、盤面を見なくなる」）。
   *   **名前を付けなければ従来どおりに見える**ことが、その反対への答え。
   */
  it('入力欄の placeholder に既定値（島名）を出す', () => {
    expect(methodBody('private placeNameInputs()')).toContain('placeholder: defaultPresetLabel(preset)')
    expect(methodBody('private syncNameInputs()')).toContain('defaultPresetLabel(preset)')
  })

  /**
   * ⚠ **升に出す字は `ShelfPresets.ts` が組む。**ここで組むと
   *   `layout.test.ts` が**実物の文字列を測れない**（`aidlc-state.md` の地雷）。
   */
  it('升の字をここで組み立てない', () => {
    const cell = methodBody('private buildCell(')
    expect(cell).toContain('describePreset(preset)')
    expect(cell).not.toContain('島')
    expect(cell).not.toContain('区画')
  })
})
