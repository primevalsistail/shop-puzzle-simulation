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

/**
 * その行の高さなら何行入るか。
 *
 * ⚠ **行数を決め打ちしないこと。**領域を動かしたときに、
 *   最後の行がページ送りへ食い込んでいることに**気づけなくなる**。
 */
export function rowsThatFit(rowH: number): number {
  return Math.max(0, Math.floor((ROWS_BOTTOM - ROWS_TOP) / rowH))
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
