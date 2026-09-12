import { describe, it, expect } from 'vitest'
import {
  SCREEN_W, SCREEN_H,
  HUD_PANEL_W, HUD_MONEY_FONT_PX, estTextWidth,
  BUY_W, BUY_FONT_PX, BUY_SUFFIX, INFO_MAX_W, INFO_FONT_PX,
  UPCOMING_FONT_PX, upcomingLabel, PRESET_TEXT_FONT_PX,
  CRAFT_TEXT_MAX_W, CRAFT_ROUTE_FONT_PX,
  LEFT_PANEL_R, STRIP_L, STRIP_W, RIGHT_PANEL_L, LOG_T,
  PLACE_L, PLACE_R, PLACE_T, PLACE_B, PLACE_W, PLACE_H, PLACE_CX, PLACE_CY,
  CONTENT_L, CONTENT_R,
  TITLE_Y, SUBTITLE_Y, FILTER_Y, ROWS_TOP, PAGER_Y, ROWS_BOTTOM,
  rowsThatFit, TITLE_RULE_Y, FILTER_BAND_H, FILTER_Y_NO_SUBTITLE, ROWS_TOP_NO_SUBTITLE,} from './layout.js'
import { money } from './money.js'
import { PRESET_COUNT, describePreset } from '../components/floor/ShelfPresets.js'
import { ROUTE } from '../taxonomy/islands.js'

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
describe('品出しの型が1画面に入る（2列 × 5行）', () => {
  const COLS = 2
  const rows = PRESET_COUNT / COLS
  const cellH = Math.floor((ROWS_BOTTOM - ROWS_TOP) / rows)
  const cellW = Math.floor((CONTENT_R - CONTENT_L - 14 * (COLS - 1)) / COLS)

  it('2で割り切れる本数である（2列に並べるため）', () => {
    expect(PRESET_COUNT % COLS).toBe(0)
  })

  it('升の高さが、縮小図とボタンの2段ぶん（56px）を下回らない', () => {
    expect(cellH).toBeGreaterThanOrEqual(56)
  })

  /** 縮小図70 ＋ ボタン3つ（76×3 ＋ 隙間7×2）＋ 余白 */
  it('升の幅に、縮小図とボタン3つが入る', () => {
    expect(cellW).toBeGreaterThanOrEqual(10 + 70 + 12 + 76 * 3 + 7 * 2 + 10)
  })

  it('全部の升が一覧の範囲に収まる', () => {
    expect(ROWS_TOP + rows * cellH).toBeLessThanOrEqual(ROWS_BOTTOM)
  })

  /**
   * **升に出す1行に、島名が入るか**（#67）。
   *
   * 文字欄は**升の幅から、縮小図（左余白10 ＋ 70 ＋ 間隔12）を引いた残り。**
   * ⚠ **最悪値は区画数が3桁のとき。**盤面はいちばん広いとき 13×10 ＝ 130升で、
   *   1升の品ばかり並べると `130区画` になる。**いまよく出る `12区画` で見てはいけない。**
   */
  const presetTextW = cellW - (10 + 70 + 12)

  it('文字欄に「島名 ＋ 区画数」が収まる（3桁の区画数でも）', () => {
    for (const island of ROUTE) {
      const line = describePreset({ savedAt: 0, island, slots: Array(130).fill(null) as never })
      expect(estTextWidth(line, PRESET_TEXT_FONT_PX)).toBeLessThanOrEqual(presetTextW)
    }
  })

  it('文字欄に「島名 ＋ 全部下ろす」が収まる', () => {
    for (const island of ROUTE) {
      const line = describePreset({ savedAt: 0, island, slots: [] })
      expect(estTextWidth(line, PRESET_TEXT_FONT_PX)).toBeLessThanOrEqual(presetTextW)
    }
  })

  /** ⚠ **ボタン3つの行と同じ升に入る。**文字の行が伸びてもボタンの列は動かない */
  it('文字欄は、ボタン3つの列より広い', () => {
    expect(presetTextW).toBeGreaterThanOrEqual(76 * 3 + 7 * 2)
  })
})

/**
 * **`¥` を `レン` にしたぶん、文字が枠から出ていないか**（束M）。
 *
 * `¥1234` は半角4文字だったが `1,234レン` は**全角2文字ぶん増える。**
 * 幅の決まった枠に中央ぞろえで置いているところは、**黙ってはみ出す。**
 *
 * ⚠ **ここで見ているのは見積もりであって実測ではない**（`estTextWidth` の注記）。
 *   落ちたら必ずはみ出しているが、通ってもぎりぎりのことはある。
 */
describe('金額の文字が枠に収まる', () => {
  /**
   * 見積もりが**実測を下回らない**ことを確かめておく。下回ると、
   * このファイルの残りの検査が「収まっている」と嘘をつくようになる。
   * 右の数は Chromium での実測（`Courier` 22px 太字 ／ 13px）。
   */
  it('見積もりは実測を下回らない', () => {
    expect(estTextWidth('10,000,000レン', 22, true)).toBeGreaterThanOrEqual(183.2)
    expect(estTextWidth('123,456レン で買う', 13)).toBeGreaterThanOrEqual(122.9)
    expect(estTextWidth('1,234レン/個　在庫 100/999', 11)).toBeGreaterThanOrEqual(150.4)
    // ⚠ `+` が3つ出る行。`+` を数字と同じ幅で数えると、ここが実測を下回る
    expect(estTextWidth(
      '転売+1,234,567レン → 作る+2,345,678レン → 材料も作る+3,456,789レン（計14064分）', 12,
    )).toBeGreaterThanOrEqual(514.9)
  })

  /**
   * ⚠ **1000万は実際に到達する額。**クリア条件が所持金 1000万（`GameService`）なので、
   *   **目標に届いた瞬間にはみ出す**という壊れ方をする。
   */
  it('右パネルの所持金は、1000万レンでも枠に収まる', () => {
    expect(estTextWidth(money(10_000_000), HUD_MONEY_FONT_PX, true))
      .toBeLessThanOrEqual(HUD_PANEL_W)
  })

  /** ⚠ **下げすぎない。**所持金は右パネルの主要な情報である */
  it('所持金の文字を 20px より小さくしない', () => {
    expect(HUD_MONEY_FONT_PX).toBeGreaterThanOrEqual(20)
  })

  /**
   * 「買う」の中身は `合計 買う`。合計は `仕入れ値 × 個数`。
   *
   * ⚠ **最悪値は 3,237,759 で、7桁。**いちばん高い品（仕入れ値 3,241。`celebration_hamper`。
   *   産地が `なし` なので U2 で商人に並び得る）を、在庫の上限 999個 買うとこうなる。
   *   **ここを 6桁で見てはいけない。**6桁で通してしまうと、遊びの終盤だけ壊れる。
   */
  it('「買う」は、7桁の合計（3,241 × 999）でもボタンに収まる', () => {
    expect(estTextWidth(`${money(3_241 * 999)}${BUY_SUFFIX}`, BUY_FONT_PX))
      .toBeLessThanOrEqual(BUY_W)
  })

  /** ⚠ **隣の「最大」「＋」「−」が 12px。**主たるボタンだけ小さいのはおかしい */
  it('「買う」の文字を、隣のボタン（12px）より小さくしない', () => {
    expect(BUY_FONT_PX).toBeGreaterThanOrEqual(12)
  })

  /**
   * ⚠ **「買う」という語を落とさない。**ボタンが何をするか読めなくなる。
   *   収まらないときに削ってよいのは助詞までである。
   */
  it('「買う」ボタンに「買う」という語が残っている', () => {
    expect(BUY_SUFFIX).toContain('買う')
  })

  /**
   * 仕入れの行の右側 `1,234レン/個　在庫 100/999`。
   * **左隣の「N品に要る」との間隔 `INFO_MAX_W` を超えると、字が重なる。**
   *
   * ⚠ **最悪値は4桁の仕入れ値・3桁の在庫。**桁が1つ増えるだけで重なるので、
   *   `51レン/個`（いまよく出る形）で見てはいけない。
   */
  it('仕入れ値が4桁でも、左隣の「N品に要る」に重ならない', () => {
    expect(estTextWidth(`${money(1_234)}/個　在庫 100/999`, INFO_FONT_PX))
      .toBeLessThanOrEqual(INFO_MAX_W)
  })

  /**
   * 商人のところの「もうすぐ買える」行（#66）。**「買う」ボタンと同じ右端に置く。**
   *
   * ⚠ **最悪値は3桁の残り。**U2 のしきい値は規則データの中の値なので、
   *   **いまの 100 で見てはいけない**（`あと100個…` は2桁の行より狭い）。
   *   しきい値を上げたときに黙ってはみ出す、という壊れ方をする。
   */
  it('「もうすぐ買える」は、3桁の残りでも「買う」ボタンの幅に収まる', () => {
    expect(estTextWidth(upcomingLabel(999), UPCOMING_FONT_PX)).toBeLessThanOrEqual(BUY_W)
  })

  /**
   * ⚠ **`BUY_FONT_PX`（12）へ上げると 1px はみ出す。**
   *   「ボタンと大きさを揃えよう」と思ったときに落ちる検査。
   */
  it('⚠ 「買う」と同じ 12px では収まらない（だから 11px）', () => {
    expect(estTextWidth(upcomingLabel(999), BUY_FONT_PX)).toBeGreaterThan(BUY_W)
  })

  /**
   * ⚠ **しきい値（100）も分母も画面に出さない**（PO 判断 Q7=A ／ #60 の既決）。
   *   `88/100` のような形へ変えると、規則を変えたとき画面の意味が変わる。
   */
  it('「もうすぐ買える」に分母が出ていない', () => {
    expect(upcomingLabel(12)).toBe('あと12個売れば並ぶ')
    expect(upcomingLabel(12)).not.toContain('/')
  })

  /**
   * 工房の「転売 → 作る → 材料も作る」の行（#23）。
   *
   * ⚠ **`…` で切れたら意味が消える行である。**3つ並んで初めて比べられる。
   *   最悪値は**全レシピ × その日に回せる最大回数**を当たって出したもので、
   *   `転売+10,464レン → 作る+15,120レン → 材料も作る+25,776レン（計14064分）`。
   *   ここでは**さらに余裕を見て7桁**の形で見る。
   */
  it('3ルートの行が、7桁でも `…` に切られない', () => {
    const line = '転売+1,234,567レン → 作る+2,345,678レン → 材料も作る+3,456,789レン（計14064分）'
    expect(estTextWidth(line, CRAFT_ROUTE_FONT_PX)).toBeLessThanOrEqual(CRAFT_TEXT_MAX_W)
  })
})

describe('見出しの下に1行が無い場所（工房）', () => {
  // ⚠ **束M で「28px まるごと詰めて壊れた」ときの再発防止。**
  //   検索の入力欄が横線を跨ぎ、「店に戻る」ボタンに1pxまで近づいた。
  it('絞り込みの行が、見出しの横線より下から始まる', () => {
    const bandTop = FILTER_Y_NO_SUBTITLE - FILTER_BAND_H / 2
    expect(bandTop).toBeGreaterThan(TITLE_RULE_Y)
  })

  it('絞り込みの行が「店に戻る」ボタンに重ならない', () => {
    // ボタンは TITLE_Y 中心・高さ30
    const backBottom = TITLE_Y + 15
    const bandTop = FILTER_Y_NO_SUBTITLE - FILTER_BAND_H / 2
    expect(bandTop).toBeGreaterThan(backBottom)
  })

  it('詰めた結果、一覧の上端が絞り込みの行より下にある', () => {
    expect(ROWS_TOP_NO_SUBTITLE).toBeGreaterThan(FILTER_Y_NO_SUBTITLE + FILTER_BAND_H / 2)
  })

  it('⚠ 詰めても、他の3画面より上にある（＝空白が減っている）', () => {
    expect(ROWS_TOP_NO_SUBTITLE).toBeLessThan(ROWS_TOP)
  })
})
