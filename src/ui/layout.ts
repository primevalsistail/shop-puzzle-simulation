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
 *   「店に戻る」ボタン（下端49）に1pxまで近づく。**実際に「壊れて見える」と指摘が出た。
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
/** 「←  店に戻る」ボタンの幅。**見出しの行の右端に置く** */
export const BACK_BTN_W = 120

/**
 * 「取引」の中の3タブ（#96）。**`商人` → `改装` → `納品`**（#96 本文の順）。
 *
 * ⚠ **見出しと同じ行に置く。**下に1行足すと、その28px ぶん一覧の上端が下がり、
 *   仕入れの行（56px）が **8行 → 7行** に減る。**タブを足すために品が1つ見えなくなる**のは割に合わない。
 * ⚠ **見出し（左）と「店に戻る」（右）のあいだに収まること**（`layout.test.ts` が見ている）。
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
 * 納品タブ（#96）の行の文字の大きさ。
 *
 * ⚠ **帯（`OrderBar`）と同じ情報しか出さない**（#98 で作り直すまで器だけ）。
 *   `deliveryTabLines` が帯の1行を全角空白で折るだけなので、**文言は1語も増えていない。**
 * ⚠ **1行目だけ `TAB_ROW_TITLE_FONT_PX`、残りは `TAB_ROW_SUB_FONT_PX`**（3タブで揃える）。
 */
export const DELIVERY_TAB_FONT_PX = TAB_ROW_TITLE_FONT_PX
/** 納品タブの行の高さ。⚠ **文字を下げたぶん詰める**（間延びして見えるため） */
export const DELIVERY_TAB_LINE_H = 24

/**
 * 帯の1行を、納品タブの複数行に折る。
 *
 * ⚠ **切るのは全角空白だけ。**`orderLineText` が区切りに使っている字で、
 *   ここで語を足したり言い換えたりしない（文言は PO の領分。#79）。
 */
export function deliveryTabLines(barLine: string): readonly string[] {
  return barLine.split('　')
}

/**
 * 注文が1件も無いときに納品タブへ出す1行。
 *
 * ⚠ **帯は無いとき消える**（`OrderBar`）が、**タブは自分で開いて来る場所**なので、
 *   まっさらだと壊れて見える（`PurchaseMenu` の「商人は、いま何も並べていません」と同じ扱い。#48）。
 * ⚠ **言い回しは仮置き。**画面に出す文言は PO が決める（#79）。
 */
export const DELIVERY_TAB_EMPTY = 'いま受けている注文はありません'

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
 * ⚠ **クリア後にしか出ない。**クリア前は同じ場所に目標の進みのバーが出ている
 *   （目標が無くなったあとのバーは満杯で止まったままで、読む意味が無い）。
 * ⚠ **ここに置いてあるのは、幅を測るため**（`upcomingLabel` と同じ理由）。
 *   `HUD.ts` は Phaser を読むので node の単体テストから import できない。
 * ⚠ **末尾の `▶` は「押すと変わる」ことの印。**取ると、ただの表示に見えて押されない。
 * ⚠ **言い回しは仮置き。**画面に出す文言は PO が決める（#79）。
 */
export function nextPortLabel(island: string): string {
  return `次 ${island}島 ▶`
}

/**
 * その文字の大きさ。⚠ **いちばん長い `次 ミフユリア島 ▶` が `HUD_BAR_W` に収まること**
 *   （`layout.test.ts` が見ている）。現在地の行（13px）と同じ大きさにしてある。
 */
export const HUD_NEXT_PORT_FONT_PX = 13

/**
 * 次の寄港地を選ぶところの高さ。**押せる的の高さ**でもある。
 *
 * ⚠ **バーの行と「目標 N%」の行、2行ぶんを使う。**片方だけだと的が 11px しかなく、押しにくい。
 *   ⚠ **枠（右パネルの HUD）は広げない。**広げるとキャラ絵の枠（`CHAR_ART_T`）が下がる。
 */
export const HUD_NEXT_PORT_H = 26

/** 仕入れの「買う」ボタンの幅。**隣の「最大」「＋」「−」と並んでいるので広げられない** */
export const BUY_W = 118

/**
 * 「買う」ボタンの文字の大きさ。**13 から下げた**（束M）。
 *
 * ⚠ `¥123,456 で買う` の頃は 13px で 105.2px だったが、`123,456レン で買う` は
 *   **122.9px** になり、118px のボタンから 5px はみ出した。
 * ⚠ **これ以上下げないこと。**隣の「最大」「＋」「−」が 12px なので、
 *   主たるボタンだけ小さいのはおかしい。
 *   **下げる代わりに助詞の「で」を落としてある**（`BUY_SUFFIX`）。
 */
export const BUY_FONT_PX = 12

/**
 * 「買う」ボタンの、金額のうしろに付く語。**`で買う` から助詞を落とした**（PO 2026-09-12）。
 *
 * ⚠ **「買う」という語は落とさないこと。**落とすとボタンが何をするか読めなくなる。
 * ⚠ 助詞1文字＝全角1文字＝ **12px** ぶんで、いちばん高い品（仕入れ値 3,241）× 999個 の
 *   `3,237,759レン` が入るかどうかがここで決まる（`で` 付き 124.9px ／ 無し 112.9px）。
 */
export const BUY_SUFFIX = ' 買う'

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

/**
 * 商人のところの「**もうすぐ買える**」行に出す文字（#66）。
 *
 * ⚠ **分母もしきい値も出さない**（PO 判断 Q7=A ／ `evaluate.ts` の注記）。
 *   出すのは **`salesUntilBuyable` が規則から導いた残り**だけ。100 を画面へ書き写さない。
 * ⚠ **ここに置いてあるのは、幅を測るため。**`PurchaseMenu.ts` は Phaser を読むので
 *   node の単体テストから import できず、**文字を組み立てる側をこちらに置かないと
 *   `layout.test.ts` が実物の文字列を測れない**（`money.ts` と同じ理由）。
 * ⚠ **「買う」ボタンの footprint（118px）に収める。**3桁の残りで `あと999個売れば買える` は
 *   **120.1px ではみ出す**ので、末尾を `並ぶ` にしてある
 *   （#60 の知らせ「**商人の店先に並ぶようになった**」と同じ語）。**⚠ 文言は PO の領分（#79）。**
 */
export function upcomingLabel(salesLeft: number): string {
  return `あと${salesLeft}個売れば並ぶ`
}

/**
 * その文字の大きさ。**「買う」ボタンと同じ右端に、ボタンを作らずに置く。**
 *
 * ⚠ **`BUY_FONT_PX`（12）にしないこと。**3桁の残り（`あと999個売れば並ぶ`）で
 *   **119.0px になり、ボタンの幅 118px を 1px 超える。**
 *   ⚠ **ボタンではないので、隣と大きさを揃える必要がない**（`INFO_FONT_PX` と同じ扱い）。
 *   収まるかは `layout.test.ts` が見ている。
 */
export const UPCOMING_FONT_PX = 11

/**
 * 行商人バレンのところ（#9）に出す文字。
 *
 * ⚠ **ここに置いてあるのは、幅を測るため**（`upcomingLabel` と同じ理由）。
 *   `PurchaseMenu.ts` は Phaser を読むので node の単体テストから import できない。
 * ⚠ **言い回しは仮置き。**画面に足す文言は PO が指示する（#79）。
 */

/**
 * 行商人の行に出す「今日まだ何個買えるか」。
 *
 * ⚠ **品名の右**（島の商人の `この島の産` と同じ場所）に出す。
 *   `51レン/個　在庫 100/999` の側に足すと `INFO_MAX_W`（160px）を超えて左隣に重なる。
 * ⚠ **買えない理由の文言も同じものを使う**（`残り0個` がそのまま理由になる）。
 */
export function peddlerRemainText(remaining: number): string {
  return `残り${remaining}個`
}

/** 行商人の行の `残り N個` の文字の大きさ。`この島の産`（11px）に合わせる */
export const PEDDLER_REMAIN_FONT_PX = 11

/**
 * 行商人の見出しの下の1行。
 *
 * ⚠ **「今日だけ」であることを言う。**言わないと、島の商人と同じく
 *   **いつでもそこに居る店**に見え、**買い逃しても気づけない**（品揃えは毎日入れ替わる）。
 */
export function peddlerSubtitleText(moneyText: string): string {
  return `所持金 ${moneyText}　今日の品ぞろえ（明日には別の品になる）`
}

/**
 * 行商人の場所の見出し。
 *
 * ⚠ **できごとの窓に出る話し手の名（`STORY_EVENTS`）と同じにすること。**
 *   同じ相手を2つの名で呼ばない（`クラフト`→`工房` と同じ直し。束M）。
 *   ⚠ **ボタン列にはもう無い**（#90。向こうから来るので、窓の「見る」からだけ開く）。
 */
export const PEDDLER_TITLE = '行商人バレン'

/**
 * 品出しの型の升に出す1行（`ハルヴェラ島 12区画`。#67）の文字の大きさ。
 *
 * ⚠ **升の文字欄は 308px**（升の幅 400 から、縮小図 70 と余白 22 を引いたもの）。
 *   いちばん長い `ミフユリア島 全部下ろす` で **136.1px**。**まだ半分以上あいている。**
 *   収まるかは `layout.test.ts` が見ている。
 */
export const PRESET_TEXT_FONT_PX = 12

/**
 * 型の升の**2行目**（島名と区画数）。**名前を付けたときだけ出る**（#83）。
 *
 * ⚠ **名前が1行目を占めるので、これが無いと区画数が読めなくなる。**
 */
export const PRESET_SUB_FONT_PX = 11

/**
 * 品出しの型の升の**横の寸法**（`PresetMenu` が並べる 2列 × 5行 の升）。
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
 * キャラ絵の枠（#21・#15 の置き場所）。**HUD の下から、ボタン列の上まで。**
 *
 * ⚠ **下端を決め打ちしないこと。**ボタン列に行を足すと列が上へ伸びるので、
 *   決め打ちにすると**気づかないまま重なる**（#9 で行商人の行を足したときに実際に起きかけた）。
 */
export const CHAR_ART_T = 135
export const CHAR_ART_B = BTN_Y_ICON - BTN_ICON_H / 2 - 9
export const CHAR_ART_CY = (CHAR_ART_T + CHAR_ART_B) / 2
export const CHAR_ART_H = CHAR_ART_B - CHAR_ART_T
export const CHAR_ART_CX = 1185
export const CHAR_ART_W = 170

// ─── 工房（クラフト）の行 ──────────────────────────────────
/** 操作列（回数の入力とボタン）の左端。ここより左が文字の領域 */
export const CRAFT_CONTROLS_L = CONTENT_R - 260
/** 文字に使える幅。**ここを超えた分は末尾が `…` に詰められる**（`CraftMenu.setText`） */
export const CRAFT_TEXT_MAX_W = CRAFT_CONTROLS_L - CONTENT_L - 22

/**
 * 儲け方の3ルートを金額で並べる行（#23）の文字の大きさ。
 *
 * ⚠ **`…` で切れると意味が消える行である。**「転売 → 作る → 材料も作る」の3つが
 *   並んで初めて比べられるので、末尾が落ちると #23 で入れた意味そのものが無くなる。
 *   収まるかは `layout.test.ts` が見ている。
 */
export const CRAFT_ROUTE_FONT_PX = 12

/**
 * 加工が**何分かかり、そのうち何分が営業時間か**を1行にする（#53）。
 *
 * ⚠ **「所要分」だけでは値段が見えない。**加工中は `TimeManager.skipMinutes` が
 *   `TIME_MINUTE_PASSED` を出さないので**客が1人も来ない**。つまり営業時間に
 *   食い込んだ分はそのまま売上が消える（実測: 営業600分のうち240分を加工に使うと
 *   その日の売上は 41.7% 減）。**払っているのに画面に出ていなかったのがこれ。**
 *
 * ⚠ **`recipe.durationMinutes` を渡さないこと。**あれは手際を掛ける前の素の値で、
 *   `CraftingSystem.minutesFor` とは**初期手際 S=10 の時点ですでに食い違う**
 *   （tier3 以上は2倍。最悪は `recipe_feast_hamper` の 240分 → 実際728分）。
 *
 * ⚠ **営業0分のときは何も足さない。**夜と朝に作るのが「削らない作り方」で、
 *   そこに毎回`（営業0分）`と出ると、**削っている行だけが目立つ形にならない。**
 * ⚠ **ここに置いてあるのは、幅を測るため**（`upcomingLabel` と同じ理由）。
 *   ⚠ **言い回しは PO の領分（#79）。**仮置き。
 */
export function craftTimeLabel(minutes: number, businessMinutes: number): string {
  if (businessMinutes <= 0) return `${minutes}分`
  return `${minutes}分（営業${businessMinutes}分）`
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
 *   ⚠ **左右は帯とそろえてある。**そろえないと、同じ中央の領域に幅の違う箱が2つ並ぶ。
 * ⚠ **キャラ帯（980〜1090）を覆わない。**`PlaceFrame` は帯を隠してからその領域まで使うが、
 *   こちらは**隠さない**ので、覆うと店番と来店客が窓に切られる。
 *   ⚠ **話し手の絵はいずれあの帯に入る**（#21・#15）。覆うと絵が見えない窓になる。
 * ⚠ **盤面には重なる。**盤面はいちばん広いとき y588 まで来るので、
 *   帯より上に置く以上は避けようがない。**消さずに重ねる**のがここの線引き。
 */
export const MSG_WIN_L = ORDER_BAR_L
export const MSG_WIN_R = ORDER_BAR_R
export const MSG_WIN_B = ORDER_BAR_T - 6
/** ⚠ **高さを増やすなら `MSG_LINES_MAX` と一緒に見ること**（本文の行が入らなくなる） */
export const MSG_WIN_H = 160
export const MSG_WIN_T = MSG_WIN_B - MSG_WIN_H
export const MSG_WIN_W = MSG_WIN_R - MSG_WIN_L
export const MSG_WIN_CX = (MSG_WIN_L + MSG_WIN_R) / 2
export const MSG_WIN_CY = (MSG_WIN_T + MSG_WIN_B) / 2
/** 窓の内側の余白 */
export const MSG_WIN_PAD = 20
/** 本文と名前に使える幅 */
export const MSG_TEXT_MAX_W = MSG_WIN_W - MSG_WIN_PAD * 2

/** 話し手の名前の行。⚠ **名前だけ出す**（絵は #21・#15 で後から入る） */
export const MSG_SPEAKER_FONT_PX = 16
export const MSG_SPEAKER_Y = MSG_WIN_T + MSG_WIN_PAD

/** 本文。**1行ずつ置く**（自動で折り返さない ＝ node のテストから測れる） */
export const MSG_TEXT_FONT_PX = 16
export const MSG_LINE_H = 24
export const MSG_TEXT_TOP = MSG_SPEAKER_Y + 30

/** 選択肢のボタン。**窓の下端に1行で並べる** */
export const MSG_CHOICE_W = 160
export const MSG_CHOICE_H = 34
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
