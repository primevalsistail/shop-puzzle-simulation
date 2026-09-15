/**
 * **音の好みを1つ作る工場**（#124）。
 *
 * **入／切と、0〜100 の音量**という同じ形を、**音楽（#14）と効果音（#124）が持つ。**
 * ⚠ **写しを2つ置かない。**置くと**片方だけ直した状態**になる ——
 *   **BGM の音量つまみは2回直っており**（`424b34d` `46f12df`）、**次も片方だけ直る。**
 *
 * ⚠ **ここは Phaser も `localStorage` の有無も前提にしない。**
 *   **読み書きは try で囲む**（プライベート窓では投げる）。
 */

export type AudioSetting = {
  readonly VOLUME_DEFAULT: number
  readonly VOLUME_MIN: number
  readonly VOLUME_MAX: number
  isOn: () => boolean
  setOn: (on: boolean) => void
  getVolume: () => number
  setVolume: (v: number) => void
  /** **鳴らす側が渡す音量（0〜1）。**⚠ **切ってあれば 0** */
  gain: () => number
  watch: (fn: () => void) => () => void
  _resetForTest: () => void
}

const VOLUME_MIN = 0
const VOLUME_MAX = 100

/**
 * @param offKey    **切ってあることを覚える鍵**（⚠ **「入」を覚えない。**
 *                  **既定が入なので、何も無い＝入 にしておくと初回が素直**）
 * @param volumeKey 音量を覚える鍵
 * @param volumeDefault ⚠ **100 にしない。**大きいと最初に切られる
 */
export function makeAudioSetting(
  offKey: string, volumeKey: string, volumeDefault: number,
): AudioSetting {
  let on = true
  let volume = volumeDefault

  const clamp = (v: number): number => {
    if (!Number.isFinite(v)) return volumeDefault
    return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, Math.round(v)))
  }

  const load = (): void => {
    try {
      on = localStorage.getItem(offKey) !== '1'
      const saved = localStorage.getItem(volumeKey)
      volume = saved === null ? volumeDefault : clamp(Number(saved))
    } catch {
      // ignore
    }
  }

  const save = (): void => {
    try {
      if (on) localStorage.removeItem(offKey)
      else localStorage.setItem(offKey, '1')
      localStorage.setItem(volumeKey, String(volume))
    } catch {
      // ignore
    }
  }

  const watchers = new Set<() => void>()
  const notify = (): void => { for (const fn of watchers) fn() }

  // ⚠ **読み込みは1度だけ**（呼ぶたびに読むと、設定の画面で変えた値が次の再生で戻る）
  load()

  return {
    VOLUME_DEFAULT: volumeDefault, VOLUME_MIN, VOLUME_MAX,
    isOn: () => on,
    setOn: (next: boolean) => { on = next; save(); notify() },
    getVolume: () => volume,
    setVolume: (v: number) => { volume = clamp(v); save(); notify() },
    gain: () => (on ? volume / VOLUME_MAX : 0),
    watch: (fn: () => void) => { watchers.add(fn); return () => { watchers.delete(fn) } },
    _resetForTest: () => { watchers.clear(); on = true; volume = volumeDefault; load() },
  }
}
