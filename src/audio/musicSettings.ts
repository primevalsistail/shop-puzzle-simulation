/**
 * **音の好み**（#14。**入／切と、0〜100 の音量**）。
 *
 * ⚠ **セーブデータ（枠3つ）には混ぜない。**遊びの記録ではなく、**この端末の好み**
 *   （`ConfirmDialog` の確認設定と同じ扱い）。
 * ⚠ **音量つまみを足した**（PO 指示 2026-09-15「**0〜100 で音量調節したい**」）。
 *   **入／切の行は残す** —— **0 まで下げて切るのと、切るのは別。**
 *   **切って入れ直したとき、前の音量に戻る**のは行があるからできている。
 */

const MUSIC_OFF_KEY = 'shop_puzzle_music_off'
const MUSIC_VOLUME_KEY = 'shop_puzzle_music_volume'

/** ⚠ **既定は入。**初めて開いた人には鳴るほうが素直 */
let musicOn = true

/**
 * **0〜100。**⚠ **既定は 50。**
 * **100 を既定にしない** —— **うしろで鳴るもの**なので、大きいと最初に切られる。
 */
export const MUSIC_VOLUME_DEFAULT = 50
export const MUSIC_VOLUME_MIN = 0
export const MUSIC_VOLUME_MAX = 100

let musicVolume = MUSIC_VOLUME_DEFAULT

/** ⚠ **範囲の外と、数でないものを弾く**（覚えた値が壊れていても鳴らなくならないように） */
function clamp(v: number): number {
  if (!Number.isFinite(v)) return MUSIC_VOLUME_DEFAULT
  return Math.min(MUSIC_VOLUME_MAX, Math.max(MUSIC_VOLUME_MIN, Math.round(v)))
}

function load(): void {
  try {
    musicOn = localStorage.getItem(MUSIC_OFF_KEY) !== '1'
    const saved = localStorage.getItem(MUSIC_VOLUME_KEY)
    musicVolume = saved === null ? MUSIC_VOLUME_DEFAULT : clamp(Number(saved))
  } catch {
    // ignore
  }
}

function save(): void {
  try {
    if (musicOn) localStorage.removeItem(MUSIC_OFF_KEY)
    else localStorage.setItem(MUSIC_OFF_KEY, '1')
    localStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume))
  } catch {
    // ignore
  }
}

// ⚠ **読み込みは1度だけ**（`ConfirmDialog` と同じ理由。
//   呼ぶたびに読むと、設定の画面で変えた値が次の再生で戻る）
load()

export function isMusicOn(): boolean {
  return musicOn
}

/** 切り替えて覚えさせる。⚠ **呼ぶのは `OptionsMenu`（`options.ts` 経由）だけ** */
export function setMusicOn(on: boolean): void {
  musicOn = on
  save()
  notify()
}

/** **0〜100。**⚠ **鳴らす側が使う値（0〜1）ではない**。変換は `musicGain()` */
export function getMusicVolume(): number {
  return musicVolume
}

export function setMusicVolume(v: number): void {
  musicVolume = clamp(v)
  save()
  notify()
}

/**
 * **鳴らす側が渡す音量（0〜1）。**
 * ⚠ **切ってあれば 0。**入／切と音量を**2箇所で見ないで済むように、ここで1つにする。**
 */
export function musicGain(): number {
  return musicOn ? musicVolume / MUSIC_VOLUME_MAX : 0
}

type Watcher = () => void
const watchers = new Set<Watcher>()

/**
 * **変わったことを知らせる。**
 * ⚠ **設定の面は開いたまま触られる。****閉じるのを待つと、つまみを動かしても音が変わらない。**
 */
export function watchMusic(fn: Watcher): () => void {
  watchers.add(fn)
  return () => { watchers.delete(fn) }
}

function notify(): void {
  for (const fn of watchers) fn()
}

/** ⚠ **テスト専用。**覚えたものを読み直して、見張りを外す */
export function _resetMusicForTest(): void {
  watchers.clear()
  musicOn = true
  musicVolume = MUSIC_VOLUME_DEFAULT
  load()
}
