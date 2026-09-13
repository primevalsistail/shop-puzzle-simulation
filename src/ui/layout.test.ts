/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import purchaseSource from './PurchaseMenu.ts?raw'
import messageWindowSource from './MessageWindow.ts?raw'
import craftSource from './CraftMenu.ts?raw'
import {
  SCREEN_W, SCREEN_H,
  HUD_PANEL_W, HUD_MONEY_FONT_PX, estTextWidth,
  BUY_W, BUY_BTN_W, BUY_TOTAL_W, BUY_TOTAL_FONT_PX, BUY_FONT_PX, BUY_LABEL,
  BUY_REASON_FUNDS, buyReasonCap, QTY_REASON_EMPTY, QTY_REASON_NOT_INT,
  INFO_MAX_W, INFO_FONT_PX,
  ROW_NAME_X, ROW_NEED_R, ROW_INPUT_L, ROW_INPUT_W, ROW_PLUS_L, ROW_MINUS_L, ROW_STEP_W,
  LIST_SEARCH_W, LIST_SEARCH_H,
  UPCOMING_FONT_PX, upcomingLabel, PRESET_TEXT_FONT_PX, PRESET_SUB_FONT_PX,
  PRESET_COLS, PRESET_GAP_X, PRESET_CELL_W, PRESET_TEXT_L_OFFSET, PRESET_TEXT_W,
  PRESET_NAME_INPUT_W, PRESET_NAME_INPUT_H,
  craftTimeLabel,
  CRAFT_HEAD_Y, CRAFT_ROWS_TOP, CRAFT_ROW_H, CRAFT_COLS,
  CRAFT_NAME_L, CRAFT_NAME_W, CRAFT_NAME_FONT_PX, CRAFT_CELL_FONT_PX,
  CRAFT_MADE_R, CRAFT_STOCK_R, CRAFT_TIME_L, CRAFT_TIME_W,
  CRAFT_DEMAND_L, CRAFT_DEMAND_W, CRAFT_DEMAND_SEP,
  CRAFT_BTN_W, CRAFT_BTN_L, CRAFT_BTN_FONT_PX, CRAFT_BTN_LABEL,
  CRAFT_REASON_INGREDIENTS, CRAFT_REASON_STOCK, CRAFT_REASON_TIME,
  CRAFT_REASON_EMPTY, CRAFT_REASON_NOT_INT,
  CRAFT_QTY_L, CRAFT_QTY_W, CRAFT_INPUT_W, CRAFT_STEP_XS, CRAFT_STEP_LABELS, CRAFT_STEP_FONT_PX,
  LEFT_PANEL_R, STRIP_L, STRIP_W, RIGHT_PANEL_L, LOG_T,
  PLACE_L, PLACE_R, PLACE_T, PLACE_B, PLACE_W, PLACE_H, PLACE_CX, PLACE_CY,
  CONTENT_L, CONTENT_R,
  TITLE_Y, SUBTITLE_Y, FILTER_Y, ROWS_TOP, PAGER_Y, ROWS_BOTTOM,
  rowsThatFit, TITLE_RULE_Y, FILTER_BAND_H, FILTER_Y_NO_SUBTITLE, ROWS_TOP_NO_SUBTITLE,
  peddlerRemainText, PEDDLER_REMAIN_FONT_PX, PEDDLER_TITLE,
  CHAR_ART_T, CHAR_ART_B, CHAR_ART_H, BTN_Y_ICON, BTN_ICON_H, BTN_Y_ADVANCE, BTN_ACTION_H,
  HUD_PANEL_B, HUD_ROW_MONEY_Y, HUD_ROW_TIME_Y, HUD_ROW_PLACE_Y,
  BTN_PANEL_L, BTN_PANEL_W, BTN_ICON_W, BTN_Y_TRADE,
  TITLE_FONT_PX, BACK_BTN_W, TAB_W, TAB_H, TAB_GAP, TAB_FONT_PX, tabCx,
  TRADE_TITLE, TRADE_TABS, TAB_ROW_SUB_FONT_PX,
  UPGRADE_ROW_H, UPGRADE_NAME_X, UPGRADE_SUB_MAX_W,
  UPGRADE_STAGE_CX, UPGRADE_STAGE_FONT_PX, UPGRADE_STAGE_W, UPGRADE_STAGE_L,
  UPGRADE_BTN_W, UPGRADE_BTN_L, UPGRADE_BTN_R, UPGRADE_COST_W, UPGRADE_COST_L,
  UPGRADE_COST_R, UPGRADE_COST_FONT_PX,
  UPGRADE_LABEL, UPGRADE_REASON_FUNDS, UPGRADE_MAXED, upgradeSubLine,
  DELIVERY_TAB_EMPTY, DELIVERY_HEAD_Y, DELIVERY_HEAD_FONT_PX,
  DELIVERY_ROWS_TOP, DELIVERY_ROW_H,
  DELIVERY_NAME_L, DELIVERY_NAME_W, DELIVERY_CLIENT_L, DELIVERY_CLIENT_W,
  DELIVERY_QTY_R, DELIVERY_QTY_W, DELIVERY_REWARD_R, DELIVERY_REWARD_W,
  DELIVERY_BTN_L, DELIVERY_BTN_W, DELIVERY_BTN_H, DELIVERY_BTN_FONT_PX,
  DELIVERY_DISCARD_L, DELIVERY_DISCARD_W,
  TAB_ROW_TITLE_FONT_PX,
  MSG_WIN_L, MSG_WIN_R, MSG_WIN_T, MSG_WIN_B, MSG_WIN_PAD, MSG_TEXT_MAX_W,
  MSG_WIN_W, MSG_WIN_CX, MSG_WIN_CY, MSG_SCRIM_ALPHA,
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
import {
  DELIVERY_COLS, DELIVERY_BTN_LABEL, DISCARD_BTN_LABEL, deliveryShortLabel,
} from './delivery.js'
import { PRESET_COUNT, PRESET_NAME_MAX, describePreset } from '../components/floor/ShelfPresets.js'
import { ROUTE } from '../taxonomy/islands.js'
import { Upgrades, UPGRADE_KINDS, MAX_STAGE, effectDeltaLabel } from '../components/progress/Upgrades.js'
import { salePrice } from '../taxonomy/derive.js'

import {
  MISSION_CAP, ORDER_REWARD_RATE, orderQuantity,
} from '../components/progress/DeliveryOrders.js'
import { ISLANDS } from '../taxonomy/islands.js'

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
 * ⚠ **マイセット（#27）が全部1画面に入るか。**
 *   型を選ぶのに送らせたくないので、**数を増やしたら行が縮む。**
 *   縮みすぎて読めなくなったら、ページ送りに切り替える合図。
 */
describe('マイセットが1画面に入る（2列 × 5行）', () => {
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
   * ⚠ **区画数は 2026-09-13 に落とした**（PO 指示）ので、**島を持つ型の最悪値は島名だけ。**
   *   ⚠ **`130区画` の最悪値は消えていない。**島を持たない古いセーブがそちらを通る
   *   （盤面はいちばん広いとき 13×10 ＝ 130升で、1升の品ばかり並べると `130区画`）。
   */
  const presetTextW = PRESET_TEXT_W

  it('文字欄に島名が収まる', () => {
    for (const island of ROUTE) {
      const line = describePreset({ savedAt: 0, island, slots: Array(130).fill(null) as never })
      expect(line).toBe(`${island}島`)
      expect(estTextWidth(line, PRESET_TEXT_FONT_PX)).toBeLessThanOrEqual(presetTextW)
    }
  })

  /** ⚠ **島を持たない古いセーブは、これまでどおり区画数**（3桁まで出る） */
  it('文字欄に「130区画」が収まる（島を持たない古い型）', () => {
    const line = describePreset({ savedAt: 0, slots: Array(130).fill(null) as never })
    expect(line).toBe('130区画')
    expect(estTextWidth(line, PRESET_TEXT_FONT_PX)).toBeLessThanOrEqual(presetTextW)
  })

  /** ⚠ **何も出していない型も島名だけ**（`全部下ろす` は 2026-09-13 に落とした） */
  it('何も出していない型も、文字欄に収まる（島名だけ）', () => {
    for (const island of ROUTE) {
      const line = describePreset({ savedAt: 0, island, slots: [] })
      expect(line).toBe(`${island}島`)
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
   * 総額は `仕入れ値 × 個数`。**ボタンの外に、右そろえで置く**（PO 指示 2026-09-13）。
   *
   * ⚠ **最悪値は 3,237,759 で、7桁。**いちばん高い品（仕入れ値 3,241。`celebration_hamper`。
   *   産地が `なし` なので U2 で商人に並び得る）を、在庫の上限 999個 買うとこうなる。
   *   **ここを 6桁で見てはいけない。**6桁で通してしまうと、遊びの終盤だけ壊れる。
   */
  it('総額は、7桁（3,241 × 999）でも枠に収まる', () => {
    expect(estTextWidth(money(3_241 * 999), BUY_TOTAL_FONT_PX))
      .toBeLessThanOrEqual(BUY_TOTAL_W)
  })

  /**
   * ⚠ **総額をボタンへ戻さないこと**（PO 指示 2026-09-13「総額と買うは分ける」）。
   *   **戻すと入らない**ことを、この検査が押さえている。
   */
  it('⚠ 総額と「買う」を1つのボタンに詰めると、ボタンから出る', () => {
    expect(estTextWidth(`${money(3_241 * 999)} ${BUY_LABEL}`, BUY_FONT_PX))
      .toBeGreaterThan(BUY_BTN_W)
  })

  /** ⚠ **隣の「最大」「＋」「−」が 12px。**主たるボタンだけ小さいのはおかしい */
  it('「買う」の文字を、隣のボタン（12px）より小さくしない', () => {
    expect(BUY_FONT_PX).toBeGreaterThanOrEqual(12)
  })

  /**
   * ⚠ **「買う」という語を落とさない。**ボタンが何をするか読めなくなる。
   */
  it('「買う」ボタンに「買う」という語が残っている', () => {
    expect(BUY_LABEL).toContain('買う')
    expect(estTextWidth(BUY_LABEL, BUY_FONT_PX)).toBeLessThanOrEqual(BUY_BTN_W)
  })

  /**
   * **買えないときはボタンの字が理由に変わる。**
   *
   * ⚠ **金額を混ぜた理由を書かないこと。**`3,237,759レン 足りない` は 138px で、
   *   ボタン（52px）にも総額の枠（80px）にも入らない。**総額はすぐ左に出ている。**
   */
  it('買えない理由は、どれも「買う」ボタンに収まる', () => {
    for (const reason of [BUY_REASON_FUNDS, buyReasonCap(999), peddlerRemainText(10)]) {
      expect(estTextWidth(reason, BUY_FONT_PX), reason).toBeLessThanOrEqual(BUY_BTN_W)
    }
  })

  /** 個数が読めないときは、**出せる総額が無い**ので総額の場所へ理由を出す */
  it('個数が読めないときの理由は、総額の枠に収まる', () => {
    for (const reason of [QTY_REASON_EMPTY, QTY_REASON_NOT_INT]) {
      expect(estTextWidth(reason, BUY_TOTAL_FONT_PX), reason).toBeLessThanOrEqual(BUY_TOTAL_W)
    }
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
   * ⚠ **総額を分けるまでは、`BUY_FONT_PX`（12）で 1px はみ出していた**（footprint 118px）。
   *   **いまは 138px なので収まる。**それでも上げていないのは、
   *   **揃える相手がボタンではない**からで（`INFO_FONT_PX`・総額と同じ 11px）、
   *   幅の制約ではない。**ここは footprint に収まることだけを見る。**
   */
  it('「もうすぐ買える」は、総額とボタンを合わせた幅の中に収まる', () => {
    expect(estTextWidth(upcomingLabel(999), UPCOMING_FONT_PX)).toBeLessThanOrEqual(BUY_W)
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
   * ⚠ **`（営業◯分）` を出さない**（PO 指示 2026-09-14「**とか不要です。消せ**」）。
   *   #53 で足したものだが、**画面から消したのは知らせだけで、仕組みは変わっていない**
   *   （加工中は客が来ないので、営業に食い込んだ分だけ売上が消える）。
   *   **どこで知らせ直すかは #109。**
   */
  it('`時間` は所要分だけを出す（`（営業◯分）` を足さない）', () => {
    expect(craftTimeLabel(90)).toBe('90分')
    expect(craftTimeLabel(90)).not.toContain('営業')
    expect(craftTimeLabel(480)).toBe('480分')
  })
})

/**
 * 工房の表（**PO 赤入れ 2026-09-13**「↓のように表示して」）。
 *
 * **商品 ／ 作成数 ／ 在庫 ／ 時間 ／ 需要 ／ 数量 ／ 作る。**
 * ⚠ **表にした時点で、はみ出す先は隣の列になった。**
 *   3段組みのときは左半分ぜんぶが文字の領域だったので、ここが測られていなかった。
 */
describe('工房の表', () => {
  it('列が左から右へ、重ならずに並ぶ', () => {
    expect(CRAFT_NAME_L + CRAFT_NAME_W).toBeLessThan(CRAFT_MADE_R)
    expect(CRAFT_MADE_R).toBeLessThan(CRAFT_STOCK_R)
    expect(CRAFT_STOCK_R).toBeLessThan(CRAFT_TIME_L)
    expect(CRAFT_TIME_L + CRAFT_TIME_W).toBeLessThanOrEqual(CRAFT_DEMAND_L)
    expect(CRAFT_DEMAND_L + CRAFT_DEMAND_W).toBeLessThanOrEqual(CRAFT_QTY_L)
    expect(CRAFT_QTY_L + CRAFT_QTY_W).toBeLessThanOrEqual(CRAFT_BTN_L)
    expect(CRAFT_BTN_L + CRAFT_BTN_W).toBeLessThanOrEqual(CONTENT_R)
    expect(CRAFT_NAME_L).toBeGreaterThanOrEqual(CONTENT_L)
  })

  it('見出しの字が7つある（列と同じ数）', () => {
    expect(CRAFT_COLS).toEqual(['商品', '作成数', '在庫', '時間', '需要', '数量', '作る'])
  })

  it('見出しの行と、1件目の行が重ならない', () => {
    expect(CRAFT_HEAD_Y).toBeLessThan(CRAFT_ROWS_TOP)
    expect(CRAFT_ROWS_TOP).toBeGreaterThan(ROWS_TOP_NO_SUBTITLE)
  })

  /** ⚠ **行数は決め打ちしない**（`rowsThatFit`）。3段組み（84px）のときは5行だった */
  it('11行入り、最後の行がページ送りに食い込まない', () => {
    const rows = rowsThatFit(CRAFT_ROW_H, CRAFT_ROWS_TOP)
    expect(rows).toBe(11)
    expect(CRAFT_ROWS_TOP + rows * CRAFT_ROW_H).toBeLessThanOrEqual(ROWS_BOTTOM)
  })

  it('いちばん長い品名が `作成数` の列に届かない', () => {
    const longest = ALL_ITEMS.reduce(
      (a, i) => estTextWidth(i.display.name, CRAFT_NAME_FONT_PX) > estTextWidth(a, CRAFT_NAME_FONT_PX)
        ? i.display.name : a, '')
    expect(estTextWidth(longest, CRAFT_NAME_FONT_PX)).toBeLessThanOrEqual(CRAFT_NAME_W)
  })

  it('4桁の作成数・在庫が、左隣の列に食い込まない', () => {
    const w = estTextWidth('9999', CRAFT_CELL_FONT_PX)
    expect(CRAFT_MADE_R - w).toBeGreaterThan(CRAFT_NAME_L + CRAFT_NAME_W)
    expect(CRAFT_STOCK_R - w).toBeGreaterThan(CRAFT_MADE_R)
  })

  /**
   * ⚠ **1日は 1440分**なので、作れる回数のあいだは所要分が4桁を超えない。
   *   それ以上を手で打つと `…` に詰まるが、そのときは `作る` が押せない。
   */
  it('`9999分` が `時間` の列に収まる', () => {
    expect(estTextWidth(craftTimeLabel(9999), CRAFT_CELL_FONT_PX))
      .toBeLessThanOrEqual(CRAFT_TIME_W)
  })

  /**
   * `需要` の列 —— **いまの島では手に入らない材料の産地。**
   *
   * ⚠ **2島までを収める。**3島になる組み合わせは（レシピ×島）424組中2組しかないので、
   *   そこは `…` に詰まってよい。**2島は 60組ある。**
   */
  it('2島ぶんの産地が `需要` の列に収まる', () => {
    const names = ISLANDS.map(i => i.name)
    const worst = [...names].sort(
      (a, b) => estTextWidth(b, CRAFT_CELL_FONT_PX) - estTextWidth(a, CRAFT_CELL_FONT_PX))
      .slice(0, 2).join(CRAFT_DEMAND_SEP)
    expect(estTextWidth(worst, CRAFT_CELL_FONT_PX)).toBeLessThanOrEqual(CRAFT_DEMAND_W)
  })

  /**
   * ⚠ **作れない理由は `作る` ボタンの字になる**（商人タブと同じ作り）。
   *   **1行になった時点で、理由を置く段が無くなった。**
   */
  it('いちばん長い理由が `作る` ボタンに収まる', () => {
    const labels = [
      CRAFT_BTN_LABEL, CRAFT_REASON_INGREDIENTS, CRAFT_REASON_STOCK,
      CRAFT_REASON_TIME, CRAFT_REASON_EMPTY, CRAFT_REASON_NOT_INT,
    ]
    for (const label of labels) {
      expect(estTextWidth(label, CRAFT_BTN_FONT_PX)).toBeLessThanOrEqual(CRAFT_BTN_W)
    }
  })

  /** ⚠ **理由に数を足さないこと**（`在庫が上限 400` はボタンから出る） */
  it('理由の字に数が入っていない', () => {
    for (const r of [CRAFT_REASON_INGREDIENTS, CRAFT_REASON_STOCK, CRAFT_REASON_TIME]) {
      expect(r).not.toMatch(/[0-9]/)
    }
  })

  it('数量の6つが、順番どおり重ならずに並ぶ', () => {
    const xs = CRAFT_STEP_XS
    expect(xs.minusTen).toBe(CRAFT_QTY_L)
    expect(xs.minusTen).toBeLessThan(xs.minusOne)
    expect(xs.minusOne).toBeLessThan(xs.input)
    expect(xs.input).toBeLessThan(xs.plusOne)
    expect(xs.plusOne).toBeLessThan(xs.plusTen)
    expect(xs.plusTen).toBeLessThan(xs.max)
    expect(xs.max).toBeLessThan(CRAFT_BTN_L)
    for (const label of Object.values(CRAFT_STEP_LABELS)) {
      expect(estTextWidth(label, CRAFT_STEP_FONT_PX)).toBeLessThanOrEqual(CRAFT_INPUT_W)
    }
  })

  /** ⚠ **`回` の字は図に無い**（数量の列に入った） */
  it('数量の段が `-10` `-1` `+1` `+10` `最大` である', () => {
    expect(CRAFT_STEP_LABELS).toEqual({
      minusTen: '-10', minusOne: '-1', plusOne: '+1', plusTen: '+10', max: '最大',
    })
  })

  /** ⚠ **写しを作らないこと。**`CraftMenu.ts` は `layout.ts` を読むだけで、自分の数を持たない */
  it('`CraftMenu.ts` が自分で行の高さや列の位置を持っていない', () => {
    expect(craftSource).toContain('CRAFT_NAME_L')
    expect(craftSource).toContain('CRAFT_ROW_H')
    expect(craftSource).not.toContain('const ROW_H')
    expect(craftSource).not.toContain('const CONTROLS_L')
    expect(craftSource).not.toContain('const TEXT_MAX_W')
  })

  /** ⚠ **3段組みに戻っていない**（材料の一覧と3ルートは #107 ／ #108 へ） */
  it('行に儲け方の3ルートが出ていない', () => {
    expect(craftSource).not.toContain('routeValues')
    expect(craftSource).not.toContain('転売')
  })
})

describe('見出しの下に1行が無い場所（工房）', () => {
  // ⚠ **束M で「28px まるごと詰めて壊れた」ときの再発防止。**
  //   検索の入力欄が横線を跨ぎ、店に戻る印のボタンに1pxまで近づいた。
  it('絞り込みの行が、見出しの横線より下から始まる', () => {
    const bandTop = FILTER_Y_NO_SUBTITLE - FILTER_BAND_H / 2
    expect(bandTop).toBeGreaterThan(TITLE_RULE_Y)
  })

  it('絞り込みの行が店に戻る印のボタンに重ならない', () => {
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

/**
 * 画面に載せた `<input>`（#55 の検索 ／ 仕入れの個数）の置き場所。
 *
 * ⚠ **`<input>` は HTML なので、ずれても Phaser 側のテストには何も出ない。**
 *   2026-09-13 の赤入れ2件（「UIがずれている」）はどちらもこれで、
 *   **検索欄が枠を 70px 突き抜けて右の HUD に被り、個数欄が `＋` に重なっていた。**
 *   原因は `domInput.ts` の注記（隠れた要素を測ると 0×0 になり中心合わせが効かない）。
 *   **左上基点で置くようにしたので、ここから場所を測れる。**
 */
describe('画面に載せた `<input>` が、隣のものに重ならない', () => {
  /** 検索欄は絞り込みの行の右端。**右そろえ**なので、枠（`CONTENT_R`）を越えない */
  it('「名前で探す」欄が枠の右端を越えない', () => {
    const searchR = (CONTENT_R - LIST_SEARCH_W / 2) + LIST_SEARCH_W / 2
    expect(searchR).toBeLessThanOrEqual(CONTENT_R)
  })

  /**
   * ⚠ **主種類のボタン（`KIND_BUTTONS`）は同じ行の真ん中に並ぶ。**
   *   `PurchaseMenu` / `CraftMenu` とも 64px ×4個、隙間 8px。
   */
  it('「名前で探す」欄が、主種類のボタンに重ならない', () => {
    const groupR = PLACE_CX + (4 * 64 + 3 * 8) / 2
    expect(CONTENT_R - LIST_SEARCH_W).toBeGreaterThan(groupR)
  })

  /** 高さは絞り込みの行に収まる（`FILTER_BAND_H` がいちばん高いものの高さ） */
  it('「名前で探す」欄の高さが、絞り込みの行に収まる', () => {
    expect(LIST_SEARCH_H).toBeLessThanOrEqual(FILTER_BAND_H)
  })

  /** 個数欄は `−` と `＋` のあいだ。**左上基点で置くので、幅ぶんそのまま場所を取る** */
  it('仕入れの個数欄が、`−` と `＋` のあいだに収まる', () => {
    expect(ROW_MINUS_L + ROW_STEP_W).toBeLessThanOrEqual(ROW_INPUT_L)
    expect(ROW_INPUT_L + ROW_INPUT_W).toBeLessThanOrEqual(ROW_PLUS_L)
  })
})

describe('行商人バレンのところ（#9）', () => {
  // ⚠ **列の式を写さないこと。**`layout.ts` の `ROW_*` が唯一の出どころで、
  //   `PurchaseMenu.ts` も同じものを読んでいる（以前はここに式の写しがあった）
  const NAME_X = ROW_NAME_X
  const NEED_R = ROW_NEED_R

  /**
   * ⚠ **`残り N個` を `51レン/個　在庫 100/999` の側に足さないこと。**
   *   足すと `INFO_MAX_W`（160px）を超えて左隣の `N品に要る` に重なる。
   *   **だから品名の右**に出している（島の商人の側は産地を行の色で出すので、字は無い）。
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

  /**
   * 仕入れの行でいちばん長い注記は `⚠ 切らしている（N品に要る）`（#33）。**右そろえ**なので、
   * **左へ伸びて品名に重なる**。
   *
   * ⚠ **総額を「買う」から分けたぶん、列が 20px 左へ寄った**（2026-09-13）。
   *   **ここが開いているかは、それまで誰も見ていなかった。**
   * ⚠ **`⚠ 切らしている` が出るのは産地がこの島の品だけ**（`PurchaseMenu.isLocalOnly`）。
   *   **加工品（産地 `なし`）の長い名前と重なることはない。**
   *   だから**産地を持つ品の中で**いちばん長い名前で見る。
   * ⚠ **`N品に要る` だけの行はどの品にも出る**ので、そちらは全品で見る。
   */
  it('⚠ 切らしている（N品に要る）が、産地つきのいちばん長い品名に重ならない', () => {
    const withOrigin = ALL_ITEMS.filter(i => i.origin !== 'なし')
    const longest = withOrigin.reduce(
      (a, b) => (b.display.name.length > a.display.name.length ? b : a))
    const nameR = NAME_X + estTextWidth(longest.display.name, 15)
    // 品数は 106レシピ ＝ 最大3桁。行の注記は 12px（`PurchaseMenu.buildRow`）
    const needL = NEED_R - estTextWidth('⚠ 切らしている（106品に要る）', 12)
    expect(needL, longest.display.name).toBeGreaterThan(nameR)
  })

  /**
   * ⚠ **素の `N品に要る` はもう出さない**（PO 指示 2026-09-13「不要」）。
   *   **どの行にも出るので、行が字で埋まっていた。**
   *   ⚠ **`ROW_NEED_R` は捨てない。**橙の `⚠ 切らしている（N品に要る）` が同じ場所を使う。
   */
  it('⚠ 素の `N品に要る` を画面に戻していない', () => {
    expect(purchaseSource).not.toMatch(/`\$\{need\.recipes\}品に要る`/)
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

  /**
   * ⚠ **HUD の枠の中には置かない**（PO 指示 2026-09-14「ここの空白は不要」）。
   *   **枠の中に居場所を取ると、クリア前はずっと空の帯が残る。**
   *   **クリア後だけ、キャラ絵の枠の上端 `HUD_NEXT_PORT_H` を使う。**
   * ⚠ **#15 の絵はそのぶんを見込むこと。**
   */
  it('押せるところは HUD の枠の外、キャラ絵の枠の上端に収まる', () => {
    const cy = CHAR_ART_T + HUD_NEXT_PORT_H / 2
    // 枠の下（重ならない）
    expect(cy - HUD_NEXT_PORT_H / 2).toBeGreaterThanOrEqual(HUD_PANEL_B)
    // キャラ絵の枠からはみ出さない
    expect(cy + HUD_NEXT_PORT_H / 2).toBeLessThanOrEqual(CHAR_ART_B)
  })

  /** ⚠ **枠は所持金の行で終わる。**下に空の帯を作らない */
  it('HUD の枠は、いちばん下の行（所持金）のすぐ下で終わる', () => {
    // 所持金は HUD_MONEY_FONT_PX。行の下端から枠の下端までは余白1つぶん
    expect(HUD_PANEL_B - (HUD_ROW_MONEY_Y + HUD_MONEY_FONT_PX / 2)).toBeLessThanOrEqual(14)
    expect(HUD_PANEL_B).toBeGreaterThan(HUD_ROW_MONEY_Y + HUD_MONEY_FONT_PX / 2)
  })

  /** ⚠ **行が詰まりすぎないこと**（PO 指示 2026-09-14「詰まりすぎ。調整」） */
  it('時刻の行と現在地の行が、字の高さぶん離れている', () => {
    const timeBottom = HUD_ROW_TIME_Y + 26 / 2      // 時刻は 26px
    const placeTop = HUD_ROW_PLACE_Y - 13 / 2       // 現在地は 13px
    expect(placeTop - timeBottom).toBeGreaterThanOrEqual(6)
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
   *   **#96 で `改装` と `商人のところ` を `取引` の1行にまとめて 249px。**
   *   **2026-09-14 に HUD の枠を所持金の行で終わらせて 265px**（PO 指示「ここの空白は不要」）。
   *   ⚠ **クリア後は上端 `HUD_NEXT_PORT_H`（26px）を次の寄港地の行が使う。**
   *   **#15 の絵はこの大きさで入る**ので、ここを下回る変更は絵が入らなくなるという意味になる。
   *   ⚠ **#7（自由航行）は行を足さずに済ませてある** —— 次の寄港地は
   *   HUD の中で目標の進みのバーと入れ替わるので、ボタン列も HUD の枠も伸びない。
   */
  it('キャラ絵の枠が 265px から縮んでいない', () => {
    expect(CHAR_ART_H).toBeGreaterThanOrEqual(265)
  })

  it('ボタン列がメッセージ欄に食い込まない', () => {
    expect(BTN_Y_ADVANCE + BTN_ACTION_H / 2).toBeLessThanOrEqual(LOG_T)
    expect(BTN_Y_TRADE).toBeGreaterThan(BTN_Y_ICON)
  })

  it('アイコン5つが列の幅に収まる', () => {
    expect(5 * BTN_ICON_W).toBeLessThanOrEqual(BTN_PANEL_W)
    expect(BTN_PANEL_L).toBeGreaterThanOrEqual(RIGHT_PANEL_L)
  })

  it('名前を付けても、2行目の島名が升に収まる（#83）', () => {
    // いちばん長い既定値（⚠ **島を持たない古い型の `130区画` のほうが短い**）
    const sub = estTextWidth('ミフユリア島', PRESET_SUB_FONT_PX)
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

  /**
   * ⚠ **画面の中央**（PO 2026-09-14「なんか前に出てる感ないよね。ダイアログにして」）。
   *   **この作りのダイアログは `Tutorial` と `SaveLoadMenu` の2つで、どちらも画面の中央。**
   *   **3つ目の置き方を作らない。**
   *
   * ⚠ **以前の「納品の帯と中心をそろえる」は捨てた**（PO 2026-09-13 の規則）。
   *   **あれは窓が帯のすぐ上にあったときの話。**捨てたのは**そろえる相手**だけで、
   *   **「被らない」ほうは下の検査で全部そのまま見ている。**
   */
  it('画面の中央にある（他のダイアログと同じ中心）', () => {
    expect(MSG_WIN_CX).toBe(SCREEN_W / 2)
    expect(MSG_WIN_CY).toBe(SCREEN_H / 2)
  })

  /** 幅は帯より狭いまま（帯と並べても軸が2本に見えない） */
  it('納品の帯より狭い', () => {
    expect(MSG_WIN_W).toBeLessThan(ORDER_BAR_R - ORDER_BAR_L)
  })

  /**
   * **幅に余りが無い**（受入条件3）。
   *
   * ⚠ **窓の幅を決めているのは選択肢の列。**本文ではない
   *   （いちばん長い本文より、ボタン3つのほうが広い）。
   *   **ボタン1つぶん以上余っていたら、それは余白である。**
   */
  it('幅が、選択肢3つぶん＋余白より広すぎない', () => {
    const need = 3 * MSG_CHOICE_W + 2 * MSG_CHOICE_GAP + MSG_WIN_PAD * 2
    expect(MSG_WIN_W).toBeGreaterThanOrEqual(need)
    expect(MSG_WIN_W - need).toBeLessThan(MSG_CHOICE_W)
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
   *
   * ⚠ **暗幕は「消す」ではなく「沈める」。**全画面にかかるが**後ろは見えている**ので、
   *   ここで見るのは**面（窓そのもの）が盤面を覆っていないか**である。
   */
  it('盤面をまるごとは覆わない（上下に棚が残る）', () => {
    const gridB = GRID_ORIGIN_Y + 10 * CELL_SIZE   // いちばん広いとき（13×10）の下端
    expect(MSG_WIN_T).toBeGreaterThan(GRID_ORIGIN_Y)
    expect(MSG_WIN_B).toBeLessThan(gridB)
  })

  /** ⚠ **暗幕は透ける。**不透明にすると `PlaceFrame` と同じ「消す」になる */
  it('暗幕は透ける（後ろが見えている）', () => {
    expect(MSG_SCRIM_ALPHA).toBeGreaterThan(0)
    expect(MSG_SCRIM_ALPHA).toBeLessThan(1)
  })

  /**
   * **`MessageWindow` は Phaser を読むのでここから import できない**ので、
   * **ソースとして縛る**（`domInput.test.ts` / `PresetMenu.test.ts` と同じやり方）。
   *
   * ⚠ **3つ揃って初めて「前に出ている」になる** ——
   *   **全画面の暗幕 ／ 下を押させない ／ 不透明な面。**
   *   **どれか1つ欠けると背景に沈む**（PO 2026-09-14 の指摘そのもの）。
   */
  it('⚠ 全画面の暗幕を敷き、下を押させず、面は不透明', () => {
    // ⚠ **注記を先に落とす。**コメントの中の `setInteractive()` まで数えてしまう
    const src = messageWindowSource
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
    // 暗幕は画面いっぱい
    expect(src).toContain('SCREEN_W, SCREEN_H, 0x000000, MSG_SCRIM_ALPHA')
    // 下を押させない面が2つ（暗幕と窓）
    expect(src.match(/setInteractive\(\)/g)).toHaveLength(2)
    // 窓の面に alpha を渡していない ＝ 不透明
    expect(src).toContain('MSG_WIN_W, MSG_WIN_H, 0x16213e)')
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

  /**
   * **高さに余りが無い**（受入条件2 ／ PO 2026-09-13「余白が多すぎる」）。
   *
   * ⚠ **使わない行を先に取っておかない。**以前は2行ぶん取って1行しか使っておらず、
   *   その22px がそのまま余白になっていた。
   * ⚠ **2行のできごとを足すと、ここが落ちる。**そのときは
   *   `MSG_WIN_H` を `MSG_LINE_H` ぶん（22px）上げること。**落ちるのが仕事の検査である。**
   */
  it('本文の行を余らせていない（窓の高さが中身ぶんしか無い）', () => {
    const used = Math.max(...STORY_EVENTS.map((def) => def.lines.length))
    expect(MSG_LINES_MAX).toBe(used)
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
 * **見出しと店に戻る印（🏠）のどちらにも重ならない**ことをここで見る。
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

  it('タブは店に戻る印（🏠）に届かない', () => {
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
 * **改装タブ（#96 の `改装`）。**PO の赤入れ（2026-09-13）で、行の中身が3つ変わった ——
 * **見出し下の `所持金` を落とす ／ 一言のうしろに「前 → 後」を出す ／
 * 費用と `改装` ボタンを分ける。**
 *
 * ⚠ **分けた2つが隣り合うので、重なりは目視では出ない。**ここで測る。
 */
describe('改装タブの行（PO 赤入れ 2026-09-13）', () => {
  /** その系統を stage 段まで進めた `Upgrades` */
  const at = (kind: typeof UPGRADE_KINDS[number], stage: number): Upgrades => {
    const u = new Upgrades()
    for (let i = 0; i < stage; i++) u.advance(kind)
    return u
  }

  it('段の ●○ が、決めてある幅に収まる', () => {
    // ⚠ `UPGRADE_STAGE_W` は段数の写しを持っている。食い違ったらここで落ちる
    expect(estTextWidth('○'.repeat(MAX_STAGE), UPGRADE_STAGE_FONT_PX))
      .toBeLessThanOrEqual(UPGRADE_STAGE_W)
  })

  it('説明の「前 → 後」が、段の ●○ に食い込まない', () => {
    for (const kind of UPGRADE_KINDS) {
      for (let stage = 0; stage <= MAX_STAGE; stage++) {
        const line = upgradeSubLine(kind, effectDeltaLabel(kind, stage))
        expect(estTextWidth(line, TAB_ROW_SUB_FONT_PX), `${kind} ${stage} ${line}`)
          .toBeLessThanOrEqual(UPGRADE_SUB_MAX_W)
      }
    }
  })

  it('最大まで買うと「前 → 後」が消え、一言だけ残る', () => {
    for (const kind of UPGRADE_KINDS) {
      expect(effectDeltaLabel(kind, MAX_STAGE)).toBeNull()
      expect(upgradeSubLine(kind, null)).not.toContain('→')
      expect(upgradeSubLine(kind, null).length).toBeGreaterThan(0)
    }
  })

  /**
   * ⚠ **`Upgrades` の費用の表を直接読まない。**`nextCost` から取ることで、
   *   **表を増やしたときにこの検査も一緒に効く。**
   */
  it('どの段の費用も、費用の幅に収まる', () => {
    for (const kind of UPGRADE_KINDS) {
      for (let stage = 0; stage < MAX_STAGE; stage++) {
        const cost = at(kind, stage).nextCost(kind)
        expect(cost).not.toBeNull()
        expect(estTextWidth(money(cost as number), UPGRADE_COST_FONT_PX), `${kind} ${stage}`)
          .toBeLessThanOrEqual(UPGRADE_COST_W)
      }
    }
  })

  it('ボタンの字も、買えないときの理由も、ボタンに収まる', () => {
    for (const label of [UPGRADE_LABEL, UPGRADE_REASON_FUNDS]) {
      expect(estTextWidth(label, BUY_FONT_PX), label).toBeLessThanOrEqual(UPGRADE_BTN_W - 8)
    }
    // 最大まで買った行はボタンを出さず、右端に字だけ出る
    expect(estTextWidth(UPGRADE_MAXED, TAB_ROW_SUB_FONT_PX)).toBeLessThanOrEqual(UPGRADE_BTN_W)
  })

  /** ⚠ **分けたことが効いているか。**費用とボタンが重なっていたら分けた意味が無い */
  it('費用とボタンが重ならず、費用が段の ●○ にも掛からない', () => {
    expect(UPGRADE_COST_R).toBeLessThan(UPGRADE_BTN_L)
    expect(UPGRADE_COST_L).toBeGreaterThan(UPGRADE_STAGE_CX + UPGRADE_STAGE_W / 2)
    expect(UPGRADE_BTN_R).toBeLessThanOrEqual(CONTENT_R)
    expect(UPGRADE_NAME_X).toBeGreaterThanOrEqual(CONTENT_L)
    expect(UPGRADE_STAGE_L).toBeGreaterThan(UPGRADE_NAME_X + UPGRADE_SUB_MAX_W)
  })

  /**
   * ⚠ **4系統がこの枠に入りきること。**
   *
   * ⚠ **5行目（#97 の `商船の購入`）は、いまの行の高さでは入らない** ——
   *   `110 + 5×100 = 610` で、枠の下端 `564` を越える（実測 2026-09-13）。
   *   **#97 は行の高さを下げるか、商船を行の外へ置くことになる。**残っている余白は 54px。
   */
  it('4系統が一覧の枠に収まる', () => {
    expect(ROWS_TOP + UPGRADE_KINDS.length * UPGRADE_ROW_H).toBeLessThanOrEqual(ROWS_BOTTOM)
  })
})

/**
 * **納品タブ（#96 の器 → #98 で表になった）。**
 *
 * **PO が描いた表**（赤入れ 2026-09-13）は **商品 ／ 依頼者 ／ 数量 ／ 報酬 ／ 納品**。
 * ⚠ **島の列は無い**（#98「納品先の島は無くす」）。**`廃棄` だけが絵に無く、右端に足してある。**
 *
 * ⚠ **列は隣と重なった瞬間に読めなくなる。**ここで見ているのは
 *   **いちばん長い品名・4人ぶんの依頼者名・いちばん高い報酬**という、実データの最悪値である。
 */
describe('納品タブの表（#98 ／ PO 赤入れ 2026-09-13）', () => {
  /** 表に出しうる、いちばん高い報酬 */
  function worstReward(): { text: string; id: string } {
    let best = { r: 0, id: '' }
    for (const item of ALL_ITEMS) {
      const r = Math.round(salePrice(item.id) * orderQuantity(item.id) * ORDER_REWARD_RATE)
      if (r > best.r) best = { r, id: item.id }
    }
    return { text: money(best.r), id: best.id }
  }

  it('列は左から 商品 → 依頼者 → 数量 → 報酬 → 納品 → 廃棄 の順に並ぶ', () => {
    expect(DELIVERY_COLS).toEqual(['商品', '依頼者', '数量', '報酬', '納品', '廃棄'])
    expect(DELIVERY_NAME_L).toBeLessThan(DELIVERY_CLIENT_L)
    expect(DELIVERY_CLIENT_L).toBeLessThan(DELIVERY_QTY_R - DELIVERY_QTY_W)
    expect(DELIVERY_QTY_R).toBeLessThan(DELIVERY_REWARD_R - DELIVERY_REWARD_W)
    expect(DELIVERY_REWARD_R).toBeLessThan(DELIVERY_BTN_L)
    expect(DELIVERY_BTN_L + DELIVERY_BTN_W).toBeLessThan(DELIVERY_DISCARD_L)
  })

  it('右端が枠から出ない', () => {
    expect(DELIVERY_NAME_L).toBeGreaterThanOrEqual(CONTENT_L)
    expect(DELIVERY_DISCARD_L + DELIVERY_DISCARD_W).toBeLessThanOrEqual(CONTENT_R)
  })

  /** ⚠ **161品のどれが出ても、品名が `依頼者` の列に届かないこと** */
  it('いちばん長い品名が依頼者の列に届かない', () => {
    let worst = { w: 0, name: '' }
    for (const item of ALL_ITEMS) {
      const w = estTextWidth(item.display.name, TAB_ROW_TITLE_FONT_PX)
      if (w > worst.w) worst = { w, name: item.display.name }
    }
    expect(worst.w, worst.name).toBeLessThanOrEqual(DELIVERY_NAME_W - 8)
  })

  it('依頼者4人の名が数量の列に届かない', () => {
    for (const island of ISLANDS) {
      expect(estTextWidth(island.merchant, TAB_ROW_SUB_FONT_PX), island.merchant)
        .toBeLessThanOrEqual(DELIVERY_CLIENT_W - 8)
    }
  })

  it('いちばん高い報酬が報酬の列に収まる', () => {
    const worst = worstReward()
    expect(estTextWidth(worst.text, TAB_ROW_SUB_FONT_PX), `${worst.id} ${worst.text}`)
      .toBeLessThanOrEqual(DELIVERY_REWARD_W)
  })

  it('いちばん多い数量が数量の列に収まる', () => {
    const most = Math.max(...ALL_ITEMS.map(i => orderQuantity(i.id)))
    expect(estTextWidth(String(most), TAB_ROW_SUB_FONT_PX)).toBeLessThanOrEqual(DELIVERY_QTY_W)
  })

  /**
   * ⚠ **納品ボタンは字が2通りある** —— 納められるときは `納品`、
   *   足りないときは **`手持ち/必要`**（手持ちの列が無いので、ここが唯一の出しどころ）。
   *   **どちらもボタンに収まること。**
   */
  it('納品ボタンの字は、どちらの出方でもボタンに収まる', () => {
    expect(estTextWidth(DELIVERY_BTN_LABEL, DELIVERY_BTN_FONT_PX))
      .toBeLessThanOrEqual(DELIVERY_BTN_W - 8)
    // 手持ちは在庫の上限（999）まで、必要な数は tier1 の上限まで出うる
    const worst = deliveryShortLabel(999, Math.max(...ALL_ITEMS.map(i => orderQuantity(i.id))))
    expect(estTextWidth(worst, DELIVERY_BTN_FONT_PX), worst)
      .toBeLessThanOrEqual(DELIVERY_BTN_W - 8)
    expect(estTextWidth(DISCARD_BTN_LABEL, DELIVERY_BTN_FONT_PX))
      .toBeLessThanOrEqual(DELIVERY_DISCARD_W - 8)
  })

  it('見出しの語が、それぞれの列の幅に収まる', () => {
    const [item, client, qty, reward, deliver, discard] = DELIVERY_COLS
    const w = (t: string) => estTextWidth(t, DELIVERY_HEAD_FONT_PX)
    expect(w(item)).toBeLessThanOrEqual(DELIVERY_NAME_W)
    expect(w(client)).toBeLessThanOrEqual(DELIVERY_CLIENT_W)
    expect(w(qty)).toBeLessThanOrEqual(DELIVERY_QTY_W)
    expect(w(reward)).toBeLessThanOrEqual(DELIVERY_REWARD_W)
    expect(w(deliver)).toBeLessThanOrEqual(DELIVERY_BTN_W)
    expect(w(discard)).toBeLessThanOrEqual(DELIVERY_DISCARD_W)
  })

  /**
   * ⚠ **上限（`MISSION_CAP`）まで全部入ること。**
   *   **この表にはページ送りが無い**ので、入らない行は**手が届かない。**
   */
  it(`${MISSION_CAP}件が一覧の領域に収まる`, () => {
    expect(rowsThatFit(DELIVERY_ROW_H, DELIVERY_ROWS_TOP)).toBeGreaterThanOrEqual(MISSION_CAP)
    expect(DELIVERY_ROWS_TOP + MISSION_CAP * DELIVERY_ROW_H).toBeLessThanOrEqual(ROWS_BOTTOM)
  })

  it('見出しの行が、1件目の行に重ならない', () => {
    expect(DELIVERY_HEAD_Y + DELIVERY_HEAD_FONT_PX / 2)
      .toBeLessThanOrEqual(DELIVERY_ROWS_TOP)
    expect(DELIVERY_HEAD_Y - DELIVERY_HEAD_FONT_PX / 2).toBeGreaterThanOrEqual(ROWS_TOP)
  })

  it('行の高さにボタンが収まる', () => {
    expect(DELIVERY_BTN_H).toBeLessThanOrEqual(DELIVERY_ROW_H - 6)
  })

  it('1件も無いときの1行が枠に収まる', () => {
    expect(estTextWidth(DELIVERY_TAB_EMPTY, TAB_ROW_SUB_FONT_PX))
      .toBeLessThanOrEqual(CONTENT_R - CONTENT_L)
  })
})
