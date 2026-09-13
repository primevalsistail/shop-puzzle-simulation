/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import menuSource from './SaveLoadMenu.ts?raw'

/**
 * **セーブの上書きに確認を挟む**（PO スクリーンショット指示 2026-09-13）。
 *
 * ⚠ **`SaveLoadMenu` は Phaser を読むのでここから import できない。**
 *   `PresetMenu.test.ts` と同じく**ソースとして縛る。**
 *   縛りたいのは1つだけ —— **中身のある枠を押した時点では保存しないこと。**
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

describe('上書きの確認', () => {
  /** ⚠ **これが指示そのもの。**押した瞬間に保存したら確認の意味が無い */
  it('枠を押して即 onSave するのは、空の枠のときだけ', () => {
    const slots = methodBody('private buildSlots(')
    expect(slots).toContain('if (isEmpty) { this.onSave(i)')
    // 中身のある枠は番号を控えて作り直すだけ
    expect(slots).toContain('this.confirmSlot = i')
  })

  it('onSave を呼ぶのは「空の枠」と「上書きする」の2箇所だけ', () => {
    expect(body.match(/this\.onSave\(/g)).toHaveLength(2)
    expect(methodBody('private buildConfirm(')).toContain('this.onSave(slot)')
  })

  it('確認には「上書きする」と「やめる」が出る', () => {
    const confirm = methodBody('private buildConfirm(')
    expect(confirm).toContain("'上書きする'")
    expect(confirm).toContain("'やめる'")
    // やめるは保存せず、枠の一覧へ戻る
    expect(confirm).toContain('this.confirmSlot = null')
  })

  /**
   * ⚠ **`build()` が `close()` を呼ぶと、確認を出すために作り直した瞬間に番号が消える**
   *   （`close()` は `confirmSlot` を `null` に戻すため）。ここを踏むと確認が一切出ない
   */
  it('build() は close() ではなく clearObjects() で捨てる', () => {
    const build = methodBody('private build(): void')
    expect(build).toContain('this.clearObjects()')
    expect(build).not.toContain('this.close()')
    expect(methodBody('close(): void')).toContain('this.confirmSlot = null')
  })

  it('ロードは確認を挟まない（消えるものが無い）', () => {
    const slots = methodBody('private buildSlots(')
    expect(slots).toContain("if (this.mode === 'load') { this.onLoad(i); this.close(); return }")
  })

  /** ⚠ **1行メソッドなので `methodBody()` では区切れない。**行ごと縛る */
  it('開き直すと確認は残らない', () => {
    for (const m of ['openSave', 'openLoad']) {
      const line = body.split('\n').find(l => l.includes(`${m}(): void`)) ?? ''
      expect(line, `${m} が無い`).toContain('this.confirmSlot = null')
    }
  })
})
