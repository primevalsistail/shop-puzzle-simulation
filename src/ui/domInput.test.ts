/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import sceneSource from '../scenes/GameScene.ts?raw'
import domInputSource from './domInput.ts?raw'

/**
 * **`<input>` は HTML なので、必ず canvas より上に出る**（2026-09-14 の指摘）。
 *   セーブの枠を開いても、**仕入れの個数の欄がダイアログの上に居座っていた。**
 *   **depth では下へ回せない**ので、上に重ねる画面の間はまとめて隠す。
 *
 * ⚠ **`GameScene` は Phaser を読むのでここから import できない。**
 *   `PresetMenu.test.ts` と同じく**ソースとして縛る。**
 */
const strip = (src: string) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')

const scene = strip(sceneSource)
const dom = strip(domInputSource)

function methodBody(src: string, name: string): string {
  const at = src.indexOf(name)
  expect(at, `${name} が無い`).toBeGreaterThanOrEqual(0)
  const rest = src.slice(at)
  const end = rest.indexOf('\n  }')
  expect(end, `${name} の終わりが見つからない`).toBeGreaterThan(0)
  return rest.slice(0, end)
}

describe('上に重ねる画面の間は `<input>` を隠す', () => {
  /** ⚠ **入れ物ごと隠す。**欄を1つずつ隠すと、欄を増やしたときに忘れる */
  it('隠すのは DOM の入れ物ごと（欄を数えない）', () => {
    const fn = methodBody(dom, 'export function setDomInputsVisible')
    expect(fn).toContain('scene.game.domContainer')
    expect(fn).toContain("container.style.display = visible ? '' : 'none'")
  })

  /**
   * ⚠ **これが要。**開く側・閉じる側に足すと、入口のどれか1つを必ず忘れる。
   *   **毎フレーム見れば、画面を増やしても判定1つを直せばよい。**
   */
  it('同期は update() から毎フレーム。開く側・閉じる側には足さない', () => {
    expect(methodBody(scene, 'update(_time: number, delta: number)'))
      .toContain('this.syncDomInputs()')
    // 呼ぶのは update() の1箇所だけ
    expect(scene.match(/this\.syncDomInputs\(\)/g)).toHaveLength(1)
    expect(scene.match(/setDomInputsVisible\(this/g)).toHaveLength(1)
  })

  /** ⚠ **毎フレーム DOM を触らない。**変わったときだけ */
  it('変わったときだけ DOM を触る', () => {
    const fn = methodBody(scene, 'private syncDomInputs()')
    expect(fn).toContain('if (hide === this.domInputsHidden) return')
  })

  /**
   * ⚠ **depth 100 より上の画面を足したら、ここに足すこと**
   *   （いまは できごと120 ／ セーブ150 ／ 幕200 ／ 案内500）。
   */
  it('判定は depth 100 より上の4つを並べている', () => {
    const fn = methodBody(scene, 'private isOverlayOpen()')
    for (const m of [
      'this.messageWindow.isShown()',
      'this.saveLoadMenu.isVisible()',
      'this.tutorial.isShown()',
      'this.curtainShown',
    ]) expect(fn, `${m} が抜けている`).toContain(m)
  })

  /**
   * ⚠ **`isShelfBlocked()` と混ぜないこと。**あちらは時間と配置を止める判定で、
   *   **行った先（`PlaceFrame`）が入る。**こちらに入れると、
   *   **仕入れの個数・工房の回数・マイセットの名前——欄のある画面が全部打てなくなる。**
   */
  it('行った先とマイセットは入れない（欄があるのがその2つ）', () => {
    const fn = methodBody(scene, 'private isOverlayOpen()')
    expect(fn).not.toContain('placeFrame')
    expect(fn).not.toContain('presetMenu')
  })

  /** ⚠ **幕は戻らない。**出たら真のまま */
  it('幕は出した両方で印を立てる', () => {
    for (const m of ['private showGoalComplete()', 'private showGameOver()']) {
      expect(methodBody(scene, m), `${m}`).toContain('this.curtainShown = true')
    }
  })
})

/**
 * **2026-09-13 の赤入れ2件（「UIがずれている」）の直し。**
 *
 * ⚠ **`<input>` は左上基点で置く。**Phaser の `DOMElement` は既定で中心基点だが、
 *   **中心へ寄せる幅と高さを `getBoundingClientRect()` で1度だけ測って焼き付ける。**
 *   **作る時点でコンテナが隠れていると 0×0 になり、寄せる量が 0 のまま固定される。**
 *   行商人は**できごとの窓から開く**ので、欄を作る瞬間はいつも隠れている。
 */
describe('`<input>` は左上基点で置く（隠れていても同じ場所に出る）', () => {
  it('`tryAddDom` が setOrigin(0, 0) を付けている', () => {
    const fn = methodBody(dom, 'export function tryAddDom')
    expect(fn).toContain('setOrigin(0, 0)')
  })

  /**
   * ⚠ **`index.html` の `* { box-sizing: border-box }` がこの要素にも効く。**
   *   明示しないと、**枠と余白のぶんだけ実寸が指定より小さくなる**
   *   （検索欄が 160×24 のつもりで 150×18 だった）。
   */
  it('欄の実寸が、頼まれた大きさと同じ', () => {
    const fn = methodBody(dom, 'export function createInput')
    expect(fn).toContain("'box-sizing: border-box'")
    expect(fn).toContain('`width: ${opts.width}px`')
    expect(fn).toContain('`height: ${opts.height}px`')
  })
})
