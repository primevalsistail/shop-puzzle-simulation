import Phaser from 'phaser'
import type { ItemDef, ItemRegistry } from '../components/items/ItemRegistry.js'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { Inventory } from '../components/economy/Inventory.js'
import { ListPaging, KIND_BUTTONS } from './ListPaging.js'
import { MAX_QUANTITY } from '../components/economy/Inventory.js'
import type { IslandName } from '../taxonomy/islands.js'
import type { UpcomingStock } from '../taxonomy/evaluate.js'
import { SearchBox } from './SearchBox.js'
import { money } from './money.js'
import { createInput, tryAddDom, readCount } from './domInput.js'
import type { PlaceFrame } from './PlaceFrame.js'
import { CONTENT_DEPTH } from './PlaceFrame.js'
import {
  PLACE_CX, CONTENT_L, CONTENT_R,
  FILTER_Y, FILTER_Y_NO_SUBTITLE, LIST_SEARCH_W, LIST_SEARCH_H,
  ROWS_TOP, ROWS_TOP_NO_SUBTITLE, PAGER_Y, rowsThatFit,
  BUY_W, BUY_BTN_W, BUY_TOTAL_FONT_PX, BUY_FONT_PX, BUY_LABEL,
  BUY_REASON_FUNDS, buyReasonCap, QTY_REASON_EMPTY, QTY_REASON_NOT_INT,
  INFO_FONT_PX, LOG_T,
  ROW_NAME_X, ROW_BUY_L, ROW_BUY_BTN_L, ROW_TOTAL_R,
  ROW_MAX_L, ROW_MAX_W, ROW_PLUS_L, ROW_INPUT_L, ROW_INPUT_W, ROW_INPUT_H,
  ROW_MINUS_L, ROW_STEP_W, ROW_INFO_R,
  UPCOMING_FONT_PX, upcomingLabel,
  PEDDLER_TITLE, PEDDLER_REMAIN_FONT_PX, peddlerRemainText,
  TAB_ROW_TITLE_FONT_PX,
  BUY_FILTER_FONT_PX, BUY_EMPTY_FONT_PX, BUY_QTY_FONT_PX, BUY_STEP_BTN_FONT_PX,
  BUY_PAGER_ARROW_FONT_PX, BUY_PAGER_FONT_PX, BUY_RANGE_FONT_PX,
} from './layout.js'
import type { PeddlerStock } from '../components/progress/PeddlerStock.js'
import {
  BTN_BACK,
  BTN_BACK_HOVER,
  BTN_TEXT,
  BTN_TEXT_OFF,
  BTN_TRADE,
  BTN_TRADE_OFF,
  FILTER_OFF_BG,
  FILTER_OFF_TEXT,
  FILTER_ON_BG,
  FILTER_ON_TEXT,
  INPUT_BG,
  INPUT_BORDER,
  LINE_STRONG,
  LINE_WEAK,
  ROW_ANY,
  ROW_LOCAL,
  ROW_UPCOMING,
  ST_SELECTED,
  TEXT_BODY,
  TEXT_SUB,
  TEXT_WEAK,
  css,
} from './palette.js'

const ROW_H = 84
/** ⚠ **決め打ちしない。**領域の高さから出す（`layout.ts`） */
const VISIBLE_COUNT = rowsThatFit(ROW_H)
/**
 * **行商人の1頁**（#105）。**見出しの下の1行が無いので一覧が上から始まる**ぶん、
 * 島の商人より多く入りうる。
 *
 * ⚠ **`VISIBLE_COUNT` を使い回さないこと。**上端が違えば入る行数も違う。
 * ⚠ **いまの寸法ではどちらも 8行**（詰めたのは 27px で、行は 84px あるため）。
 *   **`ROWS_TOP` や `PAGER_Y` を動かすとここだけ増える**ので、値ではなく式で持つ。
 */
const VISIBLE_COUNT_PEDDLER = rowsThatFit(ROW_H, ROWS_TOP_NO_SUBTITLE)
/** 何個買うかの初期値。**固定ではない**（打ち込める） */
const DEFAULT_QTY = 5

/** 行の帯の幅。⚠ **列（`ROW_*`）は `layout.ts` が持つ。ここに式を写さないこと** */
const ROW_W = CONTENT_R - CONTENT_L

/**
 * 行の背景色。**産地を字ではなく色で出し分ける**（PO 指示 2026-09-13
 * 「`この島の産` は不要。色による出し分けがいい」「特産品と背景色を変える」）。
 *
 * ⚠ **緑がこの島の産。**産地割引が乗っているのはこの行だけで、
 *   **島を出ると同じ品が青の行に変わる**（`まぐろ` のように `origin: なし` の品は常に青）。
 * ⚠ **行商人には産地割引が無い**ので、あちらは全部青になる。
 */
const ROW_BG_LOCAL = ROW_LOCAL
const ROW_BG_ANY = ROW_ANY
/** まだ買えない行（#66）。⚠ **買える2色のどちらとも違うこと** */
const ROW_BG_UPCOMING = ROW_UPCOMING

/** 1行ぶんの、あとから書き換える部品 */
interface Row {
  readonly item: ItemDef
  readonly unitCost: number
  readonly input: HTMLInputElement
  /** DOM が使えないときの数字表示 */
  readonly valueText?: Phaser.GameObjects.Text
  readonly infoText: Phaser.GameObjects.Text
  /** ⚠ **ボタンの外**に置く総額（PO 指示 2026-09-13）。**ボタンの字と混ぜない** */
  readonly totalText: Phaser.GameObjects.Text
  readonly buyBg: Phaser.GameObjects.Rectangle
  readonly buyLabel: Phaser.GameObjects.Text
}

/**
 * 島の商人。**「取引」の `商人` タブ**（#96。それまでは `商人のところ` という独立した場所だった）。
 *
 * ⚠ **枠は自分で出さない**（`enter` / `leave`）。**例外は行商人**（`openPeddler`）で、
 *   あちらは「取引」の中ではなく、できごとの窓から行く独立した場所のまま。
 *
 * ⚠ **品揃えは固定ではない。**`merchantListing` が現在地と累計販売数から出す（#30・#66）。
 *   ハルヴェラ・累計販売0の時点で **18品**。売るほど U2 で増えるので、
 *   画面に収まらない。**ホイールで送れないと下の品に手が届かない。**
 *
 * ⚠ **並ぶのは「買えるもの」だけではない**（#66・PO 決定 2026-09-13）。
 *   **一度でも手にした品**は、まだ U2 を通っていなくても `あとN個売れば並ぶ` の行として出る。
 *   **その行は買えない。**買う部品（− ＋ 最大 買う ／ 個数の `<input>`）を**そもそも作らない。**
 */
export class PurchaseMenu {
  /**
   * **行商人バレンとして開いているとき**の、その日の積荷（#9）。島の商人なら `null`。
   *
   * ## なぜ別のクラスにせず、ここを分岐させたか（main の技術判断）
   *
   * 違うのは**6箇所だけ**（値段・行の色／`残り N個`・見出しの下の1行・
   * 買える上限・買えない理由・買ったあとの減算）で、
   * 残り全部 —— 行の組み立て・ページ送り・検索・`<input>`・`最大`・金額の書き方 —— は同じ。
   * **別クラスにするとその全部が写しになり、片方だけ直す事故が起きる**
   * （寸法の写しを禁じているのと同じ理由。`layout.ts` の注記）。
   */
  private peddler: PeddlerStock | null = null
  private container: Phaser.GameObjects.Container | null = null
  private isOpen = false
  /**
   * 枠（`PlaceFrame`）を自分で出したか。
   *
   * **行商人は自分の場所を持つ**ので true。**島の商人は「取引」の1タブ**（#96）なので false で、
   * ⚠ **枠を出すのも片付けるのも `TradeMenu` の仕事。**ここで `frame.hide()` を呼ぶと
   *   タブを切り替えただけで店に帰ってしまう。
   */
  private ownsFrame = false
  private materials: ItemDef[] = []
  private islandName: IslandName = 'ハルヴェラ'
  /**
   * ⚠ **`begin()` で作り直す。**1頁に入る行数が**島の商人と行商人で違いうる**ため
   *   （`VISIBLE_COUNT` / `VISIBLE_COUNT_PEDDLER`）。**module 定数のまま固定しない。**
   */
  private paging = new ListPaging(VISIBLE_COUNT)
  /** 棚から「これを補充したい」と来た品。1行だけ目立たせる */
  private focusId: string | null = null
  /** ⚠ **一覧とは別に持つ。**一緒に作り直すと打鍵のたびにカーソルが飛ぶ（#55） */
  private search: SearchBox
  /** 1行ぶんの部品。**打鍵では作り直さない**（カーソルが飛ぶ） */
  private rows: Row[] = []
  /** 品ごとに打ち込んだ個数。買ったあとも覚えておく */
  private amounts = new Map<string, number>()
  /**
   * まだ買えない品の「あと何個」（#66）。**ここに載っている品の行は買えない。**
   *
   * ⚠ **しきい値（100）は持たない。**`salesUntilBuyable` が規則を評価して出した残りだけ。
   */
  private salesLeft = new Map<string, number>()

  constructor(
    private scene: Phaser.Scene,
    private registry: ItemRegistry,
    private economy: EconomyManager,
    private inventory: Inventory,
    private frame: PlaceFrame,
    private onClose: () => void,
  ) {
    this.search = new SearchBox(scene)
    this.scene.input.on('wheel', (
      pointer: Phaser.Input.Pointer,
      _over: unknown, _dx: number, dy: number,
    ) => {
      if (!this.isOpen) return
      // ⚠ **ログ欄の上でのホイールはログの遡り**（#40）。ここでページを送らない
      if (pointer.y >= LOG_T) return
      if (this.paging.movePage(dy > 0 ? 1 : -1, this.shown().length)) this.rebuild()
    })
  }

  /**
   * @param materials いま買える品（`merchantListing().stocked`）
   * @param upcoming  もうすぐ買える品（同 `.upcoming`）。**買えない行**として並ぶ（#66）
   */
  enter(
    materials: ItemDef[], islandName: IslandName,
    upcoming: readonly UpcomingStock[] = [], focusId?: string,
  ): void {
    if (this.isOpen) return
    this.ownsFrame = false
    this.begin(materials, islandName, null, upcoming, focusId)
  }

  /**
   * **行商人バレンのところ**（#9）。同じ枠を、値段と上限だけ替えて使う。
   *
   * ⚠ **`もうすぐ買える` 行は出さない。**あれは「この島の商人に**あとN個で並ぶ**」という
   *   島の話で（#66）、島を持たない行商人では意味が無い。
   *
   * @param islandName いまいる島。**値段には使わない**（行商人に産地割引は無い）。
   *                   **行の色**（`ROW_BG_LOCAL` / `ROW_BG_ANY`）だけがこれを見る
   */
  openPeddler(stock: PeddlerStock, materials: ItemDef[], islandName: IslandName): void {
    if (this.isOpen) return
    this.ownsFrame = true
    this.frame.show(PEDDLER_TITLE, () => this.close())
    this.begin(materials, islandName, stock)
  }

  /**
   * 中身を組み立てる。**枠（`PlaceFrame`）には触らない。**
   *
   * ⚠ **枠を出すのは呼ぶ側。**行商人は自分で枠を持つが、
   *   島の商人は「取引」の1タブ（`TradeMenu`）なので、**枠はタブの器が持っている。**
   */
  private begin(
    materials: ItemDef[], islandName: IslandName,
    peddler: PeddlerStock | null,
    upcoming: readonly UpcomingStock[] = [], focusId?: string,
  ): void {
    this.isOpen = true
    this.peddler = peddler
    // ⚠ **行数は上端から出す。**行商人は見出しの下が空なので一覧を詰めてある（#105）
    this.paging = new ListPaging(peddler ? VISIBLE_COUNT_PEDDLER : VISIBLE_COUNT)
    // ⚠ **買えるものが先。**買えない行が上に来ると、開いた瞬間に「何も買えない」と読まれる
    this.materials = [...materials, ...upcoming.map(u => u.item)]
    this.salesLeft = new Map(upcoming.map(u => [u.item.id, u.salesLeft]))
    this.islandName = islandName
    this.focusId = focusId ?? null
    this.paging.clearKinds()
    this.paging.setQuery('')
    if (focusId) this.paging.jumpTo(this.shown().findIndex(m => m.id === focusId), this.shown().length)
    this.search.place(
      CONTENT_R - LIST_SEARCH_W / 2, this.filterY(), LIST_SEARCH_W, LIST_SEARCH_H, '名前で探す',
      q => { this.paging.setQuery(q); this.rebuild() },
      CONTENT_DEPTH,
    )
    this.rebuild()
  }

  /**
   * 中身だけ捨てる。**枠には触らない**（タブを切り替えるときに通る）。
   *
   * ⚠ **`<input>` を必ず捨てること。**検索も個数も `search` と `container` にぶら下がっている。
   *   残すとタブを行き来するたびに増える（工房で一度踏んだ事故）。
   */
  leave(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.peddler = null
    this.container?.destroy()
    this.container = null
    this.rows = []
    this.search.destroy()
  }

  /** 枠ごと閉じる。**枠を自分で出したとき（行商人）だけ枠を片付ける** */
  close(): void {
    if (!this.isOpen) return
    const owned = this.ownsFrame
    this.leave()
    this.ownsFrame = false
    if (!owned) return
    this.frame.hide()
    this.onClose()
  }

  isVisible(): boolean {
    return this.isOpen
  }

  /**
   * 一覧の上端。**行商人は見出しの下の1行が無いので詰める**（#105・PO 回答 2026-09-14）。
   *
   * ⚠ **島の商人（`取引` の1タブ）は詰めない。**3タブが同じ枠を使うので、
   *   **タブを行き来するたびに一覧が跳ねる**（`layout.ts` の注記）。
   */
  private rowsTop(): number {
    return this.peddler ? ROWS_TOP_NO_SUBTITLE : ROWS_TOP
  }

  /** 絞り込みの行。⚠ **一覧と一緒に上がる**（離すと検索欄だけが取り残される） */
  private filterY(): number {
    return this.peddler ? FILTER_Y_NO_SUBTITLE : FILTER_Y
  }

  private shown(): ItemDef[] {
    return this.paging.filter(
      this.materials,
      m => m.mainKind,
      m => m.display.name,
      m => m.display.reading,   // 読みでも引ける（#65）。⚠ 画面には出さない
    )
  }

  private turnPage(delta: number): void {
    if (this.paging.movePage(delta, this.shown().length)) this.rebuild()
  }

  private rebuild(): void {
    this.container?.destroy()
    this.container = null
    this.rows = []
    this.build(this.shown())
  }

  private build(materials: ItemDef[]): void {
    const objs: Phaser.GameObjects.GameObject[] = []
    const total = materials.length

    // ── 見出しの下の1行 ──
    // ⚠ **もうどこにも出さない。**島の商人も行商人も、赤入れはすべて「不要」だった
    //   （PO 指示 2026-09-13。商人タブ3箇所 ＋ 行商人の `今日の品ぞろえ…`）。
    //   **`所持金` も `あと10日` も右パネルの HUD が常に出している**ので、ここは写しだった。
    // ⚠ **帯を残すのは島の商人だけ。**一覧の上端（`ROWS_TOP`）を上げると、
    //   **改装・納品とタブを行き来するたびに一覧が跳ねる**（3タブは同じ枠を使う）。
    //   ⚠ **行商人は自分の枠を持つので詰めてある**（#105・PO 回答 2026-09-14。`rowsTop()`）。

    // ── 絞り込み（主種類） ──
    const btnW = 96, btnH = 33, gap = 12
    const groupW = KIND_BUTTONS.length * btnW + (KIND_BUTTONS.length - 1) * gap
    KIND_BUTTONS.forEach((cat, i) => {
      const bx = PLACE_CX - groupW / 2 + btnW / 2 + i * (btnW + gap)
      const on = this.paging.isKindActive(cat.id)
      const bg = this.scene.add.rectangle(bx, this.filterY(), btnW, btnH, on ? FILTER_ON_BG : FILTER_OFF_BG)
        .setStrokeStyle(1.5, LINE_STRONG)
        .setInteractive({ useHandCursor: true })
      const label = this.scene.add.text(bx, this.filterY(), cat.label, {
        fontSize: `${BUY_FILTER_FONT_PX}px`, color: on ? css(FILTER_ON_TEXT) : css(FILTER_OFF_TEXT),
      }).setOrigin(0.5)
      bg.on('pointerdown', () => { this.paging.toggleKind(cat.id); this.rebuild() })
      objs.push(bg, label)
    })

    this.paging.slice(materials).forEach((mat, i) => {
      const y = this.rowsTop() + ROW_H / 2 + i * ROW_H
      const left = this.salesLeft.get(mat.id)
      // ⚠ **買えない行は別の組み立てを通す。**買う部品を作ってから無効にするのではなく、
      //   **そもそも作らない**（`this.rows` にも入らないので `buy()` から手が届かない）
      if (left !== undefined) this.buildUpcomingRow(mat, left, y, objs)
      else this.buildRow(mat, y, objs)
    })

    // ⚠ **0件のまま何も言わないと、画面がまっさらで不具合に見える。**
    //   理由は「絞り込んだ結果」と「そもそも並んでいない」の2つある（`CraftMenu` と同じ扱い。#48）
    if (total === 0) {
      const filtered = this.paging.hasQuery() || this.paging.hasFilter()
      objs.push(
        this.scene.add.text(PLACE_CX, this.rowsTop() + 90,
          filtered
            ? '商人に、当てはまる品はありません'
            : this.peddler
              // ⚠ **「絞り込んだ結果」と「そもそも無い」を書き分ける**（#48）。
              //   行商人は**今日は積んでいない**だけなので、明日また来ることを言う
              ? '行商人は、今日は何も積んでいません'
              : '商人は、いま何も並べていません', {
          fontSize: `${BUY_EMPTY_FONT_PX}px`, color: css(TEXT_SUB),
        }).setOrigin(0.5),
      )
    }

    this.buildPager(total, objs)

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(CONTENT_DEPTH)
    for (const row of this.rows) this.refreshRow(row)
  }

  private buildPager(total: number, objs: Phaser.GameObjects.GameObject[]): void {
    const pages = this.paging.pageCount(total)
    const cur = this.paging.currentPage(total)
    const arrow = (x: number, text: string, delta: number, enabled: boolean) => {
      const t = this.scene.add.text(x, PAGER_Y, text, {
        fontSize: `${BUY_PAGER_ARROW_FONT_PX}px`, color: enabled ? css(TEXT_SUB) : css(TEXT_WEAK),
      }).setOrigin(0.5)
      if (enabled) {
        t.setInteractive({ useHandCursor: true })
        t.on('pointerdown', () => this.turnPage(delta))
      }
      objs.push(t)
    }
    arrow(PLACE_CX - 90, '◀', -1, cur > 0)
    objs.push(this.scene.add.text(PLACE_CX, PAGER_Y, this.paging.pageLabel(total), {
      fontSize: `${BUY_PAGER_FONT_PX}px`, color: css(TEXT_SUB),
    }).setOrigin(0.5))
    arrow(PLACE_CX + 90, '▶', 1, cur < pages - 1)
    // 件数はページ送りと同じ行に置く。⚠ **見出しの下には出さない**（島の商人は空の帯）
    objs.push(this.scene.add.text(CONTENT_R, PAGER_Y, this.paging.rangeLabel(total), {
      fontSize: `${BUY_RANGE_FONT_PX}px`, color: css(TEXT_SUB),
    }).setOrigin(1, 0.5))
  }

  /**
   * **まだ買えないが、もうすぐ買える**品の行（#66）。
   *
   * ⚠ **買う部品を1つも作らない。**個数の `<input>`・− ＋ 最大・「買う」のどれも置かない。
   *   「作ってから無効にする」ではなく**作らない**ので、押せてしまう経路が残らない。
   * ⚠ **行そのものを暗くする。**買える行と同じ見た目で「あとN個」だけ違うと、
   *   **買えるのに在庫が無いだけ**に読める。
   * ⚠ **産地の色にはしない。**U2 待ちの品は必ず tier>=2 で、
   *   **tier>=2 の品はすべて産地が `なし`**（実測・161品）。**この行は常に「買えない」の色。**
   */
  private buildUpcomingRow(
    mat: ItemDef, salesLeft: number, y: number, objs: Phaser.GameObjects.GameObject[],
  ): void {
    objs.push(
      this.scene.add.rectangle(PLACE_CX, y, ROW_W, ROW_H - 9, ROW_BG_UPCOMING)
        .setStrokeStyle(1.5, LINE_WEAK),
    )

    objs.push(
      this.scene.add.text(ROW_NAME_X, y, mat.display.name, {
        fontSize: `${TAB_ROW_TITLE_FONT_PX}px`, color: css(TEXT_SUB),
      }).setOrigin(0, 0.5),
    )

    // ⚠ **注記を出さない**（買える行と同じ。PO 回答 2026-09-14「基本表示しない」）。

    // ⚠ **「買う」ボタンと同じ右端に、ボタンを作らずに置く。**
    //   文字とその大きさは `layout.ts`（`layout.test.ts` が幅を見ている）
    objs.push(
      this.scene.add.text(ROW_BUY_L + BUY_W, y, upcomingLabel(salesLeft), {
        fontSize: `${UPCOMING_FONT_PX}px`, color: css(TEXT_SUB),
      }).setOrigin(1, 0.5),
    )
  }

  private buildRow(mat: ItemDef, y: number, objs: Phaser.GameObjects.GameObject[]): void {
    // **いまいる島**の買値。産地の島にいる品だけ安い（段4-6 / derive.ts `ORIGIN_DISCOUNT`）。
    // ⚠ **行商人は島ではないので産地割引が乗らず、さらに割増が乗る**（`PeddlerStock.unitCost`）。
    //   `purchasePrice()` に引数を足していないのはこのため（#34 のコメント）
    const unitCost = this.peddler
      ? this.peddler.unitCost(mat.id)
      : this.registry.purchasePriceOf(mat.id, this.islandName)
    const isLocal = !this.peddler && mat.origin === this.islandName

    const focused = mat.id === this.focusId
    // 産地の島であることを、**行の色**で見せる（PO 指示 2026-09-13）。
    // **品に島の名前を足してはいない**（`産地` は元からある軸。ここは値の一致を色にしているだけ）
    objs.push(
      this.scene.add.rectangle(PLACE_CX, y, ROW_W, ROW_H - 9,
        isLocal ? ROW_BG_LOCAL : ROW_BG_ANY)
        .setStrokeStyle(focused ? 3 : 1.5, focused ? ST_SELECTED : LINE_WEAK),
    )

    const nameText = this.scene.add.text(ROW_NAME_X, y, mat.display.name, {
      fontSize: `${TAB_ROW_TITLE_FONT_PX}px`, color: css(TEXT_BODY),
    }).setOrigin(0, 0.5)
    objs.push(nameText)

    // 行商人は**今日これだけしか積んでいない**（#9 の上限10個）。
    // ⚠ **品名の右**に出す。`51レン/個　在庫 100/999` の側に足すと
    //   `INFO_MAX_W`（240px）を超えて左隣に重なる（→ `layout.ts` の注記）
    const left = this.remainingToday(mat.id)
    if (Number.isFinite(left)) {
      objs.push(
        this.scene.add.text(nameText.x + nameText.width + 12, y,
          peddlerRemainText(left), {
          fontSize: `${PEDDLER_REMAIN_FONT_PX}px`, color: css(TEXT_SUB),
        }).setOrigin(0, 0.5),
      )
    }

    // ⚠ **`N品に要る` の注記は、素のものも橙の警告も出さない**
    //   （PO 指示 2026-09-13「不要」／ PO 回答 2026-09-14「基本表示しない」）。
    //   **島の商人タブと行商人の両方に効く**（同じ組み立てを通るため）。
    //   ⚠ **戻すなら `expandToMaterials`（`taxonomy/materials.ts`）でレシピから数え直すこと。**
    //   **本数と数をまとめて数える導出は本番に無い**（読み手がゼロだったので
    //   `taxonomy/materials.test.ts` へ移した。#115）。
    //   **画面から消えたので、`PurchaseMenu` はもう素材の要り用を持っていない。**

    // ⚠ **大きさは `layout.ts` の `INFO_FONT_PX`。**12px だと4桁の仕入れ値で左隣に重なる
    const infoText = this.scene.add.text(ROW_INFO_R, y, '', {
      fontSize: `${INFO_FONT_PX}px`, color: css(TEXT_SUB),
    }).setOrigin(1, 0.5)
    objs.push(infoText)

    // ── 個数 ── ⚠ **5個固定をやめた**（PO 2026-09-12）。打ち込んで指定できる
    const input = createInput(this.scene, {
      width: ROW_INPUT_W, height: ROW_INPUT_H, numeric: true,
      value: String(this.amounts.get(mat.id) ?? DEFAULT_QTY),
      onInput: () => {
        const row = this.rows.find(r => r.item.id === mat.id)
        if (row) this.refreshRow(row)
      },
    })

    // DOM が使えない設定でも**画面全体を道連れにしない。**
    // 使えないときは数字を出すだけにして、− ＋ 最大 で操作できるようにする
    let valueText: Phaser.GameObjects.Text | undefined
    // ⚠ **`tryAddDom` は左上基点**（`domInput.ts` の注記）
    const domEl = tryAddDom(this.scene, ROW_INPUT_L, y - ROW_INPUT_H / 2, input, '仕入れの個数入力')
    if (domEl) {
      objs.push(domEl)
    } else {
      objs.push(
        this.scene.add.rectangle(ROW_INPUT_L + ROW_INPUT_W / 2, y, ROW_INPUT_W, ROW_INPUT_H, INPUT_BG)
          .setStrokeStyle(1.5, INPUT_BORDER),
      )
      valueText = this.scene.add.text(ROW_INPUT_L + ROW_INPUT_W - 9, y, input.value, {
        fontSize: `${BUY_QTY_FONT_PX}px`, color: css(TEXT_BODY),
      }).setOrigin(1, 0.5)
      objs.push(valueText)
    }

    // ⚠ **総額はボタンの外**（PO 指示 2026-09-13）。右そろえで、ボタンとのあいだを空ける
    const totalText = this.scene.add.text(ROW_TOTAL_R, y, '', {
      fontSize: `${BUY_TOTAL_FONT_PX}px`, color: css(TEXT_BODY),
    }).setOrigin(1, 0.5)
    objs.push(totalText)

    const buyBg = this.scene.add.rectangle(ROW_BUY_BTN_L + BUY_BTN_W / 2, y, BUY_BTN_W, 39, BTN_TRADE)
      .setStrokeStyle(1.5, LINE_STRONG)
    const buyLabel = this.scene.add.text(ROW_BUY_BTN_L + BUY_BTN_W / 2, y, '', {
      fontSize: `${BUY_FONT_PX}px`, color: css(TEXT_BODY),
    }).setOrigin(0.5)
    objs.push(buyBg, buyLabel)

    const row: Row = { item: mat, unitCost, input, valueText, infoText, totalText, buyBg, buyLabel }
    buyBg.on('pointerdown', () => this.buy(row))

    this.pushButton(objs, ROW_MINUS_L, y, ROW_STEP_W, ROW_INPUT_H, '−', () => this.step(row, -1))
    this.pushButton(objs, ROW_PLUS_L, y, ROW_STEP_W, ROW_INPUT_H, '＋', () => this.step(row, 1))
    this.pushButton(objs, ROW_MAX_L, y, ROW_MAX_W, ROW_INPUT_H, '最大',
      () => this.setValue(row, this.maxBuyable(row)))

    this.rows.push(row)
  }

  /**
   * いくつまで買えるか。**お金と在庫の上限のうち、少ないほう**（最低1）。
   *
   * ⚠ **行商人はその日の積荷も上限になる**（#9。各10個まで）。
   */
  private maxBuyable(row: Row): number {
    // ⚠ **ただの品は金で止まらない**（救済の品）。`Math.max(1, ...)` のままだと
    //   **所持金0のときに `最大` が 1個**になり、**詰みから戻る手が1個ずつになる**
    const byMoney = row.unitCost <= 0
      ? Infinity
      : Math.floor(this.economy.getMoney() / row.unitCost)
    const byRoom = this.inventory.spaceFor(row.item.id)
    return Math.max(1, Math.min(byMoney, byRoom, this.remainingToday(row.item.id)))
  }

  /**
   * **今日あと何個買えるか。**上限が無ければ `Infinity`。
   *
   * ⚠ **「その日ぶん」の上限はこの1本にまとめる。**いまは**行商人の積荷**（#9）だけ。
   *   足すときもここへ足す（読み手は買える数・買えない理由・行の `残り N個` の3箇所）。
   */
  private remainingToday(id: string): number {
    return this.peddler ? this.peddler.remaining(id) : Infinity
  }

  private setValue(row: Row, qty: number): void {
    row.input.value = String(qty)
    this.refreshRow(row)
  }

  private step(row: Row, delta: number): void {
    this.setValue(row, Math.max(1, (readCount(row.input.value) ?? DEFAULT_QTY) + delta))
  }

  /**
   * 1行ぶんの表示を今の入力に合わせる。
   *
   * ⚠ **入力を勝手に直さない**（丸めも字の置き換えもしない）。
   *   上限超過も整数でない入力も、**理由を出して「買う」を無効にするだけ。**
   *   直すと `1.5` が `15` に化けて、意図しない個数を買わせることになる。
   */
  private refreshRow(row: Row): void {
    const qty = readCount(row.input.value)
    if (qty !== null) this.amounts.set(row.item.id, qty)
    row.valueText?.setText(row.input.value)

    const stock = this.inventory.getQuantity(row.item.id)
    row.infoText.setText(`${money(row.unitCost)}/個　在庫 ${stock}/${MAX_QUANTITY}`)

    const reason = this.reasonFor(row, qty)
    // ⚠ **総額とボタンの字を混ぜないこと**（PO 指示 2026-09-13）。
    //   **個数が読めないときだけ**、総額の場所にその理由が出る（出せる総額が無いため）。
    //   ⚠ **理由に金額を足さないこと。**総額はすぐ左に出ているので、繰り返すとボタンから出る
    row.totalText.setText(qty === null ? reason : money(row.unitCost * qty))
    row.totalText.setColor(reason === '' ? css(TEXT_BODY) : css(TEXT_WEAK))
    row.buyLabel.setText(qty === null || reason === '' ? BUY_LABEL : reason)
    row.buyLabel.setColor(reason === '' ? css(BTN_TEXT) : css(BTN_TEXT_OFF))
    row.buyBg.setFillStyle(reason === '' ? BTN_TRADE : BTN_TRADE_OFF)
    if (reason === '') row.buyBg.setInteractive({ useHandCursor: true })
    else row.buyBg.disableInteractive()
  }

  /**
   * 買えない理由。買えるなら空文字。
   *
   * ⚠ **短いものだけ**（`layout.ts` の `BUY_REASON_*` / `QTY_REASON_*`）。
   *   **個数が読めない2つは総額の場所**（`BUY_TOTAL_W`）、**残りはボタンの中**（`BUY_BTN_W`）に出る。
   */
  private reasonFor(row: Row, qty: number | null): string {
    if (qty === null) {
      return row.input.value.trim() === '' ? QTY_REASON_EMPTY : QTY_REASON_NOT_INT
    }
    // **上限を超える買い物はさせない。**払ってから溢れて消える、を起こさないため（段4-7）
    if (this.inventory.spaceFor(row.item.id) < qty) return buyReasonCap(MAX_QUANTITY)
    // ⚠ **その日ぶんの上限より多くは買えない**（行商人の積荷 #9）。
    //   在庫の上限と同じで、**払う前に止める**
    const left = this.remainingToday(row.item.id)
    if (left < qty) return peddlerRemainText(left)
    if (!this.economy.canAfford(row.unitCost * qty)) return BUY_REASON_FUNDS
    return ''
  }

  private buy(row: Row): void {
    const qty = readCount(row.input.value)
    if (qty === null || this.reasonFor(row, qty) !== '') return
    if (!this.economy.spend(row.unitCost * qty)) return
    // ⚠ **積荷を先に減らす。**減らさないと閉じて開き直すだけで何度でも買え、
    //   **10個の上限が意味を失う**（`PeddlerStock` の注記）
    this.peddler?.take(row.item.id, qty)
    this.inventory.add(row.item.id, qty)
    this.rebuild()  // 買ったあとは所持金も在庫も変わるので、ここでは作り直してよい
  }

  /** 矩形＋中央ぞろえの文字でボタンを作る。幅は指定どおりなので隣と重ならない */
  private pushButton(
    objs: Phaser.GameObjects.GameObject[],
    left: number, cy: number, w: number, h: number,
    label: string, onClick: () => void,
  ): void {
    const cx = left + w / 2
    const bg = this.scene.add.rectangle(cx, cy, w, h, BTN_BACK)
      .setStrokeStyle(1.5, LINE_STRONG)
      .setInteractive({ useHandCursor: true })
    bg.on('pointerdown', onClick)
    bg.on('pointerover', () => bg.setFillStyle(BTN_BACK_HOVER))
    bg.on('pointerout', () => bg.setFillStyle(BTN_BACK))
    objs.push(
      bg,
      this.scene.add.text(cx, cy, label, { fontSize: `${BUY_STEP_BTN_FONT_PX}px`, color: css(BTN_TEXT) }).setOrigin(0.5),
    )
  }
}
