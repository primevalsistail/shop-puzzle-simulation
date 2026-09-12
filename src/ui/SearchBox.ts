import Phaser from 'phaser'

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

    const el = document.createElement('input')
    el.type = 'text'
    el.placeholder = placeholder
    el.style.cssText = [
      `width: ${w - 10}px`,
      `height: ${h - 6}px`,
      'padding: 0 4px',
      'font-size: 12px',
      'font-family: sans-serif',
      'color: #ffffff',
      'background: #15152a',
      'border: 1px solid #4a4a8a',
      // DOM コンテナ自体は pointer-events: none（クリックをゲームへ通す）なので、
      // この入力だけ受け取れるようにする
      'pointer-events: auto',
    ].join(';')

    // 打鍵をゲーム側のキー処理へ漏らさない（ESC でメニューが閉じる、など）
    el.addEventListener('keyup', e => e.stopPropagation())
    el.addEventListener('keydown', e => {
      e.stopPropagation()
      // ⚠ **ESC の逃げ道を残す。**入力中はゲームのキーを止めているので、
      //   ここで外さないと ESC で店に戻れない（もう一度 ESC を押せば戻れる）
      if (e.key === 'Escape') el.blur()
    })
    el.addEventListener('focus', () => this.setGameKeyboard(false))
    el.addEventListener('blur', () => this.setGameKeyboard(true))
    el.addEventListener('input', () => onChange(el.value))

    const dom = this.tryAddDom(x, y, el)
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
    this.setGameKeyboard(true)
  }

  /**
   * `<input>` を画面に載せる。載せられなければ null を返す
   * （`dom.createContainer` と `parent` が揃っていないと Phaser が例外を投げる）。
   */
  private tryAddDom(x: number, y: number, el: HTMLInputElement): Phaser.GameObjects.DOMElement | null {
    try {
      return this.scene.add.dom(x, y, el)
    } catch (e) {
      console.warn('SearchBox: 検索に DOM を使えません（絞り込みとページ送りで探してください）', e)
      return null
    }
  }

  private setGameKeyboard(enabled: boolean): void {
    const keyboard = this.scene.input?.keyboard
    if (keyboard) keyboard.enabled = enabled
  }
}
