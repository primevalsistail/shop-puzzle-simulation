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
 * ⚠ **渡すのは「中心」ではなく「左上」。**`setOrigin(0, 0)` で置いている。
 *
 * ## なぜ中心基点で置かないのか（2026-09-13・行商人の赤入れ）
 *
 * Phaser の `DOMElement` は既定で中心基点だが、**中心に寄せる幅と高さを
 * `getBoundingClientRect()` で1度だけ測って焼き付ける。**
 *
 * ⚠ **`<input>` を作る時点で DOM コンテナが隠れていることがある。**
 *   できごとの窓・案内・セーブ画面を出している間は `setDomInputsVisible(scene, false)`
 *   （＝ コンテナに `display: none`）で、**行商人はそのできごとの窓から開く。**
 *   **隠れている要素の `getBoundingClientRect()` は 0×0** なので、
 *   **中心へ寄せる量が 0 のまま固定され、左上が指定点に来る。**
 *   実測では検索欄が右へ 80px・下へ 12px ずれ、**枠を突き抜けて右の HUD に被った。**
 *
 * **左上基点なら測った大きさを使わない**ので、隠れていようがいまいが同じ場所に出る。
 * ⚠ **中心で置きたい側が `w / 2` を引くこと。**ここには戻さない。
 */
export function tryAddDom(
  scene: Phaser.Scene,
  left: number, top: number,
  el: HTMLElement,
  where: string,
): Phaser.GameObjects.DOMElement | null {
  try {
    return scene.add.dom(left, top, el).setOrigin(0, 0)
  } catch (e) {
    console.warn(`${where}: DOM を使えません`, e)
    return null
  }
}

/**
 * 画面に載せた `<input>` をまとめて隠す／戻す。
 *
 * ⚠ **`<input>` は HTML なので、必ず canvas より上に出る。**
 *   Phaser 側の depth をいくつにしても、**上に出した窓の下へは回らない。**
 *   **上に重ねる画面（セーブ／できごと／幕／案内）を開いている間は、まとめて隠すしかない。**
 *
 * ⚠ **入れ物ごと隠す。**欄を1つずつ隠すと、**欄を増やしたときに忘れる**
 *   （いまは4画面が `createInput()` を呼んでいる）。
 */
export function setDomInputsVisible(scene: Phaser.Scene, visible: boolean): void {
  const container = scene.game.domContainer
  if (!container) return
  container.style.display = visible ? '' : 'none'
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
  // ⚠ **`index.html` の `* { box-sizing: border-box }` がこの要素にも効く。**
  //   ここで明示しておかないと、**枠と余白のぶんだけ実寸が指定より小さくなる**
  //   （検索欄が 160×24 のつもりで 150×18 だった。2026-09-13 実測）。
  //   **`layout.ts` が確保した大きさと、画面に出る大きさを一致させる。**
  el.style.cssText = [
    'box-sizing: border-box',
    `width: ${opts.width}px`,
    `height: ${opts.height}px`,
    'padding: 0 6px',
    'font-size: 18px',
    'font-family: sans-serif',
    'color: #ffffff',
    'background: #15152a',
    'border: 1.5px solid #4a4a8a',
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
  // ⚠ **IME の変換中は絞り込みを走らせない**（#84）。
  //   `input` だけを見ていると `ひ` → `ひつ` → `ひつｊ` と**1打鍵ごとに候補が動き**、
  //   中間状態で0件になって「そもそも無い」の文言がちらつく。
  //   ⚠ **ここは3画面（持ち物・仕入れ・工房）が通る唯一の口。**直せば3箇所とも直る
  let composing = false
  el.addEventListener('compositionstart', () => { composing = true })
  el.addEventListener('compositionend', () => {
    composing = false
    opts.onInput(el.value)
  })
  el.addEventListener('input', () => {
    if (composing) return
    opts.onInput(el.value)
  })
  return el
}

/** 打ち込まれた数。1以上の整数として読めなければ null */
export function readCount(raw: string): number | null {
  const t = raw.trim()
  if (!/^\d+$/.test(t)) return null
  const n = Number(t)
  return Number.isSafeInteger(n) && n >= 1 ? n : null
}
