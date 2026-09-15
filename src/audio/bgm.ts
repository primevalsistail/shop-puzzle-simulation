/**
 * **BGM の曲と、時刻からどの曲かを決めるところ**（#14）。
 *
 * 出典: aidlc-docs/inception/worldbuilding/bgm.md（8曲・替わりかた）
 *       aidlc-docs/inception/worldbuilding/audio/README.md（原本の置き場）
 *
 * ⚠ **ここは Phaser を読まない。**読むと node のテストから測れなくなる
 *   （`options.ts` と同じ約束）。鳴らすのは `BgmPlayer` の側。
 */

import type { IslandName } from '../taxonomy/islands.js'
import { CLOSE_HOUR, OPEN_HOUR, WAKE_HOUR } from '../components/core/TimeManager.js'

/** 曲1つ。`key` は Phaser の音のキーで、ファイル名でもある */
export type BgmKey =
  | 'title'
  | 'morning'
  | 'day-halvela'
  | 'day-linatsia'
  | 'day-noakita'
  | 'day-mifuyuria'
  | 'night'
  | 'ending'

export const BGM_KEYS: readonly BgmKey[] = [
  'title', 'morning',
  'day-halvela', 'day-linatsia', 'day-noakita', 'day-mifuyuria',
  'night', 'ending',
] as const

/**
 * **一日のうち、曲が替わる区分**（bgm.md §3）。
 *
 * ⚠ **`TimeManager` の `DayPhase` は使えない。**あちらは `作業|営業|睡眠` で、
 *   **朝（6:00-10:00）と夜（20:00-24:00）がどちらも `作業`** になる。
 *   **BGM は朝と夜で別の曲**なので、ここに別の区分を持つ。
 */
export type BgmBand = '朝' | '昼' | '夜'

/**
 * その時刻に鳴る区分（bgm.md §3 の表そのまま）。
 *
 * ⚠ **24:00〜6:00（睡眠）には曲が要らない** —— `TimeManager` が
 *   **24:00 に達した瞬間 6:00 へ飛ばす**ので、時計がそこに留まらない。
 *   **それでも `朝` を返す**（万一 6:00 未満で呼ばれても無音にしないため）。
 */
export function bandOf(hour: number): BgmBand {
  if (hour < WAKE_HOUR) return '朝'
  if (hour < OPEN_HOUR) return '朝'
  if (hour < CLOSE_HOUR) return '昼'
  return '夜'
}

/** 島ごとの昼の曲（bgm.md §1）。**4島4曲で、ここが唯一の対応表** */
const DAY_BY_ISLAND: Record<IslandName, BgmKey> = {
  ハルヴェラ: 'day-halvela',
  リナツィア: 'day-linatsia',
  ノアキータ: 'day-noakita',
  ミフユリア: 'day-mifuyuria',
}

/**
 * **いま鳴らすべき曲**（bgm.md §3）。
 *
 * ⚠ **速さ（1・3・10倍）も、時計が動いているかどうかも見ない。**
 *   **時間帯と島だけで決まる** —— `TimeManager` が節目で必ず止まるので、
 *   **曲が替わるのは必ず「ゲームがいま止まったところ」**になる。
 */
export function bgmFor(hour: number, island: IslandName): BgmKey {
  const band = bandOf(hour)
  if (band === '朝') return 'morning'
  if (band === '夜') return 'night'
  return DAY_BY_ISLAND[island]
}

/** 写しの置き場（`public/audio/`）。⚠ **原本は `worldbuilding/audio/`** */
export function bgmPaths(key: BgmKey): readonly string[] {
  // ⚠ **`ogg` だけだと Safari で鳴らない。**Phaser は先に鳴らせるほうを採る
  return [`audio/${key}.ogg`, `audio/${key}.m4a`]
}

/**
 * **配布元の表記**（bgm.md §4。**設定の面のいちばん下に出す**）。
 *
 * ⚠ **規約上は表記の義務が無い**（音楽の卵）。**それでも出す**と決めてある。
 * ⚠ **規約上はどちらも表記の義務が無い**（音楽の卵・効果音ラボ）。**それでも出す**と決めてある。
 */
export const AUDIO_CREDITS: readonly string[] = [
  'BGM: 音楽の卵（ontama-m.com）',
  '効果音: 効果音ラボ（soundeffect-lab.info）',
] as const
