import type { DisplaySlot, GridCell, Rotation } from '../../types/index.js'

/**
 * 品出しの型（マイセット。#27）。
 *
 * **島ごとに品出しを変え続けるのが面倒**という issue。四島を10日ごとに回り、
 * 島ごとに需要が違う（方針6）ので、**同じ並べ替えを周回のたびに繰り返すことになる。**
 *
 * ⚠ **ここは純粋。**Phaser も盤面も知らない。当てはめるのは呼ぶ側の仕事。
 */

/**
 * 型に覚える1区画。
 *
 * ⚠ **`shape` と `id` を覚えないこと。**
 *   `shape` は品から引ける**導出値**で、覚えると品のかたちを変えたとき型だけが古いまま残る。
 *   `id` はそのときの区画の名前でしかない。**呼び出すときに付け直す。**
 */
export interface PresetSlot {
  readonly itemId: string
  readonly position: GridCell
  readonly rotation: Rotation
}

export interface ShelfPreset {
  readonly savedAt: number
  readonly slots: readonly PresetSlot[]
}

/**
 * 覚えられる型の数。
 *
 * **島は4つ**だが、4つにはしていない。**島ごとに1つと決めつけない**ため
 * （「売る型」「作る型」のような使い方を閉ざさない）。
 */
export const PRESET_COUNT = 3

/** いま並べているものを型の形にする。**導出値（かたち）と区画の名前は落とす** */
export function capture(slots: readonly DisplaySlot[]): PresetSlot[] {
  return slots.map(s => ({
    itemId: s.itemId,
    position: { x: s.position.x, y: s.position.y },
    rotation: s.rotation,
  }))
}

export class ShelfPresets {
  private presets: (ShelfPreset | null)[] = Array(PRESET_COUNT).fill(null)

  get(index: number): ShelfPreset | null {
    return this.inRange(index) ? this.presets[index] : null
  }

  /** いまの並びを覚える。**空の盤面も覚えてよい**（「全部下ろす」型になる） */
  save(index: number, slots: readonly DisplaySlot[], now = Date.now()): void {
    if (!this.inRange(index)) return
    this.presets[index] = { savedAt: now, slots: capture(slots) }
  }

  clear(index: number): void {
    if (this.inRange(index)) this.presets[index] = null
  }

  toRecord(): (ShelfPreset | null)[] {
    return this.presets.map(p => (p ? { savedAt: p.savedAt, slots: [...p.slots] } : null))
  }

  /**
   * セーブから戻す。
   *
   * ⚠ **中身を確かめてから入れること。**古いセーブや壊れたセーブを素通しすると、
   *   呼び出した瞬間に落ちる。**形が合わないものは無かったことにする。**
   */
  restore(record: unknown): void {
    this.presets = Array(PRESET_COUNT).fill(null)
    if (!Array.isArray(record)) return
    for (let i = 0; i < Math.min(PRESET_COUNT, record.length); i++) {
      const p = record[i] as ShelfPreset | null
      if (!p || !Array.isArray(p.slots)) continue
      const slots = p.slots.filter(isPresetSlot).map(s => ({
        itemId: s.itemId,
        position: { x: Math.floor(s.position.x), y: Math.floor(s.position.y) },
        rotation: s.rotation,
      }))
      this.presets[i] = { savedAt: Number.isFinite(p.savedAt) ? p.savedAt : 0, slots }
    }
  }

  private inRange(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < PRESET_COUNT
  }
}

function isPresetSlot(s: unknown): s is PresetSlot {
  if (typeof s !== 'object' || s === null) return false
  const v = s as Partial<PresetSlot>
  return typeof v.itemId === 'string'
    && typeof v.position?.x === 'number' && Number.isFinite(v.position.x)
    && typeof v.position?.y === 'number' && Number.isFinite(v.position.y)
    && (v.rotation === 0 || v.rotation === 1 || v.rotation === 2 || v.rotation === 3)
}
