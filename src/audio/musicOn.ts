/**
 * **「音楽を鳴らす」の入／切**（#14。bgm.md §4）。
 *
 * ⚠ **セーブデータ（枠3つ）には混ぜない。**遊びの記録ではなく、**この端末の好み**
 *   （`ConfirmDialog` の確認設定と同じ扱い）。
 * ⚠ **音量つまみは作らない**（bgm.md §4。**いまの設定に「つまみ」という部品が無い**）。
 */

const MUSIC_OFF_KEY = 'shop_puzzle_music_off'

/** ⚠ **既定は入。**初めて開いた人には鳴るほうが素直 */
let musicOn = true

function load(): void {
  try {
    musicOn = localStorage.getItem(MUSIC_OFF_KEY) !== '1'
  } catch {
    // ignore
  }
}

function save(): void {
  try {
    if (musicOn) localStorage.removeItem(MUSIC_OFF_KEY)
    else localStorage.setItem(MUSIC_OFF_KEY, '1')
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
  for (const fn of watchers) fn(on)
}

type Watcher = (on: boolean) => void
const watchers = new Set<Watcher>()

/**
 * **入／切が変わったときに呼ばれる**（`BgmPlayer` が使う）。
 * ⚠ **設定の面はその場で閉じない**ので、**切った瞬間に止まる**必要がある。
 */
export function watchMusicOn(fn: Watcher): () => void {
  watchers.add(fn)
  return () => watchers.delete(fn)
}

/** ⚠ **テスト専用。**localStorage を読み直して初期状態に戻す */
export function _resetMusicOnForTest(): void {
  watchers.clear()
  load()
}
