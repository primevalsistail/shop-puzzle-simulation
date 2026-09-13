import type { ItemDef, ItemId } from '../../taxonomy/axes.js'
import type { GameState } from '../../taxonomy/evaluate.js'
import { stockedByIslandMerchant } from '../../taxonomy/evaluate.js'
import { ISLANDS } from '../../taxonomy/islands.js'
import { salePrice, tier } from '../../taxonomy/derive.js'
import type { Inventory } from '../economy/Inventory.js'
import type { EconomyManager } from '../economy/EconomyManager.js'

/**
 * tier1 の品を1件で納める**個数の上限**。**深い品ほど減る**（下の `orderQuantity`）。
 *
 * ⚠ **仮置き（#61 の表へ）。**「10個なら仕入れ画面の1回の買い物で用意できる」以上の根拠は無い。
 */
export const ORDER_QUANTITY = 10

/**
 * その品の注文で出しうる**いちばん多い個数**。**tier で割る。**
 *
 * ⚠ **加工品を候補に入れた以上（#85）、個数を一律にすると果たせない注文が出る。**
 *   tier7 は**材料から作ると1個あたり 2,586分**かかるので、**10個 ＝ 24日ぶん。**
 *
 * tier1→10 ／ 2→5 ／ 3→3 ／ 4→3 ／ 5→2 ／ 6→2 ／ 7→1。
 *
 * ⚠ **これは上限であって、出る個数ではない**（#98 で「数量はランダム」になった）。
 *   実際の個数は `rollQuantity()` が **1〜ここ** から引く。
 */
export function orderQuantity(itemId: ItemId): number {
  return Math.max(1, Math.round(ORDER_QUANTITY / tier(itemId)))
}

/**
 * 1件ぶんの個数を引く。**1〜`orderQuantity()` の整数。**
 *
 * ⚠ **上限をそのまま出さない**（PO 指示 #98「対象、数量はランダムで決める」）。
 * ⚠ **下を1にしてあるのは、深い品の上限が1だから**（tier7）。
 *   下を2にすると tier7 で下が上を追い越す。
 * ⚠ **仮置き（#61 の表へ）。**報酬は個数に比例するので、**ここを触ると実入りが動く。**
 */
export function rollQuantity(itemId: ItemId, rand: () => number = Math.random): number {
  const max = orderQuantity(itemId)
  return Math.min(max, 1 + Math.floor(rand() * max))
}

/**
 * 報酬 ＝ **売値 × 個数 × これ**。
 *
 * ⚠ **仮置き（#61 の表へ）。**買値は売値の 0.7（産地なら 0.56）なので、
 *   3 なら「買って運ぶ」だけで約5倍になる。
 */
export const ORDER_REWARD_RATE = 3

/**
 * 抱えられるミッションの数（PO 判断 #98「**10件を上限として**」）。
 *
 * ⚠ **上限に達した日は、確率を引かずに何も出ない。**廃棄すれば翌日また入りうる。
 * ⚠ **仮置き（#61 の表へ）。**
 */
export const MISSION_CAP = 10

/**
 * **1日の始まりに1件受け取れる確率**（PO 判断 #98「1日の始まりに確率ミッションを1件」）。
 *
 * ⚠ **仮置き（#61 の表へ）。**根拠は「**上限10件・1つの島に10日**」という既にある数字だけで、
 *   半分の日に出れば**1回の寄港で上限に届きうる**、という程度の置き方である。
 * ⚠ **ここを上げると歯止めが外れる**（#98 本文）。報酬は**買ってすぐ納めるだけで約4.3倍**で、
 *   **効き目を抑えているのは発生頻度のほう。**確率・報酬率・個数は **#61 で必ず一緒に見ること。**
 */
export const MISSION_CHANCE = 0.5

/**
 * 納品のミッション。**セーブに載る形**（`SaveData.orders`）でもある。
 *
 * ⚠ **島を持たない**（PO 判断 #98「納品先の島は無くす」）。**どこにいても納められる。**
 */
export interface DeliveryOrder {
  /**
   * 画面の行を指すための札。⚠ **セーブをまたいで同じである必要は無い**
   *   （`restore` で振り直す）。**同じ session の中で一意であればよい。**
   */
  readonly id: string
  readonly itemId: ItemId
  readonly quantity: number
  /** 果たしたときに入る金（レン） */
  readonly reward: number
  /**
   * 依頼者（PO 判断 #98「いわゆる依頼者を残すことで世界観は崩れない」）。
   *
   * ⚠ **四島の商人4人から引いている**（`ISLANDS[].merchant`）。
   *   **新しいデータを1行も足さずに出せる**のがこの選び方の理由で、
   *   **人物をどう見せるかは #21 の領分。**
   */
  readonly client: string
  /** 出た日 */
  readonly issuedDay: number
}

/**
 * 納品のミッション（#28 → **#98 で作り直した**）。**1日の始まりに、確率で1件。**
 *
 * ## いまの形（PO 判断 2026-09-14。原文は #98）
 *
 * > **1日の始まりに確率ミッションを1件受け取る。対象、数量はランダムで決めるが
 * > 「現状プレイヤーがアクセス可能な物品」とする。納品画面で対象、数量を満たした状態で
 * > 納品ボタンを押すことで完了とする。ミッション自体は10件を上限として、
 * > 納品画面で今あるミッションを廃棄することも可能とする。**
 * > **納品先の島は無くす。**
 *
 * ## ⚠ 「1日に1回しか引かない」が歯止めそのもの
 *
 * **島が無くなったので、「納品先で買えない品から選ぶ」という歯止めが外れている**（#98）。
 * 代わりに効いているのは **1日1件しか出ないこと**で、
 * ⚠ **同じ日に読み直しても引き直さないこと**が、その歯止めの前提になる。
 * 引き直せると**欲しい品が出るまでロードし直せる**（`PeddlerStock` と同じ事故）。
 * そのために**引いた日（`rolledDay`）を持ち、セーブに積む。**
 *
 * ## 候補 —— いまアクセスできる品
 *
 * **島の商人がいま並べている品 ∪ 解放済みレシピで作れる品**（#98「決まっていること」）。
 * ⚠ **発行した日の時点で判定する。**あとから解放されても、出たミッションは変わらない。
 */
export class DeliveryOrders {
  private orders: DeliveryOrder[] = []
  /**
   * **最後に確率を引いた日。**⚠ **出たかどうかではなく、引いたかどうか**を覚える。
   *   出なかった日を覚えないと、**外れた日はロードし直すたびに引き直せる。**
   */
  private rolled = 0
  /** 札の採番。**session の中だけで一意であればよい**（`DeliveryOrder.id`） */
  private seq = 0

  constructor(
    private inventory: Inventory,
    private economy: EconomyManager,
    /** 売値。テストから差し替えられるようにしてある */
    private priceOf: (itemId: ItemId) => number = itemId => salePrice(itemId),
  ) {}

  /** いま抱えているミッション。**受けた順** */
  list(): readonly DeliveryOrder[] {
    return this.orders
  }

  /** 最後に確率を引いた日（セーブに積む） */
  rolledDay(): number {
    return this.rolled
  }

  /**
   * ミッションに出せる品。**いまアクセスできる品**（買える ∪ 作れる）。
   *
   * ⚠ **`craftable` は「レシピが解禁済み」の品。**材料が揃っているかは見ない ——
   *   **揃える段取りごとミッションにするのが狙い**（方針3「購入と加工が主軸」）。
   * ⚠ **行商人の積荷は数えない。**あれは**その日だけ・各10個**で、翌日には消える（#9）。
   *   数えると**明日には手に入らない品のミッション**が出る。
   */
  candidates(
    items: readonly ItemDef[],
    state: GameState,
    craftable: ReadonlySet<ItemId> = new Set(),
  ): readonly ItemDef[] {
    const here = new Set(stockedByIslandMerchant(items, state).map(i => i.id))
    return items.filter(i => here.has(i.id) || craftable.has(i.id))
  }

  /**
   * **その日ぶんの確率を引く。**出れば1件増える。
   *
   * ⚠ **1日に1回しか引かない。**同じ日に2度呼んでも、2度目は必ず `null`。
   *   **ロードもこれを通る**ので、同じ日のセーブを読み直しても引き直しにならない。
   * ⚠ **上限に達していても「引いた」ことにする。**引いたことにしないと、
   *   1件納めた直後にロードし直すだけで、その日にもう1件引けてしまう。
   */
  rollDaily(
    items: readonly ItemDef[],
    state: GameState,
    day: number,
    craftable: ReadonlySet<ItemId> = new Set(),
    rand: () => number = Math.random,
  ): DeliveryOrder | null {
    if (day <= this.rolled) return null
    this.rolled = day
    if (this.orders.length >= MISSION_CAP) return null
    if (rand() >= MISSION_CHANCE) return null

    const candidates = this.candidates(items, state, craftable)
    if (candidates.length === 0) return null

    const pick = candidates[Math.min(candidates.length - 1, Math.floor(rand() * candidates.length))]
    const quantity = rollQuantity(pick.id, rand)
    const client = ISLANDS[Math.min(ISLANDS.length - 1, Math.floor(rand() * ISLANDS.length))].merchant
    const order: DeliveryOrder = {
      id: this.makeId(),
      itemId: pick.id,
      quantity,
      reward: Math.round(this.priceOf(pick.id) * quantity * ORDER_REWARD_RATE),
      client,
      issuedDay: day,
    }
    this.orders.push(order)
    return order
  }

  /** いま持っている数（納品タブの `数量` が読む） */
  heldFor(order: DeliveryOrder): number {
    return this.inventory.getQuantity(order.itemId)
  }

  /** 納められるか。**手持ちが足りているか、だけ**（島も日付も関係しない） */
  canDeliver(order: DeliveryOrder): boolean {
    return this.inventory.hasEnough(order.itemId, order.quantity)
  }

  /**
   * **納品ボタンを押した**（PO 判断 #98「納品ボタンを押すことで完了とする」）。
   *
   * 足りなければ**何もしない**（`null`）。⚠ **押せないことは画面側でも見せる** ——
   * ここは**最後の関所**であって、押せてしまう経路を残さないための砦ではない。
   */
  deliver(id: string): DeliveryOrder | null {
    const order = this.orders.find(o => o.id === id)
    if (!order || !this.canDeliver(order)) return null
    this.inventory.remove(order.itemId, order.quantity)
    // ⚠ **客に売れた経路ではないので `addRevenue` を通さない。**
    //   通すと「累計売上」が納品ぶん膨らみ、**どれだけ売ったかが嘘になる**（#28）。
    //   ⚠ **#73 以降、進捗バーと目標達成の幕は所持金を読む**ので、
    //   どちらを通しても**目標への進みは同じだけ進む。**ここで分けているのは売上の意味である
    this.economy.addIncome(order.reward)
    this.orders = this.orders.filter(o => o.id !== id)
    return order
  }

  /**
   * **捨てる**（PO 判断 #98「今あるミッションを廃棄することも可能とする」）。
   *
   * ⚠ **罰は無い**（PO 判断 Q4=A。果たせなくても何も起きない、の延長）。
   *   **上限10件を自分で空けるための操作**であって、代償ではない。
   */
  discard(id: string): DeliveryOrder | null {
    const order = this.orders.find(o => o.id === id)
    if (!order) return null
    this.orders = this.orders.filter(o => o.id !== id)
    return order
  }

  toRecord(): DeliveryOrder[] {
    return this.orders.map(o => ({ ...o }))
  }

  /**
   * ロードで戻す。
   *
   * ⚠ **注文が無かった頃のセーブは `undefined` で来る。**空として読む（`shelfPresets` と同じ慣行）。
   * ⚠ **島があった頃のセーブ（#98 より前）も読める。**`island` は捨て、
   *   **依頼者が無いぶんはその場で引く** —— 読めなくして古いセーブを壊すほどの値ではない。
   * ⚠ **札は振り直す。**session をまたいで同じである必要が無く、
   *   **振り直さないと古いセーブの札と新しく出た札がぶつかりうる。**
   */
  restore(orders: readonly DeliveryOrder[] | undefined, rolledDay = 0): void {
    this.rolled = Math.max(0, Math.floor(rolledDay) || 0)
    this.orders = (orders ?? [])
      .filter(o => o && typeof o.itemId === 'string' && typeof o.reward === 'number'
        && typeof o.quantity === 'number' && o.quantity > 0)
      .slice(0, MISSION_CAP)
      // ⚠ **1つずつ組み直す。**`{...o}` で写すと、**島があった頃の `island` が
      //   そのまま乗り続け、セーブを経るたびに残る**（型からは消えているので誰も気づけない）
      .map(o => ({
        id: this.makeId(),
        itemId: o.itemId,
        quantity: o.quantity,
        reward: o.reward,
        client: typeof o.client === 'string' && o.client !== '' ? o.client : ISLANDS[0].merchant,
        issuedDay: typeof o.issuedDay === 'number' ? o.issuedDay : 0,
      }))
  }

  private makeId(): string {
    this.seq += 1
    return `m${this.seq}`
  }
}
