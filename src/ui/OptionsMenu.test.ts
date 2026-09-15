/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import optionsMenuSource from './OptionsMenu.ts?raw'
import optionsSource from './options.ts?raw'
import gameSceneSource from '../scenes/GameScene.ts?raw'
import { CONFIRM_ACTIONS } from './ConfirmDialog.js'
import { optionSections } from './options.js'

/**
 * **⚙️ から開く設定の面**（#113）。
 *
 * ⚠ **`OptionsMenu` は Phaser の場面を要るのでここから動かせない。**
 *   `SaveLoadMenu.test.ts` と同じく**ソースとして縛る。**
 *   縛りたいのは3つ ——
 *   **何を並べるかを `options.ts` だけが持つこと**（オプションを足す先を1つにする）、
 *   **行を `CONFIRM_ACTIONS` から作ること**、**`GameScene` 側の配線を外さないこと。**
 *
 * ⚠ **`options.ts` は Phaser を読まないので、中身はここから直に呼べる。**
 *   ソースで縛るのは `OptionsMenu.ts` の側だけにすること。
 */
const strip = (src: string) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')

const body = strip(optionsMenuSource)
const registry = strip(optionsSource)
const scene = strip(gameSceneSource)

describe('設定に並ぶもの', () => {
  /** ⚠ **受入条件5。**行為を足したら設定の行も増えること */
  it('行は CONFIRM_ACTIONS から作る', () => {
    expect(registry).toContain('CONFIRM_ACTIONS.map')
    // ⚠ **ほかの区分も並ぶ**（#14 の「音」など）ので、**この区分だけを見る**
    const confirms = optionSections().find(sec => sec.rows.some(r => r.label === CONFIRM_ACTIONS[0]))
    expect(confirms?.rows.map(r => r.label)).toEqual([...CONFIRM_ACTIONS])
  })

  it('どの区分にも見出しと、1つ以上の中身がある', () => {
    for (const sec of optionSections()) {
      expect(sec.title.length).toBeGreaterThan(0)
      // ⚠ **中身は行だけではない**（#14 の配布元は押せない字＝`notes`）。
      //   **空の見出しだけを出さない**ことを縛るのがここ
      expect(sec.rows.length + (sec.notes?.length ?? 0)).toBeGreaterThan(0)
    }
  })

  /** ⚠ **控えを持たず、毎回いまの値を読むこと**（設定の外で変わった値に付いていく） */
  it('いまの値は読むたびに取り直す', () => {
    const row = optionSections()[0].rows[0]
    const before = row.isOn()
    row.set(!before)
    expect(row.isOn()).toBe(!before)
    row.set(before)
    expect(row.isOn()).toBe(before)
  })

  /** ⚠ **切り替えは `setConfirmNeeded` を通す**（表を直に書き換えると覚えない） */
  it('切り替えは setConfirmNeeded を通す', () => {
    expect(registry).toContain('setConfirmNeeded(action, on)')
  })
})

describe('設定の面の作り方', () => {
  /** ⚠ **受入条件5。**オプションを足す先は `options.ts` の1箇所だけにする */
  it('並べるものは optionSections() から取る', () => {
    expect(body).toContain('optionSections()')
  })

  /** ⚠ **行為の名前も区分の見出しも、書き写すと片方だけ古くなる** */
  it('項目の名前をこのファイルに書き写していない', () => {
    const names = [
      ...CONFIRM_ACTIONS,
      ...optionSections().map(sec => sec.title),
    ]
    for (const name of names) {
      expect(body, name).not.toContain(`'${name}'`)
    }
  })

  /** ⚠ **面の高さは中身から出す。**直値だと、足したときにはみ出す */
  it('面の高さと位置は layout.ts が出す', () => {
    expect(body).toContain('optionsLayout(kinds)')
    expect(body).toContain('optionsCloseCy(cy, panelH)')
    expect(body).not.toMatch(/panelH = \d/)
  })

  /** ⚠ **描く並びと測る並びは同じ1本から作ること**（別々に組むとずれる） */
  it('見出しと行を1本に並べてから測る', () => {
    expect(body).toContain("kinds.push('section')")
    expect(body).toContain("kinds.push('row')")
    expect(body).toContain("kinds.push('note')")
    expect(body).toContain('cys[i]')
  })

  /** ⚠ **つまみの位置は状態そのもの。**押したら作り直す */
  it('切り替えたら面ごと作り直す', () => {
    expect(body).toContain('row.set(!on)')
    expect(body).toContain('optionsKnobDx(on)')
  })

  /** ⚠ **寸法は `layout.ts` が持つ。**`ui/` に直値を書かない */
  it('字の大きさを直に書いていない', () => {
    expect(body).not.toMatch(/fontSize: '\d+px'/)
  })
})

describe('GameScene 側の配線', () => {
  it('⚙️ が設定を開く（「準備中」は残っていない）', () => {
    expect(scene).toContain("tip: 'オプション', action: () => this.openOptionsMenu()")
    expect(scene).not.toContain('オプション: 準備中')
  })

  /**
   * ⚠ **`<input>` は HTML なので depth では暗幕の下へ回らない。**
   *   **ここに足さないと、設定の上に工房の検索欄や回数欄が出たままになる。**
   */
  it('<input> を隠す判定に入っている', () => {
    const at = scene.indexOf('private isOverlayOpen()')
    expect(at).toBeGreaterThan(0)
    expect(scene.slice(at, at + 300)).toContain('this.optionsMenu.isVisible()')
  })

  /** ⚠ **開いている間は棚を掴めないこと**（判定はこの1箇所だけ） */
  it('棚を止める判定に入っている', () => {
    const at = scene.indexOf('private isShelfBlocked()')
    expect(at).toBeGreaterThan(0)
    expect(scene.slice(at, at + 300)).toContain('this.optionsMenu.isVisible()')
  })

  it('ESC で閉じる', () => {
    expect(scene).toContain('if (this.optionsMenu.isVisible()) { this.optionsMenu.close(); return }')
  })
})
