import { AUDIO_CREDITS } from '../audio/bgm.js'
import { getMusicVolume, isMusicOn, setMusicOn, setMusicVolume } from '../audio/musicSettings.js'
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

/**
 * **幅のある値を持つ1項目**（#14 の音量。PO 指示 2026-09-15「**0〜100 で音量調節したい**」）。
 *
 * ⚠ **`OptionSwitch` に旗を足して兼用しない**（`options.ts` の元からの決まり）。
 *   **入／切とは部品が違う** —— 溝の上をつまみが動き、**数字が右に出る。**
 */
export type OptionSlider = {
  readonly label: string
  /** **0〜100。**⚠ **値は持たない**（`OptionSwitch` と同じ理由で、毎回読む） */
  readonly value: () => number
  readonly set: (v: number) => void
}

/** 見出しでくくった一かたまり。**区分ごとに見出しが1行出る** */
export type OptionSection = {
  readonly title: string
  readonly rows: readonly OptionSwitch[]
  /** **幅のある値の行**（音量）。⚠ **入／切の行の下に並ぶ** */
  readonly sliders?: readonly OptionSlider[]
  /**
   * **切り替えるものではない、ただの字**（#14 の配布元）。**行の下に並ぶ。**
   *
   * ⚠ **これは入／切の3つ目の状態ではない。**押せないので、`OptionSwitch` にしない。
   */
  readonly notes?: readonly string[]
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
    {
      // 音楽（#14）。⚠ **音量つまみは作らない**（PO 判断 2026-09-15。入／切の1行だけ）
      title: '音',
      rows: [
        { label: '音楽を鳴らす', isOn: isMusicOn, set: setMusicOn },
      ],
      // ⚠ **入／切と両方置く**（PO 指示 2026-09-15）。**0 まで下げるのと、切るのは別** ——
      //   **切って入れ直したときに前の音量へ戻る**のは、行が別にあるからできている
      sliders: [
        { label: '音量', value: getMusicVolume, set: setMusicVolume },
      ],
    },
    {
      // ⚠ **いちばん下**（PO 判断 2026-09-15。**タイトル画面には出さない**）。
      //   ⚠ **効果音（#124）もここに足す** —— `AUDIO_CREDITS` に1行増やすだけで出る
      title: '音楽をお借りしたところ',
      rows: [],
      notes: AUDIO_CREDITS,
    },
  ]
}
