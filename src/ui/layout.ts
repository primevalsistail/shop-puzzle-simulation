/**
 * 画面の区画。**Phaser を読まない**ので、寸法だけを単体テストから見られる。
 *
 * ⚠ **区画の値をここ以外に書かないこと。**写しを持つと、片方を動かしても
 *   もう片方が気づかず、**重なっていることをテストが見逃す**（受入条件2）。
 */

export const SCREEN_W = 1280
export const SCREEN_H = 720

/** 左パネル（船倉の中身）の右端 */
export const LEFT_PANEL_R = 220
/**
 * キャラ帯（店番・来店客）。⚠ **#21・#15 の置き場所。**
 *
 * ⚠ **店にいる間だけ出す。**商人のところや工房に行っているのに
 *   「店番」「来店客」の枠が出ているのは、**そこに居ないのだからおかしい**（PO 2026-09-12）。
 *   場所へ行っている間は隠し、**その領域も場所の画面が使う。**
 */
export const STRIP_L = 980
export const STRIP_W = 110
export const STRIP_H = 610
/** 右パネル（HUD・ボタン列）の左端 */
export const RIGHT_PANEL_L = 1090
/** メッセージ欄の上端 */
export const LOG_T = 610

// ─── 場所（中央の領域） ────────────────────────────────────────
/**
 * 仕入れ・クラフト・改装へ「行った」とき、**まるごと入れ替わる領域**（#58）。
 *
 * #58 の PO の言葉は「**中央の領域（棚とキャラ帯のあたり）がまるごとその画面に変わり**、
 * 大きく見やすくする」。**キャラ帯のぶんまで使う。**
 *
 * ⚠ **棚とキャラ帯はここに覆い被せるのではなく、隠す。**
 *   盤面は最大 13×10 ＝ x228〜982 まで伸びるので、覆う方式だと帯が残る。
 * ⚠ **この領域はキャラ帯（980〜1090）に重なる。**
 *   だから場所へ行っている間は**キャラ帯を必ず隠すこと**（`GameScene.setShopVisible`）。
 */
export const PLACE_L = LEFT_PANEL_R + 4
export const PLACE_R = RIGHT_PANEL_L - 4
export const PLACE_T = 6
export const PLACE_B = LOG_T - 6

export const PLACE_W = PLACE_R - PLACE_L
export const PLACE_H = PLACE_B - PLACE_T
export const PLACE_CX = (PLACE_L + PLACE_R) / 2
export const PLACE_CY = (PLACE_T + PLACE_B) / 2

/** 枠の内側。文字もボタンもこの左右に収める */
const PAD = 24
export const CONTENT_L = PLACE_L + PAD
export const CONTENT_R = PLACE_R - PAD

/** 見出しと「← 店に戻る」の行 */
export const TITLE_Y = PLACE_T + 28
/** 見出しの下の1行（所持金など、場所ごとの但し書き） */
export const SUBTITLE_Y = PLACE_T + 56
/** 絞り込みの行 */
export const FILTER_Y = PLACE_T + 84
/** 一覧の上端（ここから下へ1行ずつ積む） */
export const ROWS_TOP = PLACE_T + 104
/** ページ送りの行 */
export const PAGER_Y = PLACE_B - 22
/** 一覧に使える下端。ページ送りの行に食い込まない */
export const ROWS_BOTTOM = PAGER_Y - 18

/**
 * その行の高さなら何行入るか。
 *
 * ⚠ **行数を決め打ちしないこと。**領域を動かしたときに、
 *   最後の行がページ送りへ食い込んでいることに**気づけなくなる**。
 */
export function rowsThatFit(rowH: number): number {
  return Math.max(0, Math.floor((ROWS_BOTTOM - ROWS_TOP) / rowH))
}
