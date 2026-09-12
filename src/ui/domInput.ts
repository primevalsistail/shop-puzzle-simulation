import Phaser from 'phaser'

/**
 * 画面に載せる HTML の `<input>` まわり。**3箇所で使う**
 * （工房の回数 ／ 一覧の検索 ／ 仕入れの個数）。
 *
 * ⚠ **同じ約束を3回書かないこと。**打鍵をゲームへ漏らさない・DOM が使えなくても落ちない・
 *   消すときにキー入力を戻す —— どれも**1箇所でも忘れると操作が効かなくなる。**
 */

/**
 * 入力中はゲームのショートカットを止める。
 *
 * ⚠ **止めたら必ず戻すこと。**入力中の要素を消すと `blur` が来ないことがあり、
 *   止めたままだと **ESC も速度切り替えも効かなくなる。**
 */
export function setGameKeyboard(scene: Phaser.Scene, enabled: boolean): void {
  const keyboard = scene.input?.keyboard
  if (keyboard) keyboard.enabled = enabled
}

/**
 * `<input>` を画面に載せる。載せられなければ `null` を返す
 * （`dom.createContainer` と `parent` が揃っていないと Phaser が例外を投げる）。
 *
 * ⚠ **例外で画面全体を道連れにしない。**呼ぶ側は null のときの出し方を用意する。
 */
export function tryAddDom(
  scene: Phaser.Scene,
  x: number, y: number,
  el: HTMLElement,
  where: string,
): Phaser.GameObjects.DOMElement | null {
  try {
    return scene.add.dom(x, y, el)
  } catch (e) {
    console.warn(`${where}: DOM を使えません`, e)
    return null
  }
}

export interface InputOptions {
  readonly width: number
  readonly height: number
  readonly value?: string
  readonly placeholder?: string
  /** 数字だけを打つ欄か（スマホのキーボードが変わる） */
  readonly numeric?: boolean
  readonly onInput: (value: string) => void
}

/**
 * 打鍵をゲームへ漏らさない `<input>` を作る。
 *
 * ⚠ **打った文字を書き換えないこと。**`-1` → `1`、`1.5` → `15` のように
 *   意図しない値に化ける。**読めない値は呼ぶ側が「できない理由」として出す。**
 */
export function createInput(scene: Phaser.Scene, opts: InputOptions): HTMLInputElement {
  const el = document.createElement('input')
  el.type = 'text'
  if (opts.numeric) el.inputMode = 'numeric'
  if (opts.placeholder) el.placeholder = opts.placeholder
  el.value = opts.value ?? ''
  el.style.cssText = [
    `width: ${opts.width - 10}px`,
    `height: ${opts.height - 6}px`,
    'padding: 0 4px',
    'font-size: 12px',
    'font-family: sans-serif',
    'color: #ffffff',
    'background: #15152a',
    'border: 1px solid #4a4a8a',
    opts.numeric ? 'text-align: right' : 'text-align: left',
    // DOM コンテナ自体は pointer-events: none（クリックをゲームへ通す）なので、
    // この入力だけ受け取れるようにする
    'pointer-events: auto',
  ].join(';')

  el.addEventListener('keyup', e => e.stopPropagation())
  el.addEventListener('keydown', e => {
    e.stopPropagation()
    // ⚠ **ESC の逃げ道を残す。**入力中はゲームのキーを止めているので、
    //   ここで外さないと ESC で店に戻れない（もう一度 ESC を押せば戻れる）
    if (e.key === 'Escape') el.blur()
  })
  el.addEventListener('focus', () => setGameKeyboard(scene, false))
  el.addEventListener('blur', () => setGameKeyboard(scene, true))
  el.addEventListener('input', () => opts.onInput(el.value))
  return el
}

/** 打ち込まれた数。1以上の整数として読めなければ null */
export function readCount(raw: string): number | null {
  const t = raw.trim()
  if (!/^\d+$/.test(t)) return null
  const n = Number(t)
  return Number.isSafeInteger(n) && n >= 1 ? n : null
}
