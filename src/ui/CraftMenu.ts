import Phaser from 'phaser'
import type { CraftingSystem } from '../components/items/CraftingSystem.js'
import type { Inventory } from '../components/economy/Inventory.js'
import type { ItemRegistry, RecipeDef } from '../components/items/ItemRegistry.js'
import type { RecipeUnlocks } from '../components/progress/RecipeUnlocks.js'
import { ListPaging, KIND_BUTTONS } from './ListPaging.js'
import { SearchBox } from './SearchBox.js'
import { createInput, tryAddDom, setGameKeyboard, readCount } from './domInput.js'
import { ConfirmDialog, confirmNeeded } from './ConfirmDialog.js'
import { craftBusinessConfirmLines } from './workshop.js'
import { demandIsland } from '../taxonomy/islands.js'
import type { PlaceFrame } from './PlaceFrame.js'
import { CONTENT_DEPTH } from './PlaceFrame.js'
import {
  PLACE_CX, CONTENT_L, CONTENT_R,
  FILTER_Y_NO_SUBTITLE as FILTER_Y, PAGER_Y, rowsThatFit,
  LIST_SEARCH_W, LIST_SEARCH_H,
  LOG_T, craftTimeLabel,
  CRAFT_HEAD_Y, CRAFT_HEAD_FONT_PX, CRAFT_ROWS_TOP, CRAFT_ROW_H, CRAFT_COLS,
  CRAFT_NAME_L, CRAFT_NAME_W, CRAFT_NAME_FONT_PX, CRAFT_CELL_FONT_PX,
  CRAFT_MADE_R, CRAFT_STOCK_R, CRAFT_TIME_L, CRAFT_TIME_W,
  CRAFT_DEMAND_L, CRAFT_DEMAND_W,
  CRAFT_ING_L, CRAFT_ING_W, craftIngredientsLabel,
  CRAFT_BTN_W, CRAFT_BTN_H, CRAFT_BTN_L, CRAFT_BTN_FONT_PX, CRAFT_BTN_LABEL,
  CRAFT_REASON_INGREDIENTS, CRAFT_REASON_STOCK, CRAFT_REASON_TIME,
  CRAFT_REASON_EMPTY, CRAFT_REASON_NOT_INT,
  CRAFT_STEP_BIG_W, CRAFT_STEP_ONE_W, CRAFT_INPUT_W, CRAFT_INPUT_H, CRAFT_MAX_W,
  CRAFT_STEP_XS, CRAFT_STEP_LABELS, CRAFT_STEP_FONT_PX, CRAFT_STEP_BTN_FONT_PX,
  CRAFT_FILTER_FONT_PX, CRAFT_EMPTY_FONT_PX,
  CRAFT_PAGER_ARROW_FONT_PX, CRAFT_PAGER_FONT_PX, CRAFT_RANGE_FONT_PX,
} from './layout.js'
import {
  BTN_BACK,
  BTN_BACK_HOVER,
  BTN_CRAFT,
  BTN_CRAFT_OFF,
  BTN_TEXT,
  BTN_TEXT_OFF,
  FILTER_OFF_BG,
  FILTER_OFF_TEXT,
  FILTER_ON_BG,
  FILTER_ON_TEXT,
  INPUT_BG,
  INPUT_BORDER,
  LINE_STRONG,
  LINE_WEAK,
  ROW_LOCAL,
  ROW_UPCOMING,
  ST_SELECTED,
  TEXT_BODY,
  TEXT_SUB,
  TEXT_WEAK,
  css,
} from './palette.js'

/**
 * 一度に映る行数。**レシピは106本ある**（#30。ただし並ぶのは解禁済みのぶんだけ。#48）ので、
 * 全部は収まらない。
 *
 * ⚠ **決め打ちしない。**領域の高さから出す（`layout.ts` の `rowsThatFit`）。
 *   手で書くと、領域を動かしたとき最後の行がページ送りへ食い込んでいても気づけない。
 */
// ⚠ **工房は見出しの下の1行が無いので、上端が他の3画面より上にある**（`layout.ts`）
// ⚠ **見出しの行のぶん、一覧の上端は `CRAFT_ROWS_TOP`**（`ROWS_TOP` ではない）
const VISIBLE_ROWS = rowsThatFit(CRAFT_ROW_H, CRAFT_ROWS_TOP)


/** 1行ぶんの、あとから書き換える部品。⚠ **列の順は `layout.ts` の `CRAFT_COLS`** */
interface Row {
  recipe: RecipeDef
  max: number
  input: HTMLInputElement
  /** 回数の欄を載せている入れ物。⚠ **確認の面を出している間は隠す**（#109）。null もありうる */
  dom?: Phaser.GameObjects.DOMElement
  /** DOM が使えないときの数字表示（使えるときは undefined） */
  valueText?: Phaser.GameObjects.Text
  /** `作成数` — **出来高 × 回数**。1回ぶんではない */
  madeText: Phaser.GameObjects.Text
  /** `時間` — `◯分（営業◯分）`（#53） */
  timeText: Phaser.GameObjects.Text
  /** `材料` — `蕎麦の実×3` を並べたもの（#107）。**数は回数を掛けたぶん** */
  ingText: Phaser.GameObjects.Text
  craftBg: Phaser.GameObjects.Rectangle
  craftLabel: Phaser.GameObjects.Text
}

/**
 * クラフトメニュー。
 *
 * 回数は HTML の `<input>` に**直接入力**する（Phaser の DOM コンテナに載せる）。
 * 入力のたびに作り直すとカーソルが飛ぶので、**打鍵ごとに作り直さない。**
 * 文字とボタンの状態だけをその場で書き換える（`refreshRow`）。
 */
export class CraftMenu {
  private container: Phaser.GameObjects.Container | null = null
  private isOpen = false
  private rows: Row[] = []
  /** レシピごとに選んだ回数。閉じても覚えておき、上限で丸める */
  private times = new Map<string, number>()
  private paging = new ListPaging(VISIBLE_ROWS)
  /** 「作れる」だけに絞るか。いま材料と当日の残り時間が足りるものだけ出す */
  private onlyCraftable = false
  /** 棚から「これを作りたい」と来たレシピ */
  private focusId: string | null = null
  /** ⚠ **行とは別に持つ。**一緒に作り直すと打鍵のたびにカーソルが飛ぶ（#55） */
  private search: SearchBox
  /** ⚠ **4つ目の形を作らない。**納品の `廃棄` と同じ面（#109） */
  private confirm: ConfirmDialog

  constructor(
    private scene: Phaser.Scene,
    private craftingSystem: CraftingSystem,
    private inventory: Inventory,
    private registry: ItemRegistry,
    /** 解禁済みのレシピ（#48）。**`registry.getAllRecipes()` を直に並べないこと** */
    private unlocks: RecipeUnlocks,
    private frame: PlaceFrame,
    private onClose: () => void,
  ) {
    this.search = new SearchBox(scene)
    this.confirm = new ConfirmDialog(scene)
    // シーンが終わるとき DOM が残らないようにする
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown())
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.teardown())

    scene.input.on('wheel', (
      pointer: Phaser.Input.Pointer,
      _over: unknown, _dx: number, dy: number,
    ) => {
      if (!this.isOpen) return
      // ⚠ **ログ欄の上でのホイールはログの遡り**（#40）。ここでページを送らない
      if (pointer.y >= LOG_T) return
      if (this.paging.movePage(dy > 0 ? 1 : -1, this.shown().length)) this.rebuild()
    })
  }

  open(focusRecipeId?: string): void {
    if (this.isOpen) return
    this.isOpen = true
    this.paging.setQuery('')
    this.focusId = focusRecipeId ?? null
    if (focusRecipeId) {
      const shown = this.shown()
      this.paging.jumpTo(shown.findIndex(r => r.id === focusRecipeId), shown.length)
    }
    this.frame.show('工房', () => this.close())
    this.search.place(
      CONTENT_R - LIST_SEARCH_W / 2, FILTER_Y, LIST_SEARCH_W, LIST_SEARCH_H, '名前で探す',
      q => { this.paging.setQuery(q); this.rebuild() },
      CONTENT_DEPTH,
    )
    this.build()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    // ⚠ **確認を出したまま表を離れられる**（ESC）。**残すと次に開いた画面の上に居座る**
    this.confirm.close()
    this.teardown()
    this.search.destroy()
    this.frame.hide()
    this.onClose()
  }

  isVisible(): boolean {
    return this.isOpen
  }

  /**
   * いま並べるレシピ。**主種類は「出来上がる品」で見る**（材料ではない）。
   * 「作れる」は材料・在庫の空き・当日の残り時間のすべてを見る（`maxCraftTimes > 0`）。
   *
   * ⚠ **母集合は解禁済みのレシピ**（#48）。全106本を並べない。
   */
  private shown(): RecipeDef[] {
    // ⚠ **主種類も名前も「出来上がる品」で見る**（材料ではない）。行に出ているのが出来上がる品なので
    const byKind = this.paging.filter(
      this.unlocks.unlockedRecipes(),
      r => this.registry.getItem(r.outputItemId).mainKind,
      r => this.registry.getItem(r.outputItemId).display.name,
      // ⚠ **レシピ側に読みは書かない。**出来上がる品の読みで引く（#65）
      r => this.registry.getItem(r.outputItemId).display.reading,
    )
    return this.onlyCraftable
      ? byKind.filter(r => this.craftingSystem.maxCraftTimes(r.id) > 0)
      : byKind
  }

  private turnPage(delta: number): void {
    if (this.paging.movePage(delta, this.shown().length)) this.rebuild()
  }

  /** 画面の部品と DOM を片付け、ゲームのキー入力を戻す */
  private teardown(): void {
    this.container?.destroy() // DOMElement も子なので一緒に消える
    this.container = null
    this.rows = []
    setGameKeyboard(this.scene, true)
  }

  /** 中身だけ作り直す（閉じたことにはしない）。打鍵のたびには呼ばない */
  private rebuild(): void {
    this.container?.destroy()
    this.container = null
    this.rows = []
    // 入力中の要素を消すと blur が来ないことがあるので、ここで必ず戻す
    setGameKeyboard(this.scene, true)
    this.build()
  }

  private build(): void {
    const objs: Phaser.GameObjects.GameObject[] = []
    const shown = this.shown()

    this.buildFilterBar(objs)
    if (shown.length > 0) this.buildHead(objs)
    this.paging.slice(shown).forEach((recipe, i) => {
      this.buildRecipeRow(recipe, CRAFT_ROWS_TOP + CRAFT_ROW_H / 2 + i * CRAFT_ROW_H, objs)
    })
    if (shown.length === 0) {
      // 0件の理由は2つある。**「まだ1本も解禁されていない」を「該当なし」と書かない**
      // ——不具合に見えるうえ、次に何をすれば増えるのかが伝わらない（#48）
      const message = this.unlocks.unlockedRecipes().length === 0
        ? '材料を手に入れると、作れるものが増えていく'
        : '当てはまるレシピがありません'
      objs.push(this.scene.add.text(PLACE_CX, CRAFT_ROWS_TOP + 60, message, {
        fontSize: `${CRAFT_EMPTY_FONT_PX}px`, color: css(TEXT_SUB),
      }).setOrigin(0.5))
    }
    this.buildPager(shown.length, objs)

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(CONTENT_DEPTH)
    for (const row of this.rows) this.refreshRow(row)
  }

  /**
   * 見出しの行（**PO 赤入れ 2026-09-13**「↓のように表示して」）。
   *
   * ⚠ **一覧の上に1回だけ**（納品タブと同じ）。**行の中には入れない。**
   * ⚠ **列の名も位置も `layout.ts` から来る**（`CRAFT_COLS`）。ここに字を書かない。
   */
  private buildHead(objs: Phaser.GameObjects.GameObject[]): void {
    const [name, made, stock, time, demand, ing, qty, craft] = CRAFT_COLS
    const head = (x: number, text: string, originX: number) =>
      objs.push(this.scene.add.text(x, CRAFT_HEAD_Y, text, {
        fontSize: `${CRAFT_HEAD_FONT_PX}px`, color: css(TEXT_SUB),
      }).setOrigin(originX, 0.5))

    head(CRAFT_NAME_L, name, 0)
    head(CRAFT_MADE_R, made, 1)
    head(CRAFT_STOCK_R, stock, 1)
    head(CRAFT_TIME_L, time, 0)
    head(CRAFT_DEMAND_L, demand, 0)
    head(CRAFT_ING_L, ing, 0)
    head(CRAFT_STEP_XS.input + CRAFT_INPUT_W / 2, qty, 0.5)
    head(CRAFT_BTN_L + CRAFT_BTN_W / 2, craft, 0.5)
  }

  /** 絞り込み — 主種類4つ ＋「作れる」 */
  private buildFilterBar(objs: Phaser.GameObjects.GameObject[]): void {
    const btnW = 96, btnH = 33, gap = 12
    const buttons = [
      ...KIND_BUTTONS.map(k => ({
        label: k.label,
        on: this.paging.isKindActive(k.id),
        press: () => { this.paging.toggleKind(k.id); this.rebuild() },
      })),
      {
        label: '作れる',
        on: this.onlyCraftable,
        press: () => {
          this.onlyCraftable = !this.onlyCraftable
          this.paging.setPage(0, this.shown().length)
          this.rebuild()
        },
      },
    ]
    const groupW = buttons.length * btnW + (buttons.length - 1) * gap
    buttons.forEach((b, i) => {
      const bx = PLACE_CX - groupW / 2 + btnW / 2 + i * (btnW + gap)
      const bg = this.scene.add.rectangle(bx, FILTER_Y, btnW, btnH, b.on ? FILTER_ON_BG : FILTER_OFF_BG)
        .setStrokeStyle(1.5, LINE_STRONG)
        .setInteractive({ useHandCursor: true })
      const label = this.scene.add.text(bx, FILTER_Y, b.label, {
        fontSize: `${CRAFT_FILTER_FONT_PX}px`, color: b.on ? css(FILTER_ON_TEXT) : css(FILTER_OFF_TEXT),
      }).setOrigin(0.5)
      bg.on('pointerdown', b.press)
      objs.push(bg, label)
    })
  }

  private buildPager(total: number, objs: Phaser.GameObjects.GameObject[]): void {
    const pages = this.paging.pageCount(total)
    const cur = this.paging.currentPage(total)
    const arrow = (x: number, text: string, delta: number, enabled: boolean) => {
      const t = this.scene.add.text(x, PAGER_Y, text, {
        fontSize: `${CRAFT_PAGER_ARROW_FONT_PX}px`, color: enabled ? css(TEXT_SUB) : css(TEXT_WEAK),
      }).setOrigin(0.5)
      if (enabled) {
        t.setInteractive({ useHandCursor: true })
        t.on('pointerdown', () => this.turnPage(delta))
      }
      objs.push(t)
    }
    arrow(PLACE_CX - 90, '◀', -1, cur > 0)
    objs.push(this.scene.add.text(PLACE_CX, PAGER_Y, this.paging.pageLabel(total), {
      fontSize: `${CRAFT_PAGER_FONT_PX}px`, color: css(TEXT_SUB),
    }).setOrigin(0.5))
    arrow(PLACE_CX + 90, '▶', 1, cur < pages - 1)
    // 件数はページ送りと同じ行。仕入れの画面と揃える
    objs.push(this.scene.add.text(CONTENT_R, PAGER_Y, this.paging.rangeLabel(total), {
      fontSize: `${CRAFT_RANGE_FONT_PX}px`, color: css(TEXT_SUB),
    }).setOrigin(1, 0.5))
  }

  /**
   * 1件ぶんの行。**1行で8列**（**PO 赤入れ 2026-09-13** ＋ **`材料` は #107 で戻した**）。
   *
   * ⚠ **3段組みには戻さない。**儲け方の3ルート（#23）は出さない（→ #108。PO 回答 2026-09-14）。
   *   **出し方そのものは `taxonomy/routes.ts` に残してある**ので、戻すなら列を足す話になる。
   */
  private buildRecipeRow(recipe: RecipeDef, cy: number, objs: Phaser.GameObjects.GameObject[]): void {
    const max = this.craftingSystem.maxCraftTimes(recipe.id)
    const out = this.registry.getItem(recipe.outputItemId)

    const focused = recipe.id === this.focusId
    objs.push(
      this.scene.add
        .rectangle(PLACE_CX, cy, CONTENT_R - CONTENT_L, CRAFT_ROW_H - 9, max > 0 ? ROW_LOCAL : ROW_UPCOMING)
        .setStrokeStyle(focused ? 3 : 1.5, focused ? ST_SELECTED : LINE_WEAK),
    )

    // ── 商品 ／ 在庫 ／ 需要 —— **回数で変わらない列。**ここで1度だけ書く ──
    objs.push(
      this.cell(CRAFT_NAME_L, cy, out.display.name, CRAFT_NAME_FONT_PX, css(TEXT_BODY), CRAFT_NAME_W),
      this.scene.add.text(CRAFT_STOCK_R, cy, String(this.inventory.getQuantity(out.id)), {
        fontSize: `${CRAFT_CELL_FONT_PX}px`, color: css(TEXT_BODY),
      }).setOrigin(1, 0.5),
      this.cell(CRAFT_DEMAND_L, cy, this.demandLabel(recipe), CRAFT_CELL_FONT_PX, css(TEXT_SUB),
        CRAFT_DEMAND_W),
    )

    // ── 作成数 ／ 時間 —— **回数で変わる列**（`refreshRow` が書き換える） ──
    const madeText = this.scene.add.text(CRAFT_MADE_R, cy, '', {
      fontSize: `${CRAFT_CELL_FONT_PX}px`, color: css(TEXT_BODY),
    }).setOrigin(1, 0.5)
    const timeText = this.cell(CRAFT_TIME_L, cy, '', CRAFT_CELL_FONT_PX, css(TEXT_SUB), CRAFT_TIME_W)
    const ingText = this.cell(CRAFT_ING_L, cy, '', CRAFT_CELL_FONT_PX, css(TEXT_SUB), CRAFT_ING_W)
    objs.push(madeText, timeText, ingText)

    // ── 作る ── ⚠ **作れないときは字が理由に変わる**（商人タブと同じ作り）
    const craftBg = this.scene.add
      .rectangle(CRAFT_BTN_L + CRAFT_BTN_W / 2, cy, CRAFT_BTN_W, CRAFT_BTN_H, BTN_CRAFT)
      .setStrokeStyle(1.5, LINE_STRONG)
      .setInteractive({ useHandCursor: true })
    const craftLabel = this.scene.add.text(CRAFT_BTN_L + CRAFT_BTN_W / 2, cy, CRAFT_BTN_LABEL, {
      fontSize: `${CRAFT_BTN_FONT_PX}px`, color: css(TEXT_BODY),
    }).setOrigin(0.5)
    objs.push(craftBg, craftLabel)

    // ── 数量 —— `-10` `-1` `□` `+1` `+10` `最大` ──
    const input = this.createInput(recipe)
    const row: Row = { recipe, max, input, madeText, timeText, ingText, craftBg, craftLabel }
    craftBg.on('pointerdown', () => this.craft(row))

    // ⚠ **`tryAddDom` は左上基点**（`domInput.ts` の注記）
    const domEl = tryAddDom(
      this.scene, CRAFT_STEP_XS.input, cy - CRAFT_INPUT_H / 2, input, '工房の回数入力')
    // DOM が使えない設定でも**メニュー全体を道連れにしない**。
    // 使えないときは数字を表示するだけにして、段のボタンで操作できるようにする
    if (domEl) {
      row.dom = domEl
      objs.push(domEl)
    } else {
      objs.push(
        this.scene.add
          .rectangle(CRAFT_STEP_XS.input + CRAFT_INPUT_W / 2, cy, CRAFT_INPUT_W, CRAFT_INPUT_H,
            INPUT_BG)
          .setStrokeStyle(1.5, INPUT_BORDER),
      )
      row.valueText = this.scene.add.text(
        CRAFT_STEP_XS.input + CRAFT_INPUT_W - 9, cy, input.value, {
          fontSize: `${CRAFT_STEP_FONT_PX}px`, color: css(TEXT_BODY),
        }).setOrigin(1, 0.5)
      objs.push(row.valueText)
    }

    const step = CRAFT_STEP_LABELS
    this.pushButton(objs, CRAFT_STEP_XS.minusTen, cy, CRAFT_STEP_BIG_W, CRAFT_INPUT_H,
      step.minusTen, () => this.step(row, -10))
    this.pushButton(objs, CRAFT_STEP_XS.minusOne, cy, CRAFT_STEP_ONE_W, CRAFT_INPUT_H,
      step.minusOne, () => this.step(row, -1))
    this.pushButton(objs, CRAFT_STEP_XS.plusOne, cy, CRAFT_STEP_ONE_W, CRAFT_INPUT_H,
      step.plusOne, () => this.step(row, 1))
    this.pushButton(objs, CRAFT_STEP_XS.plusTen, cy, CRAFT_STEP_BIG_W, CRAFT_INPUT_H,
      step.plusTen, () => this.step(row, 10))
    // ⚠ **「最大」は `maxCraftTimes` を使う**（#64）。
    //   これは材料・**在庫の空き**・当日の残り時間のいちばん小さいものなので、
    //   押した瞬間に在庫から溢れる回数は入らない
    this.pushButton(objs, CRAFT_STEP_XS.max, cy, CRAFT_MAX_W, CRAFT_INPUT_H,
      step.max, () => this.setValue(row, Math.max(row.max, 1)))

    this.rows.push(row)
  }

  /**
   * `需要` の列 —— **出来上がる品が高く売れる島**（PO 回答 2026-09-14。Q1）。
   *
   * ⚠ **材料の産地ではない。**2026-09-13 に入れたときは `＠` を列にしたもので、
   *   **PO の図の `ノアキータ` と字が偶然そろっていた**だけだった。
   * ⚠ **出どころは `islands.ts` の `DEMAND_TABLE` 1箇所。**ここに島の名を書かない。
   * ⚠ **`向く土地: どこでも` の品は売れる島が無いので空欄**（106本中42本。PO 了承済み）。
   */
  private demandLabel(recipe: RecipeDef): string {
    return demandIsland(this.registry.getItem(recipe.outputItemId).suitedLand) ?? ''
  }

  /** 回数入力の `<input>`。打鍵ではこの要素を作り直さない（カーソルが飛ぶため） */
  private createInput(recipe: RecipeDef): HTMLInputElement {
    return createInput(this.scene, {
      width: CRAFT_INPUT_W, height: CRAFT_INPUT_H, numeric: true,
      value: String(this.times.get(recipe.id) ?? 1),
      onInput: () => {
        const row = this.rows.find(r => r.recipe.id === recipe.id)
        if (row) this.refreshRow(row)
      },
    })
  }

  /** いま入力されている回数。整数として読めなければ null（＝作れない） */
  private readTimes(row: Row): number | null {
    return readCount(row.input.value)
  }

  /** 入力の値を差し替えて表示を更新する（作り直さない） */
  private setValue(row: Row, times: number): void {
    row.input.value = String(times)
    this.refreshRow(row)
  }

  private step(row: Row, delta: number): void {
    const current = this.readTimes(row) ?? 1
    this.setValue(row, Math.max(1, current + delta))
  }

  /**
   * `作る` を押した。**営業時間を削るぶんがあるときだけ、確認を通す**（#109）。
   *
   * ⚠ **判定は `businessMinutesFor` 1つ。**0 なら今までどおり押した場で作る
   *   （朝と閉店後の加工に確認は出さない ——
   *   **毎回出すと、削っていないときまで止められる**）。
   * ⚠ **確認を出すかどうかの判定は `confirmNeeded('営業時間を削る加工')`**（#113 の受け口）。
   */
  private craft(row: Row): void {
    const times = this.readTimes(row)
    if (times === null || !this.craftingSystem.canCraft(row.recipe.id, times)) return
    const businessMinutes = this.craftingSystem.businessMinutesFor(row.recipe.id, times)
    if (businessMinutes === 0 || !confirmNeeded('営業時間を削る加工')) {
      this.craftNow(row.recipe.id, times)
      return
    }
    this.openConfirm(
      craftBusinessConfirmLines(
        this.registry.getItem(row.recipe.outputItemId).display.name, times, businessMinutes),
      CRAFT_BTN_LABEL,
      () => this.craftNow(row.recipe.id, times),
    )
  }

  private craftNow(recipeId: string, times: number): void {
    this.craftingSystem.startCraft(recipeId, times)
    this.rebuild() // 作ったあとは在庫も残り時間も変わるので、ここでは作り直してよい
  }

  /**
   * 確認を出す。
   *
   * ⚠ **出している間は回数の欄と検索の欄を隠す。**`<input>` は HTML なので
   *   **必ず canvas より上に出る** —— **depth をいくつにしても暗幕の下へ回らない**
   *   （`domInput.ts` の注記。`PresetMenu` で同じことを踏んでいる）。
   * ⚠ **戻すのは `rebuild()` ではなく、閉じたときの `setVisible(true)`。**
   *   **「する」を押したときは `craftNow` が作り直すので、隠したままの行は残らない。**
   */
  private openConfirm(
    lines: readonly string[], okLabel: string, run: () => void,
  ): void {
    for (const r of this.rows) r.dom?.setVisible(false)
    this.search.setVisible(false)
    this.confirm.open(lines, okLabel, run, () => {
      for (const r of this.rows) r.dom?.setVisible(true)
      this.search.setVisible(true)
    })
  }

  /**
   * 1行ぶんの表示を今の入力に合わせる。
   * **入力は勝手に直さない**（丸めも字の置き換えもしない）。
   * 上限超過も整数でない入力も、理由を出して「作る」を無効にするだけ。
   */
  private refreshRow(row: Row): void {
    const { recipe } = row
    const times = this.readTimes(row)
    if (times !== null) this.times.set(recipe.id, times)
    row.valueText?.setText(row.input.value)

    // 数の欄は、読める値のときだけ書き換える（編集中に数字が踊らないように）
    if (times !== null) {
      row.madeText.setText(String(recipe.outputQuantity * times))
      // ⚠ **`recipe.durationMinutes` を出さないこと**（#53）。あれは手際を掛ける前の素の値で、
      //   **初期手際 S=10 の時点ですでに tier3 以上は実際の半分**を表示していた。
      //   時間が値段である以上、ここがずれると**払う額を間違えて見せている**ことになる。
      const minutes = this.craftingSystem.minutesFor(recipe.id) * times
      this.fit(row.timeText, craftTimeLabel(minutes), CRAFT_TIME_W)
      // ⚠ **`材料` も回数を掛けたぶんを出す**（`作成数` と同じ数え方。#107）。
      //   **手持ちの数（かつての `(400)`）は出さない** —— 付けると列に収まるのが
      //   106本中32本まで落ちる（`layout.ts` の `CRAFT_ING_W` に実測）
      this.fit(row.ingText, craftIngredientsLabel(recipe.ingredients.map(ing => ({
        name: this.registry.getItem(ing.itemId).display.name,
        quantity: ing.quantity * times,
      }))), CRAFT_ING_W)
    }

    // ⚠ **理由はボタンの字になる**（1行になって、理由を置く段が無くなったため）
    const reason = this.reasonFor(row, times)
    const enabled = reason === ''
    row.craftLabel.setText(enabled ? CRAFT_BTN_LABEL : reason)
    row.craftBg.setFillStyle(enabled ? BTN_CRAFT : BTN_CRAFT_OFF)
    row.craftLabel.setColor(enabled ? css(BTN_TEXT) : css(BTN_TEXT_OFF))
    if (enabled) {
      row.craftBg.setInteractive({ useHandCursor: true })
    } else {
      row.craftBg.disableInteractive()
    }
  }

  /**
   * 作れない理由。作れるなら空文字。
   *
   * ⚠ **理由を1つにまとめないこと**（#64）。「今日はもう時間がない」と
   *   「在庫が上限」は**待てば直るかどうかが違う。**
   *   在庫の側を「時間がない」と言うと、**明日まで待ってまた作れず**に終わる。
   * ⚠ **在庫を時間より先に見る。**両方だめなときに出したいのは、待っても直らないほう。
   * ⚠ **字は `作る` ボタンに入る**ので短い（`layout.ts` の `CRAFT_REASON_*`）。
   *   **`在庫が上限 400` のように数を足さないこと。**ボタンから出る。
   */
  private reasonFor(row: Row, times: number | null): string {
    if (times === null) {
      return row.input.value.trim() === '' ? CRAFT_REASON_EMPTY : CRAFT_REASON_NOT_INT
    }
    if (!this.craftingSystem.hasIngredients(row.recipe.id, times)) return CRAFT_REASON_INGREDIENTS
    // ⚠ **知らせは出さない。**作り終えて上限に達したときの知らせが `GameScene` にあり、
    //   そちらと重なる。ここは仕入れ画面と同じく**押せなくして理由を出す**だけ
    if (!this.craftingSystem.fitsInStock(row.recipe.id, times)) return CRAFT_REASON_STOCK
    if (!this.craftingSystem.fitsInToday(row.recipe.id, times)) return CRAFT_REASON_TIME
    return ''
  }

  /** 左端そろえの1マス。**その列の幅を超えたら末尾を … に詰める** */
  private cell(
    x: number, y: number, content: string, size: number, color: string, maxW: number,
  ): Phaser.GameObjects.Text {
    const t = this.scene.add.text(x, y, '', { fontSize: `${size}px`, color }).setOrigin(0, 0.5)
    t.setData('maxW', maxW)
    this.fit(t, content, maxW)
    return t
  }

  /**
   * 列の幅に収める。
   *
   * ⚠ **列ごとに測る**（画面の左半分ぜんぶ、ではない）。
   *   **表にした時点で、はみ出す先は隣の列である。**
   */
  private fit(t: Phaser.GameObjects.Text, content: string, maxW: number): void {
    t.setText(content)
    if (t.width <= maxW) return
    let s = content
    while (s.length > 1 && t.width > maxW) {
      s = s.slice(0, -1)
      t.setText(`${s}…`)
    }
  }

  /** 矩形＋中央ぞろえの文字でボタンを作る。幅は指定値どおりなので隣と重ならない */
  private pushButton(
    objs: Phaser.GameObjects.GameObject[],
    left: number, cy: number, w: number, h: number,
    label: string, onClick: () => void, fill = BTN_BACK,
  ): void {
    const cx = left + w / 2
    const bg = this.scene.add.rectangle(cx, cy, w, h, fill)
      .setStrokeStyle(1.5, LINE_STRONG)
      .setInteractive({ useHandCursor: true })
    bg.on('pointerdown', onClick)
    bg.on('pointerover', () => bg.setFillStyle(BTN_BACK_HOVER))
    bg.on('pointerout', () => bg.setFillStyle(fill))
    objs.push(
      bg,
      this.scene.add.text(cx, cy, label, { fontSize: `${CRAFT_STEP_BTN_FONT_PX}px`, color: css(BTN_TEXT) }).setOrigin(0.5),
    )
  }
}
