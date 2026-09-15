/**
 * 画面の区画。**Phaser を読まない**ので、寸法だけを単体テストから見られる。
 *
 * ⚠ **区画の値をここ以外に書かないこと。**写しを持つと、片方を動かしても
 *   もう片方が気づかず、**重なっていることをテストが見逃す**（受入条件2）。
 *
 * ⚠ **いまの値を名指ししているコメントは 1920×1080 に直してある**（#117）。
 *   **2026-09-14 に内部座標を 1280×720 → 1920×1080 にし、寸法をすべて正確に 1.5倍した**（#10）。
 *   ⚠ **直していないコメントが残っている —— 過去の実測値と経緯である。**
 *   例:「`10,000,000レン` は 183.2px になり、枠 174px からはみ出した」（Chromium での実測値）／
 *   「キャラ絵の枠が 202 → 249px に広がる」（#96 当時の経緯）。
 *   **1.5倍した数は誰も測っていない**ので、**1280系のまま残してある。**
 *   ⚠ **過去形（「〜だった」「〜になり」「はみ出した」）と小数が目印。**掛けて直さないこと。
 */

/**
 * ⚠ **実行時の import は1つも無い**（上のとおり Phaser を読まないため）。
 *   下の1行は**型だけ**で、コンパイルで消える。
 */
import type { UpgradeKind } from '../components/progress/Upgrades.js'

export const SCREEN_W = 1920
export const SCREEN_H = 1080

/** 左パネル（船倉の中身）の右端 */
export const LEFT_PANEL_R = 330
/**
 * キャラ帯（店番・来店客）。⚠ **#21・#15 の置き場所。**
 *
 * ⚠ **店にいる間だけ出す。**商人のところや工房に行っているのに
 *   「店番」「来店客」の枠が出ているのは、**そこに居ないのだからおかしい**（PO 2026-09-12）。
 *   場所へ行っている間は隠し、**その領域も場所の画面が使う。**
 */
export const STRIP_L = 1470
export const STRIP_W = 165
export const STRIP_H = 915
/** 右パネル（HUD・ボタン列）の左端 */
export const RIGHT_PANEL_L = 1635
/** メッセージ欄の上端 */
export const LOG_T = 915

// ─── 左パネル（持ち物の一覧） ──────────────────────────────────
/**
 * **`InventoryPanel` の区画**（#120。2026-09-15 に同ファイルのローカル定数から移した）。
 *
 * ⚠ **移しただけで、値は1つも変えていない。**画面は1ドットも動いていない。
 *   **`LEFT_PANEL_R` から導けるものは導いてある**（写しを持つと、片方を動かしても
 *   もう片方が気づかない —— このファイル冒頭の約束）。
 */
/** 左パネルの左端。**右端は `LEFT_PANEL_R`** */
export const INV_PANEL_L = 30
/** 左パネルの幅。⚠ **`LEFT_PANEL_R` から導く**（30 + 300 = 330 を写しで持たない） */
export const INV_PANEL_W = LEFT_PANEL_R - INV_PANEL_L
/** 品の行の右に空ける余白 */
export const INV_ITEM_RIGHT_MARGIN = 18
/**
 * 品の行の幅（**252**）。
 *
 * ⚠ **この式は左端を2回引いている**（`300 - 30 - 18`）。**直さないこと。**
 *   直すと行が 18px 広がる ＝ **画面が動く。**#120 は「移すだけ」なので式ごと移してある。
 *   ⚠ **実際に空くのは右 48px**（行の右端 282 ／ `LEFT_PANEL_R` 330）で、
 *   `INV_ITEM_RIGHT_MARGIN` の 18 とは合っていない。**幅を決め直すのは別件。**
 */
export const INV_ITEM_W = INV_PANEL_W - INV_PANEL_L - INV_ITEM_RIGHT_MARGIN
/** 品の行1本ぶんの刻み。⚠ **枠の高さはこれより `INV_ITEM_GAP` 低い**（行と行の隙間） */
export const INV_ITEM_H = 105
/** 行と行の隙間 */
export const INV_ITEM_GAP = 9
/** 1行目の**中心** y。⚠ **上端ではない**（枠も字も中心ぞろえ）。ページ送り(162)の下 */
export const INV_ITEM_TOP = 225
/** 一覧の下端。**左パネルは y=1080 まで** */
export const INV_LIST_BOTTOM = 1074
/** 1ページに映る行数（**8**）。⚠ **決め打ちにしない**（下端と刻みから出す） */
export const INV_VISIBLE_COUNT = Math.floor((INV_LIST_BOTTOM - INV_ITEM_TOP) / INV_ITEM_H)
/** 行の中の、字の左端（縮小図の右）。**品名・個数の左** */
export const INV_ITEM_TEXT_L = INV_PANEL_L + 81
/** 売値の右端。**右そろえ**（`INV_ITEM_PRICE_FONT_PX`） */
export const INV_ITEM_PRICE_R = INV_ITEM_TEXT_L + INV_ITEM_W - 99
/** かたちの縮小図の1マス */
export const INV_PREVIEW_CELL = 19.5
/** かたちの縮小図の中心 x */
export const INV_PREVIEW_CX = INV_PANEL_L + 40.5
/** ページ送りの行の中心 y */
export const INV_PAGER_Y = 162
/** 見出しの行（検索欄 ＋ 件数）の中心 y */
export const INV_HEAD_Y = 78
/**
 * 検索欄（#55）。⚠ **見出しの行に置く。**行を1本足すと一覧が 8行 → 7行に減る。
 *
 * ⚠ **件数（`rangeLabel`）と同じ行なので、幅はそちらから決まる**（2026-09-15）。
 *   **件数は右端 `INV_PANEL_L + INV_ITEM_W`（282）から右そろえ**で、
 *   **3桁になると `113-120 / 161` ＝ 125.73px。左端は 156.27 まで伸びる。**
 *   ⚠ **165 のままだと欄が 195 まであり、38.7px ぶん件数の頭が隠れた**
 *   （**`<input>` は HTML なので必ず canvas より上に出る。161品・21ページのうち9ページで起きていた**）。
 *   ⚠ **字を小さくしても縮まらない**（12px でも左端 190.6 で重なる）。**欄を詰めるしかない。**
 *   ⚠ **`layout.test.ts` が「件数と検索欄が重ならない」を見ている。**広げるときは必ず通すこと。
 *   **プレースホルダ `名前で探す`（18px）は 90px なので、117 でも 15px 余る。**
 */
export const INV_SEARCH_L = INV_PANEL_L
export const INV_SEARCH_W = 117
export const INV_SEARCH_H = 30
/**
 * 絞り込み（主種類4つ）のボタン。
 *
 * ⚠ **4つと隙間3つで、ちょうど行の幅になる**（58.5×4 + 6×3 = 252）。
 */
export const INV_FILTER_BTN_W = 58.5
export const INV_FILTER_BTN_H = 27
export const INV_FILTER_GAP = 6
/** 絞り込みの行の**上端**。⚠ **中心ではない**（ここだけ上端から積む） */
export const INV_FILTER_TOP = 114

/** 見出しの行の右端に出す件数（`3 / 161`）の字 */
export const INV_RANGE_FONT_PX = 16.5
/** 絞り込み（主種類4つ）のボタンの字。⚠ **升が狭いので、ここだけ小さい** */
export const INV_FILTER_FONT_PX = 15
/** ページ送りの `◀` `▶` */
export const INV_PAGER_ARROW_FONT_PX = 21
/** ページ送りの中央に出す `1 / 21` */
export const INV_PAGER_FONT_PX = 18
/** 品の行の1行目 —— 品名 */
export const INV_ITEM_NAME_FONT_PX = 19.5
/** 品の行の2行目の左 —— 個数。⚠ **売値と同じ行**（PO 指示 2026-09-14） */
export const INV_ITEM_QTY_FONT_PX = 16.5
/** 品の行の2行目の右 —— 売値。**右そろえ** */
export const INV_ITEM_PRICE_FONT_PX = 16.5

// ─── キャラ帯の見出し ────────────────────────────────────────
/** 上半分の見出し（`店番`） */
export const STRIP_SHOPKEEPER_FONT_PX = 16.5
/** 下半分の見出し（`来店客`）。⚠ **上と同じ大きさだが別の字**なので、別に持つ */
export const STRIP_CUSTOMER_FONT_PX = 16.5

// ─── 来店客の3枠（#21） ──────────────────────────────────────
/**
 * 来店客の絵は **162 × 138**。⚠ **拡大縮小をかけない**（かけると輪郭がぼやける）ので、
 * **枠の高さも 138 のまま**にする。
 */
export const STRIP_CUSTOMER_SLOT_H = 138
/** 枠は3つ。⚠ **4つ目は出さない**（帯からはみ出す。`layout.test.ts` が見張る） */
export const STRIP_CUSTOMER_SLOT_MAX = 3
/** いちばん上の枠の中心。**見出し（`来店客`）の下から始める** */
export const STRIP_CUSTOMER_SLOT_TOP_CY = 566
/**
 * 1人が店に居る分数（**見た目だけ**）。
 * ⚠ **売買には一切効かない。**居る人数を売れ行きの条件にすると、
 *   **来店の判定（`CustomerSimulator`）と二重に数えることになる。**
 * ⚠ 客はおよそ1日90人＝**6〜7分に1人**来る。ここを長くすると3枠が埋まりっぱなしになる
 */
export const STRIP_CUSTOMER_DWELL_MIN = 4

// ─── ログ欄 ──────────────────────────────────────────────────
/** 1行ぶんの字。⚠ **行の高さ（`LINE_HEIGHT`）は `MessageLog` にある** */
export const LOG_LINE_FONT_PX = 19.5

// ─── 盤面（売り場） ──────────────────────────────────────────
/** 1升の大きさ。13×10 の最終盤面から逆算: min(floor(1140/13), floor(915/10)) = 87 */
export const CELL_SIZE = 87
/** 盤面の左上。左パネルの右端から 12px、画面の上端から 12px */
export const GRID_ORIGIN_X = LEFT_PANEL_R + 12
export const GRID_ORIGIN_Y = 12

/**
 * 画面の外周のうち、ここで離すと**棚から下ろす**帯の幅。
 *
 * ⚠ **上端の帯（y 0〜84）は盤面の1行目（y 12〜99）に食い込む。**
 *   1行目の **82%** が帯の中に入るので、**盤面をくり抜かないと
 *   「一番上の行へ動かそうとすると棚から外れる」**（`rects.ts` / `subtractRect`）。
 */
export const DISCARD_MARGIN = 84

/** 棚に出した品の札（品名と `×N`）。⚠ **升の中に収める字** */
export const GRID_SLOT_LABEL_FONT_PX = 15
/** 売れたときに升から浮き上がる `+Nレン`。**太字** */
export const SALE_POPUP_FONT_PX = 21

// ─── 場所（中央の領域） ────────────────────────────────────────
/**
 * 仕入れ・クラフト・改装へ「行った」とき、**まるごと入れ替わる領域**（#58）。
 *
 * #58 の PO の言葉は「**中央の領域（棚とキャラ帯のあたり）がまるごとその画面に変わり**、
 * 大きく見やすくする」。**キャラ帯のぶんまで使う。**
 *
 * ⚠ **棚とキャラ帯はここに覆い被せるのではなく、隠す。**
 *   盤面は最大 13×10 ＝ x342〜1473 まで伸びるので、覆う方式だと帯が残る。
 * ⚠ **この領域はキャラ帯（1470〜1635）に重なる。**
 *   だから場所へ行っている間は**キャラ帯を必ず隠すこと**（`GameScene.setShopVisible`）。
 */
export const PLACE_L = LEFT_PANEL_R + 6
export const PLACE_R = RIGHT_PANEL_L - 6
export const PLACE_T = 9
export const PLACE_B = LOG_T - 9

export const PLACE_W = PLACE_R - PLACE_L
export const PLACE_H = PLACE_B - PLACE_T
export const PLACE_CX = (PLACE_L + PLACE_R) / 2
export const PLACE_CY = (PLACE_T + PLACE_B) / 2

/** 枠の内側。文字もボタンもこの左右に収める */
const PAD = 36
export const CONTENT_L = PLACE_L + PAD
export const CONTENT_R = PLACE_R - PAD

/** 見出しと、店に戻る印（🏠）の行 */
export const TITLE_Y = PLACE_T + 42
/** 見出しの下の1行（所持金など、場所ごとの但し書き） */
export const SUBTITLE_Y = PLACE_T + 84
/** 絞り込みの行 */
export const FILTER_Y = PLACE_T + 126
/**
 * 絞り込みの行の右端に置く「名前で探す」欄（#55）。**仕入れと工房で同じ大きさ。**
 *
 * ⚠ **`PurchaseMenu.ts` / `CraftMenu.ts` に写しを置かないこと。**
 *   以前は両方が 160×24 を自前で持っていて、**画面に出る実寸は 150×18 だった**
 *   （`index.html` の `box-sizing: border-box` と `createInput` の食い違い。2026-09-13）。
 *   **`layout.test.ts` が枠からはみ出さないことを見るには、出どころが1つで要る。**
 */
export const LIST_SEARCH_W = 240
export const LIST_SEARCH_H = 36
/** 一覧の上端（ここから下へ1行ずつ積む） */
export const ROWS_TOP = PLACE_T + 156
/** ページ送りの行 */
export const PAGER_Y = PLACE_B - 33
/** 一覧に使える下端。ページ送りの行に食い込まない */
export const ROWS_BOTTOM = PAGER_Y - 27

/** 見出しの下に引く横線。`PlaceFrame` が引く。⚠ **ここより上へ物を置かない** */
export const TITLE_RULE_Y = TITLE_Y + 30
/** 絞り込みの行でいちばん高いもの（検索の入力欄）の高さ */
export const FILTER_BAND_H = 36
/** 横線と、その下に置くものとのあいだに残す余白 */
const RULE_GAP = 9

/**
 * 見出しの下の1行が**無い**場所の、絞り込みの行と一覧の上端。
 *
 * ⚠ **工房だけ、見出しの下に置くものが無い**（他の3つは所持金が入る）。
 *   説明文を消した跡が**空白の帯として残る**ので、上へ詰める（束M・PO 判断）。
 * ⚠ **42px まるごと詰めないこと。**`SUBTITLE_Y`(93) まで上げると、
 *   **検索の入力欄（高さ36）が y75〜111 になり、横線(81) を跨いで
 *   店に戻る印のボタン（下端73.5）に1.5pxまで近づく。**実際に「壊れて見える」と指摘が出た。
 *   **横線の下から始める**のが上限。
 */
export const FILTER_Y_NO_SUBTITLE = TITLE_RULE_Y + RULE_GAP + FILTER_BAND_H / 2
const NO_SUBTITLE_SHIFT = FILTER_Y - FILTER_Y_NO_SUBTITLE
/** 見出しの下の1行が無い場所の、一覧の上端 */
export const ROWS_TOP_NO_SUBTITLE = ROWS_TOP - NO_SUBTITLE_SHIFT

/**
 * 画面に出す時間帯の名（PO 指示 2026-09-14「閉店・開店に変更」）。
 *
 * ⚠ **`DayPhase`（`作業` / `営業` / `睡眠`）はそのまま。**あれは**時間の仕組みが読む値**で、
 *   客が来るかどうかも加工が進むかどうかもあれで決まる。**画面に出す語だけをここで変える。**
 * ⚠ **画面には2つしか出さない。**開いているか、いないか。
 *   `睡眠` を別の語で出すと、**プレイヤーから見て閉まっていることは同じなのに語が3つになる。**
 */
export function phaseLabel(phase: '作業' | '営業' | '睡眠'): string {
  return phase === '営業' ? '開店' : '閉店'
}

// ─── 見出しの行に並ぶもの（`PlaceFrame` が置く） ─────────────────
/** 見出しの文字の大きさ。**太字** */
export const TITLE_FONT_PX = 36
/**
 * **店に戻る印（🏠）のボタンの幅**。**見出しの行の右端に置く**。
 *
 * ⚠ **字を入れない**（PO 指示 2026-09-13。「店に戻る」は不要・家マークに）。
 *   印だけなので**正方形に近い**。120 だった頃の余白は**タブの取り分**になる
 *   （`layout.test.ts` の「タブは店に戻る印に届かない」）。
 */
export const BACK_BTN_W = 60
/** その印（🏠）そのものの字。⚠ **見出し（`TITLE_FONT_PX`）とは別**（絵文字なので大きさが違う） */
export const PLACE_BACK_FONT_PX = 27

/**
 * 「取引」の中の3タブ（#96）。**`商人` → `改装` → `納品`**（#96 本文の順）。
 *
 * ⚠ **見出しと同じ行に置く。**下に1行足すと、その42px ぶん一覧の上端が下がり、
 *   仕入れの行（84px）が **8行 → 7行** に減る。**タブを足すために品が1つ見えなくなる**のは割に合わない。
 * ⚠ **見出し（左）と店に戻る印（右）のあいだに収まること**（`layout.test.ts` が見ている）。
 * ⚠ **文言は #96 本文の語をそのまま使う。**言い回しを発明しない（#79）。
 */
export const TRADE_TITLE = '取引'
export const TRADE_TABS = ['商人', '改装', '納品'] as const
export type TradeTabName = typeof TRADE_TABS[number]

export const TAB_W = 126
export const TAB_H = 39
export const TAB_GAP = 9
export const TAB_FONT_PX = 21

/** `count` 個のタブを中央ぞろえで並べたときの、`index` 番目の中心 x */
export function tabCx(index: number, count: number): number {
  const total = count * TAB_W + (count - 1) * TAB_GAP
  return PLACE_CX - total / 2 + TAB_W / 2 + index * (TAB_W + TAB_GAP)
}

/**
 * 「取引」の3タブで共通に使う文字の大きさ（PO 指示 2026-09-14「商人・改装・納品でそろえてほしい」）。
 *
 * ⚠ **タブごとに別の大きさを書かないこと。**タブを行き来したときに、
 *   同じ役目の文字が跳ねて見える。**揃えるのは「役」であって、画面ではない。**
 *
 * ⚠ **`商人` に合わせて下げてある。**あそこは1画面に8行並ぶので**いちばん狭く、伸ばせない。**
 *   ほかの2つは余裕があるが、**広いほうへ合わせると `商人` だけ収まらなくなる。**
 *
 * ⚠ **大きくするときは `layout.test.ts` の幅の検査を必ず通すこと**（`estTextWidth`）。
 *   **小さくするぶんには安全。**
 */
/** 行の主見出し（品名 ／ 改装の系統名 ／ 納品の1行目） */
export const TAB_ROW_TITLE_FONT_PX = 22.5
/** 行の補足（何品に要る ／ 改装の説明 ／ 納品の手持ち・報酬） */
export const TAB_ROW_SUB_FONT_PX = 18
/** 見出しの下の1行（所持金 …） */
export const TAB_SUBTITLE_FONT_PX = 22.5
/** 見出しの下の行の、右に出る注記 */
export const TAB_NOTE_FONT_PX = 18

/**
 * 納品タブ（#96 → **#98 で表になった**）。
 *
 * ⚠ **列の寸法はここではなく、下の「納品タブの表」**（`DELIVERY_NAME_L` …）にある。
 *   商人タブ（`ROW_*`）・改装タブ（`UPGRADE_*`）と同じ場所に並べてあるため。
 */

/**
 * ミッションが1件も無いときに納品タブへ出す1行。
 *
 * ⚠ **まっさらにしない。タブは自分で開いて来る場所**なので、空だと壊れて見える
 *   （`PurchaseMenu` の「商人は、いま何も並べていません」と同じ扱い。#48）。
 * ⚠ **言い回しは仮置き。**画面に出す文言は PO が決める（#79）。
 */
export const DELIVERY_TAB_EMPTY = 'いま受けている依頼はありません'

/**
 * その行の高さなら何行入るか。
 *
 * ⚠ **行数を決め打ちしないこと。**領域を動かしたときに、
 *   最後の行がページ送りへ食い込んでいることに**気づけなくなる**。
 */
export function rowsThatFit(rowH: number, rowsTop: number = ROWS_TOP): number {
  return Math.max(0, Math.floor((ROWS_BOTTOM - rowsTop) / rowH))
}

// ─── 文字が枠に収まるか ────────────────────────────────────────
/**
 * 文字の幅の**見積もり**（px）。
 *
 * ⚠ **実測ではない。**Phaser は canvas の `measureText` で測るので、node のテストからは測れない。
 *   **通れば必ず収まる側**へ寄せた見積もりだけを置く。
 *
 * 係数の根拠（Chromium 実測・Phaser 既定フォント `Courier` の Linux での実体）:
 * **数字 0.636em（太字 0.696em）／「,」「.」「/」「:」と空白 0.337em（太字 0.381em）／
 * それ以外の半角 0.838em（`+`。英字は 0.709em）／全角 1.000em**（`→` `−` は 0.838em だが
 * 1.0em として数える）。下の値はこれを**上へ丸めた**もの。
 * 本物の Courier がある環境は全部 0.6em なので、広いのはこちら。
 *
 * ⚠ **`+` を数字と同じ幅で数えないこと。**`+` は数字より 3割広く、
 *   工房の3ルートの行には `+` が3つ出る。ここを誤ると見積もりが実測を**下回る。**
 */
export function estTextWidth(text: string, fontPx: number, bold = false): number {
  const digit = bold ? 0.70 : 0.64   // 数字
  const thin  = bold ? 0.39 : 0.34   // 「,」「.」「/」「:」と空白
  const other = 0.84                 // それ以外の半角（`+` がいちばん広い）
  let em = 0
  for (const ch of text) {
    if (ch === ',' || ch === '.' || ch === '/' || ch === ':' || ch === ' ') em += thin
    else if (ch >= '0' && ch <= '9') em += digit
    else if (ch.charCodeAt(0) < 0x100) em += other
    else em += 1.0
  }
  return em * fontPx
}

/**
 * 右パネル（HUD）の枠。**285px の右パネルから左右の余白 12px ずつを引いたもの。**
 *
 * ⚠ **広げないこと。**右パネルにはこの下にボタン列が並んでいる。
 */
export const HUD_PANEL_W = SCREEN_W - RIGHT_PANEL_L - 24

/**
 * 所持金の文字の大きさ。**22 から下げた**（束M）。
 *
 * ⚠ `¥10,000,000` の頃は 22px でも収まっていたが、`10,000,000レン` は
 *   全角2文字ぶん増えて **183.2px** になり、枠 174px からはみ出した。
 * ⚠ **これ以上下げないこと。**所持金は右パネルの主要な情報である。
 *   収まるかは `layout.test.ts` が見ている。
 */
export const HUD_MONEY_FONT_PX = 30

/** 1行目の左 —— `D1 作業`。⚠ **この行に長い字を足さないこと**（右の時刻と重なる） */
export const HUD_PHASE_FONT_PX = 18
/** 1行目の右 —— 時刻。**太字。右そろえ** */
export const HUD_TIME_FONT_PX = 39
/** 2行目 —— 現在地（島名）。⚠ **季節名は出さない**（#2 の確定事項） */
export const HUD_PLACE_FONT_PX = 19.5

/**
 * 目標の進みのバーの幅。**右パネルの枠から左右 18px ずつ引いたもの。**
 *
 * ⚠ **`HUD.ts` と `layout.test.ts` の両方が使う。**以前は `HUD.ts` に式が直書きで、
 *   ここに置くものが収まるかを node のテストから測れなかった。
 */
export const HUD_BAR_W = HUD_PANEL_W - 36

/**
 * 自由航行（#7）で、**次の寄港地を選ぶところ**に出す1行。
 *
 * ⚠ **クリア後にしか出ない。**
 * ⚠ **現在地の行の右に置く**（PO 指示 2026-09-14）。
 *   **クリア後は `あと N日` が消えて島名だけになる**ので、そこが空く。
 *   ⚠ **キャラ絵の枠は動かない。**枠の外に行を足すと、絵の置き場所が変わる。
 * ⚠ **島名だけにしてある。**`次 〇〇島 ▶` だと現在地と並べて 154px に収まらない
 *   （実測 78 + 81 = 159）。**押せることは囲みで示す。**
 * ⚠ **ここに置いてあるのは、幅を測るため**（`upcomingLabel` と同じ理由）。
 *   `HUD.ts` は Phaser を読むので node の単体テストから import できない。
 * ⚠ **言い回しは仮置き。**画面に出す文言は PO が決める（#79）。
 */
export function nextPortLabel(island: string): string {
  return `${island}島`
}

/**
 * その文字の大きさ。⚠ **現在地（19.5px）と並べて枠に収まること**（`layout.test.ts` が見ている）。
 */
export const HUD_NEXT_PORT_FONT_PX = 16.5

/**
 * 次の寄港地を選ぶところの高さ。**押せる的の高さ**でもある。
 *
 * ⚠ **バーの行と「目標 N%」の行、2行ぶんを使う。**片方だけだと的が 11px しかなく、押しにくい。
 *   ⚠ **この 11px がどの寸法かは特定できなかった**（#117）。**1280系の数として読むこと。**
 *   **いまの `HUD_NEXT_PORT_H` は 27。**
 *   ⚠ **枠（右パネルの HUD）は広げない。**広げるとキャラ絵の枠（`CHAR_ART_T`）が下がる。
 */
export const HUD_NEXT_PORT_H = 27

/**
 * 仕入れの行の右端 ——「**総額**」と「**買う**」の2つぶんの幅（**footprint**）。
 *
 * ⚠ **1つのボタンではない**（PO 指示 2026-09-13「『総額』部分と『買う』部分は分ける」）。
 *   **総額はボタンの外の文字**で、ボタンは `買う` とだけ書いてある。
 * ⚠ **`118 → 138` に広げてある。**総額（11px で最悪 78.7px）とボタン（52px）は
 *   **118px には並ばない。**広げたぶんは左の「最大」「＋」「−」が寄る
 *   （列の並びは下の `ROW_*`）。
 * ⚠ **これ以上広げないこと。**広げると列全体が左へ寄り、
 *   **行商人の `残り N個` が仕入れ値に重なる**（`ROW_INFO_L`。`layout.test.ts` が見ている）。
 */
export const BUY_BTN_W = 78
/** 総額を置く幅。**右そろえ。**⚠ 7桁（`3,237,759レン`）が `BUY_TOTAL_FONT_PX` で収まること */
export const BUY_TOTAL_W = 120
/** 総額とボタンのあいだ。**離すこと自体が指摘の中身**なので詰めない */
export const BUY_GAP = 9
/** 総額とボタンを合わせた幅。**「もうすぐ買える」の1行はこの幅に収める**（#66） */
export const BUY_W = BUY_TOTAL_W + BUY_GAP + BUY_BTN_W

/**
 * 総額の文字の大きさ。**ボタン（18px）より小さい。**
 *
 * ⚠ **ボタンではないので、隣のボタンと揃える必要が無い**（`INFO_FONT_PX` と同じ理由）。
 *   12px にすると7桁の総額が **85.9px** になり、`BUY_TOTAL_W`（80）から出る。
 */
export const BUY_TOTAL_FONT_PX = 16.5

/**
 * 「買う」ボタンの文字の大きさ。**13 から下げた**（束M）。
 *
 * ⚠ `¥123,456 で買う` の頃は 13px で 105.2px だったが、`123,456レン で買う` は
 *   **122.9px** になり、118px のボタンから 5px はみ出した。
 * ⚠ **これ以上下げないこと。**隣の「最大」「＋」「−」が 18px なので、
 *   主たるボタンだけ小さいのはおかしい。
 *   **下げる代わりに助詞の「で」を落とし**、**のちに金額そのものをボタンの外へ出した**（`BUY_LABEL`）。
 */
export const BUY_FONT_PX = 18

/**
 * 「買う」ボタンの字。**金額はもう入っていない**（PO 指示 2026-09-13「総額と買うは分ける」）。
 *
 * ⚠ **「買う」という語は落とさないこと。**落とすとボタンが何をするか読めなくなる。
 * ⚠ **総額を足さないこと。**分けたのがこの直しの中身で、
 *   足すと `BUY_BTN_W`（78px）から出る。総額は `BUY_TOTAL_W` の側に置く。
 */
export const BUY_LABEL = '買う'

/**
 * **買えないとき**にボタンの字と差し替える、短い理由。
 *
 * ⚠ **`BUY_BTN_W`（78px）に収まること**（`layout.test.ts` が見ている）。
 *   **金額を混ぜないこと** —— 総額は**すぐ左に出ている**ので、
 *   `3,237,759レン 足りない` のように繰り返すと 138px になり、ボタンから出る。
 */
export const BUY_REASON_FUNDS = '足りない'
/** 在庫の上限で買えないときの理由。⚠ **しきい値は `Inventory` が持つ。**ここは形だけ */
export function buyReasonCap(max: number): string {
  return `上限${max}`
}

/**
 * **個数が読めないとき**に、総額の代わりに出す字。
 *
 * ⚠ **`BUY_TOTAL_W`（120px）に収まること**（`layout.test.ts` が見ている）。
 * ⚠ **入力を勝手に直さない**（`PurchaseMenu.refreshRow` の注記）。**理由を出すだけ。**
 */
export const QTY_REASON_EMPTY = '個数を入れて'
export const QTY_REASON_NOT_INT = '1以上の整数'

/**
 * 仕入れの行の `51レン/個　在庫 100/999`。**左隣の「N品に要る」との間隔** と、その文字の大きさ。
 *
 * ⚠ **`/個` を落とさないこと。**単価か総額か読めなくなる。
 * ⚠ 12px のままだと、仕入れ値が4桁の品で `1,234レン/個　在庫 100/999` ＝ **164.1px** になり、
 *   間隔 160px を超えて左隣の字に重なった（`¥1234/個…` の頃は 143.9px で収まっていた）。
 *   **ボタンではないので、隣と大きさを揃える必要がない。**11px へ下げてある。
 */
export const INFO_MAX_W = 240
export const INFO_FONT_PX = 16.5

/**
 * 商人タブの、**行そのものではない字**（絞り込み・ページ送り・件数・0件のときの文言）。
 *
 * ⚠ **工房（`CRAFT_*`）と同じ大きさだが、別に持つ。**
 *   同じ数だからと束ねると、**片方を動かしたときにもう片方が黙って動く**（#116）。
 */
export const BUY_FILTER_FONT_PX = 18
export const BUY_EMPTY_FONT_PX = 21
export const BUY_PAGER_ARROW_FONT_PX = 27
export const BUY_PAGER_FONT_PX = 19.5
export const BUY_RANGE_FONT_PX = 19.5
/** 個数の `−` `＋` `最大` のボタンの字 */
export const BUY_STEP_BTN_FONT_PX = 18
/** `<input>` が使えないときに、個数を出すだけの字（`tryAddDom` が空を返したとき） */
export const BUY_QTY_FONT_PX = 18

// ─── 仕入れの行の列 ────────────────────────────────────────────
/**
 * 1行の中の列。**右端から順に決める。**こうしておくと領域の幅が変わっても、
 * 操作の列が品名に食い込まない。
 *
 * ⚠ **ここにしか置かないこと。**以前は `PurchaseMenu.ts` が式を持ち、
 *   `layout.test.ts` が**同じ式を書き写して**追っていた。
 *   **写しがあると、片方だけ動かしても重なりをテストが見逃す。**
 */
export const ROW_INPUT_W = 78
export const ROW_INPUT_H = 33
export const ROW_STEP_W = 39
export const ROW_MAX_W = 60
/** 品名の左端 */
export const ROW_NAME_X = CONTENT_L + 24
/** 「買う」ボタンの左端 */
export const ROW_BUY_BTN_L = CONTENT_R - 12 - BUY_BTN_W
/** 総額の右端（右そろえ） */
export const ROW_TOTAL_R = ROW_BUY_BTN_L - BUY_GAP
/** 総額とボタンを合わせた footprint の左端。**「もうすぐ買える」の1行もここから置く** */
export const ROW_BUY_L = ROW_TOTAL_R - BUY_TOTAL_W
export const ROW_MAX_L = ROW_BUY_L - 9 - ROW_MAX_W
export const ROW_PLUS_L = ROW_MAX_L - 9 - ROW_STEP_W
export const ROW_INPUT_L = ROW_PLUS_L - 6 - ROW_INPUT_W
export const ROW_MINUS_L = ROW_INPUT_L - 6 - ROW_STEP_W
/** 「51レン/個　在庫 100/999」の右端（右そろえ） */
export const ROW_INFO_R = ROW_MINUS_L - 21
/**
 * 「51レン/個　在庫 100/999」の**左端**（＝右そろえの右端から `INFO_MAX_W` ぶん左）。
 *
 * ⚠ **ここより左へ字を伸ばさないこと。**行商人の `残り N個` は品名の右から伸びるので、
 *   **この線に届くと仕入れ値に重なる**（`layout.test.ts` が測っている）。
 * ⚠ **2026-09-14 まで `ROW_NEED_R`（`⚠ 切らしている（N品に要る）` の右端）だった。**
 *   **注記は PO 指示で画面から消えた**（「基本表示しない」）が、
 *   **境界としての線は残る**ので、名前だけ実体に合わせた。
 */
export const ROW_INFO_L = ROW_INFO_R - INFO_MAX_W

// ─── 改装タブの行 ──────────────────────────────────────────────
/**
 * 改装タブ（`UpgradeMenu`）の1行。**以前は `UpgradeMenu.ts` が直値で持っていた。**
 *
 * ⚠ **こちらへ移したのは、`費用` と `改装` ボタンが別の部品になったから**
 *   （PO 指示 2026-09-13「`32,000レン 不足` → 金額と `改装` ボタンに分ける」）。
 *   **2つの部品が隣り合うと、重なりは目視では数px単位でしか出ない。**
 *   `layout.test.ts` が見られるように、寸法をここへ集めてある。
 */
/**
 * 1行の高さ。⚠ **5行入ること**（#97。4系統 ＋ **商船**）。
 *
 * ⚠ **改装は上下の帯を2つとも使っていないので、そのぶんを一覧に回している**
 *   （PO 赤入れ 2026-09-15「**この余白は調整できるはず**」。上下の空きを図で指名された）。
 *   **上**: 絞り込みの帯（`FILTER_Y` 135〜171）が無い ／ **下**: ページ送りの帯（`PAGER_Y` 873）が無い。
 *   **`UPGRADE_HEAD_Y` 120 ／ `UPGRADE_ROWS_TOP` 150 ／ 150×5 = 750 → 下端 900**（枠の下端 906）。
 *   **行の面の上端は 159、下端は 891。線（`TITLE_RULE_Y` 81）からも枠の下端からも 39px と 15px。**
 * ⚠ **これで改装だけ一覧の上端が 15px 上にある**（ほかの2タブは `ROWS_TOP` 165）。
 *   **タブを行き来すると一覧がその分だけ動く。**PO が上下の余白を詰めるほうを採った。
 * ⚠ **行の面は `UPGRADE_ROW_H - 18`。**中身は約 66px（見出し `-30` ／ 一言 `+15` ／
 *   ボタン `UPGRADE_BTN_H` 45）。
 *   **数を動かすときは `layout.test.ts` の「5行が収まる」を必ず通すこと。**
 */
export const UPGRADE_ROW_H = 150
export const UPGRADE_ROW_W = CONTENT_R - CONTENT_L
/** 系統名（`棚`）と、その下の説明の左端 */
export const UPGRADE_NAME_X = CONTENT_L + 42
/** 行の中心からの上下。上が系統名、下が説明 */
export const UPGRADE_TITLE_DY = -30
export const UPGRADE_SUB_DY = 15

/**
 * 見出しの行（`現在値` `強化後` `強化費用`）。
 *
 * ⚠ **一覧の上に1回だけ出す**（PO 回答 2026-09-14 ／ `sessions/questions-ui-all.md` Q8 = A）。
 *   **行の中に入れると、同じ3語が4行とも繰り返される。**
 * ⚠ **`ROWS_TOP` から引いていない**（2026-09-15）。**改装には絞り込みの帯が無いので、
 *   その帯のぶん（36px）とページ送りの帯のぶんを一覧に回している**（`UPGRADE_ROW_H` の注記）。
 *   **納品タブ（`DELIVERY_HEAD_Y`）は `ROWS_TOP` のまま。**
 */
export const UPGRADE_COLS = ['現在値', '強化後', '強化費用'] as const
export const UPGRADE_HEAD_Y = 120
export const UPGRADE_HEAD_FONT_PX = 18
/**
 * 1行目の上端。⚠ **見出しの行と重ならないこと**（`layout.test.ts` が見ている）。
 * ⚠ **`ROWS_TOP` から引いていない理由は `UPGRADE_HEAD_Y` の注記。**
 */
export const UPGRADE_ROWS_TOP = 150

/** 段の `●○` の中心と、その文字の大きさ */
export const UPGRADE_STAGE_CX = PLACE_CX + 60
export const UPGRADE_STAGE_FONT_PX = 30
/**
 * `●○` が占める幅。⚠ **段数（`Upgrades.MAX_STAGE`）ぶんの丸が入ること。**
 *   段数を増やしたらここも広げる。**食い違えば `layout.test.ts` が落ちる**
 *   （`MAX_STAGE` をあちらから読んで測っている）。
 * ⚠ **`layout.ts` は実行時に何も import しない**ので、段数をここから読みには行かない。
 */
export const UPGRADE_STAGE_W = 150
export const UPGRADE_STAGE_L = UPGRADE_STAGE_CX - UPGRADE_STAGE_W / 2

/**
 * `現在値` `→` `強化後` の3つ。**`●○` の左端から左へ決める**
 * （右側の `費用`・ボタンが枠の右端から左へ決めてあるのと同じ作り）。
 *
 * ⚠ **説明の中に流し込まないこと。**以前は `売り場が広がる　6×5 → 7×6` の1行で、
 *   **説明の長さで `→` の位置が4行ともずれていた**（PO 赤入れ 2026-09-13「表にする」）。
 *   **列が固定されて初めて、見出しを一覧の上に1回だけ置ける。**
 */
export const UPGRADE_VALUE_W = 96
export const UPGRADE_ARROW_W = 30
export const UPGRADE_ARROW = '→'
export const UPGRADE_NEXT_R = UPGRADE_STAGE_L - 24
export const UPGRADE_NEXT_L = UPGRADE_NEXT_R - UPGRADE_VALUE_W
export const UPGRADE_NEXT_CX = (UPGRADE_NEXT_L + UPGRADE_NEXT_R) / 2
export const UPGRADE_ARROW_CX = UPGRADE_NEXT_L - UPGRADE_ARROW_W / 2
export const UPGRADE_NOW_R = UPGRADE_NEXT_L - UPGRADE_ARROW_W
export const UPGRADE_NOW_L = UPGRADE_NOW_R - UPGRADE_VALUE_W
export const UPGRADE_NOW_CX = (UPGRADE_NOW_L + UPGRADE_NOW_R) / 2
/** 値の文字の大きさ。⚠ **費用（`UPGRADE_COST_FONT_PX`）と揃える。**同じ表の中の数である */
export const UPGRADE_VALUE_FONT_PX = 21

/**
 * 説明の一言（`売り場が広がる`）に使える幅。
 *
 * ⚠ **`現在値` の列に食い込ませないこと。**食い込むと、列で揃えた意味が消える。
 */
export const UPGRADE_SUB_MAX_W = UPGRADE_NOW_L - UPGRADE_NAME_X - 18

/**
 * 行の右端 ——「**費用**」と「**改装**」の2つ。
 *
 * ⚠ **1つのボタンではない**（PO 指示 2026-09-13）。**費用はボタンの外の文字**で、
 *   ボタンは `改装` とだけ書いてある。**商人タブの「総額 ＋ 買う」と同じ作り。**
 *   **隣り合う2タブで作りが違うと、同じ操作に見えない。**
 */
export const UPGRADE_BTN_W = 96
export const UPGRADE_BTN_H = 45
/** ボタンの右端。**行の右の余白は 42px**（`UPGRADE_NAME_X` の左の余白と揃えてある） */
export const UPGRADE_BTN_R = CONTENT_R - 42
export const UPGRADE_BTN_L = UPGRADE_BTN_R - UPGRADE_BTN_W
/** 費用とボタンのあいだ。**離すこと自体が指摘の中身**なので詰めない */
export const UPGRADE_GAP = 15
/** 費用の右端（右そろえ）と、そこから左へ取る幅 */
export const UPGRADE_COST_R = UPGRADE_BTN_L - UPGRADE_GAP
/**
 * ⚠ **いちばん高い段（`400,000レン`）で 86.5px。**84 では**はみ出していた**（実測 2026-09-13）。
 *   ここを縮めるときは `layout.test.ts` の検査を通すこと。
 */
export const UPGRADE_COST_W = 138
export const UPGRADE_COST_L = UPGRADE_COST_R - UPGRADE_COST_W
/**
 * 費用の文字の大きさ。⚠ **ボタンではないので、ボタンと揃える必要がない**
 *   （商人タブの `BUY_TOTAL_FONT_PX` と同じ理由）。
 *   ⚠ いちばん高い段（`400,000レン`）が `UPGRADE_COST_W` に収まること。
 */
export const UPGRADE_COST_FONT_PX = 21

/**
 * ボタンの字。**金額はもう入っていない**（PO 指示 2026-09-13）。
 *
 * ⚠ **`不足` を金額のうしろに付けないこと。**付けると `32,000レン 不足` が
 *   「あと32,000足りない」と読まれる —— **PO 自身がそう読んだ**（赤入れの `37000レン` は
 *   32,000 ＋ 所持金 5,000）。**費用は裸で出す。**
 */
export const UPGRADE_LABEL = '改装'
/** **買えないとき**にボタンの字と差し替える理由。⚠ **`UPGRADE_BTN_W` に収まること** */
export const UPGRADE_REASON_FUNDS = '足りない'
/** 最大まで買った系統に出す字。**ボタンは出さない** */
export const UPGRADE_MAXED = '最大'

/**
 * その系統が何を良くするか。**買う前に分かるようにする。**
 *
 * ⚠ **文言は PO の領分**（#79）。ここは置き場所で、勝手に言い回しを変えない。
 */
export const UPGRADE_WHAT_IT_DOES: Record<UpgradeKind, string> = {
  棚:     '売り場が広がる',
  来客:   '客が来やすくなる',
  利益率: '1個あたりの取り分が増える',
  手際:   '加工が速くなる',
}

/**
 * **一覧の5行目 ——「商船」**（#97）。**買うとエンディングになり、そのまま遊べる。**
 *
 * ⚠ **`UpgradeKind` ではない。**商船は**段を買うものではない**ので、
 *   `Upgrades` の段・費用・効果の仕組みには乗らない（`Upgrades.ts` は触らない）。
 *   **一覧の5行目として `UpgradeMenu` が別に描く。**
 * ⚠ **値段は `ui/goal.ts` の `SHIP_COST`**（＝ `GameService.GOAL_AMOUNT`。決定 2026-09-15）。
 *   **ここに額を書かないこと**（`goal.test.ts` が「目標額の別書き」として落とす）。
 */
export const UPGRADE_SHIP_NAME = '商船'
/** ⚠ **文言は PO の領分**（#79）。ここは置き場所。**いまのは仮** */
export const UPGRADE_SHIP_WHAT_IT_DOES = '次の寄港地を選べるようになる'
/** 買えるときのボタンの字。⚠ **買えないときは `UPGRADE_REASON_FUNDS` に差し替わる**（他の行と同じ） */
export const UPGRADE_SHIP_LABEL = '買う'
/** 買ったあとに出す字。**`UPGRADE_MAXED` と同じ置き方**（ボタンも費用も出さない） */
export const UPGRADE_SHIP_BOUGHT = '購入済み'
/**
 * 商船の行の**費用に使える幅**。
 *
 * ⚠ **ほかの行の `UPGRADE_COST_W`（138）では足りない** —— `10,000,000レン` は
 *   **見積もり 163.8px**（`estTextWidth`）で、いちばん高い段（`400,000レン` = 129.8px）より広い。
 * ⚠ **商船の行は `現在値` `→` `強化後` も `●○` も出さない**ので、
 *   **`現在値` の列の左端から費用の右端まで丸ごと使える。**ここを狭めるときは
 *   `layout.test.ts` の「商船の費用が収まる」を通すこと。
 */
export const UPGRADE_SHIP_COST_W = UPGRADE_COST_R - UPGRADE_NOW_L

/**
 * 一覧の行数。**4系統 ＋ 商船の1行**（#97）。
 *
 * ⚠ **`layout.ts` は実行時に何も import しない**ので、`UPGRADE_KINDS.length` を読みに行かない。
 *   **写しなので食い違えば `layout.test.ts` が落ちる**（`UPGRADE_STAGE_W` と同じ作り）。
 */
export const UPGRADE_ROW_COUNT = 5


// ─── 納品タブの表 ──────────────────────────────────────────────
/**
 * 納品タブ（`DeliveryTab`）の表（**PO 赤入れ 2026-09-13**）。
 *
 * **商品 ／ 依頼者 ／ 数量 ／ 報酬 ／ 納品**（列の名は `ui/delivery.ts` の `DELIVERY_COLS`）。
 * ⚠ **島の列は無い**（#98「納品先の島は無くす」）。**`廃棄` だけが絵に無く、右端に足してある。**
 *
 * ⚠ **右端から順に決める**（商人タブの `ROW_*` と同じ作り）。
 *   こうしておくと領域の幅が変わっても、ボタンが品名に食い込まない。
 * ⚠ **写しを作らないこと。**`DeliveryTab.ts` はここを読むだけで、自分の数を持たない。
 */
/** 見出しの行（`商品` `依頼者` …）の y */
export const DELIVERY_HEAD_Y = ROWS_TOP + 15
export const DELIVERY_HEAD_FONT_PX = 18
/** 1件目の行の上端。⚠ **見出しの行と重ならないこと**（`layout.test.ts` が見ている） */
export const DELIVERY_ROWS_TOP = ROWS_TOP + 45
/**
 * 1行の高さ。
 *
 * ⚠ **`MISSION_CAP`（10件）が全部入ること。**入らないと**下の行に手が届かない** ——
 *   商人タブと違い、**この表にはページ送りが無い**（10件で打ち止めなので要らない）。
 *   `layout.test.ts` が `rowsThatFit` で見ている。
 */
export const DELIVERY_ROW_H = 60

/**
 * ⚠ **左から順に決める。商人タブ（`ROW_*`）・改装タブ（`UPGRADE_*`）とは逆である。**
 *
 * **PO が描いた表は左に寄っている**（赤入れ 2026-09-13。6列で領域の半分ほど）。
 * あの2つが右端から決めているのは、**右端にボタンが貼り付いていて、
 * 左の品名が伸びると食い込むから。**この表は**全部の列が短い**ので、
 * 右端に散らすと**読む目が横に飛ぶ。**⚠ **右に余白が残るのは、この表では正しい。**
 */
/** `商品` の左端。⚠ **いちばん長い品名が `依頼者` に届かないこと**（`layout.test.ts`） */
export const DELIVERY_NAME_L = CONTENT_L + 24
export const DELIVERY_NAME_W = 285
/**
 * `依頼者` の左端。⚠ **4人ぶんの名（`フィエラ` がいちばん長い）が
 *   `数量` の列に届かないこと**（`layout.test.ts` が見ている）。
 */
export const DELIVERY_CLIENT_L = DELIVERY_NAME_L + DELIVERY_NAME_W
export const DELIVERY_CLIENT_W = 165
/** `数量` の右端（右そろえ）。**必要な数**であって、手持ちではない */
export const DELIVERY_QTY_W = 90
export const DELIVERY_QTY_R = DELIVERY_CLIENT_L + DELIVERY_CLIENT_W + DELIVERY_QTY_W
/** `報酬` の右端（右そろえ）。⚠ **いちばん高い報酬が収まること**（`layout.test.ts`） */
export const DELIVERY_REWARD_W = 165
export const DELIVERY_REWARD_R = DELIVERY_QTY_R + 30 + DELIVERY_REWARD_W

export const DELIVERY_BTN_H = 39
/** `納品` ボタン。⚠ **納められないとき `手持ち/必要` に変わる**ので、その幅も要る */
export const DELIVERY_BTN_W = 108
export const DELIVERY_BTN_L = DELIVERY_REWARD_R + 30
/** `廃棄` ボタン。⚠ **`納品` から離すこと。**押し間違えると依頼が消える */
export const DELIVERY_DISCARD_W = 84
export const DELIVERY_DISCARD_L = DELIVERY_BTN_L + DELIVERY_BTN_W + 24
/** ボタンの字の大きさ。⚠ **2つのボタンで揃える**（隣り合うので） */
export const DELIVERY_BTN_FONT_PX = 19.5

/**
 * 商人のところの「**もうすぐ買える**」行に出す文字（#66）。
 *
 * ⚠ **分母もしきい値も出さない**（PO 判断 Q7=A ／ `evaluate.ts` の注記）。
 *   出すのは **`salesUntilBuyable` が規則から導いた残り**だけ。100 を画面へ書き写さない。
 * ⚠ **ここに置いてあるのは、幅を測るため。**`PurchaseMenu.ts` は Phaser を読むので
 *   node の単体テストから import できず、**文字を組み立てる側をこちらに置かないと
 *   `layout.test.ts` が実物の文字列を測れない**（`money.ts` と同じ理由）。
 * ⚠ **「総額 ＋ 買う」の footprint（`BUY_W`）に収める。**3桁の残りで `あと999個売れば買える` は
 *   **末尾を `買える` のままにすると、footprint が 118px だった頃にはみ出した**ので `並ぶ` にしてある
 *   （#60 の知らせ「**商人の店先に並ぶようになった**」と同じ語）。**⚠ 文言は PO の領分（#79）。**
 */
export function upcomingLabel(salesLeft: number): string {
  return `あと${salesLeft}個売れば並ぶ`
}

/**
 * その文字の大きさ。**「買う」ボタンと同じ右端に、ボタンを作らずに置く。**
 *
 * ⚠ **ボタンではないので、隣と大きさを揃える必要がない**（`INFO_FONT_PX` と同じ扱い）。
 *   **総額（`BUY_TOTAL_FONT_PX`）と同じ 16.5px。**どちらもボタンの外に置く文字である。
 * ⚠ **上げてよいのは footprint に収まるあいだだけ**（`layout.test.ts` が3桁の残りで見ている）。
 *   **118px だった頃は 12px で 1px はみ出していた** —— 総額を分けて 138px になったので、
 *   いまは収まる。**それでも上げていないのは、揃える相手がボタンではないからである。**
 */
export const UPCOMING_FONT_PX = 16.5

/**
 * 行商人のところ（#9）に出す文字。
 *
 * ⚠ **ここに置いてあるのは、幅を測るため**（`upcomingLabel` と同じ理由）。
 *   `PurchaseMenu.ts` は Phaser を読むので node の単体テストから import できない。
 * ⚠ **言い回しは仮置き。**画面に足す文言は PO が指示する（#79）。
 * ⚠ **見出しの下の1行はもう無い**（PO 指示 2026-09-13「不要」）。
 *   `所持金` を落としたときと同じで、**戻すなら PO の指示が要る。**
 */

/**
 * 行に出す「今日まだ何個買えるか」。
 *
 * ⚠ **読み手は行商人の積荷（#9）だけ。**「今日ここまで」がほかにもできたら、
 *   **字はこれを使い回す**（分けると同じ意味の文言が2つになり、幅の検査も2本になる）。
 *
 * ⚠ **品名の右**に出す。**島の商人の側にはもう字が無い**（産地は行の色。PO 指示 2026-09-13）ので、
 *   **ここが品名の右を使う唯一の字**である。
 *   `51レン/個　在庫 100/999` の側に足すと `INFO_MAX_W`（240px）を超えて左隣に重なる。
 * ⚠ **買えない理由の文言も同じものを使う**（`残り0個` がそのまま理由になる）。
 */
export function peddlerRemainText(remaining: number): string {
  return `残り${remaining}個`
}

/** 行商人の行の `残り N個` の文字の大きさ。**行の補足の字**（`INFO_FONT_PX`）に合わせる */
export const PEDDLER_REMAIN_FONT_PX = 16.5

/**
 * 行商人の場所の見出し。
 *
 * ⚠ **できごとの窓に出る話し手の名（`STORY_EVENTS`）と同じにすること。**
 *   同じ相手を2つの名で呼ばない（`クラフト`→`工房` と同じ直し。束M）。
 *   ⚠ **ボタン列にはもう無い**（#90。向こうから来るので、窓の「見る」からだけ開く）。
 * ⚠ **`バレン` を戻さないこと**（PO 指示 2026-09-13「`バレン` は不要」）。
 *   **戻すなら話し手も一緒に戻す**（`STORY_EVENTS.peddler_visit.speaker`）。
 *   ⚠ **内部の語はそのまま**（`StockedBy` の `'行商人バレン'`）。**画面に出ない。**
 */
export const PEDDLER_TITLE = '行商人'

/**
 * 型の升に出す1行（`ハルヴェラ島`。#67）の文字の大きさ。
 *
 * ⚠ **升の文字欄は 462px**（升の幅 600 から、縮小図 105 と余白 33 を引いたもの）。
 *   いちばん長い既定値は `ミフユリア島` で **72px**（区画数を落とした 2026-09-13 以降）。
 *   ⚠ **古いセーブの `130区画` も通る。**収まるかは `layout.test.ts` が両方見ている。
 */
export const PRESET_TEXT_FONT_PX = 18

/**
 * 型の升の**2行目**（島名）。**名前を付けたときだけ出る**（#83）。
 *
 * ⚠ **名前が1行目を占めるので、これが無いと島名が読めなくなる。**
 */
export const PRESET_SUB_FONT_PX = 16.5

/** 升の下に並ぶボタン（`セーブ` `ロード` `削除`）の字 */
export const PRESET_BTN_FONT_PX = 18

/**
 * 型の升の**横の寸法**（`PresetMenu` が並べる 2列 × 5行 の升）。
 *
 * ⚠ **`PresetMenu` と `layout.test.ts` の両方が使う。**以前は両方が同じ式を書き写していて、
 *   **片方を動かしてももう片方が気づかない**形だった（#83 で片付けた）。
 * ⚠ **縦の寸法（升の高さ）はここに無い。**`PRESET_COUNT` から割るので `PresetMenu` に置いてある。
 */
export const PRESET_COLS = 2
export const PRESET_GAP_X = 21
export const PRESET_CELL_W =
  Math.floor((CONTENT_R - CONTENT_L - PRESET_GAP_X * (PRESET_COLS - 1)) / PRESET_COLS)
/** 盤面の縮小図を置く枠の幅 */
export const PRESET_PREVIEW_W = 105
/** 升の左端から、文字（と名前の入力欄）の左端までの距離。左余白15 ＋ 縮小図 ＋ 間隔18 */
export const PRESET_TEXT_L_OFFSET = 15 + PRESET_PREVIEW_W + 18
/** 升の文字欄の幅（**462px**）。⚠ **名前もここに収まること**（`layout.test.ts` が見ている） */
export const PRESET_TEXT_W = PRESET_CELL_W - PRESET_TEXT_L_OFFSET

/**
 * 型の名前を打つ `<input>`（#83）。**文字欄と同じ場所に、同じ大きさで置く。**
 *
 * ⚠ **右端に 15px 残す。**升の縁にぴったり付けると枠線と重なって見える。
 * ⚠ **高さは 36。**升の文字行（升の上端から22.5px）と、その下のボタン列のあいだに収まる。
 */
export const PRESET_NAME_INPUT_W = PRESET_TEXT_W - 15
export const PRESET_NAME_INPUT_H = 36

// ─── 右パネルのボタン列 ──────────────────────────────────
/**
 * 右パネル下段のボタン列。**下から順に積む**（`進める` が最下段）。
 *
 * ⚠ **GameScene が写しを持たないこと。**以前はここの数字が `GameScene` に直書きで、
 *   **行を1つ足したときにキャラ絵の枠と重なることに気づけなかった**（#9 で行商人を足した）。
 *   いまは `CHAR_ART_B` をこの列の上端から引いてあるので、`layout.test.ts` が重なりを見られる。
 */
export const BTN_PANEL_R = 1917
export const BTN_PANEL_W = 264
export const BTN_PANEL_L = BTN_PANEL_R - BTN_PANEL_W
/** ⚠ **アイコンは5つ。**幅を広げると入らない（列は 264px しかない） */
export const BTN_ICON_W = 49.5
export const BTN_ICON_H = 57
export const BTN_ACTION_H = 63
export const BTN_GAP = 7.5
/** 速さの行。ボタンの中に入れると文字が重なる */
export const BTN_SPEED_H = 24
/** 列の下端（メッセージ欄の上）と、そこから空ける余白 */
const BTN_COLUMN_B = LOG_T - 1.5 - 24

export const BTN_Y_ADVANCE = BTN_COLUMN_B - BTN_ACTION_H / 2
export const BTN_Y_SPEED   = BTN_Y_ADVANCE - BTN_ACTION_H / 2 - BTN_GAP - BTN_SPEED_H / 2
export const BTN_Y_CRAFT   = BTN_Y_SPEED   - BTN_SPEED_H / 2  - BTN_GAP - BTN_ACTION_H / 2
/**
 * ⚠ **行商人の行はここに無い**（#90 で外した）。**向こうから来る**ので、
 *   いつでも押せるボタンにすると「そこに在る店」になり、来訪という形が消える。
 *   開くのは**できごとの窓の「見る」**だけ（`MessageWindow` ／ `STORY_EVENTS`）。
 *   ⚠ **行が1つ減ったぶん、列の上端が下がってキャラ絵の枠が広がる。**
 *   それも `CHAR_ART_B` が列から引いているので、写しを作らないこと。
 *
 * ⚠ **`改装` と `商人のところ` はもう無い**（#96）。2つを `取引` の1行にまとめ、
 *   中を3タブにした（`TRADE_TABS`）。**ここでも行が1つ減り、キャラ絵の枠が 202 → 249px に広がる。**
 */
export const BTN_Y_TRADE   = BTN_Y_CRAFT - BTN_ACTION_H / 2 - BTN_GAP - BTN_ACTION_H / 2
export const BTN_Y_ICON    = BTN_Y_TRADE - BTN_ACTION_H / 2 - BTN_GAP - BTN_ICON_H / 2

/** 行動ボタン（`取引` `工房`）の字 */
export const BTN_ACTION_FONT_PX = 25.5
/**
 * `▶  進める` の字。
 *
 * ⚠ **`BTN_ACTION_FONT_PX` と同じ大きさだが、別に持つ。**
 *   いちばん押すボタンなので、**ここだけ動かすことがある**（#116）。
 */
export const BTN_ADVANCE_FONT_PX = 25.5
/**
 * 上段のアイコンのボタンに出す**絵の大きさ**（#69）。
 *
 * ⚠ **`BTN_ICON_W`(49.5) × `BTN_ICON_H`(57) の枠の中。**枠いっぱいにすると
 *   **隣のボタンと絵がくっついて見える**ので、まわりに余白を残す。
 * ⚠ **原本は 256px。**ここで縮めるので、**細い線は消える**
 *   —— 絵の側の条件は `handoff-button-icons.md`。
 */
export const BTN_ICON_ART_PX = 36
/**
 * 行動ボタン（`取引` `工房`）の中の絵と、絵と字のあいだ。
 *
 * ⚠ **絵と字を合わせた幅でボタンの中央に置く**（`GameScene`）。
 *   字だけを中央に置くと、**絵のぶんだけ左に寄って見える。**
 */
export const BTN_ACTION_ICON_PX = 30
export const BTN_ACTION_ICON_GAP = 12
/** アイコンのボタンに触れたときに出る吹き出しの字 */
export const BTN_TOOLTIP_FONT_PX = 18
/** `速さ ×N` の行。⚠ **「進める」の中に入れない**（字が重なる） */
export const BTN_SPEED_FONT_PX = 16.5

/**
 * 右パネル上の枠（時刻・現在地・所持金）。⚠ **`HUD.ts` に写しを置かないこと。**
 *
 * ⚠ **行の位置は枠の上端からの絶対値で持つ。**中心からの相対にすると、
 *   **高さを変えたときに全部の行が動く**（どれか1つだけ直したいときに効かない）。
 * ⚠ **`時刻` は 39px、`所持金` は 30px。**行の間隔はその半分を見込んである
 *   （PO 指示 2026-09-14「詰まりすぎ。調整」で広げた）。
 * ⚠ **枠は所持金の行で終わる**（PO 指示「ここの空白は不要」）。
 *   **目標の進みのバーを消したあと、下に空の帯が残っていた。**
 */
export const HUD_PANEL_T = 12
export const HUD_ROW_TIME_Y = HUD_PANEL_T + 33
export const HUD_ROW_PLACE_Y = HUD_PANEL_T + 75
export const HUD_RULE_Y = HUD_PANEL_T + 96
export const HUD_ROW_MONEY_Y = HUD_PANEL_T + 126
export const HUD_PANEL_H = 153
export const HUD_PANEL_B = HUD_PANEL_T + HUD_PANEL_H

/**
 * キャラ絵の枠（#21・#15 の置き場所）。**HUD の下から、ボタン列の上まで。**
 *
 * ⚠ **下端を決め打ちしないこと。**ボタン列に行を足すと列が上へ伸びるので、
 *   決め打ちにすると**気づかないまま重なる**（#9 で行商人の行を足したときに実際に起きかけた）。
 * ⚠ **上端も決め打ちしない。**HUD の枠の下から引く。
 *   **枠の高さを変えたときに、ここが置き去りになると隙間か重なりになる。**
 * ⚠ **次の寄港地は現在地の行に置いてある**（#7）ので、**クリア後もここは動かない。**
 */
export const CHAR_ART_T = HUD_PANEL_B + 13.5
export const CHAR_ART_B = BTN_Y_ICON - BTN_ICON_H / 2 - 13.5
export const CHAR_ART_CY = (CHAR_ART_T + CHAR_ART_B) / 2
export const CHAR_ART_H = CHAR_ART_B - CHAR_ART_T
export const CHAR_ART_CX = 1777.5
export const CHAR_ART_W = 255

// ─── 工房の表 ────────────────────────────────────────────────
/**
 * 工房（`CraftMenu`）の表（**PO 赤入れ 2026-09-13**「↓のように表示して」）。
 *
 * **商品 ／ 作成数 ／ 在庫 ／ 時間 ／ 需要 ／ 材料 ／ 数量 ／ 作る**（列の名は `CRAFT_COLS`）。
 * ⚠ **`材料` は PO 回答で戻した列**（#107。2026-09-14）。**図には無いが、
 *   「何が要るか」が画面から消えていた**ので8列目として足してある。
 * ⚠ **儲け方の3ルート（#23）は出さない**（→ #108。PO 回答 2026-09-14）。
 *   **`taxonomy/routes.ts` の `routeValues` は残してある**ので、戻すなら列を足す話になる。
 *
 * ⚠ **納品タブ（`DELIVERY_*`）と同じく左から順に決める。**
 *   商人タブ・改装タブが右端から決めているのは**右端にボタンが貼り付いているから**で、
 *   この表は**左の5列が短く、右の2列（数量・作る）だけが固定幅**なので、
 *   **左は左から、右は右から**決めて、あいだが空くかをテストで見る。
 * ⚠ **写しを作らないこと。**`CraftMenu.ts` はここを読むだけで、自分の数を持たない。
 */
/** 見出しの行（`商品` `作成数` …）の y。⚠ **工房は見出しの下の1行が無い**ので上端が他より上 */
export const CRAFT_HEAD_Y = ROWS_TOP_NO_SUBTITLE + 15
export const CRAFT_HEAD_FONT_PX = 18
/** 1件目の行の上端。⚠ **見出しの行と重ならないこと**（`layout.test.ts` が見ている） */
export const CRAFT_ROWS_TOP = ROWS_TOP_NO_SUBTITLE + 45
/**
 * 1行の高さ。**3段組み（84px）をやめて1行にした。**
 *
 * ⚠ **行数は決め打ちしない**（`rowsThatFit`）。84px のときは5行、いまは11行入る。
 */
export const CRAFT_ROW_H = 60

/** 列の名。⚠ **見出しの字はここだけ。**`CraftMenu.ts` に書かない */
export const CRAFT_COLS =
  ['商品', '作成数', '在庫', '時間', '需要', '材料', '数量', '作る'] as const

/**
 * 列と列のあいだ。⚠ **列ごとに別の値を置かない**（`材料` の幅がここから出るため）。
 * ⚠ **`材料` 以外は「いちばん長い中身」ぴったりに詰めてある。**
 *   余らせると、そのぶん `材料` が短くなって `…` に詰まる行が増える。
 */
export const CRAFT_COL_GAP = 12
/** 右そろえの数の列（`作成数` ／ `在庫`）の幅。**4桁 = 28.2px**（`CRAFT_CELL_FONT_PX`） */
export const CRAFT_NUM_W = 45

/**
 * `商品` の左端と幅。**出来上がる品の名前だけ**（`×3(400)` は `作成数` と `在庫` に割れた）。
 *
 * ⚠ **いちばん長い品名が `作成数` に届かないこと**（`layout.test.ts`）。
 *   **実測: `フェルト張りの氷入れ` が 10文字＝140px**（`CRAFT_NAME_FONT_PX`）。
 */
export const CRAFT_NAME_L = CONTENT_L + 12
export const CRAFT_NAME_W = 213
/** ⚠ **納品タブ（22.5px）より1つ小さい。**列が7つあり、ここを 22.5px にすると `需要` が入らない */
export const CRAFT_NAME_FONT_PX = 21

/** 行の中の数字と島名の大きさ */
export const CRAFT_CELL_FONT_PX = 16.5

/**
 * `作成数` の右端（右そろえ）。**`出来高 × 回数`** であって、1回ぶんではない。
 *
 * ⚠ **`材料` の列を足したとき 44px → 桁ぴったりに詰めた**（2026-09-14。#107）。
 *   **空けておいた余白は `材料` へ回してある。**
 */
export const CRAFT_MADE_R = CRAFT_NAME_L + CRAFT_NAME_W + CRAFT_COL_GAP + CRAFT_NUM_W
/** `在庫` の右端（右そろえ）。**出来上がる品の在庫** */
export const CRAFT_STOCK_R = CRAFT_MADE_R + CRAFT_COL_GAP + CRAFT_NUM_W
/**
 * `時間` の左端と幅。**`craftTimeLabel` が作る `◯分`**。
 *
 * ⚠ **4桁までしか測っていない**（`9999分`）。**1日は 1440分**なので、
 *   作れる回数のあいだは必ず4桁に収まる。**それ以上を手で打つと `…` に詰まる**が、
 *   そのときは `作る` が押せない状態なので実害は無い。
 *
 * ⚠ **`（営業◯分）` を消したぶんは、いま `材料` が使っている**（2026-09-14。#107）。
 *   消した直後（118px のまま）は「詰めても穴の場所が変わるだけ」だったが、
 *   **8列目が入って穴に置くものができた**ので、`9999分`（39.2px）ぴったりまで詰めた。
 *   ⚠ **ここを広げると、そのぶん `材料` が短くなる。**
 */
export const CRAFT_TIME_L = CRAFT_STOCK_R + CRAFT_COL_GAP
export const CRAFT_TIME_W = 63
/**
 * `需要` の左端と幅。**中身は「その品が高く売れる島」**（PO 回答 2026-09-14。Q1）。
 *
 * ⚠ **材料の産地ではない。**2026-09-13 に入れたときは `＠` を列にしたもので、
 *   **PO の図の `ノアキータ` と字が一致していただけ**だった。
 *   **出どころは `islands.ts` の `DEMAND_TABLE`**（品の `向く土地` → 島）。
 * ⚠ **島は多くても1つ**（需要表が `向く土地` 1つにつき1行）。だから`・` の繋ぎは要らない。
 *   **いちばん長い島名 `ミフユリア` = 55px** に合わせてある。
 * ⚠ **`向く土地: どこでも` の品は行が無いので空欄**（106レシピ中42本。PO 了承済み）。
 */
export const CRAFT_DEMAND_L = CRAFT_TIME_L + CRAFT_TIME_W + CRAFT_COL_GAP
export const CRAFT_DEMAND_W = 87

/**
 * `作る` ボタン。**右端から決める。**
 *
 * ⚠ **作れないときは字が理由に変わる**（商人タブ `BUY_REASON_FUNDS` と同じ作り）。
 *   **1行になった時点で、理由を置く段が無くなった。**
 * ⚠ **いちばん長い理由がここに収まること**（`layout.test.ts`）。
 */
export const CRAFT_BTN_W = 114
export const CRAFT_BTN_H = 39
export const CRAFT_BTN_L = CONTENT_R - 9 - CRAFT_BTN_W
export const CRAFT_BTN_FONT_PX = 18
export const CRAFT_BTN_LABEL = '作る'

/**
 * 作れない理由。**ボタンの字になる**ので短い。
 *
 * ⚠ **1つにまとめないこと**（#64）。「時間がない」と「在庫が上限」は
 *   **待てば直るかどうかが違う。**在庫の側を「時間がない」と言うと、
 *   **明日まで待ってまた作れず**に終わる。
 * ⚠ **言い回しは PO の領分（#79）。**仮置き。**ここに置いてあるのは幅を測るため。**
 */
export const CRAFT_REASON_INGREDIENTS = '材料不足'
export const CRAFT_REASON_STOCK = '在庫上限'
export const CRAFT_REASON_TIME = '時間切れ'
export const CRAFT_REASON_EMPTY = '回数を入れて'
export const CRAFT_REASON_NOT_INT = '1以上の整数'

/**
 * `数量` の列 —— `-10` `-1` `□` `+1` `+10` `最大`（**PO の図のとおりの並び**）。
 *
 * ⚠ **`回` の字は出さない**（図に無い）。**別の段にあった `最大` もここへ入った。**
 * ⚠ **右端は `作る` ボタンから `CRAFT_QTY_GAP` 空ける。**
 */
export const CRAFT_STEP_BIG_W = 42
export const CRAFT_STEP_ONE_W = 33
export const CRAFT_INPUT_W = 60
export const CRAFT_INPUT_H = 33
export const CRAFT_MAX_W = 51
export const CRAFT_STEP_GAP = 4.5
export const CRAFT_QTY_GAP = 15
/** 数量の列の幅（6つぶんと隙間5つ） */
export const CRAFT_QTY_W =
  CRAFT_STEP_BIG_W + CRAFT_STEP_ONE_W + CRAFT_INPUT_W
  + CRAFT_STEP_ONE_W + CRAFT_STEP_BIG_W + CRAFT_MAX_W + CRAFT_STEP_GAP * 5
/** 数量の列の左端 */
export const CRAFT_QTY_L = CRAFT_BTN_L - CRAFT_QTY_GAP - CRAFT_QTY_W
/** ⚠ **並びは1箇所から**。`CraftMenu.ts` も `layout.test.ts` もここを読む */
export const CRAFT_STEP_XS = {
  minusTen: CRAFT_QTY_L,
  minusOne: CRAFT_QTY_L + CRAFT_STEP_BIG_W + CRAFT_STEP_GAP,
  input: CRAFT_QTY_L + CRAFT_STEP_BIG_W + CRAFT_STEP_ONE_W + CRAFT_STEP_GAP * 2,
  plusOne: CRAFT_QTY_L + CRAFT_STEP_BIG_W + CRAFT_STEP_ONE_W + CRAFT_INPUT_W + CRAFT_STEP_GAP * 3,
  plusTen: CRAFT_QTY_L + CRAFT_STEP_BIG_W + CRAFT_STEP_ONE_W + CRAFT_INPUT_W
    + CRAFT_STEP_ONE_W + CRAFT_STEP_GAP * 4,
  max: CRAFT_QTY_L + CRAFT_STEP_BIG_W + CRAFT_STEP_ONE_W + CRAFT_INPUT_W
    + CRAFT_STEP_ONE_W + CRAFT_STEP_BIG_W + CRAFT_STEP_GAP * 5,
} as const
/** 段の刻み。⚠ **`最大` は `maxCraftTimes` を使う**（#64）ので、ここには入らない */
export const CRAFT_STEP_LABELS = {
  minusTen: '-10', minusOne: '-1', plusOne: '+1', plusTen: '+10', max: '最大',
} as const
export const CRAFT_STEP_FONT_PX = 16.5

/**
 * `材料` の列（**#107。PO 回答 2026-09-14「戻す」**）。
 *
 * ⚠ **幅は「残りぜんぶ」である。**左の5列を詰めて空けたところを、ここが全部使う。
 *   **だから `数量` の列の左端から引く**（左から積むと、詰め忘れが `…` になって現れない）。
 * ⚠ **いちばん右の文字の列なので、ここだけが可変。**
 *   ほかの列は「いちばん長い中身」ぴったりに詰めてある。
 *
 * **実測（2026-09-14。106レシピ）**: 幅 175px に
 * **`くるみのビスケット×2`（115px）のような材料1つは必ず収まる**／
 * **材料2つは 43本中42本**／**全体では 106本中 77本**が収まり、
 * **残りは末尾が `…` に詰まる**（材料3〜4つのレシピ。50本中29本）。
 * ⚠ **`(在庫)` を付けると 106本中32本しか収まらない**ので、**手持ちの数は出していない**
 *   （表にする前の `蕎麦の実×3(400)` から `(400)` が落ちている）。
 */
export const CRAFT_ING_L = CRAFT_DEMAND_L + CRAFT_DEMAND_W + CRAFT_COL_GAP
export const CRAFT_ING_W = CRAFT_QTY_L - CRAFT_COL_GAP - CRAFT_ING_L
/** 材料と材料のあいだ。⚠ **幅の見積もりに入る**ので `craftIngredientsLabel` と揃える */
export const CRAFT_ING_SEP = '  '

/**
 * 工房の、**行そのものではない字**（絞り込み・ページ送り・件数・0件のときの文言）。
 *
 * ⚠ **商人タブ（`BUY_*`）と同じ大きさだが、別に持つ**（上と同じ理由。#116）。
 */
export const CRAFT_FILTER_FONT_PX = 18
export const CRAFT_EMPTY_FONT_PX = 21
export const CRAFT_PAGER_ARROW_FONT_PX = 27
export const CRAFT_PAGER_FONT_PX = 19.5
export const CRAFT_RANGE_FONT_PX = 19.5
/**
 * 回数の `-10` `-1` `+1` `+10` `最大` のボタンの字。
 *
 * ⚠ **`CRAFT_STEP_FONT_PX` とは別物。**あちらは `<input>` が使えないときに出す
 *   **数そのもの**の字で、大きさも違う（こちらのほうが大きい）。
 */
export const CRAFT_STEP_BTN_FONT_PX = 18

/**
 * `材料` の列の字 —— **`蕎麦の実×3` を並べたもの。**
 *
 * ⚠ **数は「1回ぶん × 回数」**（`作成数` と同じ数え方）。**1回ぶんではない。**
 * ⚠ **産地（`＠ノアキータ`）は付けない**（2026-09-14）。
 *   **付けると 424組中 217組しか収まらない**（付けなければ 320組）。
 * ⚠ **言い回しは PO の領分（#79）。**ここに置いてあるのは幅を測るため。
 */
export function craftIngredientsLabel(
  parts: readonly { readonly name: string, readonly quantity: number }[],
): string {
  return parts.map(p => `${p.name}×${p.quantity}`).join(CRAFT_ING_SEP)
}

/**
 * 加工が**何分かかるか**を1行にする。
 *
 * ⚠ **`（営業◯分）` を足さないこと**（PO 指示 2026-09-14「**とか不要です。消せ**」）。
 *   #53 で足したもので、**加工中は客が1人も来ない**（`TimeManager.skipMinutes` が
 *   `TIME_MINUTE_PASSED` を出さない）ため、営業時間に食い込んだ分だけ売上が消える
 *   ——という**仕組みそのものは変わっていない**（実測: 営業600分のうち240分を加工に使うと
 *   その日の売上は 41.7% 減）。**画面から消えたのは、その知らせだけである。**
 *   **どこで知らせ直すかは #109。**
 *
 * ⚠ **`recipe.durationMinutes` を渡さないこと。**あれは手際を掛ける前の素の値で、
 *   `CraftingSystem.minutesFor` とは**初期手際 S=10 の時点ですでに食い違う**
 *   （tier3 以上は2倍。最悪は `recipe_feast_hamper` の 240分 → 実際728分）。
 *
 * ⚠ **ここに置いてあるのは、幅を測るため**（`upcomingLabel` と同じ理由）。
 *   ⚠ **言い回しは PO の領分（#79）。**
 */
export function craftTimeLabel(minutes: number): string {
  return `${minutes}分`
}

/**
 * レシピが1本開いたときの知らせ（#111。**1レシピ単位**）。
 *
 * ⚠ **語を増やしていない**（#79）。系統単位だった頃の
 *   `食料（tier2）の作り方が分かった（13種）` から、**系統の名と本数を落としただけ。**
 *   開くのが1本ずつになったので、**まとめ方を表す語がもう要らない。**
 */
export function recipeUnlockedText(itemName: string): string {
  return `${itemName}の作り方が分かった`
}

// ─── 納品の帯（#28） ──────────────────────────────────
/**
 * いま受けている注文を**1行**で出す帯。**盤面の下端とメッセージ欄の上端のあいだ。**
 *
 * ⚠ **右パネルには置けない。**HUD の枠は y12〜165 で、そのすぐ下（178.5〜576）がキャラ絵の枠、
 *   さらに下はボタン列（589.5〜889.5）で埋まっている。**1行ぶんの隙間が無い。**
 * ⚠ **上へ広げないこと。**盤面はいちばん広いとき（13×10）下地が y885 まで来る
 *   （`GRID_ORIGIN_Y + 10 * CELL_SIZE + 3`）。広げると盤面と重なる。
 * ⚠ **右は `STRIP_L` まで。**そこから先はキャラ帯（1470〜1635）。
 */
export const ORDER_BAR_T = GRID_ORIGIN_Y + 10 * CELL_SIZE + 3
export const ORDER_BAR_B = LOG_T - 3
export const ORDER_BAR_L = GRID_ORIGIN_X
export const ORDER_BAR_R = STRIP_L - 6
export const ORDER_BAR_W = ORDER_BAR_R - ORDER_BAR_L
export const ORDER_BAR_H = ORDER_BAR_B - ORDER_BAR_T
export const ORDER_BAR_CY = (ORDER_BAR_T + ORDER_BAR_B) / 2
/** 帯の内側の余白 */
export const ORDER_BAR_PAD = 15
/**
 * 帯の文字に使える幅。
 *
 * ⚠ **`レン` は全角2文字。**金額を出す場所なので、`OrderBar.test.ts` が
 *   **注文に出うる全品の最悪値**を `estTextWidth` で測っている。
 */
export const ORDER_TEXT_MAX_W = ORDER_BAR_W - ORDER_BAR_PAD * 2
/** 帯の文字の大きさ。⚠ 帯の高さが 27px しかないので、これ以上大きくしない */
export const ORDER_BAR_FONT_PX = 18

// ─── できごとのウィンドウ（#24） ──────────────────────────
/**
 * 選択肢のあるできごとを出す窓（#24）。
 *
 * ⚠ **`PlaceFrame`（行く場所）にしないこと。**あれは**棚を消してから**出る器で、
 *   中央の領域がまるごと入れ替わる。**選択肢1つ出すために店の風景を消さない。**
 *   先例は `MessageLog` の遡り —— 同じ理由で「行く場所」にしなかった。
 *
 * ⚠ **納品の帯（#28）とメッセージ欄に被せない。**帯はいま受けている注文で、
 *   **選ぶ材料になる**（「見る」かどうかは何が要るかで決まる）。
 * ⚠ **キャラ帯（1470〜1635）を覆わない。**`PlaceFrame` は帯を隠してからその領域まで使うが、
 *   こちらは**隠さない**ので、覆うと店番と来店客が窓に切られる。
 *   ⚠ **話し手の絵はいずれあの帯に入る**（#21・#15）。覆うと絵が見えない窓になる。
 * ⚠ **盤面には重なる。**消さずに重ねる、が #24 の線引き。
 *
 * ## 置き場所（PO 2026-09-14「なんか前に出てる感ないよね。ダイアログにして」）
 *
 * ⚠ **画面の中央。**この作りのダイアログは**全画面の暗幕 ＋ 画面中央の面**で、
 *   **`Tutorial` と `SaveLoadMenu` の2つがどちらもその形**である。**3つ目の形を作らない。**
 *
 * ⚠ **以前の「納品の帯と中心をそろえる」は捨てた**（PO 2026-09-13 の規則）。
 *   **あれは窓が帯のすぐ上にあったときの話**で、**画面の中央へ出すならそろえる相手は帯ではない。**
 *   ⚠ **「被らない」ほうは全部そのまま成り立っている**（下の実測）。捨てたのは「そろえる相手」だけ。
 *
 * ⚠ **暗幕は「消す」ではなく「沈める」。**#24 の既決2（**棚を消さない**）は生きている ——
 *   `PlaceFrame` は棚を `destroy()` してから中央を入れ替えるが、**こちらは後ろが見えている。**
 */
/**
 * 窓の幅。
 *
 * ⚠ **広げるなら、何が入らなかったのかを書くこと。**ここは
 *   **選択肢3つぶん（165×3 ＋ 隙間）＋内側の余白**でできていて、
 *   **それより1つぶん以上広いと `layout.test.ts` が落ちる**（PO 2026-09-13「余白が多すぎる」）。
 */
export const MSG_WIN_W = 660
/**
 * 窓の高さ。**中身（話し手1行・本文・ボタン1行）ぶんしか無い。**
 *
 * ⚠ **`MSG_LINES_MAX` と一緒に見ること。**入る行数はここから導いていて、
 *   **いまは1行。2行のできごとを足すと `layout.test.ts` が落ちる** ——
 *   落ちたら、ここを `MSG_LINE_H` ぶん（33px）上げる。
 *   **黙って余らせておかない**（PO 2026-09-13「余白が多すぎる」）。
 */
export const MSG_WIN_H = 180
/** ⚠ **画面の中央。**`Tutorial` `SaveLoadMenu` と同じ中心（上の注記） */
export const MSG_WIN_CX = SCREEN_W / 2
export const MSG_WIN_CY = SCREEN_H / 2
export const MSG_WIN_L = MSG_WIN_CX - MSG_WIN_W / 2
export const MSG_WIN_R = MSG_WIN_CX + MSG_WIN_W / 2
export const MSG_WIN_T = MSG_WIN_CY - MSG_WIN_H / 2
export const MSG_WIN_B = MSG_WIN_CY + MSG_WIN_H / 2
/** 窓の内側の余白 */
export const MSG_WIN_PAD = 21
/** 本文と名前に使える幅 */
export const MSG_TEXT_MAX_W = MSG_WIN_W - MSG_WIN_PAD * 2

/** 話し手の名前の行。⚠ **名前だけ出す**（絵は #21・#15 で後から入る） */
export const MSG_SPEAKER_FONT_PX = 24
export const MSG_SPEAKER_Y = MSG_WIN_T + MSG_WIN_PAD

/** 本文。**1行ずつ置く**（自動で折り返さない ＝ node のテストから測れる） */
export const MSG_TEXT_FONT_PX = 24
export const MSG_LINE_H = 33
export const MSG_TEXT_TOP = MSG_SPEAKER_Y + 39

/** 選択肢のボタン。**窓の下端に1行で並べる** */
export const MSG_CHOICE_W = 165
export const MSG_CHOICE_H = 45
export const MSG_CHOICE_GAP = 18
export const MSG_CHOICE_FONT_PX = 22.5
export const MSG_CHOICE_CY = MSG_WIN_B - MSG_WIN_PAD - MSG_CHOICE_H / 2

/**
 * 本文に使える行数。**選択肢のボタンに食い込まない範囲。**
 *
 * ⚠ **決め打ちにしないこと。**窓の高さやボタンの高さを動かしたときに、
 *   本文がボタンへ食い込んだことに**気づけなくなる**（`CHAR_ART_B` と同じ直し）。
 */
export const MSG_LINES_MAX = Math.max(
  0,
  Math.floor((MSG_CHOICE_CY - MSG_CHOICE_H / 2 - 12 - MSG_TEXT_TOP) / MSG_LINE_H),
)

/**
 * 選択肢 `count` 個を1行に並べたときの、`index` 番目のボタンの中心 x。
 *
 * ⚠ **中央ぞろえ。**左詰めにすると、選択肢の数で「はい」の位置が動く。
 */
export function msgChoiceCx(index: number, count: number): number {
  const total = count * MSG_CHOICE_W + (count - 1) * MSG_CHOICE_GAP
  return MSG_WIN_CX - total / 2 + MSG_CHOICE_W / 2 + index * (MSG_CHOICE_W + MSG_CHOICE_GAP)
}

// ─── 確認のダイアログ（セーブの上書き／ロード ＋ 納品の `廃棄`） ──────────
/**
 * **戻らない操作の前に出す確認。**
 *
 * ⚠ **4つ目の形を作らないこと。**この作りのダイアログは
 *   **`Tutorial` ／ `SaveLoadMenu` ／ できごとの窓**の3つで、どれも
 *   **全画面の暗幕（`palette.ts` の `SCRIM_ALPHA`）＋ 画面中央の不透明な面**である。
 *   **`ConfirmDialog` はその形をそのまま使う**（色も `SaveLoadMenu` と同じ）。
 *
 * ⚠ **大きさは `SaveLoadMenu` の確認から移したもの**（PO 指示 2026-09-13「大きすぎる」で
 *   枠の一覧 720×465 から切り離した値）。**写しを作らず、両方がここを読む。**
 */
export const CONFIRM_MW = 540
export const CONFIRM_MH = 225
/** 確認のボタン。**2つ並べて面に収まる幅** */
export const CONFIRM_BTN_W = 195
export const CONFIRM_BTN_H = 54
export const CONFIRM_BTN_GAP = 30
export const CONFIRM_BTN_FONT_PX = 21
/** ボタンの列の中心 y。**面の下端から 45px** */
export const CONFIRM_BTN_CY = MSG_WIN_CY + CONFIRM_MH / 2 - 45
/** 本文の1行目の中心 y。⚠ **行の高さは窓と同じ `MSG_LINE_H`**（別の刻みを作らない） */
export const CONFIRM_TEXT_TOP = MSG_WIN_CY - CONFIRM_MH / 2 + 45
/** 本文に使える幅。⚠ **内側の余白は窓と同じ `MSG_WIN_PAD`** */
export const CONFIRM_TEXT_MAX_W = CONFIRM_MW - MSG_WIN_PAD * 2
/**
 * 本文に使える行数。**ボタンの列に食い込まない範囲。**
 *
 * ⚠ **決め打ちにしないこと**（`MSG_LINES_MAX` と同じ直し）。
 */
export const CONFIRM_LINES_MAX = Math.max(
  0,
  Math.floor((CONFIRM_BTN_CY - CONFIRM_BTN_H / 2 - 12 - CONFIRM_TEXT_TOP) / MSG_LINE_H),
)
/**
 * 「やめる」側の字。⚠ **`SaveLoadMenu` の確認と同じ語**（同じ役目を2つの語で呼ばない）。
 *   あちらは**ソースを縛るテスト**が直書きを見ているので、字はそのまま置いてある。
 */
export const CONFIRM_CANCEL_LABEL = 'やめる'

/** 確認のボタン `count` 個を1行に並べたときの、`index` 番目の中心 x */
export function confirmBtnCx(index: number, count: number): number {
  const total = count * CONFIRM_BTN_W + (count - 1) * CONFIRM_BTN_GAP
  return MSG_WIN_CX - total / 2 + CONFIRM_BTN_W / 2 + index * (CONFIRM_BTN_W + CONFIRM_BTN_GAP)
}

// ─── 遊び方の案内（`Tutorial`） ────────────────────────────────
/**
 * 初回に出す案内。**画面中央の面に、見出し・本文・`N / M`・ボタンの4つ。**
 *
 * ⚠ **できごとの窓（`MSG_*`）とは別の面**なので、字も別に持つ。
 */
export const TUTORIAL_TITLE_FONT_PX = 36
export const TUTORIAL_BODY_FONT_PX = 24
export const TUTORIAL_STEP_FONT_PX = 19.5
export const TUTORIAL_BTN_FONT_PX = 30
/**
 * 猫（ネム）が指す1行（#20）。⚠ **ノエラの行より小さく、弱い色で出す。**
 *   **説明をするのはノエラのほう**で、猫は「そこ」と指すだけ。
 */
export const TUTORIAL_NEM_FONT_PX = 21
/** 面の大きさ。⚠ **字がここに収まるかを `layout.test.ts` が見ている** */
export const TUTORIAL_PANEL_W = 720
export const TUTORIAL_PANEL_H = 420

// ─── タイトル画面（`TitleScene`） ──────────────────────────────
/**
 * 遊び始める前の1枚（#114）。**題名・はじめる・つづきから の3つだけ。**
 *
 * ⚠ **題名の正はここ1つ。**`index.html` の `<title>` も同じ文字にすること
 *   （あちらは HTML なので写しになる。**変えるときは両方**）。
 */
export const GAME_TITLE = 'ペルラ号の店開き'
export const TITLE_NAME_FONT_PX = 90
export const TITLE_NAME_Y = 246
/** 題名の下に置く主人公の顔絵。**252×370 をそのまま出す**ので、拡縮はしない */
export const TITLE_FACE_CY = 585
/** ボタン2つ。⚠ **顔絵の下端（585 + 185 = 770）より下に置くこと** */
export const TITLE_BTN_W = 372
export const TITLE_BTN_H = 72
export const TITLE_BTN_FONT_PX = 33
export const TITLE_BTN_NEW_Y = 846
export const TITLE_BTN_CONTINUE_Y = 948
export const TITLE_BTN_NEW_LABEL = 'はじめる'
export const TITLE_BTN_CONTINUE_LABEL = 'つづきから'

// ─── はじまりの場面（`OpeningScene`） ──────────────────────────
/**
 * 遊び始める前の語り（#6）。**叔母から舟を受け取って、最初の島へ出るまで。**
 *
 * ⚠ **「つづきから」では出さない。**出るのは **「はじめる」を押したときだけ。**
 * ⚠ **左に顔絵、右に文。**顔絵は 252×370 をそのまま出す（拡縮すると輪郭がぼやける）。
 * ⚠ **文は自分で `\n` を入れている。**Phaser は勝手に折り返さないので、
 *   **`OPENING_TEXT_W` に収まるか**を `layout.test.ts` が見ている。
 */
export const OPENING_FACE_CX = 620
export const OPENING_FACE_CY = 480
export const OPENING_TEXT_L = 840
export const OPENING_TEXT_CY = 480
export const OPENING_TEXT_FONT_PX = 30
export const OPENING_TEXT_W = 900
export const OPENING_STEP_FONT_PX = 19.5
export const OPENING_STEP_Y = 810
/** 押しどころ。⚠ **顔絵の下**（`OPENING_FACE_CY + 370/2 = 665`）に置くこと */
export const OPENING_BTN_CX = 960
export const OPENING_BTN_Y = 900
export const OPENING_BTN_W = 300
export const OPENING_BTN_H = 72
export const OPENING_BTN_FONT_PX = 30
/** ⚠ **飛ばせるようにする。**2周目に同じ語りを読ませない（右上・小さく） */
export const OPENING_SKIP_CX = 1740
export const OPENING_SKIP_Y = 66
export const OPENING_SKIP_FONT_PX = 21


// ─── セーブ／ロードの画面 ──────────────────────────────────────
/**
 * ⚠ **確認の面のボタンの字は `CONFIRM_BTN_FONT_PX`**（`ConfirmDialog` と同じ面を使うため）。
 *   ここに置くのは**枠の一覧の側**と、**確認の見出し**の字だけ。
 */
export const SAVELOAD_TITLE_FONT_PX = 30
/** 枠の1行目（`スロット N`）。**太字** */
export const SAVELOAD_SLOT_FONT_PX = 18
/** 枠の2行目（記録の中身、または `--- 空スロット ---`） */
export const SAVELOAD_INFO_FONT_PX = 18
/** 確認の面の見出し1行。⚠ **記録の中身は出さない**（PO 指示 2026-09-14） */
export const SAVELOAD_CONFIRM_FONT_PX = 24

// ─── オプション ───────────────────────────────────────────────
/**
 * **⚙️ から開く設定の面**（`OptionsMenu`。#113）。
 *
 * ⚠ **形は `SaveLoadMenu` と同じ** —— **全画面の暗幕 ＋ 画面中央の不透明な面**。
 *   **5つ目の形を作らない**（`MessageWindow` の注記）。
 * ⚠ **高さは中身から出す**（`optionsLayout`）。**直値で置かないこと** ——
 *   **項目を足したとき、増えたぶんがボタンに重なったまま気付けない。**
 * ⚠ **送り（ページ）も巻き取り（スクロール）も無い。**面が伸びて画面に収まらなくなったら
 *   `layout.test.ts` が落ちる。**そのときに送りを入れるかを決める。**
 */
export const OPTIONS_MW = 720
/** 見出し（`オプション`）が入るぶん。面の上端から1つ目の中身の上端まで */
export const OPTIONS_HEAD_H = 84
/** 「閉じる」のボタンが入るぶん。最後の中身の下端から面の下端まで */
export const OPTIONS_FOOT_H = 96
/** 区分の見出し1行ぶん */
export const OPTIONS_SECTION_H = 42
export const OPTIONS_ROW_H = 60
/** 中身どうしの間 */
export const OPTIONS_GAP = 12
/** 面の左右の余白（行の幅はこのぶん内側） */
export const OPTIONS_PAD = 30
export const OPTIONS_ROW_W = OPTIONS_MW - OPTIONS_PAD * 2
/** 行の中の左右の余白（字とつまみが端に張り付かないぶん） */
export const OPTIONS_ROW_PAD = 21

export const OPTIONS_TITLE_FONT_PX = 30
export const OPTIONS_SECTION_FONT_PX = 21
export const OPTIONS_ROW_FONT_PX = 21

/**
 * **入／切のつまみ**（PO 指示 2026-09-15「トグル形式に」）。
 * ⚠ **字は出さない。**溝の中をつまみが**左（切）／右（入）**へ動き、色が変わる。
 */
export const OPTIONS_TOGGLE_W = 84
export const OPTIONS_TOGGLE_H = 36
/** つまみの丸。⚠ **溝の高さより小さいこと**（縁が見えないと動きが読めない） */
export const OPTIONS_KNOB_R = 13.5

export const OPTIONS_TITLE = 'オプション'
export const OPTIONS_CLOSE_LABEL = '閉じる'

/** つまみの中心 x（溝の中心 `x` から見て）。**切は左、入は右** */
export function optionsKnobDx(on: boolean): number {
  const half = OPTIONS_TOGGLE_W / 2 - OPTIONS_TOGGLE_H / 2
  return on ? half : -half
}

/** 面に積むものの種類。⚠ **高さが違うので、数だけでは位置が出ない** */
export type OptionsItemKind = 'section' | 'row'

/**
 * 面の高さと、**中身それぞれの中心 y**（面の上端からの距離）を出す。
 *
 * ⚠ **`optionSections()` の中身をそのまま積んだ並びを渡すこと。**
 *   画面側で足し引きすると、**描く位置と測る位置がずれる。**
 */
export function optionsLayout(kinds: readonly OptionsItemKind[]): {
  panelH: number; cys: readonly number[]
} {
  const cys: number[] = []
  let y = OPTIONS_HEAD_H
  kinds.forEach((kind, i) => {
    const h = kind === 'section' ? OPTIONS_SECTION_H : OPTIONS_ROW_H
    if (i > 0) y += OPTIONS_GAP
    cys.push(y + h / 2)
    y += h
  })
  return { panelH: y + OPTIONS_FOOT_H, cys }
}

/** 「閉じる」の中心 y（`cy` は面の中心） */
export function optionsCloseCy(cy: number, panelH: number): number {
  return cy + panelH / 2 - 45
}

/** 行の字の左端（`cx` は面の中心） */
export function optionsLabelL(cx: number): number {
  return cx - OPTIONS_ROW_W / 2 + OPTIONS_ROW_PAD
}

/** 区分の見出しの左端。⚠ **行より外側**（くくっているものだと分かるように） */
export function optionsSectionL(cx: number): number {
  return cx - OPTIONS_ROW_W / 2
}

/** つまみの中心 x。**行の右端に寄せる** */
export function optionsToggleCx(cx: number): number {
  return cx + OPTIONS_ROW_W / 2 - OPTIONS_ROW_PAD - OPTIONS_TOGGLE_W / 2
}

/** 行の字が使える幅（つまみにぶつからない上限） */
export const OPTIONS_LABEL_MAX_W =
  OPTIONS_ROW_W - OPTIONS_ROW_PAD * 2 - OPTIONS_TOGGLE_W - 12


// ─── 幕（目標達成） ───────────────────────────────────────────
/**
 * **画面ぜんぶを覆う幕**（`GameScene.showGoalComplete()`）。
 *
 * ⚠ **幕は1つだけになった**（2026-09-15）。**GAME OVER の幕を外した**ので、
 *   **残っているのは商船を買ったときのエンディングだけ。**
 */
export const GOAL_TITLE_FONT_PX = 78
export const GOAL_LINE_FONT_PX = 39
/** 幕を閉じるボタン */
export const GOAL_BTN_FONT_PX = 33
/**
 * 幕を閉じるボタンの字（#97）。**閉じればそのまま遊べる。**
 *
 * ⚠ **`エンドレスモードへ` は消した**（決定 2026-09-15）。**買わないことがそのままエンドレス**なので、
 *   幕の上で選ばせるものが無くなった。
 * ⚠ **文言は PO が指示するもの。いまのは仮。**
 */
export const GOAL_CLOSE_LABEL = '続ける'
// ⚠ **`GAMEOVER_TITLE_FONT_PX` / `GAMEOVER_LINE_FONT_PX` は 2026-09-15 に消した。**
//   **GAME OVER の幕そのものが無くなった**（`GameScene.showGameOver()` ごと）ので、
//   **読み手が1人もいない定数になった。**→ 計画 `rescue-and-no-gameover.md`

// ─── 確認用の表示（`DebugTools`） ──────────────────────────────
/** 押せるキーの一覧。⚠ **ログ欄にかからない位置に置く** */
export const DEBUG_KEYS_FONT_PX = 15
