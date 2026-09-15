/**
 * **効果音の一覧と、鳴らしていいかの判断**（#124）。
 *
 * 出典: aidlc-docs/inception/worldbuilding/se-candidates.md（12音・配布元・替えの候補）
 *       aidlc-docs/sessions/questions-se.md（PO 判断 2026-09-16。Q1〜Q3）
 *
 * ⚠ **ここは Phaser を読まない。**読むと node のテストから測れなくなる
 *   （`bgm.ts` と `options.ts` と同じ約束）。鳴らすのは `SePlayer` の側。
 *
 * ⚠ **速さ（1・3・10倍）を見ない**（PO 判断 2026-09-16。Question 2 = B）。
 *   **`bgm.ts` が速さを見ないのと同じ向き。**代わりに**間隔で間引く**（下の `MIN_GAP_MS`）。
 */

/** 音1つ。`key` は Phaser の音のキーで、`public/audio/<key>.mp3` でもある */
export type SeKey =
  | 'button' | 'place' | 'deny' | 'grab' | 'discard' | 'confirm'
  | 'window-open' | 'window-close' | 'fanfare'
  | 'sold' | 'crafted' | 'port-open'

/**
 * ⚠ **「押した音」と「勝手に起きた音」で間隔が違う。**
 *
 * - **押した音**は**鳴る回数をプレイヤーが決める。**間引くと**押したのに無音**になる。
 *   **同じ瞬間に2つ重ならない**ぶんだけ空ける（`TAP_GAP_MS`）。
 * - **勝手に起きた音**は**速さで回数が変わる。**10倍速で**売れた音が鳴り続ける**ので、
 *   **0.5秒に1回まで**に間引く（`AUTO_GAP_MS`。PO 判断 2026-09-16）。
 */
export const TAP_GAP_MS = 60
/** ⚠ **仮の値。**触るときは `audit.md`（#124 の節）の数字を先に直す */
export const AUTO_GAP_MS = 500

/** ⚠ **勝手に起きた音はこの3つだけ。**ほかは全部「押した音」 */
export const AUTO_KEYS: readonly SeKey[] = ['sold', 'crafted', 'port-open'] as const

export const SE_KEYS: readonly SeKey[] = [
  'button', 'place', 'deny', 'grab', 'discard', 'confirm',
  'window-open', 'window-close', 'fanfare',
  'sold', 'crafted', 'port-open',
] as const

/** その音を空けるべき間隔 */
export function minGapMs(key: SeKey): number {
  return AUTO_KEYS.includes(key) ? AUTO_GAP_MS : TAP_GAP_MS
}

/** 写しの置き場（`public/audio/`）。⚠ **原本は `worldbuilding/audio/`** */
export function sePath(key: SeKey): string {
  // ⚠ **BGM と違って1つだけ。****mp3 はどのブラウザでも鳴る**ので `m4a` を作らない
  //   （`bgmPaths()` が2つ返すのは **ogg が Safari で鳴らないから**）
  return `audio/${key}.mp3`
}

/**
 * **間引き。**⚠ **これが Question 2 = B の中身。**
 *
 * **鍵ごとに「最後に鳴らした時刻」だけを持つ。**
 * ⚠ **速さも、いくつ溜まったかも見ない** —— **見ると、速さを引数に取ることになる。**
 */
export class SeThrottle {
  private last = new Map<SeKey, number>()

  /**
   * **いま鳴らしていいか。**⚠ **`true` を返したら鳴らしたものとして数える**
   * （**聞くだけの用途に使わない**）。
   *
   * @param now ミリ秒。**呼ぶ側が渡す**（テストから時計を進められるように）
   */
  allow(key: SeKey, now: number): boolean {
    const prev = this.last.get(key)
    if (prev !== undefined && now - prev < minGapMs(key)) return false
    this.last.set(key, now)
    return true
  }

  /** ⚠ **場面をまたぐときに呼ぶ。**持ち越すと、場面を移った直後の1音が消える */
  reset(): void {
    this.last.clear()
  }
}
