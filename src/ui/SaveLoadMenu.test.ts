/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import menuSource from './SaveLoadMenu.ts?raw'

/**
 * **戻らない操作に確認を挟む。**
 *   **上書き**（PO スクリーンショット指示 2026-09-13）と
 *   **ロード**（PO スクリーンショット指示 2026-09-14）。
 *
 * ⚠ **`SaveLoadMenu` は Phaser を読むのでここから import できない。**
 *   `PresetMenu.test.ts` と同じく**ソースとして縛る。**
 *   縛りたいのは1つ —— **押した時点では実行しないこと。**
 *
 * ⚠ **2026-09-13 には「ロードは確認を挟まない」と決めていた。**
 *   **2026-09-14 に PO が覆した**ので、そのテストは反対向きに書き直してある。
 *   受入条件は `construction/plans/load-confirm.md`。
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

describe('上書きとロードの確認', () => {
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

  /** ⚠ **2026-09-14 に反転した。**押し間違えると、いま遊んでいる分が戻らない */
  it('ロードも確認を挟む（枠を押した時点では読み込まない）', () => {
    const slots = methodBody('private buildSlots(')
    expect(slots).not.toContain('this.onLoad(')
    expect(slots).toContain('this.confirmSlot = i')
  })

  it('onLoad を呼ぶのは確認の「読み込む」1箇所だけ', () => {
    expect(body.match(/this\.onLoad\(/g)).toHaveLength(1)
    expect(methodBody('private buildConfirm(')).toContain('this.onLoad(slot)')
  })

  /**
   * ⚠ **出すのは見出し1行とボタンだけ**（PO 指示 2026-09-14「不要」）。
   *   **記録の中身も、`いま遊んでいる分は消えます` も出さない。**
   *   後者は同じ日に足して同じ日に外している。**足し直すなら PO に聞くこと。**
   */
  it('確認に出す文字は、見出しとボタンの名前だけ', () => {
    const confirm = methodBody('private buildConfirm(')
    expect(confirm).toContain("'読み込む'")
    expect(confirm).not.toContain('いま遊んでいる分は消えます')
    expect(confirm).not.toContain('formatMeta')
  })

  /**
   * ⚠ **確認の面は枠の一覧より小さい**（PO 指示 2026-09-13「大きすぎる」）。
   *   一覧の `MH` をそのまま使うと、見出し1行のまわりが空く
   */
  it('確認のときは小さい面を使う', () => {
    const build = methodBody('private build(): void')
    expect(build).toContain('confirming ? CONFIRM_MW : MW')
    expect(build).toContain('confirming ? CONFIRM_MH : MH')
    // 面の中身も、その高さから位置を取る（一覧の高さを混ぜない）
    const confirm = methodBody('private buildConfirm(')
    expect(confirm).toContain('CONFIRM_MH / 2')
    expect(confirm).not.toMatch(/(?<!CONFIRM_)MH \/ 2/)
  })

  /** ⚠ **記録の中身は出さない**（PO 指示 2026-09-13「不要」） */
  it('確認に記録（Day・所持金・日時）を出さない', () => {
    const confirm = methodBody('private buildConfirm(')
    expect(confirm).not.toContain('formatMeta')
    expect(confirm).not.toContain('getSlotMeta')
  })

  /** ⚠ **1行メソッドなので `methodBody()` では区切れない。**行ごと縛る */
  it('開き直すと確認は残らない', () => {
    for (const m of ['openSave', 'openLoad']) {
      const line = body.split('\n').find(l => l.includes(`${m}(): void`)) ?? ''
      expect(line, `${m} が無い`).toContain('this.confirmSlot = null')
    }
  })
})
