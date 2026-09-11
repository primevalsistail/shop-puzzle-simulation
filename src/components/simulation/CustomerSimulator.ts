import type { DisplaySlot, SaleResult } from '../../types/index.js'
import type { ItemRegistry } from '../items/ItemRegistry.js'
import type { EvaluationResult, Modifiers } from '../../taxonomy/evaluate.js'
import { finalModifiers } from '../../taxonomy/evaluate.js'
import { luxuryTurnover } from '../../taxonomy/derive.js'

/** 1分あたりに客が来る確率（店全体の集客がこれに掛かる） */
const CUSTOMER_ARRIVAL_RATE = 0.3

/**
 * 足を止めた客が買う素の確率。**贅沢さの回転率がこれに掛かる。**
 *
 * ⚠ 旧 `ItemDef.baseSaleProb`（品ごとに手書きした 0.2〜0.65）を置き換えたもの（#30）。
 *   手書きの値は軸と無関係に置かれていて、なぜその品が速く捌けるのかが読めなかった。
 *   新体系では**回転率は `贅沢さ` が担う唯一の軸**で、日用1.0 ／ 上等0.7 ／ 贅沢0.45。
 */
const BASE_PURCHASE_PROB = 0.4

const NEUTRAL: Modifiers = { 売れやすさ: 1, 値段: 1, 集客: 1 }

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
  ): SaleResult[] {
    if (rng() > CUSTOMER_ARRIVAL_RATE * evaluation.shopWide.集客) return []

    const results: SaleResult[] = []
    const activeSlots = slots.filter(s => s.quantity > 0)

    for (const slot of activeSlots) {
      const own = evaluation.perSlot.get(slot.id) ?? NEUTRAL
      const final = finalModifiers(evaluation, slot.id)

      if (rng() < this.calcPurchaseProb(slot, own, final)) {
        results.push({
          slotId: slot.id,
          itemId: slot.itemId,
          qtySold: 1,
          // ⚠ 倍率は加工利益にだけ乗る。材料費には乗らない（derive.ts の finalPrice を参照）
          revenue: this.registry.finalPriceOf(slot.itemId, final.値段),
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
