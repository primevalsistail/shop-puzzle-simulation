import type { ItemDef } from './axes.js'
import type { GameState } from './evaluate.js'
import { evalCondition } from './evaluate.js'
import { CUSTOMER_PREFERENCE_RULES, combine } from './rules.js'

/**
 * 来店客の年ごろ（#122 の絵と同じ6通り）。
 *
 * ⚠ **新しい軸を足していない。**好みは既にある条件言語（`主種類` ／ `贅沢さ`）で書く
 *   （`rules.ts` の `CUSTOMER_PREFERENCE_RULES`）。**品の側に「子ども向け」のような印は持たせない。**
 * ⚠ **絵の名前と1対1**（`ui/faces.ts` の `CUSTOMER_ART_NAME`）。**片方だけ増やさない。**
 */
export const CUSTOMER_TYPES = ['男子', '女子', '男性', '女性', '老人男性', '老人女性'] as const
export type CustomerType = typeof CUSTOMER_TYPES[number]

/**
 * **誰がどれくらい来るか。**合計で割った割合で引く。
 *
 * ⚠ **均等にしない。**6等分だと**客の3分の1が子ども**になり、
 *   **子どもの好み（贅沢 ×0.5）が店の売れ行きを決めてしまう。**
 *   おとなが主で、年配がそれに次ぎ、子どもはたまに来る、という重みにしてある。
 */
export const CUSTOMER_ARRIVAL_WEIGHTS: Readonly<Record<CustomerType, number>> = {
  男子: 1, 女子: 1,
  男性: 4, 女性: 4,
  老人男性: 2, 老人女性: 2,
}

const TOTAL_WEIGHT = Object.values(CUSTOMER_ARRIVAL_WEIGHTS).reduce((a, b) => a + b, 0)

/** その年ごろが来る割合（0〜1）。**重みの合計で割ったもの** */
export function arrivalShare(type: CustomerType): number {
  return CUSTOMER_ARRIVAL_WEIGHTS[type] / TOTAL_WEIGHT
}

/**
 * 来た1人を引く。**渡された乱数をそのまま使う**ので、テストと `src/sim/` から固定できる。
 */
export function pickCustomerType(rng: () => number): CustomerType {
  let r = rng() * TOTAL_WEIGHT
  for (const type of CUSTOMER_TYPES) {
    r -= CUSTOMER_ARRIVAL_WEIGHTS[type]
    if (r < 0) return type
  }
  return CUSTOMER_TYPES[CUSTOMER_TYPES.length - 1]
}

/**
 * **その人がその品をどれくらい欲しがるか。**当たった好みの規則を合成した倍率。
 *
 * ⚠ **合成は規則と同じ加算**（`combine`。`1 + Σ(mᵢ − 1)`）。
 *   **ここだけ掛け算にしない** —— 好みが2本当たった品だけが跳ね上がる。
 * ⚠ **効き目は「売れやすさ」1本。**値段や集客には効かない
 *   （**誰が来たかで値段が変わると、同じ品の値が理由なく揺れて見える**）。
 */
export function preferenceMultiplier(type: CustomerType, item: ItemDef, state: GameState): number {
  const hits = CUSTOMER_PREFERENCE_RULES
    .filter(r => r.customerType === type && evalCondition(r.condition, { item, state }))
    .map(r => r.multiplier)
  return Math.max(0, combine(hits))
}
