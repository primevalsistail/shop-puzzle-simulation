import type { DisplaySlot, GridCell, Rotation } from '../../types/index.js'
import type { IslandName } from '../../taxonomy/islands.js'
import { ROUTE } from '../../taxonomy/islands.js'

/**
 * マイセット（#27）。
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
  /**
   * **覚えたときに居た島**（#67。PO 判断 Q5 のベース案 A）。
   *
   * ⚠ **任意。**型が島を持たない古いセーブがすでに手元にあるので、
   *   **無いまま読めること**（先例は `SaveData.shelfPresets` / `orders`）。
   * ⚠ **これが既定値。**名前（`name`）を付けなければこれが出る（#83）。
   */
  readonly island?: IslandName
  /**
   * **プレイヤーが付けた名前**（#83。PO 判断 Q5「ベースはA、そのあとにユーザが編集できればいい」）。
   *
   * ⚠ **任意。空文字を持たない。**空にしたら `undefined` に戻し、**島名（既定値）へ戻す**
   *   —— ペルソナ4人中2人が「名前を付けると名前を読むようになり、盤面を見なくなる」と
   *   反対しているので、**名前を付けなければ従来どおりに見えること**が条件。
   * ⚠ **長さは `PRESET_NAME_MAX`。**升の文字欄（308px）からはみ出させない。
   */
  readonly name?: string
  readonly slots: readonly PresetSlot[]
}

/**
 * 型に付けられる名前の長さ（**文字数**）。⚠ **仮置き（#61）。**
 *
 * ⚠ **升の文字欄は 308px**（`layout.ts` の `PRESET_TEXT_W`）。
 *   **全角ばかり 20文字で 240px** なので、いちばん長い既定値
 *   `ミフユリア島`（72px。区画数を落とした 2026-09-13 以降）の3倍以上打てる。
 *   収まるかは `src/ui/layout.test.ts` が `estTextWidth` で見ている。
 */
export const PRESET_NAME_MAX = 20

/**
 * 打たれた名前を、型に入れてよい形にする。
 *
 * ⚠ **空は `undefined`。**空文字を持たせると `describePreset` が空行を出し、
 *   **既定値（島名）へ戻れなくなる。**
 * ⚠ **打った文字を書き換えない**（`domInput.ts` の約束）。**落とすのは前後の空白と、
 *   1行の升に出せない改行・タブだけ**（改行はセーブを手で書き換えたときにしか来ない）。
 * ⚠ **数えるのはコードポイント。**`slice` で切ると絵文字が割れる。
 */
export function normalizePresetName(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const t = raw.replace(/[\r\n\t]/g, ' ').trim()
  if (t === '') return undefined
  return [...t].slice(0, PRESET_NAME_MAX).join('')
}

/**
 * 覚えられる型の数。**PO 判断（2026-09-12）で 3 → 10。**
 *
 * **島は4つ**だが、4つにはしていない。**島ごとに1つと決めつけない**ため
 * （「売る型」「作る型」のような使い方を閉ざさない）。
 *
 * ⚠ **増やすと画面の行が縮む。**場所の一覧に使える高さは `ROWS_BOTTOM - ROWS_TOP`（454px）で、
 *   1行 = 454 / この数。**10 で 45px。**これ以上増やすなら**ページ送りが要る**
 *   （`src/ui/layout.test.ts` が、入らなくなったら落ちる）。
 */
export const PRESET_COUNT = 10

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

  /**
   * いまの並びを覚える。**空の盤面も覚えてよい**（「全部下ろす」型になる）。
   *
   * ⚠ **島は覚えるときに渡す。**呼び出すときの島ではない（呼び出しはどの島でもできる）。
   */
  save(
    index: number, slots: readonly DisplaySlot[],
    island?: IslandName, now = Date.now(),
  ): void {
    if (!this.inRange(index)) return
    // ⚠ **上書きで名前を消さない**（#83）。島ごとの型は**寄港のたびに覚え直す**ので、
    //   消すと付けた名前が周回ごとに毎回消える。名前を捨てるのは `clear`（削除）のほう
    const name = this.presets[index]?.name
    this.presets[index] = { savedAt: now, island, name, slots: capture(slots) }
  }

  /**
   * 名前を書き換える（#83）。**空にしたら島名（既定値）へ戻る。**
   *
   * ⚠ **空の升には付けられない。**名前は型に付くもので、升に付くものではない
   *   （空の升に名前だけ残ると、`削除` したはずの字が残る）。
   */
  setName(index: number, raw: string): void {
    const preset = this.get(index)
    if (!preset) return
    this.presets[index] = { ...preset, name: normalizePresetName(raw) }
  }

  clear(index: number): void {
    if (this.inRange(index)) this.presets[index] = null
  }

  toRecord(): (ShelfPreset | null)[] {
    return this.presets.map(p =>
      (p ? { savedAt: p.savedAt, island: p.island, name: p.name, slots: [...p.slots] } : null))
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
      this.presets[i] = {
        savedAt: Number.isFinite(p.savedAt) ? p.savedAt : 0,
        // ⚠ **4島に無い値は読み捨てる。**島の名前は変わりうるので、
        //   古いセーブの知らない島名をそのまま画面へ出さない
        island: isIslandName(p.island) ? p.island : undefined,
        // ⚠ **手で書き換えたセーブの長い名前をそのまま画面へ出さない**（升からはみ出す）
        name: normalizePresetName(p.name),
        slots,
      }
    }
  }

  private inRange(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < PRESET_COUNT
  }
}

function isIslandName(v: unknown): v is IslandName {
  return typeof v === 'string' && (ROUTE as readonly string[]).includes(v)
}

/**
 * 升に出す1行（#67）。
 *
 * ⚠ **`PresetMenu` ではなくここに置く。**あちらは Phaser を読むので
 *   node の単体テストから import できず、**文字を組み立てる側を純粋な側に置かないと
 *   検査できない**（`layout.ts` の `upcomingLabel` と同じ理由）。
 * ⚠ **現実の時刻は出さない。**「どの型を呼ぶか」の判断に一切効かない（束M・ペルソナ3人）。
 * ⚠ **島を持たない古い型は、従来どおり区画数だけ。**「島なし」と書かない
 *   （書くと、古いセーブの10本ぜんぶに意味のない字が並ぶ）。
 * ⚠ **島を持つ型は島名だけ**（PO 指示 2026-09-13。区画数も「全部下ろす」も出さない）
 *   → `defaultPresetLabel`。
 */
export function describePreset(preset: ShelfPreset | null): string {
  return preset?.name ?? defaultPresetLabel(preset)
}

/**
 * **名前を付けていない型に出す字**（#67）。名前を空にしたときに戻る先でもある（#83）。
 *
 * ⚠ **入力欄の `placeholder` もこれ。**打つ前から島名が見えているので、
 *   **名前を付けなければ従来どおりに見える**（ペルソナ2人の反対への答え）。
 * ⚠ **区画数も「全部下ろす」も出さない**（PO 指示 2026-09-13）。**出すのは島名だけ。**
 *   **中身は縮小図に出ている**ので、字にすると同じことを2度言うことになる
 *   （何も出していない型は、縮小図が**升だけの空の盤面**になる）。
 * ⚠ **島を持たない古い型だけ、これまでどおり区画数。**島も数も消すと
 *   **古いセーブの型がすべて同じ字になる**（手がかりが縮小図だけに戻る）。
 *   ⚠ **その型は `0区画` にもなりうる**（島を持たない、何も出していない型）。
 */
export function defaultPresetLabel(preset: ShelfPreset | null): string {
  if (!preset) return '空'
  return preset.island ? `${preset.island}島` : `${preset.slots.length}区画`
}

function isPresetSlot(s: unknown): s is PresetSlot {
  if (typeof s !== 'object' || s === null) return false
  const v = s as Partial<PresetSlot>
  return typeof v.itemId === 'string'
    && typeof v.position?.x === 'number' && Number.isFinite(v.position.x)
    && typeof v.position?.y === 'number' && Number.isFinite(v.position.y)
    && (v.rotation === 0 || v.rotation === 1 || v.rotation === 2 || v.rotation === 3)
}
