/**
 * **音楽の好み**（#14。**入／切と、0〜100 の音量**）。
 *
 * ⚠ **中身は `audioSettings.ts` の工場に移した**（#124。効果音が同じ形を持つため）。
 *   **ここに残っているのは名前だけ** —— **呼ぶ側を1行も変えずに済ませるため。**
 *
 * ⚠ **セーブデータ（枠3つ）には混ぜない。**遊びの記録ではなく、**この端末の好み**
 *   （`ConfirmDialog` の確認設定と同じ扱い）。
 * ⚠ **入／切の行は残す** —— **0 まで下げて切るのと、切るのは別。**
 *   **切って入れ直したとき、前の音量に戻る**のは行があるからできている。
 */

import { makeAudioSetting } from './audioSettings.js'

/**
 * **0〜100。**⚠ **既定は 50。**
 * **100 を既定にしない** —— **うしろで鳴るもの**なので、大きいと最初に切られる。
 */
export const MUSIC_VOLUME_DEFAULT = 50
export const MUSIC_VOLUME_MIN = 0
export const MUSIC_VOLUME_MAX = 100

/** ⚠ **既定は入。**初めて開いた人には鳴るほうが素直 */
const music = makeAudioSetting(
  'shop_puzzle_music_off', 'shop_puzzle_music_volume', MUSIC_VOLUME_DEFAULT,
)

export function isMusicOn(): boolean { return music.isOn() }

/** 切り替えて覚えさせる。⚠ **呼ぶのは `OptionsMenu`（`options.ts` 経由）だけ** */
export function setMusicOn(on: boolean): void { music.setOn(on) }

/** **0〜100。**⚠ **鳴らす側が使う値（0〜1）ではない**。変換は `musicGain()` */
export function getMusicVolume(): number { return music.getVolume() }

export function setMusicVolume(v: number): void { music.setVolume(v) }

/**
 * **鳴らす側が渡す音量（0〜1）。**
 * ⚠ **切ってあれば 0。**入／切と音量を**2箇所で見ないで済むように、ここで1つにする。**
 */
export function musicGain(): number { return music.gain() }

/**
 * **変わったことを知らせる。**
 * ⚠ **設定の面は開いたまま触られる。****閉じるのを待つと、つまみを動かしても音が変わらない。**
 */
export function watchMusic(fn: () => void): () => void { return music.watch(fn) }

/** ⚠ **テスト専用。**覚えたものを読み直して、見張りを外す */
export function _resetMusicForTest(): void { music._resetForTest() }
