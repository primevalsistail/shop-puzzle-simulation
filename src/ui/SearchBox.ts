import Phaser from 'phaser'
import { createInput, tryAddDom, setGameKeyboard } from './domInput.js'

/**
 * 名前で一覧を絞る入力欄（#55）。仕入れ・工房・持ち物の3画面で使い回す。
 *
 * ⚠ **一覧と同じ入れ物に入れないこと。**一覧は打鍵のたびに作り直されるので、
 *   一緒に入れると**入力欄も作り直されてカーソルが飛ぶ。**
 *   `place()` で1度だけ置き、`destroy()` で捨てる。打鍵で作り直すのは行の入れ物だけ。
 *
 * ⚠ **DOM が使えない設定では何も出さない。**打てない箱を出しても意味がなく、
 *   例外で一覧を道連れにもしない（`CraftMenu.tryAddDom` と同じ考え）。
 */
export class SearchBox {
  private dom: Phaser.GameObjects.DOMElement | null = null
  private input: HTMLInputElement | null = null

  constructor(private scene: Phaser.Scene) {
    // シーンが終わるとき DOM が残らないようにする
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy())
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroy())
  }

  isPlaced(): boolean {
    return this.dom !== null
  }

  value(): string {
    return this.input?.value ?? ''
  }

  /**
   * 入力欄を置く。**すでに置いてあるなら何もしない**（打鍵中に作り直さないため）。
   *
   * `x` `y` は**中心**（Phaser の `DOMElement` は中心基点）。
   */
  place(
    x: number, y: number, w: number, h: number,
    placeholder: string,
    onChange: (query: string) => void,
    depth: number,
  ): void {
    if (this.dom) return

    const el = createInput(this.scene, {
      width: w, height: h, placeholder,
      onInput: value => onChange(value),
    })

    const dom = tryAddDom(this.scene, x, y, el, '一覧の検索')
    if (!dom) return
    this.dom = dom.setDepth(depth)
    this.input = el
  }

  /**
   * 片付ける。
   *
   * ⚠ **ゲームのキー入力を必ず戻すこと。**入力中の要素を消すと `blur` が来ないことがあり、
   *   止めたままだと **ESC も速度切り替えも効かなくなる。**
   */
  destroy(): void {
    this.dom?.destroy()
    this.dom = null
    this.input = null
    setGameKeyboard(this.scene, true)
  }

}
