import Phaser from 'phaser'
import type { ItemDef, ItemRegistry } from '../components/items/ItemRegistry.js'
import type { EconomyManager } from '../components/economy/EconomyManager.js'
import type { Inventory } from '../components/economy/Inventory.js'
import { ListPaging, KIND_BUTTONS } from './ListPaging.js'
import { MAX_QUANTITY } from '../components/economy/Inventory.js'
import type { IslandName } from '../taxonomy/islands.js'
import type { MaterialNeed } from '../taxonomy/materials.js'
import type { ItemId } from '../taxonomy/axes.js'
import type { UpcomingStock } from '../taxonomy/evaluate.js'
import { SearchBox } from './SearchBox.js'
import { money } from './money.js'
import { createInput, tryAddDom, readCount } from './domInput.js'
import type { PlaceFrame } from './PlaceFrame.js'
import { CONTENT_DEPTH } from './PlaceFrame.js'
import {
  PLACE_CX, CONTENT_L, CONTENT_R,
  SUBTITLE_Y, FILTER_Y, ROWS_TOP, PAGER_Y, rowsThatFit,
  BUY_W, BUY_FONT_PX, BUY_SUFFIX, INFO_MAX_W, INFO_FONT_PX, LOG_T,
  UPCOMING_FONT_PX, upcomingLabel,
  PEDDLER_TITLE, PEDDLER_REMAIN_FONT_PX, peddlerRemainText, peddlerSubtitleText,
} from './layout.js'
import type { PeddlerStock } from '../components/progress/PeddlerStock.js'

const ROW_H = 56
/** ⚠ **決め打ちしない。**領域の高さから出す（`layout.ts`） */
const VISIBLE_COUNT = rowsThatFit(ROW_H)
/** 何個買うかの初期値。**固定ではない**（打ち込める） */
const DEFAULT_QTY = 5
/** 検索の入力欄。絞り込みの行の右端に置く */
const SEARCH_W = 160
const SEARCH_H = 24

const INPUT_W = 52
const INPUT_H = 22
const STEP_W = 26

/**
 * 1行の中の列。**右端から順に決める。**
 * こうしておくと領域の幅が変わっても、操作列が name に食い込まない。
 */
const ROW_W = CONTENT_R - CONTENT_L
const NAME_X = CONTENT_L + 16
/** ⚠ **`BUY_W` は `layout.ts` にある**（`3,237,759レン 買う` が収まるかをテストが見ている） */
const BUY_L = CONTENT_R - 8 - BUY_W
const MAX_W = 40
const MAX_L = BUY_L - 6 - MAX_W
const PLUS_L = MAX_L - 6 - STEP_W
const INPUT_L = PLUS_L - 4 - INPUT_W
const MINUS_L = INPUT_L - 4 - STEP_W
/** 「51レン/個　在庫 100/999」。右そろえ */
const INFO_R = MINUS_L - 14
/** 「作れるN品に要る」。右そろえ。⚠ **間隔は `layout.ts` の `INFO_MAX_W`**（テストが見ている） */
const NEED_R = INFO_R - INFO_MAX_W

/** 1行ぶんの、あとから書き換える部品 */
interface Row {
  readonly item: ItemDef
  readonly unitCost: number
  readonly input: HTMLInputElement
  /** DOM が使えないときの数字表示 */
  readonly valueText?: Phaser.GameObjects.Text
  readonly infoText: Phaser.GameObjects.Text
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
   * 違うのは**6箇所だけ**（値段・`この島の産`／`残り N個`・見出しの下の1行・
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
  private paging = new ListPaging(VISIBLE_COUNT)
  /** 棚から「これを補充したい」と来た品。1行だけ目立たせる */
  private focusId: string | null = null
  /** ⚠ **一覧とは別に持つ。**一緒に作り直すと打鍵のたびにカーソルが飛ぶ（#55） */
  private search: SearchBox
  /** この島の素材が、作れる品の何本に要るか（#33）。`open()` で1度だけ数える */
  private needs: Map<ItemId, MaterialNeed> = new Map()
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
    /** 解禁済みのレシピが要する素材（#33）。**開くたびに数え直す** */
    private materialNeeds: () => Map<ItemId, MaterialNeed>,
    /** 次にこの島へ戻るまでの日数（#33） */
    private daysUntilReturn: () => number,
    /** この島をあと何日で出るか。⚠ `daysUntilReturn` の内訳の一部（#33・束M） */
    private daysLeftAtPort: () => number,
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
   *                   行の `N品に要る` の `⚠ 切らしている` がこの島の産かどうかを見る
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
    // ⚠ **買えるものが先。**買えない行が上に来ると、開いた瞬間に「何も買えない」と読まれる
    this.materials = [...materials, ...upcoming.map(u => u.item)]
    this.salesLeft = new Map(upcoming.map(u => [u.item.id, u.salesLeft]))
    this.islandName = islandName
    this.focusId = focusId ?? null
    this.paging.clearKinds()
    this.paging.setQuery('')
    this.needs = this.materialNeeds()
    if (focusId) this.paging.jumpTo(this.shown().findIndex(m => m.id === focusId), this.shown().length)
    this.search.place(
      CONTENT_R - SEARCH_W / 2, FILTER_Y, SEARCH_W, SEARCH_H, '名前で探す',
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
   * その品が、作れる品の材料になっているか（#23）。
   *
   * **これが「買って売るだけではない」の印**になる。品数が増えると、
   * どれが材料でどれが売り物か分からなくなるので、仕入れの行で言う。
   */
  private needOf(mat: ItemDef): MaterialNeed | null {
    return this.needs.get(mat.id) ?? null
  }

  /**
   * **この島でしか買えない**品か（#33）。
   *
   * ⚠ **産地が `なし` の品は違う。**どの島でも買えるので、切らしても取り返せる。
   *   急ぐ必要があるのはこの島の産だけ。
   */
  private isLocalOnly(mat: ItemDef): boolean {
    return mat.origin === this.islandName
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

    // ── 見出しの下の1行 — 所持金 ＋ いつまで買えて、次はいつ買えるか ──
    // ⚠ **何個買うべきかは言わない**（#33「最適解を教えない」）。
    //   切らしている素材は**行ごとの `N品に要る` が言う**ので、まとめ行では言わない（束M）。
    // ⚠ **「次に戻るのは40日後」だけを出さないこと。**この島にはまだ何日か居られるので、
    //   40日後だけ見せると「もう来られない、いま全部買え」と読まれる（束M・ペルソナ2巡目）。
    //   ⚠ **40 の中に 10 が入っている**（`daysLeftAtPort + 3周ぶん`）。両方出して関係を見せる
    // ⚠ **行商人には島が無い**ので、この島を出る日も次に戻る日も言えない（#9）。
    //   代わりに言うのは「**今日の品ぞろえ**」であること。**毎日入れ替わるのが歯止めそのもの**なので、
    //   言わないと島の商人と同じ「いつでもある店」に見える
    const stay = this.daysLeftAtPort()
    const days = this.daysUntilReturn()
    objs.push(
      this.scene.add.text(CONTENT_L, SUBTITLE_Y,
        this.peddler
          ? peddlerSubtitleText(money(this.economy.getMoney()))
          : `所持金 ${money(this.economy.getMoney())}　`
            + `あと${stay}日でこの島を出る（次に戻るのは${days}日後）`, {
        fontSize: '15px', color: '#ffdd44',
      }).setOrigin(0, 0.5),
    )

    // ⚠ **まだ1本も作れないときだけ出す。**#48「0件の理由を書き分ける」の分岐で、
    //   これが無いと**行に `N品に要る` が1つも付かない理由**が画面のどこにも無くなる。
    //   序盤に商人の前へ立って「何を買えばいいのか」の手がかりがゼロになる（束M・ペルソナ2巡目）
    if (this.needs.size === 0) {
      objs.push(
        this.scene.add.text(CONTENT_R, SUBTITLE_Y, 'まだ作れるものが無い', {
          fontSize: '13px', color: '#889999',
        }).setOrigin(1, 0.5),
      )
    }

    // ── 絞り込み（主種類） ──
    const btnW = 64, btnH = 22, gap = 8
    const groupW = KIND_BUTTONS.length * btnW + (KIND_BUTTONS.length - 1) * gap
    KIND_BUTTONS.forEach((cat, i) => {
      const bx = PLACE_CX - groupW / 2 + btnW / 2 + i * (btnW + gap)
      const on = this.paging.isKindActive(cat.id)
      const bg = this.scene.add.rectangle(bx, FILTER_Y, btnW, btnH, on ? 0x6a5a2a : 0x232338)
        .setStrokeStyle(1, on ? 0xbb9944 : 0x444455)
        .setInteractive({ useHandCursor: true })
      const label = this.scene.add.text(bx, FILTER_Y, cat.label, {
        fontSize: '12px', color: on ? '#ffdd88' : '#778899',
      }).setOrigin(0.5)
      bg.on('pointerdown', () => { this.paging.toggleKind(cat.id); this.rebuild() })
      objs.push(bg, label)
    })

    this.paging.slice(materials).forEach((mat, i) => {
      const y = ROWS_TOP + ROW_H / 2 + i * ROW_H
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
        this.scene.add.text(PLACE_CX, ROWS_TOP + 60,
          filtered
            ? '商人に、当てはまる品はありません'
            : this.peddler
              // ⚠ **「絞り込んだ結果」と「そもそも無い」を書き分ける**（#48）。
              //   行商人は**今日は積んでいない**だけなので、明日また来ることを言う
              ? '行商人は、今日は何も積んでいません'
              : '商人は、いま何も並べていません', {
          fontSize: '14px', color: '#889999',
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
        fontSize: '18px', color: enabled ? '#ffdd88' : '#555566',
      }).setOrigin(0.5)
      if (enabled) {
        t.setInteractive({ useHandCursor: true })
        t.on('pointerdown', () => this.turnPage(delta))
      }
      objs.push(t)
    }
    arrow(PLACE_CX - 60, '◀', -1, cur > 0)
    objs.push(this.scene.add.text(PLACE_CX, PAGER_Y, this.paging.pageLabel(total), {
      fontSize: '13px', color: '#aa9977',
    }).setOrigin(0.5))
    arrow(PLACE_CX + 60, '▶', 1, cur < pages - 1)
    // 件数はページ送りと同じ行に置く。見出しの下は所持金と不足の知らせで埋まっている
    objs.push(this.scene.add.text(CONTENT_R, PAGER_Y, this.paging.rangeLabel(total), {
      fontSize: '13px', color: '#aa9977',
    }).setOrigin(1, 0.5))
  }

  /**
   * **まだ買えないが、もうすぐ買える**品の行（#66）。
   *
   * ⚠ **買う部品を1つも作らない。**個数の `<input>`・− ＋ 最大・「買う」のどれも置かない。
   *   「作ってから無効にする」ではなく**作らない**ので、押せてしまう経路が残らない。
   * ⚠ **行そのものを暗くする。**買える行と同じ見た目で「あとN個」だけ違うと、
   *   **買えるのに在庫が無いだけ**に読める。
   * ⚠ **`この島の産` は出ない。**U2 待ちの品は必ず tier>=2 で、
   *   **tier>=2 の品はすべて産地が `なし`**（実測・161品）。産地の島の行の 5.6px 問題には当たらない。
   */
  private buildUpcomingRow(
    mat: ItemDef, salesLeft: number, y: number, objs: Phaser.GameObjects.GameObject[],
  ): void {
    objs.push(
      this.scene.add.rectangle(PLACE_CX, y, ROW_W, ROW_H - 6, 0x2a2a2a)
        .setStrokeStyle(1, 0x444444),
    )

    objs.push(
      this.scene.add.text(NAME_X, y, mat.display.name, {
        fontSize: '15px', color: '#998877',
      }).setOrigin(0, 0.5),
    )

    // 作れる品の材料になっているなら、買える行と同じように言う（#23）。
    // ⚠ **`⚠ 切らしている` は出さない。**急いでも買えないので、急かす意味が無い
    const need = this.needOf(mat)
    if (need) {
      objs.push(
        this.scene.add.text(NEED_R, y, `${need.recipes}品に要る`, {
          fontSize: '12px', color: '#667788',
        }).setOrigin(1, 0.5),
      )
    }

    // ⚠ **「買う」ボタンと同じ右端に、ボタンを作らずに置く。**
    //   文字とその大きさは `layout.ts`（`layout.test.ts` が幅を見ている）
    objs.push(
      this.scene.add.text(BUY_L + BUY_W, y, upcomingLabel(salesLeft), {
        fontSize: `${UPCOMING_FONT_PX}px`, color: '#aa9977',
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
    objs.push(
      this.scene.add.rectangle(PLACE_CX, y, ROW_W, ROW_H - 6, 0x2a3a2a)
        .setStrokeStyle(focused ? 2 : 1, focused ? 0xffdd88 : 0x555555),
    )

    const nameText = this.scene.add.text(NAME_X, y, mat.display.name, {
      fontSize: '15px', color: '#ffffff',
    }).setOrigin(0, 0.5)
    objs.push(nameText)

    // 産地の島であることを、値引きの理由として見せる。**品に島の名前を足してはいない**
    // （`産地` は元からある軸。ここは値の一致を表示しているだけ）
    if (isLocal) {
      objs.push(
        this.scene.add.text(nameText.x + nameText.width + 8, y, 'この島の産', {
          fontSize: '11px', color: '#88ddaa',
        }).setOrigin(0, 0.5),
      )
    }

    // 行商人は**今日これだけしか積んでいない**（#9 の上限10個）。
    // ⚠ **`この島の産` と同じ場所に出す。**`51レン/個　在庫 100/999` の側に足すと
    //   `INFO_MAX_W`（160px）を超えて左隣に重なる（→ `layout.ts` の注記）
    if (this.peddler) {
      objs.push(
        this.scene.add.text(nameText.x + nameText.width + 8, y,
          peddlerRemainText(this.peddler.remaining(mat.id)), {
          fontSize: `${PEDDLER_REMAIN_FONT_PX}px`, color: '#ddbb88',
        }).setOrigin(0, 0.5),
      )
    }

    // 作れる品の材料になっているなら、その本数を出す（#23）。
    // **この島でしか買えない**うえ切らしているなら、急ぐ理由として強く出す（#33）。
    // ⚠ **必要数は出さない。**誰も「1回ずつ」は作らないので嘘になる
    const need = this.needOf(mat)
    if (need) {
      const urgent = this.isLocalOnly(mat) && this.inventory.getQuantity(mat.id) === 0
      objs.push(
        this.scene.add.text(NEED_R, y,
          urgent ? `⚠ 切らしている（${need.recipes}品に要る）` : `${need.recipes}品に要る`, {
          fontSize: '12px', color: urgent ? '#ffaa66' : '#8899aa',
        }).setOrigin(1, 0.5),
      )
    }

    // ⚠ **大きさは `layout.ts` の `INFO_FONT_PX`。**12px だと4桁の仕入れ値で左隣に重なる
    const infoText = this.scene.add.text(INFO_R, y, '', {
      fontSize: `${INFO_FONT_PX}px`, color: '#aaaaaa',
    }).setOrigin(1, 0.5)
    objs.push(infoText)

    // ── 個数 ── ⚠ **5個固定をやめた**（PO 2026-09-12）。打ち込んで指定できる
    const input = createInput(this.scene, {
      width: INPUT_W, height: INPUT_H, numeric: true,
      value: String(this.amounts.get(mat.id) ?? DEFAULT_QTY),
      onInput: () => {
        const row = this.rows.find(r => r.item.id === mat.id)
        if (row) this.refreshRow(row)
      },
    })

    // DOM が使えない設定でも**画面全体を道連れにしない。**
    // 使えないときは数字を出すだけにして、− ＋ 最大 で操作できるようにする
    let valueText: Phaser.GameObjects.Text | undefined
    const domEl = tryAddDom(this.scene, INPUT_L + INPUT_W / 2, y, input, '仕入れの個数入力')
    if (domEl) {
      objs.push(domEl)
    } else {
      objs.push(
        this.scene.add.rectangle(INPUT_L + INPUT_W / 2, y, INPUT_W, INPUT_H, 0x15152a)
          .setStrokeStyle(1, 0x4a4a8a),
      )
      valueText = this.scene.add.text(INPUT_L + INPUT_W - 6, y, input.value, {
        fontSize: '12px', color: '#ffffff',
      }).setOrigin(1, 0.5)
      objs.push(valueText)
    }

    const buyBg = this.scene.add.rectangle(BUY_L + BUY_W / 2, y, BUY_W, 26, 0x6a5a2a)
      .setStrokeStyle(1, 0x8a7a3a)
    const buyLabel = this.scene.add.text(BUY_L + BUY_W / 2, y, '', {
      fontSize: `${BUY_FONT_PX}px`, color: '#ffffff',
    }).setOrigin(0.5)
    objs.push(buyBg, buyLabel)

    const row: Row = { item: mat, unitCost, input, valueText, infoText, buyBg, buyLabel }
    buyBg.on('pointerdown', () => this.buy(row))

    this.pushButton(objs, MINUS_L, y, STEP_W, INPUT_H, '−', () => this.step(row, -1))
    this.pushButton(objs, PLUS_L, y, STEP_W, INPUT_H, '＋', () => this.step(row, 1))
    this.pushButton(objs, MAX_L, y, MAX_W, INPUT_H, '最大', () => this.setValue(row, this.maxBuyable(row)))

    this.rows.push(row)
  }

  /**
   * いくつまで買えるか。**お金と在庫の上限のうち、少ないほう**（最低1）。
   *
   * ⚠ **行商人はその日の積荷も上限になる**（#9。各10個まで）。
   */
  private maxBuyable(row: Row): number {
    const byMoney = Math.floor(this.economy.getMoney() / Math.max(1, row.unitCost))
    const byRoom = this.inventory.spaceFor(row.item.id)
    const byCart = this.peddler ? this.peddler.remaining(row.item.id) : Infinity
    return Math.max(1, Math.min(byMoney, byRoom, byCart))
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
    const total = qty === null ? 0 : row.unitCost * qty
    // ⚠ **「で」を足さないこと**（`BUY_SUFFIX` の注記）。7桁の合計がボタンから出る
    row.buyLabel.setText(reason === '' ? `${money(total)}${BUY_SUFFIX}` : reason)
    row.buyLabel.setColor(reason === '' ? '#ffffff' : '#998877')
    row.buyBg.setFillStyle(reason === '' ? 0x6a5a2a : 0x3a3a3a)
    if (reason === '') row.buyBg.setInteractive({ useHandCursor: true })
    else row.buyBg.disableInteractive()
  }

  /** 買えない理由。買えるなら空文字 */
  private reasonFor(row: Row, qty: number | null): string {
    if (qty === null) return row.input.value.trim() === '' ? '個数を入れて' : '1以上の整数'
    // **上限を超える買い物はさせない。**払ってから溢れて消える、を起こさないため（段4-7）
    if (this.inventory.spaceFor(row.item.id) < qty) return `上限${MAX_QUANTITY}`
    // ⚠ **行商人の積荷より多くは買えない**（#9）。在庫の上限と同じで、**払う前に止める**
    if (this.peddler && this.peddler.remaining(row.item.id) < qty) {
      return peddlerRemainText(this.peddler.remaining(row.item.id))
    }
    if (!this.economy.canAfford(row.unitCost * qty)) {
      return `${money(row.unitCost * qty)} 足りない`
    }
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
    const bg = this.scene.add.rectangle(cx, cy, w, h, 0x33335a)
      .setStrokeStyle(1, 0x6a6ab0)
      .setInteractive({ useHandCursor: true })
    bg.on('pointerdown', onClick)
    bg.on('pointerover', () => bg.setFillStyle(0x5a5ab0))
    bg.on('pointerout', () => bg.setFillStyle(0x33335a))
    objs.push(
      bg,
      this.scene.add.text(cx, cy, label, { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5),
    )
  }
}
