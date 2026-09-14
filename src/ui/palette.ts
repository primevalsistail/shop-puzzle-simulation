/**
 * 画面の色。**役割で呼ぶ。**
 *
 * ⚠ **生の16進を呼び出し側に書かないこと。**以前は `src/ui` と `src/scenes` に
 *   **232箇所・155色**が直書きで、**同じ役割に別の値が当たっていても気づけなかった**。
 *   `palette.test.ts` が、生の16進が戻っていないかを見ている。
 *
 * ⚠ **Phaser を読まない。**寸法の `layout.ts` と同じで、単体テストから見られるようにする。
 *
 * **出どころ**: `aidlc-docs/inception/worldbuilding/prompts/ui-palette.md`。
 * **昼の光が入る売り場**として組んである（店は船倉で、接岸すると横腹が開く）。
 * ⚠ **地と枠の彩度は抑えてある。**鮮やかな色は**状態の合図と人物の絵**のためのもので、
 *   **画面の地に彩度を足すと、その2つが埋もれる。**
 */

/** 型だけ。コンパイルで消える */
import type { MainKind } from '../taxonomy/axes.js'

/**
 * Phaser の文字色は文字列で受ける（`0x` では通らない）。**値は下の定数のまま渡すこと。**
 * ⚠ **`'#303a36'` のような文字列リテラルを書かない。**片方だけ直す事故が起きる。
 */
export const css = (color: number): string => `#${color.toString(16).padStart(6, '0')}`

// ─── A 地（面） ──────────────────────────────────────────────
/** いちばん奥。区画の隙間から見える */
export const BG_SCREEN = 0xdeded3
/** 左の一覧・右の操作板・下のメッセージ欄。**3つとも同じ地** */
export const BG_PANEL = 0xefeee4
/** 売り場の升目の下地。⚠ **画面の 47.5%** を占める、いちばん広い面 */
export const BG_FLOOR = 0xe6e9df
/** 窓（買い物・工房・確認）。**いちばん明るい紙色で、手前に出す** */
export const BG_WINDOW = 0xfaf7ee
/** 窓を開いたとき背後を覆う膜。⚠ **薄い。**昼の明るさを残すため */
export const SCRIM = 0x303a36
export const SCRIM_ALPHA = 0.18

// ─── B 線と文字 ──────────────────────────────────────────────
/** 区画・窓の縁 */
export const LINE_STRONG = 0x727970
/** 区切りの横線、升目の格子。⚠ **130本引いても品より目立たない濃さ** */
export const LINE_WEAK = 0xc3c8bd
/** 品名・説明・ボタンの字。⚠ **真黒にしない**（地に対して 8.68:1 ある） */
export const TEXT_BODY = 0x303a36
/** 個数・単位・注記（4.82:1） */
export const TEXT_SUB = 0x56605a
/**
 * 押せない・選べないものの字（3.31:1）。
 * ⚠ **読ませたい文にこれを使わない。**「なぜ買えないか」の説明は `TEXT_SUB` で書く。
 */
export const TEXT_WEAK = 0x727970
/** 所持金。**画面でいちばん大きい字**なので、大きさで強調し色は本文と同じにする */
export const TEXT_MONEY = 0x303a36

// ─── C 状態の合図（ここにだけ鮮やかな色を置く） ─────────────────
/**
 * ⚠ **色みだけで分けないこと。**下の6色は明度でも段が付けてあるが、
 *   **隣り合う段は明度だけでは見分けられない。**印（✓ × 二重枠 残数）を必ず添える。
 * ⚠ **赤と橙を合図に使わない。**品の色がその色みに固まっていた名残で、
 *   **合図の上に同じ色みの品が乗る。**緑・黄緑・青紫が空いている。
 */
/** 買える・納められる・置ける */
export const ST_OK = 0x247044
/** 並べた品の在庫が少ない */
export const ST_LOW = 0x887020
/** 在庫ゼロ・そこには置けない */
export const ST_NG = 0x713f67
/** いま選んでいる行・升 */
export const ST_SELECTED = 0x234e78
/** カーソルが乗っているところ */
export const ST_HOVER = 0x6e8440
/** 品を捨てる場所 */
export const ST_DISCARD = 0x493d38

// ─── D ボタン（4つの役 × 通常／指が乗った時／押せない時） ──────
/** 時間を進める。**画面でいちばん大きく、いちばん押される** */
export const BTN_ADVANCE = 0xbdced9
export const BTN_ADVANCE_HOVER = 0xa9c1d1
export const BTN_ADVANCE_OFF = 0xd5dcd9
/** 仕入れ・納品・改装。**お金が動く** */
export const BTN_TRADE = 0xddc9a3
export const BTN_TRADE_HOVER = 0xd1b888
export const BTN_TRADE_OFF = 0xdfd9cb
/** 工房。**手を動かす** */
export const BTN_CRAFT = 0xcdbed6
export const BTN_CRAFT_HOVER = 0xbda9c9
export const BTN_CRAFT_OFF = 0xdcd5df
/** 戻る・取り消す・閉じる */
export const BTN_BACK = 0xd5d0c5
export const BTN_BACK_HOVER = 0xc3bcae
export const BTN_BACK_OFF = 0xdddad3
/** ボタンの字。⚠ **既定色に任せないこと**（押せない時に字が残って見える） */
export const BTN_TEXT = 0x303a36
export const BTN_TEXT_OFF = 0x727970

// ─── E 一覧の行と、打ち込むところ ───────────────────────────
/** 仕入れの一覧で、**いま居る島の産**（安く買える行） */
export const ROW_LOCAL = 0xdce6cf
/** 島によらず買える行。**標準の状態**なので区画と同じ地 */
export const ROW_ANY = 0xefeee4
/** **この先の島**でしか買えない行。⚠ **上の2つのどちらとも見分けが付くこと** */
export const ROW_UPCOMING = 0xddd9df
/** 絞り込み・タブが入っているとき。**選んでいる色を共有する** */
export const FILTER_ON_BG = 0x234e78
export const FILTER_ON_TEXT = 0xfaf7ee
/** 切っているとき。標準の面と字に戻す */
export const FILTER_OFF_BG = 0xefeee4
export const FILTER_OFF_TEXT = 0x303a36
/** 数量を打ち込む欄。⚠ **HTML の `<input>` なので CSS で当てる**（`domInput.ts`） */
export const INPUT_BG = 0xfaf7ee
export const INPUT_TEXT = 0x303a36
export const INPUT_BORDER = 0x727970
/** 打ち込んでいる最中の外枠。**選んでいる色と同じ** */
export const FOCUS_RING = 0x234e78
/** メッセージ欄の右端。**動かせることが分かる濃さ** */
export const SCROLL_THUMB = 0x727970

// ─── F 品の色（主種類の4色） ────────────────────────────────
/**
 * ⚠ **品ごとに色を持たせないこと**（PO 判断 2026-09-14「4色でいいよ」）。
 *   **以前は161品それぞれ違う色**で、`鉄` と `釘`、`いちご` と `ジャムパン` のように
 *   **見分けられない組が多数あった。**
 *
 * **実測**: 4色どうし ΔE 42〜85 ／ 売り場の地に対して 1.58〜2.37 ／
 * **状態の色6つとの最小 ΔE 26.5。**
 *
 * ⚠ **升にも一覧にも品名が出る。**色は種類を束ねるためのもので、品を見分けるものではない。
 */
const KIND_COLOR: Readonly<Record<MainKind, number>> = {
  食料: 0xc89884,
  飲みもの: 0x84b3c8,
  衣類: 0xba84c8,
  道具: 0x91c884,
}

export const kindColor = (kind: MainKind): number => KIND_COLOR[kind]
