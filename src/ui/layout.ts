/**
 * 画面の区画。**Phaser を読まない**ので、寸法だけを単体テストから見られる。
 *
 * ⚠ **区画の値をここ以外に書かないこと。**写しを持つと、片方を動かしても
 *   もう片方が気づかず、**重なっていることをテストが見逃す**（受入条件2）。
 */

/**
 * ⚠ **実行時の import は1つも無い**（上のとおり Phaser を読まないため）。
 *   下の1行は**型だけ**で、コンパイルで消える。
 */
import type { UpgradeKind } from '../components/progress/Upgrades.js'

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

// ─── 盤面（売り場） ──────────────────────────────────────────
/** 1升の大きさ。13×10 の最終盤面から逆算: min(floor(760/13), floor(610/10)) = 58 */
export const CELL_SIZE = 58
/** 盤面の左上。左パネルの右端から 8px、画面の上端から 8px */
export const GRID_ORIGIN_X = LEFT_PANEL_R + 8
export const GRID_ORIGIN_Y = 8

/**
 * 画面の外周のうち、ここで離すと**棚から下ろす**帯の幅。
 *
 * ⚠ **上端の帯（y 0〜56）は盤面の1行目（y 8〜66）に食い込む。**
 *   1行目の **82%** が帯の中に入るので、**盤面をくり抜かないと
 *   「一番上の行へ動かそうとすると棚から外れる」**（`rects.ts` / `subtractRect`）。
 */
export const DISCARD_MARGIN = 56

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

/** 見出しと、店に戻る印（🏠）の行 */
export const TITLE_Y = PLACE_T + 28
/** 見出しの下の1行（所持金など、場所ごとの但し書き） */
export const SUBTITLE_Y = PLACE_T + 56
/** 絞り込みの行 */
export const FILTER_Y = PLACE_T + 84
/**
 * 絞り込みの行の右端に置く「名前で探す」欄（#55）。**仕入れと工房で同じ大きさ。**
 *
 * ⚠ **`PurchaseMenu.ts` / `CraftMenu.ts` に写しを置かないこと。**
 *   以前は両方が 160×24 を自前で持っていて、**画面に出る実寸は 150×18 だった**
 *   （`index.html` の `box-sizing: border-box` と `createInput` の食い違い。2026-09-13）。
 *   **`layout.test.ts` が枠からはみ出さないことを見るには、出どころが1つで要る。**
 */
export const LIST_SEARCH_W = 160
export const LIST_SEARCH_H = 24
/** 一覧の上端（ここから下へ1行ずつ積む） */
export const ROWS_TOP = PLACE_T + 104
/** ページ送りの行 */
export const PAGER_Y = PLACE_B - 22
/** 一覧に使える下端。ページ送りの行に食い込まない */
export const ROWS_BOTTOM = PAGER_Y - 18

/** 見出しの下に引く横線。`PlaceFrame` が引く。⚠ **ここより上へ物を置かない** */
export const TITLE_RULE_Y = TITLE_Y + 20
/** 絞り込みの行でいちばん高いもの（検索の入力欄）の高さ */
export const FILTER_BAND_H = 24
/** 横線と、その下に置くものとのあいだに残す余白 */
const RULE_GAP = 6

/**
 * 見出しの下の1行が**無い**場所の、絞り込みの行と一覧の上端。
 *
 * ⚠ **工房だけ、見出しの下に置くものが無い**（他の3つは所持金が入る）。
 *   説明文を消した跡が**空白の帯として残る**ので、上へ詰める（束M・PO 判断）。
 * ⚠ **28px まるごと詰めないこと。**`SUBTITLE_Y`(62) まで上げると、
 *   **検索の入力欄（高さ24）が y50〜74 になり、横線(54) を跨いで
 *   店に戻る印のボタン（下端49）に1pxまで近づく。**実際に「壊れて見える」と指摘が出た。
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
export const TITLE_FONT_PX = 24
/**
 * **店に戻る印（🏠）のボタンの幅**。**見出しの行の右端に置く**。
 *
 * ⚠ **字を入れない**（PO 指示 2026-09-13。「店に戻る」は不要・家マークに）。
 *   印だけなので**正方形に近い**。120 だった頃の余白は**タブの取り分**になる
 *   （`layout.test.ts` の「タブは店に戻る印に届かない」）。
 */
export const BACK_BTN_W = 40

/**
 * 「取引」の中の3タブ（#96）。**`商人` → `改装` → `納品`**（#96 本文の順）。
 *
 * ⚠ **見出しと同じ行に置く。**下に1行足すと、その28px ぶん一覧の上端が下がり、
 *   仕入れの行（56px）が **8行 → 7行** に減る。**タブを足すために品が1つ見えなくなる**のは割に合わない。
 * ⚠ **見出し（左）と店に戻る印（右）のあいだに収まること**（`layout.test.ts` が見ている）。
 * ⚠ **文言は #96 本文の語をそのまま使う。**言い回しを発明しない（#79）。
 */
export const TRADE_TITLE = '取引'
export const TRADE_TABS = ['商人', '改装', '納品'] as const
export type TradeTabName = typeof TRADE_TABS[number]

export const TAB_W = 84
export const TAB_H = 26
export const TAB_GAP = 6
export const TAB_FONT_PX = 14

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
export const TAB_ROW_TITLE_FONT_PX = 15
/** 行の補足（何品に要る ／ 改装の説明 ／ 納品の手持ち・報酬） */
export const TAB_ROW_SUB_FONT_PX = 12
/** 見出しの下の1行（所持金 …） */
export const TAB_SUBTITLE_FONT_PX = 15
/** 見出しの下の行の、右に出る注記 */
export const TAB_NOTE_FONT_PX = 12

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
 * 右パネル（HUD）の枠。**190px の右パネルから左右の余白 8px ずつを引いたもの。**
 *
 * ⚠ **広げないこと。**右パネルにはこの下にボタン列が並んでいる。
 */
export const HUD_PANEL_W = SCREEN_W - RIGHT_PANEL_L - 16

/**
 * 所持金の文字の大きさ。**22 から下げた**（束M）。
 *
 * ⚠ `¥10,000,000` の頃は 22px でも収まっていたが、`10,000,000レン` は
 *   全角2文字ぶん増えて **183.2px** になり、枠 174px からはみ出した。
 * ⚠ **これ以上下げないこと。**所持金は右パネルの主要な情報である。
 *   収まるかは `layout.test.ts` が見ている。
 */
export const HUD_MONEY_FONT_PX = 20

/**
 * 目標の進みのバーの幅。**右パネルの枠から左右 12px ずつ引いたもの。**
 *
 * ⚠ **`HUD.ts` と `layout.test.ts` の両方が使う。**以前は `HUD.ts` に式が直書きで、
 *   ここに置くものが収まるかを node のテストから測れなかった。
 */
export const HUD_BAR_W = HUD_PANEL_W - 24

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
 * その文字の大きさ。⚠ **現在地（13px）と並べて枠に収まること**（`layout.test.ts` が見ている）。
 */
export const HUD_NEXT_PORT_FONT_PX = 11

/**
 * 次の寄港地を選ぶところの高さ。**押せる的の高さ**でもある。
 *
 * ⚠ **バーの行と「目標 N%」の行、2行ぶんを使う。**片方だけだと的が 11px しかなく、押しにくい。
 *   ⚠ **枠（右パネルの HUD）は広げない。**広げるとキャラ絵の枠（`CHAR_ART_T`）が下がる。
 */
export const HUD_NEXT_PORT_H = 18

/**
 * 仕入れの行の右端 ——「**総額**」と「**買う**」の2つぶんの幅（**footprint**）。
 *
 * ⚠ **1つのボタンではない**（PO 指示 2026-09-13「『総額』部分と『買う』部分は分ける」）。
 *   **総額はボタンの外の文字**で、ボタンは `買う` とだけ書いてある。
 * ⚠ **`118 → 138` に広げてある。**総額（11px で最悪 78.7px）とボタン（52px）は
 *   **118px には並ばない。**広げたぶんは左の「最大」「＋」「−」が寄る
 *   （列の並びは下の `ROW_*`）。
 * ⚠ **これ以上広げないこと。**広げると `⚠ 切らしている（N品に要る）` が品名に重なる
 *   （`layout.test.ts` が産地つきのいちばん長い品名で見ている）。
 */
export const BUY_BTN_W = 52
/** 総額を置く幅。**右そろえ。**⚠ 7桁（`3,237,759レン`）が `BUY_TOTAL_FONT_PX` で収まること */
export const BUY_TOTAL_W = 80
/** 総額とボタンのあいだ。**離すこと自体が指摘の中身**なので詰めない */
export const BUY_GAP = 6
/** 総額とボタンを合わせた幅。**「もうすぐ買える」の1行はこの幅に収める**（#66） */
export const BUY_W = BUY_TOTAL_W + BUY_GAP + BUY_BTN_W

/**
 * 総額の文字の大きさ。**ボタン（12px）より小さい。**
 *
 * ⚠ **ボタンではないので、隣のボタンと揃える必要が無い**（`INFO_FONT_PX` と同じ理由）。
 *   12px にすると7桁の総額が **85.9px** になり、`BUY_TOTAL_W`（80）から出る。
 */
export const BUY_TOTAL_FONT_PX = 11

/**
 * 「買う」ボタンの文字の大きさ。**13 から下げた**（束M）。
 *
 * ⚠ `¥123,456 で買う` の頃は 13px で 105.2px だったが、`123,456レン で買う` は
 *   **122.9px** になり、118px のボタンから 5px はみ出した。
 * ⚠ **これ以上下げないこと。**隣の「最大」「＋」「−」が 12px なので、
 *   主たるボタンだけ小さいのはおかしい。
 *   **下げる代わりに助詞の「で」を落とし**、**のちに金額そのものをボタンの外へ出した**（`BUY_LABEL`）。
 */
export const BUY_FONT_PX = 12

/**
 * 「買う」ボタンの字。**金額はもう入っていない**（PO 指示 2026-09-13「総額と買うは分ける」）。
 *
 * ⚠ **「買う」という語は落とさないこと。**落とすとボタンが何をするか読めなくなる。
 * ⚠ **総額を足さないこと。**分けたのがこの直しの中身で、
 *   足すと `BUY_BTN_W`（52px）から出る。総額は `BUY_TOTAL_W` の側に置く。
 */
export const BUY_LABEL = '買う'

/**
 * **買えないとき**にボタンの字と差し替える、短い理由。
 *
 * ⚠ **`BUY_BTN_W`（52px）に収まること**（`layout.test.ts` が見ている）。
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
 * ⚠ **`BUY_TOTAL_W`（80px）に収まること**（`layout.test.ts` が見ている）。
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
export const INFO_MAX_W = 160
export const INFO_FONT_PX = 11

// ─── 仕入れの行の列 ────────────────────────────────────────────
/**
 * 1行の中の列。**右端から順に決める。**こうしておくと領域の幅が変わっても、
 * 操作の列が品名に食い込まない。
 *
 * ⚠ **ここにしか置かないこと。**以前は `PurchaseMenu.ts` が式を持ち、
 *   `layout.test.ts` が**同じ式を書き写して**追っていた。
 *   **写しがあると、片方だけ動かしても重なりをテストが見逃す。**
 */
export const ROW_INPUT_W = 52
export const ROW_INPUT_H = 22
export const ROW_STEP_W = 26
export const ROW_MAX_W = 40
/** 品名の左端 */
export const ROW_NAME_X = CONTENT_L + 16
/** 「買う」ボタンの左端 */
export const ROW_BUY_BTN_L = CONTENT_R - 8 - BUY_BTN_W
/** 総額の右端（右そろえ） */
export const ROW_TOTAL_R = ROW_BUY_BTN_L - BUY_GAP
/** 総額とボタンを合わせた footprint の左端。**「もうすぐ買える」の1行もここから置く** */
export const ROW_BUY_L = ROW_TOTAL_R - BUY_TOTAL_W
export const ROW_MAX_L = ROW_BUY_L - 6 - ROW_MAX_W
export const ROW_PLUS_L = ROW_MAX_L - 6 - ROW_STEP_W
export const ROW_INPUT_L = ROW_PLUS_L - 4 - ROW_INPUT_W
export const ROW_MINUS_L = ROW_INPUT_L - 4 - ROW_STEP_W
/** 「51レン/個　在庫 100/999」の右端（右そろえ） */
export const ROW_INFO_R = ROW_MINUS_L - 14
/** 「N品に要る」の右端（右そろえ）。⚠ **間隔は `INFO_MAX_W`** */
export const ROW_NEED_R = ROW_INFO_R - INFO_MAX_W

// ─── 改装タブの行 ──────────────────────────────────────────────
/**
 * 改装タブ（`UpgradeMenu`）の1行。**以前は `UpgradeMenu.ts` が直値で持っていた。**
 *
 * ⚠ **こちらへ移したのは、`費用` と `改装` ボタンが別の部品になったから**
 *   （PO 指示 2026-09-13「`32,000レン 不足` → 金額と `改装` ボタンに分ける」）。
 *   **2つの部品が隣り合うと、重なりは目視では数px単位でしか出ない。**
 *   `layout.test.ts` が見られるように、寸法をここへ集めてある。
 */
export const UPGRADE_ROW_H = 100
export const UPGRADE_ROW_W = CONTENT_R - CONTENT_L
/** 系統名（`棚`）と、その下の説明の左端 */
export const UPGRADE_NAME_X = CONTENT_L + 28
/** 行の中心からの上下。上が系統名、下が説明 */
export const UPGRADE_TITLE_DY = -20
export const UPGRADE_SUB_DY = 10

/** 段の `●○` の中心と、その文字の大きさ */
export const UPGRADE_STAGE_CX = PLACE_CX + 40
export const UPGRADE_STAGE_FONT_PX = 20
/**
 * `●○` が占める幅。⚠ **段数（`Upgrades.MAX_STAGE`）ぶんの丸が入ること。**
 *   段数を増やしたらここも広げる。**食い違えば `layout.test.ts` が落ちる**
 *   （`MAX_STAGE` をあちらから読んで測っている）。
 * ⚠ **`layout.ts` は実行時に何も import しない**ので、段数をここから読みには行かない。
 */
export const UPGRADE_STAGE_W = 100
export const UPGRADE_STAGE_L = UPGRADE_STAGE_CX - UPGRADE_STAGE_W / 2

/**
 * 説明の1行（`売り場が広がる　6×5 → 7×6`）に使える幅。
 *
 * ⚠ **`●○` に食い込ませないこと。**食い込むと、いちばん見たい「前 → 後」が丸に重なる。
 */
export const UPGRADE_SUB_MAX_W = UPGRADE_STAGE_L - UPGRADE_NAME_X - 12

/**
 * 行の右端 ——「**費用**」と「**改装**」の2つ。
 *
 * ⚠ **1つのボタンではない**（PO 指示 2026-09-13）。**費用はボタンの外の文字**で、
 *   ボタンは `改装` とだけ書いてある。**商人タブの「総額 ＋ 買う」と同じ作り。**
 *   **隣り合う2タブで作りが違うと、同じ操作に見えない。**
 */
export const UPGRADE_BTN_W = 64
export const UPGRADE_BTN_H = 30
/** ボタンの右端。**行の右の余白は 28px**（`UPGRADE_NAME_X` の左の余白と揃えてある） */
export const UPGRADE_BTN_R = CONTENT_R - 28
export const UPGRADE_BTN_L = UPGRADE_BTN_R - UPGRADE_BTN_W
/** 費用とボタンのあいだ。**離すこと自体が指摘の中身**なので詰めない */
export const UPGRADE_GAP = 10
/** 費用の右端（右そろえ）と、そこから左へ取る幅 */
export const UPGRADE_COST_R = UPGRADE_BTN_L - UPGRADE_GAP
/**
 * ⚠ **いちばん高い段（`400,000レン`）で 86.5px。**84 では**はみ出していた**（実測 2026-09-13）。
 *   ここを縮めるときは `layout.test.ts` の検査を通すこと。
 */
export const UPGRADE_COST_W = 92
export const UPGRADE_COST_L = UPGRADE_COST_R - UPGRADE_COST_W
/**
 * 費用の文字の大きさ。⚠ **ボタンではないので、ボタンと揃える必要がない**
 *   （商人タブの `BUY_TOTAL_FONT_PX` と同じ理由）。
 *   ⚠ いちばん高い段（`400,000レン`）が `UPGRADE_COST_W` に収まること。
 */
export const UPGRADE_COST_FONT_PX = 14

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
 * 説明の1行。**一言のうしろに「前 → 後」を付ける**（PO 指示 2026-09-13）。
 * 最大まで買っていれば（`delta` が `null`）一言だけ。
 *
 * ⚠ **数は `Upgrades.effectDeltaLabel` が作る。**ここは繋ぐだけで、**自分の数を持たない。**
 */
export function upgradeSubLine(kind: UpgradeKind, delta: string | null): string {
  return delta === null ? UPGRADE_WHAT_IT_DOES[kind] : `${UPGRADE_WHAT_IT_DOES[kind]}　${delta}`
}

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
export const DELIVERY_HEAD_Y = ROWS_TOP + 10
export const DELIVERY_HEAD_FONT_PX = 12
/** 1件目の行の上端。⚠ **見出しの行と重ならないこと**（`layout.test.ts` が見ている） */
export const DELIVERY_ROWS_TOP = ROWS_TOP + 30
/**
 * 1行の高さ。
 *
 * ⚠ **`MISSION_CAP`（10件）が全部入ること。**入らないと**下の行に手が届かない** ——
 *   商人タブと違い、**この表にはページ送りが無い**（10件で打ち止めなので要らない）。
 *   `layout.test.ts` が `rowsThatFit` で見ている。
 */
export const DELIVERY_ROW_H = 40

/**
 * ⚠ **左から順に決める。商人タブ（`ROW_*`）・改装タブ（`UPGRADE_*`）とは逆である。**
 *
 * **PO が描いた表は左に寄っている**（赤入れ 2026-09-13。6列で領域の半分ほど）。
 * あの2つが右端から決めているのは、**右端にボタンが貼り付いていて、
 * 左の品名が伸びると食い込むから。**この表は**全部の列が短い**ので、
 * 右端に散らすと**読む目が横に飛ぶ。**⚠ **右に余白が残るのは、この表では正しい。**
 */
/** `商品` の左端。⚠ **いちばん長い品名が `依頼者` に届かないこと**（`layout.test.ts`） */
export const DELIVERY_NAME_L = CONTENT_L + 16
export const DELIVERY_NAME_W = 190
/**
 * `依頼者` の左端。⚠ **4人ぶんの名（`フィエラ` がいちばん長い）が
 *   `数量` の列に届かないこと**（`layout.test.ts` が見ている）。
 */
export const DELIVERY_CLIENT_L = DELIVERY_NAME_L + DELIVERY_NAME_W
export const DELIVERY_CLIENT_W = 110
/** `数量` の右端（右そろえ）。**必要な数**であって、手持ちではない */
export const DELIVERY_QTY_W = 60
export const DELIVERY_QTY_R = DELIVERY_CLIENT_L + DELIVERY_CLIENT_W + DELIVERY_QTY_W
/** `報酬` の右端（右そろえ）。⚠ **いちばん高い報酬が収まること**（`layout.test.ts`） */
export const DELIVERY_REWARD_W = 110
export const DELIVERY_REWARD_R = DELIVERY_QTY_R + 20 + DELIVERY_REWARD_W

export const DELIVERY_BTN_H = 26
/** `納品` ボタン。⚠ **納められないとき `手持ち/必要` に変わる**ので、その幅も要る */
export const DELIVERY_BTN_W = 72
export const DELIVERY_BTN_L = DELIVERY_REWARD_R + 20
/** `廃棄` ボタン。⚠ **`納品` から離すこと。**押し間違えると依頼が消える */
export const DELIVERY_DISCARD_W = 56
export const DELIVERY_DISCARD_L = DELIVERY_BTN_L + DELIVERY_BTN_W + 16
/** ボタンの字の大きさ。⚠ **2つのボタンで揃える**（隣り合うので） */
export const DELIVERY_BTN_FONT_PX = 13

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
 *   **総額（`BUY_TOTAL_FONT_PX`）と同じ 11px。**どちらもボタンの外に置く文字である。
 * ⚠ **上げてよいのは footprint に収まるあいだだけ**（`layout.test.ts` が3桁の残りで見ている）。
 *   **118px だった頃は 12px で 1px はみ出していた** —— 総額を分けて 138px になったので、
 *   いまは収まる。**それでも上げていないのは、揃える相手がボタンではないからである。**
 */
export const UPCOMING_FONT_PX = 11

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
 * 行商人の行に出す「今日まだ何個買えるか」。
 *
 * ⚠ **品名の右**に出す。**島の商人の側にはもう字が無い**（産地は行の色。PO 指示 2026-09-13）ので、
 *   **ここが品名の右を使う唯一の字**である。
 *   `51レン/個　在庫 100/999` の側に足すと `INFO_MAX_W`（160px）を超えて左隣に重なる。
 * ⚠ **買えない理由の文言も同じものを使う**（`残り0個` がそのまま理由になる）。
 */
export function peddlerRemainText(remaining: number): string {
  return `残り${remaining}個`
}

/** 行商人の行の `残り N個` の文字の大きさ。**行の補足の字**（`INFO_FONT_PX`）に合わせる */
export const PEDDLER_REMAIN_FONT_PX = 11

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
 * マイセットの升に出す1行（`ハルヴェラ島`。#67）の文字の大きさ。
 *
 * ⚠ **升の文字欄は 308px**（升の幅 400 から、縮小図 70 と余白 22 を引いたもの）。
 *   いちばん長い既定値は `ミフユリア島` で **72px**（区画数を落とした 2026-09-13 以降）。
 *   ⚠ **古いセーブの `130区画` も通る。**収まるかは `layout.test.ts` が両方見ている。
 */
export const PRESET_TEXT_FONT_PX = 12

/**
 * 型の升の**2行目**（島名）。**名前を付けたときだけ出る**（#83）。
 *
 * ⚠ **名前が1行目を占めるので、これが無いと島名が読めなくなる。**
 */
export const PRESET_SUB_FONT_PX = 11

/**
 * マイセットの升の**横の寸法**（`PresetMenu` が並べる 2列 × 5行 の升）。
 *
 * ⚠ **`PresetMenu` と `layout.test.ts` の両方が使う。**以前は両方が同じ式を書き写していて、
 *   **片方を動かしてももう片方が気づかない**形だった（#83 で片付けた）。
 * ⚠ **縦の寸法（升の高さ）はここに無い。**`PRESET_COUNT` から割るので `PresetMenu` に置いてある。
 */
export const PRESET_COLS = 2
export const PRESET_GAP_X = 14
export const PRESET_CELL_W =
  Math.floor((CONTENT_R - CONTENT_L - PRESET_GAP_X * (PRESET_COLS - 1)) / PRESET_COLS)
/** 盤面の縮小図を置く枠の幅 */
export const PRESET_PREVIEW_W = 70
/** 升の左端から、文字（と名前の入力欄）の左端までの距離。左余白10 ＋ 縮小図 ＋ 間隔12 */
export const PRESET_TEXT_L_OFFSET = 10 + PRESET_PREVIEW_W + 12
/** 升の文字欄の幅（**308px**）。⚠ **名前もここに収まること**（`layout.test.ts` が見ている） */
export const PRESET_TEXT_W = PRESET_CELL_W - PRESET_TEXT_L_OFFSET

/**
 * 型の名前を打つ `<input>`（#83）。**文字欄と同じ場所に、同じ大きさで置く。**
 *
 * ⚠ **右端に 10px 残す。**升の縁にぴったり付けると枠線と重なって見える。
 * ⚠ **高さは 24。**升の文字行（升の上端から15px）と、その下のボタン列のあいだに収まる。
 */
export const PRESET_NAME_INPUT_W = PRESET_TEXT_W - 10
export const PRESET_NAME_INPUT_H = 24

// ─── 右パネルのボタン列 ──────────────────────────────────
/**
 * 右パネル下段のボタン列。**下から順に積む**（`進める` が最下段）。
 *
 * ⚠ **GameScene が写しを持たないこと。**以前はここの数字が `GameScene` に直書きで、
 *   **行を1つ足したときにキャラ絵の枠と重なることに気づけなかった**（#9 で行商人を足した）。
 *   いまは `CHAR_ART_B` をこの列の上端から引いてあるので、`layout.test.ts` が重なりを見られる。
 */
export const BTN_PANEL_R = 1278
export const BTN_PANEL_W = 176
export const BTN_PANEL_L = BTN_PANEL_R - BTN_PANEL_W
/** ⚠ **アイコンは5つ。**幅を広げると入らない（列は 176px しかない） */
export const BTN_ICON_W = 33
export const BTN_ICON_H = 38
export const BTN_ACTION_H = 42
export const BTN_GAP = 5
/** 速さの行。ボタンの中に入れると文字が重なる */
export const BTN_SPEED_H = 16
/** 列の下端（メッセージ欄の上）と、そこから空ける余白 */
const BTN_COLUMN_B = LOG_T - 1 - 16

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

/**
 * 右パネル上の枠（時刻・現在地・所持金）。⚠ **`HUD.ts` に写しを置かないこと。**
 *
 * ⚠ **行の位置は枠の上端からの絶対値で持つ。**中心からの相対にすると、
 *   **高さを変えたときに全部の行が動く**（どれか1つだけ直したいときに効かない）。
 * ⚠ **`時刻` は 26px、`所持金` は 20px。**行の間隔はその半分を見込んである
 *   （PO 指示 2026-09-14「詰まりすぎ。調整」で広げた）。
 * ⚠ **枠は所持金の行で終わる**（PO 指示「ここの空白は不要」）。
 *   **目標の進みのバーを消したあと、下に空の帯が残っていた。**
 */
export const HUD_PANEL_T = 8
export const HUD_ROW_TIME_Y = HUD_PANEL_T + 22
export const HUD_ROW_PLACE_Y = HUD_PANEL_T + 50
export const HUD_RULE_Y = HUD_PANEL_T + 64
export const HUD_ROW_MONEY_Y = HUD_PANEL_T + 84
export const HUD_PANEL_H = 102
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
export const CHAR_ART_T = HUD_PANEL_B + 9
export const CHAR_ART_B = BTN_Y_ICON - BTN_ICON_H / 2 - 9
export const CHAR_ART_CY = (CHAR_ART_T + CHAR_ART_B) / 2
export const CHAR_ART_H = CHAR_ART_B - CHAR_ART_T
export const CHAR_ART_CX = 1185
export const CHAR_ART_W = 170

// ─── 工房の表 ────────────────────────────────────────────────
/**
 * 工房（`CraftMenu`）の表（**PO 赤入れ 2026-09-13**「↓のように表示して」）。
 *
 * **商品 ／ 作成数 ／ 在庫 ／ 時間 ／ 需要 ／ 数量 ／ 作る**（列の名は `CRAFT_COLS`）。
 * ⚠ **材料の一覧と、儲け方の3ルート（#23）は図に列が無い**ので行から落ちている
 *   （→ #107 ／ #108）。**戻すなら列を足す話になる。**
 *
 * ⚠ **納品タブ（`DELIVERY_*`）と同じく左から順に決める。**
 *   商人タブ・改装タブが右端から決めているのは**右端にボタンが貼り付いているから**で、
 *   この表は**左の5列が短く、右の2列（数量・作る）だけが固定幅**なので、
 *   **左は左から、右は右から**決めて、あいだが空くかをテストで見る。
 * ⚠ **写しを作らないこと。**`CraftMenu.ts` はここを読むだけで、自分の数を持たない。
 */
/** 見出しの行（`商品` `作成数` …）の y。⚠ **工房は見出しの下の1行が無い**ので上端が他より上 */
export const CRAFT_HEAD_Y = ROWS_TOP_NO_SUBTITLE + 10
export const CRAFT_HEAD_FONT_PX = 12
/** 1件目の行の上端。⚠ **見出しの行と重ならないこと**（`layout.test.ts` が見ている） */
export const CRAFT_ROWS_TOP = ROWS_TOP_NO_SUBTITLE + 30
/**
 * 1行の高さ。**3段組み（84px）をやめて1行にした。**
 *
 * ⚠ **行数は決め打ちしない**（`rowsThatFit`）。84px のときは5行、いまは11行入る。
 */
export const CRAFT_ROW_H = 40

/** 列の名。⚠ **見出しの字はここだけ。**`CraftMenu.ts` に書かない */
export const CRAFT_COLS = ['商品', '作成数', '在庫', '時間', '需要', '数量', '作る'] as const

/**
 * `商品` の左端と幅。**出来上がる品の名前だけ**（`×3(400)` は `作成数` と `在庫` に割れた）。
 *
 * ⚠ **いちばん長い品名が `作成数` に届かないこと**（`layout.test.ts`）。
 *   **実測: `フェルト張りの氷入れ` が 10文字＝140px**（`CRAFT_NAME_FONT_PX`）。
 */
export const CRAFT_NAME_L = CONTENT_L + 8
export const CRAFT_NAME_W = 142
/** ⚠ **納品タブ（15px）より1つ小さい。**列が7つあり、ここを 15px にすると `需要` が入らない */
export const CRAFT_NAME_FONT_PX = 14

/** 行の中の数字と島名の大きさ */
export const CRAFT_CELL_FONT_PX = 11

/** `作成数` の右端（右そろえ）。**`出来高 × 回数`** であって、1回ぶんではない */
export const CRAFT_MADE_R = CRAFT_NAME_L + CRAFT_NAME_W + 44
/** `在庫` の右端（右そろえ）。**出来上がる品の在庫** */
export const CRAFT_STOCK_R = CRAFT_MADE_R + 56
/**
 * `時間` の左端と幅。**`craftTimeLabel` が作る `◯分`**。
 *
 * ⚠ **4桁までしか測っていない**（`9999分`）。**1日は 1440分**なので、
 *   作れる回数のあいだは必ず4桁に収まる。**それ以上を手で打つと `…` に詰まる**が、
 *   そのときは `作る` が押せない状態なので実害は無い。
 *
 * ⚠ **`（営業◯分）` を消しても幅は詰めていない**（PO 指示 2026-09-14）。
 *   **`需要` の左端はここから導いている**ので、詰めると表全体が左へ寄り、
 *   **`需要` と `数量` のあいだに穴が開く**（`数量` と `作る` は右端に固定）。
 *   **穴の場所が変わるだけなので、動かさない。**
 */
export const CRAFT_TIME_L = CRAFT_STOCK_R + 16
export const CRAFT_TIME_W = 118
/**
 * `需要` の左端と幅。
 *
 * ⚠ **中身は「いまの島では手に入らない材料の産地」である**（これまで `＠` で付けていたもの）。
 *   **「売れる島」ではない。**→ 列名は PO 判断（`sessions/questions-craft-tab.md` Q1）。
 * ⚠ **2島まで収まる幅**（`ハルヴェラ・リナツィア` ＝ 121px）。
 *   **3島になる組み合わせは 424組中2組**しかないので、そこは `…` に詰まってよい。
 */
export const CRAFT_DEMAND_L = CRAFT_TIME_L + CRAFT_TIME_W + 8
export const CRAFT_DEMAND_W = 129
/** 産地が2つ以上あるときの繋ぎ。⚠ **幅の見積もりに入る**ので `layout.test.ts` と揃える */
export const CRAFT_DEMAND_SEP = '・'

/**
 * `作る` ボタン。**右端から決める。**
 *
 * ⚠ **作れないときは字が理由に変わる**（商人タブ `BUY_REASON_FUNDS` と同じ作り）。
 *   **1行になった時点で、理由を置く段が無くなった。**
 * ⚠ **いちばん長い理由がここに収まること**（`layout.test.ts`）。
 */
export const CRAFT_BTN_W = 76
export const CRAFT_BTN_H = 26
export const CRAFT_BTN_L = CONTENT_R - 6 - CRAFT_BTN_W
export const CRAFT_BTN_FONT_PX = 12
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
export const CRAFT_STEP_BIG_W = 28
export const CRAFT_STEP_ONE_W = 22
export const CRAFT_INPUT_W = 40
export const CRAFT_INPUT_H = 22
export const CRAFT_MAX_W = 34
export const CRAFT_STEP_GAP = 3
export const CRAFT_QTY_GAP = 10
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
export const CRAFT_STEP_FONT_PX = 11

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

// ─── 納品の帯（#28） ──────────────────────────────────
/**
 * いま受けている注文を**1行**で出す帯。**盤面の下端とメッセージ欄の上端のあいだ。**
 *
 * ⚠ **右パネルには置けない。**HUD の枠は y8〜134 で、そのすぐ下（135〜335）がキャラ絵の枠、
 *   さらに下はボタン列（346〜593）で埋まっている。**1行ぶんの隙間が無い。**
 * ⚠ **上へ広げないこと。**盤面はいちばん広いとき（13×10）下地が y590 まで来る
 *   （`GRID_ORIGIN_Y + 10 * CELL_SIZE + 2`）。広げると盤面と重なる。
 * ⚠ **右は `STRIP_L` まで。**そこから先はキャラ帯（980〜1090）。
 */
export const ORDER_BAR_T = GRID_ORIGIN_Y + 10 * CELL_SIZE + 2
export const ORDER_BAR_B = LOG_T - 2
export const ORDER_BAR_L = GRID_ORIGIN_X
export const ORDER_BAR_R = STRIP_L - 4
export const ORDER_BAR_W = ORDER_BAR_R - ORDER_BAR_L
export const ORDER_BAR_H = ORDER_BAR_B - ORDER_BAR_T
export const ORDER_BAR_CY = (ORDER_BAR_T + ORDER_BAR_B) / 2
/** 帯の内側の余白 */
export const ORDER_BAR_PAD = 10
/**
 * 帯の文字に使える幅。
 *
 * ⚠ **`レン` は全角2文字。**金額を出す場所なので、`OrderBar.test.ts` が
 *   **注文に出うる全品の最悪値**を `estTextWidth` で測っている。
 */
export const ORDER_TEXT_MAX_W = ORDER_BAR_W - ORDER_BAR_PAD * 2
/** 帯の文字の大きさ。⚠ 帯の高さが 18px しかないので、これ以上大きくしない */
export const ORDER_BAR_FONT_PX = 12

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
 * ⚠ **キャラ帯（980〜1090）を覆わない。**`PlaceFrame` は帯を隠してからその領域まで使うが、
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
 * 暗幕の濃さ。**下を押させないための面でもある**（`setInteractive()`）。
 *
 * ⚠ **`Tutorial`（0.75）と `SaveLoadMenu`（0.65）は自前で持っている。**
 *   3箇所を1つにまとめるのは別の話（issue）。**ここはセーブ枠に合わせた。**
 */
export const MSG_SCRIM_ALPHA = 0.65
/**
 * 窓の幅。
 *
 * ⚠ **広げるなら、何が入らなかったのかを書くこと。**ここは
 *   **選択肢3つぶん（110×3 ＋ 隙間）＋内側の余白**でできていて、
 *   **それより1つぶん以上広いと `layout.test.ts` が落ちる**（PO 2026-09-13「余白が多すぎる」）。
 */
export const MSG_WIN_W = 440
/**
 * 窓の高さ。**中身（話し手1行・本文・ボタン1行）ぶんしか無い。**
 *
 * ⚠ **`MSG_LINES_MAX` と一緒に見ること。**入る行数はここから導いていて、
 *   **いまは1行。2行のできごとを足すと `layout.test.ts` が落ちる** ——
 *   落ちたら、ここを `MSG_LINE_H` ぶん（22px）上げる。
 *   **黙って余らせておかない**（PO 2026-09-13「余白が多すぎる」）。
 */
export const MSG_WIN_H = 120
/** ⚠ **画面の中央。**`Tutorial` `SaveLoadMenu` と同じ中心（上の注記） */
export const MSG_WIN_CX = SCREEN_W / 2
export const MSG_WIN_CY = SCREEN_H / 2
export const MSG_WIN_L = MSG_WIN_CX - MSG_WIN_W / 2
export const MSG_WIN_R = MSG_WIN_CX + MSG_WIN_W / 2
export const MSG_WIN_T = MSG_WIN_CY - MSG_WIN_H / 2
export const MSG_WIN_B = MSG_WIN_CY + MSG_WIN_H / 2
/** 窓の内側の余白 */
export const MSG_WIN_PAD = 14
/** 本文と名前に使える幅 */
export const MSG_TEXT_MAX_W = MSG_WIN_W - MSG_WIN_PAD * 2

/** 話し手の名前の行。⚠ **名前だけ出す**（絵は #21・#15 で後から入る） */
export const MSG_SPEAKER_FONT_PX = 16
export const MSG_SPEAKER_Y = MSG_WIN_T + MSG_WIN_PAD

/** 本文。**1行ずつ置く**（自動で折り返さない ＝ node のテストから測れる） */
export const MSG_TEXT_FONT_PX = 16
export const MSG_LINE_H = 22
export const MSG_TEXT_TOP = MSG_SPEAKER_Y + 26

/** 選択肢のボタン。**窓の下端に1行で並べる** */
export const MSG_CHOICE_W = 110
export const MSG_CHOICE_H = 30
export const MSG_CHOICE_GAP = 12
export const MSG_CHOICE_FONT_PX = 15
export const MSG_CHOICE_CY = MSG_WIN_B - MSG_WIN_PAD - MSG_CHOICE_H / 2

/**
 * 本文に使える行数。**選択肢のボタンに食い込まない範囲。**
 *
 * ⚠ **決め打ちにしないこと。**窓の高さやボタンの高さを動かしたときに、
 *   本文がボタンへ食い込んだことに**気づけなくなる**（`CHAR_ART_B` と同じ直し）。
 */
export const MSG_LINES_MAX = Math.max(
  0,
  Math.floor((MSG_CHOICE_CY - MSG_CHOICE_H / 2 - 8 - MSG_TEXT_TOP) / MSG_LINE_H),
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
