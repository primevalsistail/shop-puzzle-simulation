import { describe, it, expect } from 'vitest'
import {
  SCREEN_W, SCREEN_H,
  LEFT_PANEL_R, STRIP_L, STRIP_W, RIGHT_PANEL_L, LOG_T,
  PLACE_L, PLACE_R, PLACE_T, PLACE_B, PLACE_W, PLACE_H, PLACE_CX, PLACE_CY,
  CONTENT_L, CONTENT_R,
  TITLE_Y, SUBTITLE_Y, FILTER_Y, ROWS_TOP, PAGER_Y, ROWS_BOTTOM,
  rowsThatFit,
} from './layout.js'
import { PRESET_COUNT } from '../components/floor/ShelfPresets.js'

/**
 * **受入条件2（棚を覆わない）を機械で見る。**
 *
 * 行った先の画面は中央の領域だけを使い、**左パネル・キャラ帯・右パネル・メッセージ欄を
 * 侵さない。**目視では気づけない数pxのはみ出しがここで落ちる。
 */
describe('場所の領域は、隣の区画を侵さない', () => {
  it('左パネル（船倉の中身）より右にある', () => {
    expect(PLACE_L).toBeGreaterThanOrEqual(LEFT_PANEL_R)
  })

  it('右パネル（HUD・ボタン列）に届かない', () => {
    expect(PLACE_R).toBeLessThanOrEqual(RIGHT_PANEL_L)
    // キャラ帯と右パネルが隙間なく並んでいることも見ておく
    expect(STRIP_L + STRIP_W).toBe(RIGHT_PANEL_L)
  })

  /**
   * ⚠ **重なってよい。ただし隠すことが条件。**
   *   店にいないのに「店番」「来店客」の枠が出ているのはおかしいので、
   *   場所へ行っている間はキャラ帯を隠し、その領域も場所が使う（PO 2026-09-12）。
   */
  it('キャラ帯に重なる（だから場所へ行く間はキャラ帯を隠す）', () => {
    expect(PLACE_R).toBeGreaterThan(STRIP_L)
  })

  it('メッセージ欄より上にある', () => {
    expect(PLACE_B).toBeLessThanOrEqual(LOG_T)
  })

  it('画面の中にある', () => {
    expect(PLACE_T).toBeGreaterThanOrEqual(0)
    expect(PLACE_R).toBeLessThanOrEqual(SCREEN_W)
    expect(PLACE_B).toBeLessThanOrEqual(SCREEN_H)
  })
})

describe('領域の内側の座標', () => {
  it('幅と高さと中心が左右上下から出ている', () => {
    expect(PLACE_W).toBe(PLACE_R - PLACE_L)
    expect(PLACE_H).toBe(PLACE_B - PLACE_T)
    expect(PLACE_CX).toBe((PLACE_L + PLACE_R) / 2)
    expect(PLACE_CY).toBe((PLACE_T + PLACE_B) / 2)
  })

  it('文字の左右は枠の内側', () => {
    expect(CONTENT_L).toBeGreaterThan(PLACE_L)
    expect(CONTENT_R).toBeLessThan(PLACE_R)
    expect(CONTENT_L).toBeLessThan(CONTENT_R)
  })

  it('行が上から下へ重ならずに並んでいる', () => {
    expect(PLACE_T).toBeLessThan(TITLE_Y)
    expect(TITLE_Y).toBeLessThan(SUBTITLE_Y)
    expect(SUBTITLE_Y).toBeLessThan(FILTER_Y)
    expect(FILTER_Y).toBeLessThan(ROWS_TOP)
    expect(ROWS_TOP).toBeLessThan(ROWS_BOTTOM)
    expect(ROWS_BOTTOM).toBeLessThan(PAGER_Y)
    expect(PAGER_Y).toBeLessThan(PLACE_B)
  })
})

describe('rowsThatFit — 行数は高さから出す', () => {
  it('入れた行がページ送りへ食い込まない', () => {
    for (const rowH of [24, 40, 52, 72, 84, 120]) {
      const n = rowsThatFit(rowH)
      expect(ROWS_TOP + n * rowH).toBeLessThanOrEqual(ROWS_BOTTOM)
    }
  })

  it('あと1行は入らない（詰められるだけ詰めている）', () => {
    for (const rowH of [24, 40, 52, 72, 84, 120]) {
      const n = rowsThatFit(rowH)
      expect(ROWS_TOP + (n + 1) * rowH).toBeGreaterThan(ROWS_BOTTOM)
    }
  })

  it('領域より高い行は0行', () => {
    expect(rowsThatFit(PLACE_H * 2)).toBe(0)
  })

  /**
   * ⚠ **ダイアログだった頃より狭くしない。**
   *   「大きく見やすくする」（#58）のが目的なので、行数が減ったら作り直しの意味がない。
   */
  it('ダイアログの頃より行数が減っていない', () => {
    expect(rowsThatFit(52)).toBeGreaterThanOrEqual(6)  // 仕入れ（420×480 で6行）
    expect(rowsThatFit(84)).toBeGreaterThanOrEqual(5)  // クラフト（560×560 で5行）
  })

  it('ダイアログの頃より広い', () => {
    expect(PLACE_W).toBeGreaterThan(560)  // クラフト（いちばん広かった）
    expect(PLACE_H).toBeGreaterThan(560)
  })
})

/**
 * ⚠ **品出しの型（#27）が全部1画面に入るか。**
 *   型を選ぶのに送らせたくないので、**数を増やしたら行が縮む。**
 *   縮みすぎて読めなくなったら、ページ送りに切り替える合図。
 */
describe('品出しの型が1画面に入る', () => {
  it('行の高さが 36px を下回らない', () => {
    const rowH = Math.floor((ROWS_BOTTOM - ROWS_TOP) / PRESET_COUNT)
    expect(rowH).toBeGreaterThanOrEqual(36)
  })

  it('全部の行が一覧の範囲に収まる', () => {
    const rowH = Math.floor((ROWS_BOTTOM - ROWS_TOP) / PRESET_COUNT)
    expect(ROWS_TOP + PRESET_COUNT * rowH).toBeLessThanOrEqual(ROWS_BOTTOM)
  })
})
