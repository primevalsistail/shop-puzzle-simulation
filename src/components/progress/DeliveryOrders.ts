import type { ItemDef, ItemId } from '../../taxonomy/axes.js'
import type { IslandName } from '../../taxonomy/islands.js'
import type { GameState } from '../../taxonomy/evaluate.js'
import { stockedByIslandMerchant } from '../../taxonomy/evaluate.js'
import { salePrice } from '../../taxonomy/derive.js'
import type { Inventory } from '../economy/Inventory.js'
import type { EconomyManager } from '../economy/EconomyManager.js'

/**
 * 1件の注文で納める個数。
 *
 * ⚠ **仮置き（#61 の表へ）。**「10個なら仕入れ画面の1回の買い物で用意できる」以上の根拠は無い。
 */
export const ORDER_QUANTITY = 10

/**
 * 報酬 ＝ **売値 × 個数 × これ**。
 *
 * ⚠ **仮置き（#61 の表へ）。**買値は売値の 0.7（産地なら 0.56）なので、
 *   3 なら「買って運ぶ」だけで約5倍になる。**目標1000万に対しては無視できる額**
 *   （tier1 の売値は 20〜60 なので1件 600〜2,000レン）で、**効かせるなら #61 で上げる。**
 */
export const ORDER_REWARD_RATE = 3

/** 納品の注文。**セーブに載る形**（`SaveData.orders`）でもある */
export interface DeliveryOrder {
  readonly itemId: ItemId
  /** 納品先の島。**発注元（いまの島）ではなく、次の寄港地** */
  readonly island: IslandName
  readonly quantity: number
  /** 果たしたときに入る金（レン） */
  readonly reward: number
  /** 出た日 */
  readonly issuedDay: number
}

export interface DeliveryResult {
  readonly order: DeliveryOrder
  /** 果たせたか。**果たせなくても注文は流れる**（罰なし。PO 判断 Q4=A） */
  readonly delivered: boolean
}

/**
 * 納品の注文（#28）。**寄港ごとに1件、自動で出る。**
 *
 * ## 注文はどこから選ぶか
 *
 * **「いまの島の商人が並べていて、納品先（次の島）の商人が並べない品」**だけを候補にする。
 *
 *   - **納品先で買えない**（PO 判断・`issue-grouping.md`）…
 *     そうしないと**着いた先で買って即納品できる無料ボーナス**になる
 *   - **いまの島で買える** … こちらは器の都合。全135品の補集合から選ぶと、
 *     **材料も作り方も無い tier7 の品**が出てきて**果たしようがない注文**になる
 *
 * 判定は `stockedByIslandMerchant()` を2回呼ぶだけで、**新しいデータは1行も足していない。**
 *
 * ## U2（100個売ると買えるようになる）をどこで見るか → **発注時だけでよい**
 *
 * ⚠ **納品時の再評価はしない。**上の候補は結果として
 * **「産地が発注元の島である品」に限られる**（産地 `なし` の品は次の島でも並ぶので必ず外れる）。
 * 産地の一致は U3 で見られていて、**U2 で解禁されても産地は変わらない**ので、
 * **納品先でその品が並ぶようになることは起こらない。**
 * つまり「発注時に買えなかったが納品時には買える」は、この候補の作り方では**構造的に起きない。**
 */
export class DeliveryOrders {
  /**
   * ⚠ **いまは常に0件か1件。**配列にしてあるのは、セーブの形（`SaveData.orders`）を
   *   複数件へ広げるときに形を変えずに済ませるため。**先頭が有効な注文。**
   */
  private orders: DeliveryOrder[] = []

  constructor(
    private inventory: Inventory,
    private economy: EconomyManager,
    /** 売値。テストから差し替えられるようにしてある */
    private priceOf: (itemId: ItemId) => number = itemId => salePrice(itemId),
  ) {}

  getActive(): DeliveryOrder | null {
    return this.orders[0] ?? null
  }

  /**
   * 注文に出せる品。**いまの島で買えて、納品先では買えない品。**
   *
   * `state` は `WorldState.getState()` が返す素の値。納品先ぶんは `現在地` を差し替えて呼ぶ。
   */
  candidates(
    items: readonly ItemDef[],
    state: GameState,
    destination: IslandName,
  ): readonly ItemDef[] {
    const here = new Set(stockedByIslandMerchant(items, state).map(i => i.id))
    const there = new Set(
      stockedByIslandMerchant(items, { ...state, 現在地: destination }).map(i => i.id),
    )
    return items.filter(i => here.has(i.id) && !there.has(i.id))
  }

  /**
   * 注文を1件出す。**前の注文は流れる**（罰なし・持ち越さない）。
   *
   * 候補が1つも無ければ注文は出ない（`null`）。
   */
  issue(
    items: readonly ItemDef[],
    state: GameState,
    destination: IslandName,
    day: number,
    rand: () => number = Math.random,
  ): DeliveryOrder | null {
    const candidates = this.candidates(items, state, destination)
    if (candidates.length === 0) {
      this.orders = []
      return null
    }
    const pick = candidates[Math.min(candidates.length - 1, Math.floor(rand() * candidates.length))]
    const order: DeliveryOrder = {
      itemId: pick.id,
      island: destination,
      quantity: ORDER_QUANTITY,
      reward: Math.round(this.priceOf(pick.id) * ORDER_QUANTITY * ORDER_REWARD_RATE),
      issuedDay: day,
    }
    this.orders = [order]
    return order
  }

  /**
   * 納品先に着いたときの精算。**着いた時点で自動で納める。**
   *
   * ⚠ **果たせても果たせなくても、注文はここで流れる**（PO 判断 Q4=A「罰なし」）。
   *   果たせなかったことを次に持ち越さない。
   *
   * 納品先でなければ `null`（何も起きない）。
   */
  settleArrival(island: IslandName): DeliveryResult | null {
    const order = this.getActive()
    if (!order || order.island !== island) return null
    const delivered = this.inventory.hasEnough(order.itemId, order.quantity)
    if (delivered) {
      this.inventory.remove(order.itemId, order.quantity)
      // ⚠ **客に売れた経路ではないので `addRevenue` を通さない。**
      //   通すと進捗バーと目標達成の幕が読む「累計売上」が納品ぶん膨らむ。
      this.economy.addIncome(order.reward)
    }
    this.orders = []
    return { order, delivered }
  }

  /** いま持っている数（帯の「手持ち n/10」が読む） */
  heldFor(order: DeliveryOrder): number {
    return this.inventory.getQuantity(order.itemId)
  }

  toRecord(): DeliveryOrder[] {
    return this.orders.map(o => ({ ...o }))
  }

  /**
   * ロードで戻す。
   *
   * ⚠ **注文が無かった頃のセーブは `undefined` で来る。**空として読む（`shelfPresets` と同じ慣行）。
   */
  restore(orders: readonly DeliveryOrder[] | undefined): void {
    this.orders = (orders ?? [])
      .filter(o => o && typeof o.itemId === 'string' && typeof o.reward === 'number')
      .slice(0, 1)
      .map(o => ({ ...o }))
  }
}
