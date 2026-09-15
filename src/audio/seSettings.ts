/**
 * **効果音の好み**（#124。**入／切と、0〜100 の音量**）。
 *
 * ⚠ **音楽とは別に持つ**（PO 判断 2026-09-16。質問票 Question 3 = A「分ける」）。
 *   **切りたい理由が違う** —— **音楽は繰り返すので飽きて切る。効果音は押した手応えなので残したい。**
 *   **一緒にすると、どちらかを諦めることになる。**
 *
 * ⚠ **既定は 入・50。****音楽と同じ**（PO 判断 2026-09-16）。
 *   **効果音だけ最初から大きい／小さい理由が無い。**
 */

import { makeAudioSetting } from './audioSettings.js'

export const SE_VOLUME_DEFAULT = 50
export const SE_VOLUME_MIN = 0
export const SE_VOLUME_MAX = 100

const se = makeAudioSetting(
  'shop_puzzle_se_off', 'shop_puzzle_se_volume', SE_VOLUME_DEFAULT,
)

export function isSeOn(): boolean { return se.isOn() }
export function setSeOn(on: boolean): void { se.setOn(on) }
export function getSeVolume(): number { return se.getVolume() }
export function setSeVolume(v: number): void { se.setVolume(v) }

/** **鳴らす側が渡す音量（0〜1）。**⚠ **切ってあれば 0** */
export function seGain(): number { return se.gain() }

export function watchSe(fn: () => void): () => void { return se.watch(fn) }

/** ⚠ **テスト専用** */
export function _resetSeForTest(): void { se._resetForTest() }
