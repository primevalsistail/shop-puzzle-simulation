import { describe, it, expect } from 'vitest'
import { orderLineText } from './OrderBar.js'
import {
  ORDER_TEXT_MAX_W, ORDER_BAR_FONT_PX, ORDER_BAR_T, ORDER_BAR_B, ORDER_BAR_H,
  GRID_ORIGIN_Y, CELL_SIZE, LOG_T, STRIP_L, ORDER_BAR_R, estTextWidth,
} from './layout.js'
import { ORDER_QUANTITY, ORDER_REWARD_RATE } from '../components/progress/DeliveryOrders.js'
import type { DeliveryOrder } from '../components/progress/DeliveryOrders.js'
import { ALL_ITEMS } from '../taxonomy/items.js'
import { ROUTE } from '../taxonomy/islands.js'
import { salePrice } from '../taxonomy/derive.js'

/** 注文に出うるのは**産地を持つ素材**だけ（`DeliveryOrders.candidates`） */
const ORDERABLE = ALL_ITEMS.filter(i => i.origin !== 'なし')

const order = (reward: number, island: string): DeliveryOrder => ({
  itemId: 'x', island: island as never, quantity: ORDER_QUANTITY, reward, issuedDay: 1,
})

describe('納品の帯（#28）', () => {
  it('注文に出うるどの品でも、1行が帯からはみ出さない', () => {
    let worst = { w: 0, text: '' }
    for (const item of ORDERABLE) {
      const reward = Math.round(salePrice(item.id) * ORDER_QUANTITY * ORDER_REWARD_RATE)
      for (const island of ROUTE) {
        // 手持ちは最大 999（`MAX_QUANTITY`）まで出る
        const text = orderLineText(item.display.name, order(reward, island), 999)
        const w = estTextWidth(text, ORDER_BAR_FONT_PX)
        if (w > worst.w) worst = { w, text }
      }
    }
    expect(worst.w, worst.text).toBeLessThanOrEqual(ORDER_TEXT_MAX_W)
  })

  it('金額は `money()` の書き方（桁区切り ＋ レン）で出る', () => {
    expect(orderLineText('たけのこ', order(1200, 'リナツィア'), 3))
      .toBe('納品 たけのこ ×10 → リナツィア島　手持ち 3/10　報酬 1,200レン')
  })

  /** ⚠ 盤面は 13×10 のとき y590 まで来る。メッセージ欄は y610 から */
  it('帯は盤面の下端とメッセージ欄のあいだに収まっている', () => {
    expect(ORDER_BAR_T).toBeGreaterThanOrEqual(GRID_ORIGIN_Y + 10 * CELL_SIZE)
    expect(ORDER_BAR_B).toBeLessThanOrEqual(LOG_T)
    expect(ORDER_BAR_H).toBeGreaterThanOrEqual(ORDER_BAR_FONT_PX + 4)
    // キャラ帯（980〜）にかからない
    expect(ORDER_BAR_R).toBeLessThanOrEqual(STRIP_L)
  })
})
