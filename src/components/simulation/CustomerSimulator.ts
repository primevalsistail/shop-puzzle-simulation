import type { DisplaySlot, SaleResult } from '../../types/index.js'
import type { ItemRegistry } from '../items/ItemRegistry.js'
import type { EvaluationResult, Modifiers } from '../../taxonomy/evaluate.js'
import { finalModifiers } from '../../taxonomy/evaluate.js'
import { luxuryTurnover } from '../../taxonomy/derive.js'

/**
 * 1分あたりに客が来る確率（店全体の集客と、来客の強化がこれに掛かる）。
 *
 * 営業600分なので **1日およそ90人**。
 * ⚠ **ここを下げて売れ行きを絞らないこと。**客の数が減ると店が閑散として見える。
 *   絞るのは下の `BASE_PURCHASE_PROB`（1人が買うかどうか）で行う。
 */
export const CUSTOMER_ARRIVAL_RATE = 0.15

/**
 * 足を止めた客が買う素の確率。**贅沢さの回転率がこれに掛かる。**
 *
 * ⚠ **品ごとに手書きの確率を持たせない。**回転率は `贅沢さ` が担う唯一の軸で、
 *   日用1.0 ／ 上等0.7 ／ 贅沢0.45。品側に数値を置くと、なぜ速く捌けるのかが読めなくなる。
 *
 * ⚠ **売れ行きはここで絞る。**開始の3品×15個が **4日ほどもつ**水準
 *   （1日およそ11個）。ここを上げると開始在庫が半日で尽き、
 *   「買って並べる」の判断が起きないまま空になる。
 */
export const BASE_PURCHASE_PROB = 0.06

const NEUTRAL: Modifiers = { 売れやすさ: 1, 値段: 1, 集客: 1 }

/** Fisher-Yates。渡された乱数をそのまま使うのでテストから固定できる */
function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export class CustomerSimulator {
  constructor(private registry: ItemRegistry) {}

  /**
   * 1分ぶんの売買。
   *
   * **集客は2段に効く**:
   * - `店全体` ぶん … **客が来るかどうか**（R5「同じ島の産を並べると人が寄る」）
   * - `その品` ぶん … **その品の前で足を止めるかどうか**
   *
   * 店全体ぶんを来店に使うので、品ごとの判定では `その品` の集客だけを掛ける（二重計上を避ける）。
   */
  simulateMinute(
    slots: DisplaySlot[],
    evaluation: EvaluationResult,
    rng: () => number = Math.random,
    /**
     * 強化の倍率。**配置の効き目とは別の掛け算にする。**
     * 規則の合成は加算なので、ここに混ぜると配置の工夫が誤差になる。
     */
    upgrade: { 来客: number; 利益率: number } = { 来客: 1, 利益率: 1 },
  ): SaleResult[] {
    if (rng() > CUSTOMER_ARRIVAL_RATE * evaluation.shopWide.集客 * upgrade.来客) return []

    const results: SaleResult[] = []
    // ⚠ **巡回順をランダムにする。**`getAllSlots()` の順は挿入順＝**置いた順**で、
    //   プレイヤーには見えない。売れ行きを決めるのは**配置の工夫**であって、置いた順ではない。
    const activeSlots = shuffle(slots.filter(s => s.quantity > 0), rng)

    for (const slot of activeSlots) {
      const own = evaluation.perSlot.get(slot.id) ?? NEUTRAL
      const final = finalModifiers(evaluation, slot.id)

      if (rng() < this.calcPurchaseProb(slot, own, final)) {
        results.push({
          slotId: slot.id,
          itemId: slot.itemId,
          qtySold: 1,
          // ⚠ 倍率は加工利益にだけ乗る。材料費には乗らない（derive.ts の finalPrice を参照）
          revenue: this.registry.finalPriceOf(slot.itemId, final.値段 * upgrade.利益率),
        })
      }
    }

    return results
  }

  private calcPurchaseProb(slot: DisplaySlot, own: Modifiers, final: Modifiers): number {
    const item = this.registry.getItem(slot.itemId)
    const prob = BASE_PURCHASE_PROB * luxuryTurnover(item) * final.売れやすさ * own.集客
    return Math.min(1, prob)
  }
}
