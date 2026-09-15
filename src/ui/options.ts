import { AUDIO_CREDITS } from '../audio/bgm.js'
import { getMusicVolume, isMusicOn, setMusicOn, setMusicVolume } from '../audio/musicSettings.js'
import { getSeVolume, isSeOn, setSeOn, setSeVolume } from '../audio/seSettings.js'
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
 * **入／切と、幅のある値を1行に持つ項目**（#14 の音量。PO 指示 2026-09-15）。
 *
 * ⚠ **`OptionSwitch` に旗を足して兼用しない**（`options.ts` の元からの決まり）。
 *   **部品が違う** —— **入／切のつまみ ＋ 溝 ＋ 右の数字**が1行に並ぶ。
 * ⚠ **入／切と値を別の行に分けない**（PO 指示 2026-09-15「**1か所にまとめたい**」）。
 *   **同じものの設定なので、2行あると別物に見える。**
 */
export type OptionLevel = {
  readonly label: string
  readonly isOn: () => boolean
  readonly setOn: (on: boolean) => void
  /** **0〜100。**⚠ **値は持たない**（`OptionSwitch` と同じ理由で、毎回読む） */
  readonly value: () => number
  readonly set: (v: number) => void
}

/** 見出しでくくった一かたまり。**区分ごとに見出しが1行出る** */
export type OptionSection = {
  readonly title: string
  readonly rows: readonly OptionSwitch[]
  /** **入／切と値が1行になっているもの**（音量）。⚠ **行のあとに並ぶ** */
  readonly levels?: readonly OptionLevel[]
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
      // 音楽（#14）と効果音（#124）。
      title: '音',
      rows: [],
      // ⚠ **入／切と音量は1行**（PO 指示 2026-09-15「1か所にまとめたい」）。
      //   ⚠ **入／切は残す。****0 まで下げるのと、切るのは別** ——
      //   **切って入れ直したときに前の音量へ戻る**のは、入／切を別に持っているからできている
      // ⚠ **効果音は音楽と別の行**（PO 判断 2026-09-16。質問票 Question 3 = A「分ける」）。
      //   **切りたい理由が違う** —— **音楽は繰り返すので飽きて切る。効果音は押した手応えなので残したい。**
      // ⚠ **行が2つになったので、名前を「音量」から「音楽」「効果音」に変えた。**
      //   **1行のときは「音」の下の「音量」で通じたが、2行あるとどちらの音量か分からない。**
      levels: [
        {
          label: '音楽',
          isOn: isMusicOn, setOn: setMusicOn,
          value: getMusicVolume, set: setMusicVolume,
        },
        {
          label: '効果音',
          isOn: isSeOn, setOn: setSeOn,
          value: getSeVolume, set: setSeVolume,
        },
      ],
    },
    {
      // ⚠ **いちばん下**（PO 判断 2026-09-15。**タイトル画面には出さない**）。
      //   ⚠ **効果音（#124）の行はここに入り済み**（`AUDIO_CREDITS` が2行になった）
      title: '音をお借りしたところ',
      rows: [],
      notes: AUDIO_CREDITS,
    },
  ]
}
