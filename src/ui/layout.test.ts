import { describe, it, expect } from 'vitest'
import {
  SCREEN_W, SCREEN_H,
  HUD_PANEL_W, HUD_MONEY_FONT_PX, estTextWidth,
  BUY_W, BUY_FONT_PX, BUY_SUFFIX, INFO_MAX_W, INFO_FONT_PX,
  UPCOMING_FONT_PX, upcomingLabel, PRESET_TEXT_FONT_PX, PRESET_SUB_FONT_PX,
  PRESET_COLS, PRESET_GAP_X, PRESET_CELL_W, PRESET_TEXT_L_OFFSET, PRESET_TEXT_W,
  PRESET_NAME_INPUT_W, PRESET_NAME_INPUT_H,
  CRAFT_TEXT_MAX_W, CRAFT_ROUTE_FONT_PX, craftTimeLabel,
  LEFT_PANEL_R, STRIP_L, STRIP_W, RIGHT_PANEL_L, LOG_T,
  PLACE_L, PLACE_R, PLACE_T, PLACE_B, PLACE_W, PLACE_H, PLACE_CX, PLACE_CY,
  CONTENT_L, CONTENT_R,
  TITLE_Y, SUBTITLE_Y, FILTER_Y, ROWS_TOP, PAGER_Y, ROWS_BOTTOM,
  rowsThatFit, TITLE_RULE_Y, FILTER_BAND_H, FILTER_Y_NO_SUBTITLE, ROWS_TOP_NO_SUBTITLE,
  peddlerRemainText, peddlerSubtitleText, PEDDLER_REMAIN_FONT_PX, PEDDLER_TITLE,
  CHAR_ART_T, CHAR_ART_B, CHAR_ART_H, BTN_Y_ICON, BTN_ICON_H, BTN_Y_ADVANCE, BTN_ACTION_H,
  BTN_PANEL_L, BTN_PANEL_W, BTN_ICON_W, BTN_Y_TRADE,
  TITLE_FONT_PX, BACK_BTN_W, TAB_W, TAB_H, TAB_GAP, TAB_FONT_PX, tabCx,
  TRADE_TITLE, TRADE_TABS,
  DELIVERY_TAB_FONT_PX, DELIVERY_TAB_LINE_H, DELIVERY_TAB_EMPTY, deliveryTabLines,
  MSG_WIN_L, MSG_WIN_R, MSG_WIN_T, MSG_WIN_B, MSG_WIN_PAD, MSG_TEXT_MAX_W,
  MSG_SPEAKER_FONT_PX, MSG_SPEAKER_Y, MSG_TEXT_FONT_PX, MSG_TEXT_TOP, MSG_LINE_H,
  MSG_LINES_MAX, MSG_CHOICE_W, MSG_CHOICE_H, MSG_CHOICE_GAP, MSG_CHOICE_FONT_PX,
  MSG_CHOICE_CY, msgChoiceCx,
  ORDER_BAR_T, ORDER_BAR_L, ORDER_BAR_R, GRID_ORIGIN_Y, CELL_SIZE,
  HUD_BAR_W, HUD_NEXT_PORT_FONT_PX, HUD_NEXT_PORT_H, nextPortLabel,
} from './layout.js'
import { STORY_EVENTS } from '../components/progress/StoryEvents.js'
import { ALL_ITEMS } from '../taxonomy/items.js'
import { PEDDLER_MAX_PER_KIND, peddlerPrice } from '../components/progress/PeddlerStock.js'
import { money } from './money.js'
import { orderLineText } from './delivery.js'
import { PRESET_COUNT, PRESET_NAME_MAX, describePreset } from '../components/floor/ShelfPresets.js'
import { ROUTE } from '../taxonomy/islands.js'
import { salePrice } from '../taxonomy/derive.js'

import { ORDER_QUANTITY, ORDER_REWARD_RATE } from '../components/progress/DeliveryOrders.js'
import type { DeliveryOrder } from '../components/progress/DeliveryOrders.js'

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
  const COLS = PRESET_COLS
  const rows = PRESET_COUNT / COLS
  const cellH = Math.floor((ROWS_BOTTOM - ROWS_TOP) / rows)
  // ⚠ **升の横の寸法は `layout.ts` が持つ**（#83 で写しをやめた）。縦だけここで割る
  const cellW = PRESET_CELL_W

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
  const presetTextW = PRESET_TEXT_W

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

  it('升の幅の式が、`layout.ts` と一致している', () => {
    expect(cellW).toBe(
      Math.floor((CONTENT_R - CONTENT_L - PRESET_GAP_X * (COLS - 1)) / COLS),
    )
    expect(PRESET_TEXT_L_OFFSET + presetTextW).toBe(cellW)
  })

  /**
   * **プレイヤーが打った名前が升に収まるか**（#83・受入条件4）。
   *
   * ⚠ **最悪値は全角ばかりを上限まで打ったとき。**`estTextWidth` は全角を 1.0em と見るので、
   *   `PRESET_NAME_MAX × PRESET_TEXT_FONT_PX` が上限になる。
   * ⚠ **上限を上げるならここが先に落ちる。**落ちたら上げてはいけない合図。
   */
  it('名前を上限まで打っても文字欄に収まる（全角ばかりでも）', () => {
    const worst = 'あ'.repeat(PRESET_NAME_MAX)
    expect(estTextWidth(worst, PRESET_TEXT_FONT_PX)).toBeLessThanOrEqual(presetTextW)
  })

  /** ⚠ **既定値より長く打てること。**上限が既定値より短いと、島名を名前で書き写せない */
  it('上限は、いちばん長い既定値より長い', () => {
    const longest = Math.max(...ROUTE.map(island =>
      estTextWidth(describePreset({ savedAt: 0, island, slots: [] }), PRESET_TEXT_FONT_PX)))
    expect(estTextWidth('あ'.repeat(PRESET_NAME_MAX), PRESET_TEXT_FONT_PX))
      .toBeGreaterThan(longest)
  })

  /** 名前の `<input>` は文字欄と同じ場所に置く。**升の縁からはみ出さない** */
  it('名前の入力欄が升に収まる', () => {
    expect(PRESET_NAME_INPUT_W).toBeLessThanOrEqual(presetTextW)
    expect(PRESET_TEXT_L_OFFSET + PRESET_NAME_INPUT_W).toBeLessThanOrEqual(cellW)
  })

  /**
   * ⚠ **入力欄は升の1行目に置き、その下のボタン列に重ならないこと。**
   *   文字の行は升の上端から 15px（`PresetMenu.cellBox`）、ボタンは下端から 18px。
   */
  it('名前の入力欄が、升の上端とボタン列のあいだに収まる', () => {
    const h = cellH - 8              // GAP_Y
    const nameCy = -h / 2 + 15       // 升の中心から見た入力欄の中心
    const btnCy = h / 2 - 18
    expect(nameCy - PRESET_NAME_INPUT_H / 2).toBeGreaterThanOrEqual(-h / 2)
    expect(nameCy + PRESET_NAME_INPUT_H / 2).toBeLessThanOrEqual(btnCy - 24 / 2)
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

  /**
   * 1行目の「完成品×個数(在庫)　所要分（営業分）」（#53）。
   *
   * ⚠ **`…` で切れると、払う額が消える行である。**営業◯分こそが加工の値段なので、
   *   ここが落ちると #53 で足した意味そのものが無くなる。
   */
  it('所要分に「営業◯分」を足しても、1行目が `…` に切られない', () => {
    // 最悪値 — いちばん長い品名 × 4桁の個数・在庫 × 5桁の分数
    const longest = [...ALL_ITEMS].sort(
      (a, b) => b.display.name.length - a.display.name.length)[0].display.name
    const line = `${longest}×9999(999)　${craftTimeLabel(14064, 9999)}`
    expect(estTextWidth(line, 14)).toBeLessThanOrEqual(CRAFT_TEXT_MAX_W)
  })

  it('営業を削らないときは「（営業0分）」を足さない（削る行だけが目立つように）', () => {
    expect(craftTimeLabel(90, 0)).toBe('90分')
    expect(craftTimeLabel(90, 0)).not.toContain('営業')
    expect(craftTimeLabel(90, 30)).toContain('営業30分')
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

describe('行商人バレンのところ（#9）', () => {
  /** 1行の中で `残り N個` を置ける場所（品名の右端〜`N品に要る` の左端） */
  const NAME_X = CONTENT_L + 16
  const NEED_R = (() => {
    // ⚠ `PurchaseMenu.ts` は Phaser を読むので import できない。**列の並びは同じ式で追う**
    const BUY_L = CONTENT_R - 8 - 118
    const MAX_L = BUY_L - 6 - 40
    const PLUS_L = MAX_L - 6 - 26
    const INPUT_L = PLUS_L - 4 - 52
    const MINUS_L = INPUT_L - 4 - 26
    return MINUS_L - 14 - INFO_MAX_W
  })()

  /**
   * ⚠ **`残り N個` を `51レン/個　在庫 100/999` の側に足さないこと。**
   *   足すと `INFO_MAX_W`（160px）を超えて左隣の `N品に要る` に重なる。
   *   **だから品名の右**（`この島の産` と同じ場所）に出している。
   */
  it('⚠ `51レン/個…` の側に足すと枠を超える（だから品名の右に出す）', () => {
    const crowded = `1,234レン/個　在庫 100/999${peddlerRemainText(PEDDLER_MAX_PER_KIND)}`
    expect(estTextWidth(crowded, INFO_FONT_PX)).toBeGreaterThan(INFO_MAX_W)
  })

  it('いちばん長い品名でも、`残り N個` が `N品に要る` に重ならない', () => {
    const longest = ALL_ITEMS.reduce(
      (a, b) => (b.display.name.length > a.display.name.length ? b : a))
    // 品名は 15px（`PurchaseMenu.buildRow`）。右に 8px 空けて置く
    const tagL = NAME_X + estTextWidth(longest.display.name, 15) + 8
    const tagR = tagL + estTextWidth(peddlerRemainText(PEDDLER_MAX_PER_KIND), PEDDLER_REMAIN_FONT_PX)
    expect(tagR, longest.display.name).toBeLessThanOrEqual(NEED_R)
  })

  it('見出しの下の1行が、枠の内側に収まる（いちばん高い所持金で）', () => {
    const line = peddlerSubtitleText(money(10_000_000))
    expect(estTextWidth(line, 15)).toBeLessThanOrEqual(CONTENT_R - CONTENT_L)
  })

  /**
   * ⚠ **見出しの名と、できごとの窓に出る話し手の名は同じ**
   *   （同じ相手を2つの名で呼ばない。束M）。
   * ⚠ **ボタン列の名ではもう見ない**（#90 で列から外した）。
   */
  it('見出しの名が、できごとの窓の話し手と同じ', () => {
    const peddler = STORY_EVENTS.find(e => e.id === 'peddler_visit')
    expect(peddler?.speaker).toBe(PEDDLER_TITLE)
  })

  it('見出しが枠の内側に収まる', () => {
    expect(estTextWidth(PEDDLER_TITLE, 24)).toBeLessThanOrEqual(CONTENT_R - CONTENT_L)
  })

  /** ⚠ 行商人の買値も「買う」ボタンに収まること（`レン` は全角2文字） */
  it('行商人の買値 × 999個 でも「買う」ボタンからはみ出さない', () => {
    const worst = ALL_ITEMS.reduce((a, i) => Math.max(a, peddlerPrice(i.id)), 0) * 999
    expect(estTextWidth(`${money(worst)} 買う`, 12)).toBeLessThanOrEqual(118)
  })
})

describe('次の寄港地（#7・自由航行）', () => {
  /** ⚠ **いちばん長い島名で測る。**はみ出すと右パネルの枠から字が出る */
  it('どの島名でも、目標のバーと同じ幅に収まる', () => {
    for (const island of ROUTE) {
      expect(estTextWidth(nextPortLabel(island), HUD_NEXT_PORT_FONT_PX))
        .toBeLessThanOrEqual(HUD_BAR_W)
    }
  })

  /** ⚠ **HUD の枠（上端8・高さ126）から出ないこと。**出るとキャラ絵の枠に被る */
  it('押せるところが HUD の枠に収まり、キャラ絵の枠に被らない', () => {
    // `HUD.ts` の置き場所: パネル中心 y = 126/2 + 8、そこから +40（バー）+6
    const cy = 126 / 2 + 8 + 46
    expect(cy + HUD_NEXT_PORT_H / 2).toBeLessThanOrEqual(126 + 8)
    expect(cy + HUD_NEXT_PORT_H / 2).toBeLessThanOrEqual(CHAR_ART_T)
  })
})

describe('右パネルのボタン列とキャラ絵の枠（#9 で行を1つ足した）', () => {
  /**
   * ⚠ **行を足すと列が上へ伸びる。**キャラ絵の枠の下端を決め打ちにしていたら
   *   **重なったことに気づけない。**下端は列の上端から引いてある（`layout.ts`）。
   */
  it('キャラ絵の枠がボタン列に重ならない', () => {
    expect(CHAR_ART_B).toBeLessThan(BTN_Y_ICON - BTN_ICON_H / 2)
    expect(CHAR_ART_B).toBeGreaterThan(CHAR_ART_T)
    // 枠として意味がある高さは残っている（#21・#15 のキャラ絵が入る）
    expect(CHAR_ART_H).toBeGreaterThanOrEqual(120)
  })

  /**
   * ⚠ **縮めないこと。**#9 で行を足したときに 200 → 155px になり、#24 で外して 202px に戻り、
   *   **#96 で `改装` と `商人のところ` を `取引` の1行にまとめて 249px まで広がった。**
   *   **#15 の絵はこの大きさで入る**ので、ここを下回る変更は絵が入らなくなるという意味になる。
   *   ⚠ **#7（自由航行）は行を足さずに済ませてある** —— 次の寄港地は
   *   HUD の中で目標の進みのバーと入れ替わるので、ボタン列も HUD の枠も伸びない。
   */
  it('キャラ絵の枠が 249px から縮んでいない（#96 で広がった大きさ）', () => {
    expect(CHAR_ART_H).toBeGreaterThanOrEqual(249)
  })

  it('ボタン列がメッセージ欄に食い込まない', () => {
    expect(BTN_Y_ADVANCE + BTN_ACTION_H / 2).toBeLessThanOrEqual(LOG_T)
    expect(BTN_Y_TRADE).toBeGreaterThan(BTN_Y_ICON)
  })

  it('アイコン5つが列の幅に収まる', () => {
    expect(5 * BTN_ICON_W).toBeLessThanOrEqual(BTN_PANEL_W)
    expect(BTN_PANEL_L).toBeGreaterThanOrEqual(RIGHT_PANEL_L)
  })

  it('名前を付けても、2行目の島名と区画数が升に収まる（#83）', () => {
    // いちばん長い既定値
    const sub = estTextWidth('ミフユリア島 全部下ろす', PRESET_SUB_FONT_PX)
    expect(sub).toBeLessThanOrEqual(PRESET_TEXT_W)
    // 1行目（入力欄）と重ならない高さに置いてある
    expect(PRESET_SUB_FONT_PX).toBeLessThan(PRESET_TEXT_FONT_PX)
  })
})

/**
 * **選択肢のあるできごとの窓**（#24）。
 *
 * ⚠ **`PlaceFrame` と違って棚を消さない。**だから「隣の区画を侵さないか」ではなく、
 *   **消してはいけないもの（納品の帯・メッセージ欄・左右のパネル）に被っていないか**を見る。
 */
describe('できごとの窓（#24）', () => {
  it('左パネル（船倉の中身）と右パネルを侵さない', () => {
    expect(MSG_WIN_L).toBeGreaterThanOrEqual(LEFT_PANEL_R)
    expect(MSG_WIN_R).toBeLessThanOrEqual(RIGHT_PANEL_L)
  })

  /**
   * ⚠ **キャラ帯を覆わない。**`PlaceFrame` は帯を**隠してから**その領域まで使うが、
   *   こちらは隠さないので、覆えば店番と来店客が窓に切られる。
   *   **話し手の絵はいずれあの帯に入る**（#21・#15）。
   */
  it('キャラ帯（店番・来店客）を覆わない', () => {
    expect(MSG_WIN_R).toBeLessThanOrEqual(STRIP_L)
  })

  /** ⚠ **納品の帯と左右をそろえる**（同じ領域に幅の違う箱を2つ並べない） */
  it('納品の帯と左右がそろっている', () => {
    expect(MSG_WIN_L).toBe(ORDER_BAR_L)
    expect(MSG_WIN_R).toBe(ORDER_BAR_R)
  })

  /** ⚠ **帯はいま受けている注文で、選ぶ材料そのもの**（何が要るかで「見る」かが決まる） */
  it('納品の帯（#28）に被らない', () => {
    expect(MSG_WIN_B).toBeLessThanOrEqual(ORDER_BAR_T)
  })

  it('メッセージ欄に食い込まない', () => {
    expect(MSG_WIN_B).toBeLessThanOrEqual(LOG_T)
    expect(MSG_WIN_T).toBeGreaterThanOrEqual(0)
  })

  /**
   * ⚠ **窓が盤面をまるごと覆わないこと。**覆うなら `PlaceFrame` と変わらず、
   *   「棚を消さない」（#24 の既決2）が形だけになる。
   */
  it('盤面をまるごとは覆わない（上に棚が残る）', () => {
    const gridB = GRID_ORIGIN_Y + 10 * CELL_SIZE   // いちばん広いとき（13×10）の下端
    expect(MSG_WIN_T).toBeGreaterThan(GRID_ORIGIN_Y)
    // 盤面の上半分より下から始まる
    expect(MSG_WIN_T).toBeGreaterThan((GRID_ORIGIN_Y + gridB) / 2)
  })

  it('中の行が上から下へ重ならずに並んでいる', () => {
    expect(MSG_WIN_T).toBeLessThan(MSG_SPEAKER_Y)
    expect(MSG_SPEAKER_Y).toBeLessThan(MSG_TEXT_TOP)
    expect(MSG_TEXT_TOP).toBeLessThan(MSG_CHOICE_CY - MSG_CHOICE_H / 2)
    expect(MSG_CHOICE_CY + MSG_CHOICE_H / 2).toBeLessThanOrEqual(MSG_WIN_B)
  })

  /**
   * ⚠ **本文の行数を決め打ちにしないこと。**窓の高さやボタンの高さを動かしたとき、
   *   本文がボタンへ食い込んだことに気づけなくなる（`CHAR_ART_B` と同じ直し）。
   */
  it('本文の行が、選択肢のボタンに食い込まない', () => {
    expect(MSG_LINES_MAX).toBeGreaterThanOrEqual(1)
    expect(MSG_TEXT_TOP + MSG_LINES_MAX * MSG_LINE_H)
      .toBeLessThanOrEqual(MSG_CHOICE_CY - MSG_CHOICE_H / 2)
    // あと1行は入らない（詰められるだけ詰めている）
    expect(MSG_TEXT_TOP + (MSG_LINES_MAX + 1) * MSG_LINE_H)
      .toBeGreaterThan(MSG_CHOICE_CY - MSG_CHOICE_H / 2)
  })

  /** 選択肢は**1行に並べる**。段組みにすると「どれが先か」が生まれる */
  it('選択肢が1行に並び、窓からはみ出さない', () => {
    for (const def of STORY_EVENTS) {
      const n = def.choices.length
      const l = msgChoiceCx(0, n) - MSG_CHOICE_W / 2
      const r = msgChoiceCx(n - 1, n) + MSG_CHOICE_W / 2
      expect(l, def.id).toBeGreaterThanOrEqual(MSG_WIN_L + MSG_WIN_PAD)
      expect(r, def.id).toBeLessThanOrEqual(MSG_WIN_R - MSG_WIN_PAD)
      // 隣と重ならない
      for (let i = 1; i < n; i++) {
        expect(msgChoiceCx(i, n) - msgChoiceCx(i - 1, n))
          .toBe(MSG_CHOICE_W + MSG_CHOICE_GAP)
      }
    }
  })

  /** 3つ並べても収まるか。**選択肢の数はデータ側で増える** */
  it('選択肢が3つでも1行に収まる', () => {
    expect(msgChoiceCx(0, 3) - MSG_CHOICE_W / 2).toBeGreaterThanOrEqual(MSG_WIN_L + MSG_WIN_PAD)
    expect(msgChoiceCx(2, 3) + MSG_CHOICE_W / 2).toBeLessThanOrEqual(MSG_WIN_R - MSG_WIN_PAD)
  })
})

/**
 * **できごとのデータが、実物の文字として窓に収まるか**（受入条件4・5）。
 *
 * ⚠ **文字を組み立てているのは `StoryEvents.ts`（Phaser を読まない）。**
 *   だからここで実物を測れる。`MessageWindow.ts` 側で組み立てると測れなくなる。
 * ⚠ **文言は PO が決める（#79）。**言い回しを変えて収まらなくなったら、ここが落ちる。
 */
describe('できごとの文字が窓に収まる', () => {
  it('話し手の名前が枠に収まる', () => {
    for (const def of STORY_EVENTS) {
      expect(estTextWidth(def.speaker, MSG_SPEAKER_FONT_PX, true), def.id)
        .toBeLessThanOrEqual(MSG_TEXT_MAX_W)
    }
  })

  /** ⚠ **自動で折り返さない。**1行が枠を超えたら、超えたぶんは窓の外へ出る */
  it('本文の各行が枠に収まる', () => {
    for (const def of STORY_EVENTS) {
      for (const line of def.lines) {
        expect(estTextWidth(line, MSG_TEXT_FONT_PX), `${def.id}: ${line}`)
          .toBeLessThanOrEqual(MSG_TEXT_MAX_W)
      }
    }
  })

  it('本文の行数が、入る行数を超えていない', () => {
    for (const def of STORY_EVENTS) {
      expect(def.lines.length, def.id).toBeGreaterThan(0)
      expect(def.lines.length, def.id).toBeLessThanOrEqual(MSG_LINES_MAX)
    }
  })

  it('選択肢の文字がボタンに収まる', () => {
    for (const def of STORY_EVENTS) {
      for (const choice of def.choices) {
        expect(estTextWidth(choice.label, MSG_CHOICE_FONT_PX), `${def.id}: ${choice.label}`)
          .toBeLessThanOrEqual(MSG_CHOICE_W - 16)
      }
    }
  })
})

/**
 * **「取引」の3タブ（#96）。**タブは見出しの行に並ぶので、
 * **見出しと「← 店に戻る」のどちらにも重ならない**ことをここで見る。
 *
 * ⚠ **目で見ても数px の重なりは分からない。**`PurchaseMenu` の行と同じ扱いで、機械が見る。
 */
describe('「取引」の3タブ（#96）', () => {
  const tabsL = () => tabCx(0, TRADE_TABS.length) - TAB_W / 2
  const tabsR = () => tabCx(TRADE_TABS.length - 1, TRADE_TABS.length) + TAB_W / 2

  it('タブは見出しの右で始まる', () => {
    const headingR = CONTENT_L + estTextWidth(TRADE_TITLE, TITLE_FONT_PX, true)
    expect(tabsL()).toBeGreaterThan(headingR)
  })

  it('タブは「← 店に戻る」に届かない', () => {
    expect(tabsR()).toBeLessThan(CONTENT_R - BACK_BTN_W)
  })

  it('タブの名がタブの枠に収まる', () => {
    for (const label of TRADE_TABS) {
      expect(estTextWidth(label, TAB_FONT_PX), label).toBeLessThanOrEqual(TAB_W - 8)
    }
  })

  /** ⚠ **見出しの行を越えて、下の横線に掛からないこと** */
  it('タブが見出しの行に収まり、横線を跨がない', () => {
    expect(TITLE_Y - TAB_H / 2).toBeGreaterThan(PLACE_T)
    expect(TITLE_Y + TAB_H / 2).toBeLessThan(TITLE_RULE_Y)
  })

  it('タブどうしが重ならない', () => {
    for (let i = 1; i < TRADE_TABS.length; i++) {
      expect(tabCx(i, TRADE_TABS.length) - tabCx(i - 1, TRADE_TABS.length))
        .toBe(TAB_W + TAB_GAP)
    }
  })

  /**
   * ⚠ **行を1つ足していないこと。**タブを見出しの行ではなく下に置くと、
   *   一覧の上端が下がって**仕入れの行（56px）が8行から7行に減る。**
   *   タブを足すために品が1つ見えなくなるのは割に合わない（`layout.ts` の注記）。
   */
  it('タブを足しても仕入れの一覧の行数が減っていない', () => {
    expect(rowsThatFit(56)).toBe(8)
  })
})

/**
 * **納品タブ（#96）。**⚠ **帯は消したので、納品を見る場所はここだけ。**
 * 出す文字列は帯の1行を全角空白で折ったものなので、**文言は1語も増えていない。**
 */
describe('納品タブ（#96）', () => {
  it('帯の1行を折るだけで、語を足していない', () => {
    const bar = orderLineText('たけのこ', {
      itemId: 'x' as never, island: 'リナツィア' as never,
      quantity: 10, reward: 1200, issuedDay: 1,
    }, 3)
    expect(deliveryTabLines(bar).join('　')).toBe(bar)
    expect(deliveryTabLines(bar)).toEqual([
      '納品 たけのこ ×10 → リナツィア島', '手持ち 3/10', '報酬 1,200レン',
    ])
  })

  /** ⚠ **注文に出うるどの品でも、枠の幅に収まること**（帯と同じ検査） */
  it('どの注文でも、折った行が枠からはみ出さない', () => {
    const orderable = ALL_ITEMS.filter(i => i.origin !== 'なし')
    let worst = { w: 0, text: '' }
    for (const item of orderable) {
      const reward = Math.round(salePrice(item.id) * ORDER_QUANTITY * ORDER_REWARD_RATE)
      for (const island of ROUTE) {
        const order: DeliveryOrder = {
          itemId: item.id, island, quantity: ORDER_QUANTITY, reward, issuedDay: 1,
        }
        for (const line of deliveryTabLines(orderLineText(item.display.name, order, 999))) {
          const w = estTextWidth(line, DELIVERY_TAB_FONT_PX)
          if (w > worst.w) worst = { w, text: line }
        }
      }
    }
    expect(worst.w, worst.text).toBeLessThanOrEqual(CONTENT_R - CONTENT_L - 32)
  })

  /** 3行が一覧の領域に収まる（ページ送りの行に食い込まない） */
  it('3行が一覧の領域に収まる', () => {
    expect(ROWS_TOP + 24 + 2 * DELIVERY_TAB_LINE_H).toBeLessThanOrEqual(ROWS_BOTTOM)
    expect(estTextWidth(DELIVERY_TAB_EMPTY, 14)).toBeLessThanOrEqual(CONTENT_R - CONTENT_L)
  })
})
