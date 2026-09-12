import Phaser from 'phaser'
import type { CraftingSystem } from '../components/items/CraftingSystem.js'
import type { Inventory } from '../components/economy/Inventory.js'
import type { ItemRegistry, RecipeDef } from '../components/items/ItemRegistry.js'
import type { RecipeUnlocks } from '../components/progress/RecipeUnlocks.js'
import { ListPaging, KIND_BUTTONS } from './ListPaging.js'
import { SearchBox } from './SearchBox.js'
import { createInput, tryAddDom, setGameKeyboard, readCount } from './domInput.js'
import type { IslandName } from '../taxonomy/islands.js'
import { routeValues } from '../taxonomy/routes.js'
import type { PlaceFrame } from './PlaceFrame.js'
import { CONTENT_DEPTH } from './PlaceFrame.js'
import {
  PLACE_CX, CONTENT_L, CONTENT_R,
  SUBTITLE_Y, FILTER_Y, ROWS_TOP, PAGER_Y, rowsThatFit,
} from './layout.js'

const ROW_H = 84

/**
 * 一度に映る行数。**レシピは72本ある**（#30。ただし並ぶのは解禁済みのぶんだけ。#48）ので、
 * 全部は収まらない。
 *
 * ⚠ **決め打ちしない。**領域の高さから出す（`layout.ts` の `rowsThatFit`）。
 *   手で書くと、領域を動かしたとき最後の行がページ送りへ食い込んでいても気づけない。
 */
const VISIBLE_ROWS = rowsThatFit(ROW_H)

/**
 * 右側の操作列の左端。ここから右は数量入力とボタンの領域で、文字は入れない
 * （**名前が長くてもボタンに被らない**ようにするため）。
 */
const CONTROLS_L = CONTENT_R - 260
/** 左の文字列に使える幅 */
const TEXT_MAX_W = CONTROLS_L - CONTENT_L - 22

const INPUT_W = 52
const INPUT_H = 22

/** 検索の入力欄。絞り込みの行の右端に置く */
const SEARCH_W = 160
const SEARCH_H = 24

/** 1行ぶんの、あとから書き換える部品 */
interface Row {
  recipe: RecipeDef
  max: number
  input: HTMLInputElement
  /** DOM が使えないときの数字表示（使えるときは undefined） */
  valueText?: Phaser.GameObjects.Text
  outText: Phaser.GameObjects.Text
  ingText: Phaser.GameObjects.Text
  timeText: Phaser.GameObjects.Text
  reason: Phaser.GameObjects.Text
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

  constructor(
    private scene: Phaser.Scene,
    private craftingSystem: CraftingSystem,
    private inventory: Inventory,
    private registry: ItemRegistry,
    /** 解禁済みのレシピ（#48）。**`registry.getAllRecipes()` を直に並べないこと** */
    private unlocks: RecipeUnlocks,
    private frame: PlaceFrame,
    /** いまいる島（#33）。**ここで手に入らない材料に産地を出す**ため */
    private islandOf: () => IslandName,
    private onClose: () => void,
  ) {
    this.search = new SearchBox(scene)
    // シーンが終わるとき DOM が残らないようにする
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown())
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.teardown())

    scene.input.on('wheel', (
      _pointer: Phaser.Input.Pointer,
      _over: unknown, _dx: number, dy: number,
    ) => {
      if (!this.isOpen) return
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
      CONTENT_R - SEARCH_W / 2, FILTER_Y, SEARCH_W, SEARCH_H, '名前で探す',
      q => { this.paging.setQuery(q); this.rebuild() },
      CONTENT_DEPTH,
    )
    this.build()
  }

  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
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
   * 「作れる」は材料と当日の残り時間の両方を見る（`maxCraftTimes > 0`）。
   *
   * ⚠ **母集合は解禁済みのレシピ**（#48）。全72本を並べない。
   */
  private shown(): RecipeDef[] {
    // ⚠ **主種類も名前も「出来上がる品」で見る**（材料ではない）。行に出ているのが出来上がる品なので
    const byKind = this.paging.filter(
      this.unlocks.unlockedRecipes(),
      r => this.registry.getItem(r.outputItemId).mainKind,
      r => this.registry.getItem(r.outputItemId).display.name,
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

    objs.push(
      this.scene.add.text(CONTENT_L, SUBTITLE_Y, '材料を組み合わせて、深く作るほど取り分が増える', {
        fontSize: '13px', color: '#8899aa',
      }).setOrigin(0, 0.5),
    )

    this.buildFilterBar(objs)
    this.paging.slice(shown).forEach((recipe, i) => {
      this.buildRecipeRow(recipe, ROWS_TOP + ROW_H / 2 + i * ROW_H, objs)
    })
    if (shown.length === 0) {
      // 0件の理由は2つある。**「まだ1本も解禁されていない」を「該当なし」と書かない**
      // ——不具合に見えるうえ、次に何をすれば増えるのかが伝わらない（#48）
      const message = this.unlocks.unlockedRecipes().length === 0
        ? '材料を手に入れると、作れるものが増えていく'
        : '当てはまるレシピがありません'
      objs.push(this.scene.add.text(PLACE_CX, ROWS_TOP + 60, message, {
        fontSize: '14px', color: '#889999',
      }).setOrigin(0.5))
    }
    this.buildPager(shown.length, objs)

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(CONTENT_DEPTH)
    for (const row of this.rows) this.refreshRow(row)
  }

  /** 絞り込み — 主種類4つ ＋「作れる」 */
  private buildFilterBar(objs: Phaser.GameObjects.GameObject[]): void {
    const btnW = 64, btnH = 22, gap = 8
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
      const bg = this.scene.add.rectangle(bx, FILTER_Y, btnW, btnH, b.on ? 0x4a6a3a : 0x232338)
        .setStrokeStyle(1, b.on ? 0x7abb5a : 0x444455)
        .setInteractive({ useHandCursor: true })
      const label = this.scene.add.text(bx, FILTER_Y, b.label, {
        fontSize: '12px', color: b.on ? '#ccffaa' : '#778899',
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
        fontSize: '18px', color: enabled ? '#aaccee' : '#445566',
      }).setOrigin(0.5)
      if (enabled) {
        t.setInteractive({ useHandCursor: true })
        t.on('pointerdown', () => this.turnPage(delta))
      }
      objs.push(t)
    }
    arrow(PLACE_CX - 60, '◀', -1, cur > 0)
    objs.push(this.scene.add.text(PLACE_CX, PAGER_Y, this.paging.pageLabel(total), {
      fontSize: '13px', color: '#8899aa',
    }).setOrigin(0.5))
    arrow(PLACE_CX + 60, '▶', 1, cur < pages - 1)
    // 件数はページ送りと同じ行。仕入れの画面と揃える
    objs.push(this.scene.add.text(CONTENT_R, PAGER_Y, this.paging.rangeLabel(total), {
      fontSize: '13px', color: '#8899aa',
    }).setOrigin(1, 0.5))
  }

  private buildRecipeRow(recipe: RecipeDef, cy: number, objs: Phaser.GameObjects.GameObject[]): void {
    const max = this.craftingSystem.maxCraftTimes(recipe.id)

    const focused = recipe.id === this.focusId
    objs.push(
      this.scene.add
        .rectangle(PLACE_CX, cy, CONTENT_R - CONTENT_L, ROW_H - 8, max > 0 ? 0x2a3a2a : 0x3a2a2a)
        .setStrokeStyle(focused ? 2 : 1, focused ? 0xffdd88 : 0x555555),
    )

    // 左は3段 — 完成品と時間／材料／**儲け方の3ルート**（#23）。数は括弧が在庫
    const outText = this.text(CONTENT_L, cy - 24, '', 14, '#ffffff')
    const ingText = this.text(CONTENT_L, cy - 2, '', 11, '#aaaaaa')
    const timeText = this.text(CONTENT_L, cy + 22, '', 12, '#aaddaa')
    const reason = this.scene.add.text(CONTROLS_L - 10, cy + 22, '', {
      fontSize: '11px', color: '#dd8888',
    }).setOrigin(1, 0.5)
    objs.push(outText, ingText, timeText, reason)

    // 右上 — − [n]回 ＋
    const groupW = 26 + 4 + INPUT_W + 4 + 16 + 4 + 26
    let x = CONTROLS_L + (CONTENT_R - CONTROLS_L - groupW) / 2
    const minusAt = x
    x += 26 + 4
    const inputAt = x
    x += INPUT_W + 4
    const unitAt = x
    x += 16 + 4
    const plusAt = x

    const input = this.createInput(recipe)
    // DOM が使えない設定でも**メニュー全体を道連れにしない**。
    // 使えないときは数字を表示するだけにして、− ＋ 最大 で操作できるようにする
    let valueText: Phaser.GameObjects.Text | undefined
    const domEl = tryAddDom(this.scene, inputAt + INPUT_W / 2, cy - 17, input, '工房の回数入力')
    if (domEl) {
      objs.push(domEl)
    } else {
      objs.push(
        this.scene.add.rectangle(inputAt + INPUT_W / 2, cy - 17, INPUT_W, INPUT_H, 0x15152a)
          .setStrokeStyle(1, 0x4a4a8a),
      )
      valueText = this.scene.add.text(inputAt + INPUT_W - 6, cy - 17, input.value, {
        fontSize: '12px', color: '#ffffff',
      }).setOrigin(1, 0.5)
      objs.push(valueText)
    }

    // 右下 — 最大 ／ 作る
    const craftW = CONTENT_R - CONTROLS_L - 44
    const craftBg = this.scene.add.rectangle(CONTROLS_L + 44 + craftW / 2, cy + 17, craftW, 24, 0x4a4a8a)
      .setStrokeStyle(1, 0x6a6ab0)
      .setInteractive({ useHandCursor: true })
    const craftLabel = this.scene.add.text(CONTROLS_L + 44 + craftW / 2, cy + 17, '作る', {
      fontSize: '12px', color: '#ffffff',
    }).setOrigin(0.5)
    objs.push(craftBg, craftLabel)

    const row: Row = { recipe, max, input, valueText, outText, ingText, timeText, reason, craftBg, craftLabel }
    craftBg.on('pointerdown', () => this.craft(row))

    // 右上 — − [n]回 ＋
    this.pushButton(objs, minusAt, cy - 17, 26, INPUT_H, '−', () => this.step(row, -1))
    objs.push(
      this.scene.add.text(unitAt + 8, cy - 17, '回', { fontSize: '12px', color: '#cccccc' })
        .setOrigin(0.5),
    )
    this.pushButton(objs, plusAt, cy - 17, 26, INPUT_H, '＋', () => this.step(row, 1))

    this.pushButton(objs, CONTROLS_L, cy + 17, 38, 24, '最大', () => {
      this.setValue(row, Math.max(row.max, 1))
    })

    this.rows.push(row)
  }

  /** 回数入力の `<input>`。打鍵ではこの要素を作り直さない（カーソルが飛ぶため） */
  private createInput(recipe: RecipeDef): HTMLInputElement {
    return createInput(this.scene, {
      width: INPUT_W, height: INPUT_H, numeric: true,
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

  private craft(row: Row): void {
    const times = this.readTimes(row)
    if (times === null || !this.craftingSystem.canCraft(row.recipe.id, times)) return
    this.craftingSystem.startCraft(row.recipe.id, times)
    this.rebuild() // 作ったあとは在庫も残り時間も変わるので、ここでは作り直してよい
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
      const out = this.registry.getItem(recipe.outputItemId)
      this.setText(row.outText,
        `${out.display.name}×${recipe.outputQuantity * times}(${this.inventory.getQuantity(out.id)})`
        + `　${recipe.durationMinutes * times}分`)
      // ⚠ **ここで手に入らない材料にだけ産地を付ける**（#33）。
      //   全部に付けると行が溢れるうえ、**答えたいのは「ここで手に入るか」**である。
      //   産地が `なし` の品はどの島でも買えるので付けない
      const island = this.islandOf()
      this.setText(row.ingText, recipe.ingredients
        .map(ing => {
          const item = this.registry.getItem(ing.itemId)
          const here = item.origin === 'なし' || item.origin === island
          const at = here ? '' : `＠${item.origin}`
          return `${item.display.name}×${ing.quantity * times}(${this.inventory.getQuantity(ing.itemId)})${at}`
        })
        .join('  '))
      this.setText(row.timeText, this.routeLabel(recipe, times))
    }

    const reason = this.reasonFor(row, times)
    row.reason.setText(reason)
    const enabled = reason === ''
    row.craftBg.setFillStyle(enabled ? 0x4a4a8a : 0x3a3a4a)
    row.craftLabel.setColor(enabled ? '#ffffff' : '#8888aa')
    if (enabled) {
      row.craftBg.setInteractive({ useHandCursor: true })
    } else {
      row.craftBg.disableInteractive()
    }
  }

  /**
   * 儲け方の3ルートを金額で1行にする（#23）。
   *
   * **設計としては3ルート成立しているのに、遊んでいる側に見えていない**のが #23。
   * ⚠ **目安であることを忘れないこと。**実際の売上は配置の効き目・島の需要・強化で変わる。
   * ⚠ **③ は時間も一緒に出す。**取り分だけ見せると「材料も作る」がただ得に見える。
   */
  private routeLabel(recipe: RecipeDef, times: number): string {
    const v = routeValues(recipe, this.unlocks.unlockedRecipes(), this.islandOf())
    const yen = (n: number) => `${n >= 0 ? '+' : '−'}¥${Math.abs(n * times).toLocaleString()}`
    const base = `転売${yen(v.resell)} → 作る${yen(v.craft)}`
    if (!v.hasDeeper) return base
    return `${base} → 材料も作る${yen(v.deepCraft)}（計${v.deepMinutes * times}分）`
  }

  /** 作れない理由。作れるなら空文字 */
  private reasonFor(row: Row, times: number | null): string {
    if (times === null) {
      return row.input.value.trim() === '' ? '数量を入れてください' : '1以上の整数を入力'
    }
    if (!this.craftingSystem.hasIngredients(row.recipe.id, times)) return '材料が足りない'
    if (!this.craftingSystem.fitsInToday(row.recipe.id, times)) return '今日はもう時間がない'
    return ''
  }

  /** 枠に収まる文字（はみ出す分は末尾を … に詰める）。左端そろえ */
  private text(x: number, y: number, content: string, size: number, color: string): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, content, { fontSize: `${size}px`, color }).setOrigin(0, 0.5)
  }

  private setText(t: Phaser.GameObjects.Text, content: string): void {
    t.setText(content)
    if (t.width <= TEXT_MAX_W) return
    let s = content
    while (s.length > 1 && t.width > TEXT_MAX_W) {
      s = s.slice(0, -1)
      t.setText(`${s}…`)
    }
  }

  /** 矩形＋中央ぞろえの文字でボタンを作る。幅は指定値どおりなので隣と重ならない */
  private pushButton(
    objs: Phaser.GameObjects.GameObject[],
    left: number, cy: number, w: number, h: number,
    label: string, onClick: () => void, fill = 0x33335a,
  ): void {
    const cx = left + w / 2
    const bg = this.scene.add.rectangle(cx, cy, w, h, fill)
      .setStrokeStyle(1, 0x6a6ab0)
      .setInteractive({ useHandCursor: true })
    bg.on('pointerdown', onClick)
    bg.on('pointerover', () => bg.setFillStyle(0x5a5ab0))
    bg.on('pointerout', () => bg.setFillStyle(fill))
    objs.push(
      bg,
      this.scene.add.text(cx, cy, label, { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5),
    )
  }
}
