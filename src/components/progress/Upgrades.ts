import type { GridSize } from '../../types/index.js'
import { SKILL_INITIAL } from '../../taxonomy/craft.js'

/**
 * 金で買う長期の強化。**4系統 × 5段。**
 *
 * どれも「**いま買うか、目標まで我慢するか**」を問う。所持金は目標と同じ通貨なので、
 * 払えば目標が遠のく。**これがこのゲームの中心の判断。**
 *
 * ⚠ **強化の倍率は、配置の効き目とは別の掛け算にする。**
 *   規則の合成は加算（`1 + Σ(mᵢ−1)`）で、取り合わせ R1 は 1.2倍。
 *   ここに強化の +2.0 を混ぜると、**配置の工夫が誤差になる。**
 */
export type UpgradeKind = '棚' | '来客' | '利益率' | '手際'

export const UPGRADE_KINDS: readonly UpgradeKind[] = ['棚', '来客', '利益率', '手際'] as const

/** 段数（初期段を除く）。4系統とも同じにしてある。系統ごとに違うと比べにくい */
export const MAX_STAGE = 5

/**
 * 棚の大きさ。**1辺ずつ交互に伸ばし、縦横比を 6:5 から離さない。**
 *
 * 升目は 30 → 130 で 4.3倍、1段あたり約 1.34倍。
 * ⚠ **画面に入るのは 14×10 まで**（グリッド領域 x228〜1090 / y8〜609、1升58px）。
 *   13×10 で止めているのは、14×10 だと縦横比が 1.40 になり 6:5（1.20）から離れるため。
 */
const GRID_SIZES: readonly GridSize[] = [
  { width: 6, height: 5 },
  { width: 7, height: 6 },
  { width: 8, height: 7 },
  { width: 9, height: 8 },
  { width: 11, height: 9 },
  { width: 13, height: 10 },
]

/** 来店のしやすさ。`来店確率 = 素の来店率 × 店全体の集客 × これ` */
const CUSTOMER_MULTIPLIERS: readonly number[] = [1.0, 1.3, 1.6, 2.0, 2.5, 3.0]

/** 粗利の倍率。**倍率は粗利にだけ乗る**（`derive.ts` の `finalPrice`） */
const MARGIN_MULTIPLIERS: readonly number[] = [1.0, 1.3, 1.6, 2.0, 2.5, 3.0]

/**
 * 手際。`craft.ts` の `speedMultiplier` が読む。
 *
 * ⚠ **上限まで刻むこと。**低い段で止めると、難度の高い品（tier が深い品）だけが
 *   倍率の床に届かず、**深い品が不利なまま**になる。
 */
const SKILL_VALUES: readonly number[] = [SKILL_INITIAL, 14, 18, 22, 26, 30]

/**
 * 各段の費用。**段が進むほど高い。**
 *
 * ⚠ **未調整。**目標額（所持金1000万）と釣り合っているかは測っていない。
 *   効くのは費用の絶対額ではなく**目標額に対する比**で、比が 100% を超えると
 *   「元が取れないので誰も買わない」形になる。
 */
const COSTS: Record<UpgradeKind, readonly number[]> = {
  棚:     [32_000, 80_000, 160_000, 280_000, 400_000],
  来客:   [10_000, 24_000, 48_000, 96_000, 180_000],
  利益率: [14_000, 36_000, 72_000, 144_000, 260_000],
  手際:   [12_000, 32_000, 64_000, 112_000, 180_000],
}

/**
 * **1段上げると、効き目の数がどう変わるか**（PO 指示 2026-09-13「変更前と変更後を表示」）。
 * 最大まで買っていれば `null`。
 *
 * ⚠ **ここが効き目の表の唯一の読み手にならないようにしてある。**
 *   数は上の `GRID_SIZES` / `CUSTOMER_MULTIPLIERS` / `MARGIN_MULTIPLIERS` / `SKILL_VALUES`
 *   から引くだけで、**画面のために別の数を持たない。**持つと、直したときに片方だけ動く。
 *
 * ⚠ **`手際` だけ、出している数が画面のほかの場所に一度も出てこない**（`10 → 14`）。
 *   速さの倍率に直すと `craft.ts` の床（0.25）・天井（4.0）で**品ごとに変わる**ので、
 *   一律の倍率として出すと嘘になる。**PO へ回してある**
 *   （`construction/plans/upgrade-tab-po-marks.md`）。
 *
 * ⚠ **Phaser を読まない。**読むと `layout.test.ts` が実物の文字列を測れなくなる
 *   （`layout.ts` 冒頭と同じ理由）。
 */
export function effectDeltaLabel(kind: UpgradeKind, stage: number): string | null {
  if (stage < 0 || stage >= MAX_STAGE) return null
  const pair = (before: string, after: string): string => `${before} → ${after}`
  switch (kind) {
    case '棚': {
      const a = GRID_SIZES[stage], b = GRID_SIZES[stage + 1]
      return pair(`${a.width}×${a.height}`, `${b.width}×${b.height}`)
    }
    case '来客':
      return pair(times(CUSTOMER_MULTIPLIERS[stage]), times(CUSTOMER_MULTIPLIERS[stage + 1]))
    case '利益率':
      return pair(times(MARGIN_MULTIPLIERS[stage]), times(MARGIN_MULTIPLIERS[stage + 1]))
    case '手際':
      return pair(`${SKILL_VALUES[stage]}`, `${SKILL_VALUES[stage + 1]}`)
  }
}

/** `1.3` を `×1.3` にする。⚠ **小数1桁で揃える。**`×1` と `×1.3` が並ぶと段差に見える */
function times(v: number): string {
  return `×${v.toFixed(1)}`
}

export class Upgrades {
  private stages: Record<UpgradeKind, number> = { 棚: 0, 来客: 0, 利益率: 0, 手際: 0 }

  getStage(kind: UpgradeKind): number {
    return this.stages[kind]
  }

  isMaxed(kind: UpgradeKind): boolean {
    return this.stages[kind] >= MAX_STAGE
  }

  /** 次の段の費用。もう無ければ null */
  nextCost(kind: UpgradeKind): number | null {
    return this.isMaxed(kind) ? null : COSTS[kind][this.stages[kind]]
  }

  /** 1段進める。上限なら false */
  advance(kind: UpgradeKind): boolean {
    if (this.isMaxed(kind)) return false
    this.stages[kind]++
    return true
  }

  // ─── 効き目 ───────────────────────────────────────────
  gridSize(): GridSize {
    return { ...GRID_SIZES[this.stages.棚] }
  }

  customerMultiplier(): number {
    return CUSTOMER_MULTIPLIERS[this.stages.来客]
  }

  marginMultiplier(): number {
    return MARGIN_MULTIPLIERS[this.stages.利益率]
  }

  skill(): number {
    return SKILL_VALUES[this.stages.手際]
  }

  // ─── 保存 ─────────────────────────────────────────────
  toRecord(): Record<string, number> {
    return { ...this.stages }
  }

  restore(record: Record<string, number>): void {
    for (const kind of UPGRADE_KINDS) {
      const v = record[kind]
      // ⚠ `typeof NaN === 'number'` なので、有限かどうかまで見ないと段が NaN になる
      if (!Number.isFinite(v)) continue
      this.stages[kind] = Math.min(Math.max(0, Math.floor(v)), MAX_STAGE)
    }
  }
}
