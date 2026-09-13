/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import menuSource from './SaveLoadMenu.ts?raw'

/**
 * ロードの確認（PO 指示 2026-09-14「ロードの時は確認メッセージを表示する」）。
 *
 * ⚠ **`SaveLoadMenu` は Phaser を読むのでここから import できない。**
 *   **押した先で何が呼ばれるかをソースとして縛る**（`PresetMenu.test.ts` と同じやり方）。
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

describe('ロードは確認を挟んでから実行する', () => {
  /** ⚠ **これが受入条件そのもの。**枠を押しただけでは戻らない操作を起こさない */
  it('枠の一覧（build）からは onLoad を呼ばない', () => {
    expect(methodBody('private build()')).not.toContain('this.onLoad(')
  })

  it('枠を押すと確認の面へ移る', () => {
    expect(methodBody('private build()')).toContain('this.buildConfirm()')
  })

  it('onLoad を呼ぶのは確認の面の1箇所だけ', () => {
    expect(body.match(/this\.onLoad\(/g)).toHaveLength(1)
    expect(methodBody('private buildConfirm()')).toContain('this.onLoad(slot)')
  })

  /** ⚠ **やめるは閉じない。**枠を選び直せること */
  it('確認の面から一覧へ戻れる', () => {
    const confirm = methodBody('private buildConfirm()')
    expect(confirm).toContain('やめる')
    expect(confirm).toContain('this.build()')
  })

  /** ⚠ **セーブは今までどおり。**上書きの確認は PO 判断待ち（計画ファイル参照） */
  it('セーブは押した時点で保存する', () => {
    expect(methodBody('private build()')).toContain('this.onSave(i)')
  })
})

describe('確認の面でも棚に手が出せない', () => {
  /**
   * ⚠ **`GameScene.isShelfBlocked()` が `isVisible()` を見ている。**
   *   確認の面を出している間に偽になると、**確認を出したまま棚を掴める。**
   */
  it('isVisible は中身があるかで判定していて、確認の面でも中身がある', () => {
    expect(body).toContain('isVisible(): boolean { return this.objects.length > 0 }')
    expect(methodBody('private buildConfirm()')).toContain('this.buildFrame(')
  })

  /** ⚠ **面を入れ替えるときに `close()` を使わない。**使うと確認待ちの枠まで捨てる */
  it('面の作り直しは clearObjects で、close ではない', () => {
    expect(methodBody('private buildConfirm()')).toContain('this.clearObjects()')
    expect(methodBody('private build()')).toContain('this.clearObjects()')
  })
})
