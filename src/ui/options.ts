import { CONFIRM_ACTIONS, confirmNeeded, setConfirmNeeded } from './ConfirmDialog.js'

/**
 * **設定に並べる1項目**（#113）。**いまは入／切の2状態だけ。**
 *
 * ⚠ **値を持たない。**`isOn()` で毎回いまの値を読む ——
 *   **控えを持つと、設定の外で変わった値に気付けない。**
 */
export type OptionSwitch = {
  /** 画面に出す字。⚠ **見たままの言葉で**（#75） */
  readonly label: string
  readonly isOn: () => boolean
  readonly set: (on: boolean) => void
}

/** 見出しでくくった一かたまり。**区分ごとに見出しが1行出る** */
export type OptionSection = {
  readonly title: string
  readonly rows: readonly OptionSwitch[]
}

/**
 * **設定の画面に並ぶもの、全部**（#113）。
 *
 * ⚠ **オプションを足すときはここに足す。**`OptionsMenu` は並べるだけで、
 *   **何があるかを知らない** —— 画面側に書き足すと、**面の高さの計算とテストがずれる。**
 * ⚠ **ここは Phaser を読まない。**読むと `layout.test.ts` から実物を測れなくなる。
 * ⚠ **入／切でないもの**（音量のような幅のある値、3つ以上から選ぶもの）**が要るようになったら、
 *   `OptionSwitch` の隣に型を足す。**`OptionSwitch` に旗を足して兼用しないこと。
 */
export function optionSections(): readonly OptionSection[] {
  return [
    {
      title: '確認のメッセージを出す',
      // ⚠ **行は `CONFIRM_ACTIONS` から作る。**書き写すと、行為を足したとき片方だけ古くなる
      rows: CONFIRM_ACTIONS.map(action => ({
        label: action,
        isOn: () => confirmNeeded(action),
        set: (on: boolean) => { setConfirmNeeded(action, on) },
      })),
    },
  ]
}
