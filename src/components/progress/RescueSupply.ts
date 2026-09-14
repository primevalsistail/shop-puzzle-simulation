// ⚠ **どの品が救済の品かはここで決めない。**`derive.ts` の `isRescueItem` が唯一の口で、
//   買値0 の例外と同じ1本の規則から読む（2つに分けると片方だけ増える）。

/**
 * **1日に手に入る救済の品の数**（main が決めた。PO 指示「数字は知らんよ。そっちで調整してよ」）。
 *
 * ⚠ **上限が無いと、救済の品で盤面を埋めるのが最良の稼ぎ方になる。**
 *   客は1区画あたり **5.4個/日** 買う（`CUSTOMER_ARRIVAL_RATE × BASE_PURCHASE_PROB × 営業600分`）ので、
 *   ただで仕入れて売値5レンで捌けるものは、**置いた区画の数だけ素の利益になる。**
 *
 * **20個 ＝ 1日あたり 100レン**（売値5レン）。
 * ⚠ **どの稼ぎ方よりも下**（加工は概算 624レン/日）で、
 *   **いちばん安い仕入れ品 `羊の乳`（30レン）を1日で買い戻せる**水準として置いた。
 * ⚠ **仮置き。**「詰みから戻れる最小限」以上の根拠は無い。**上げると救済が稼ぎ方になる。**
 */
export const RESCUE_DAILY_LIMIT = 20

/** セーブに載る形（`SaveData.rescue`） */
export interface RescueRecord {
  /** **その日ぶんを配った日。**違う日になったら数が戻る */
  readonly day: number
  /** その日に買った数 */
  readonly taken: number
}

/**
 * **救済の品の、1日ぶんの手当て**（PO 判断 2026-09-15）。
 *
 * ## 何のためにあるか
 *
 * **詰みを無くすため**にただで買える品を1つ置いた（`derive.ts` の `isRescueItem`）。
 * ⚠ **ただで買えるものに上限が無いと、それが最良の稼ぎ方になる**（上の `RESCUE_DAILY_LIMIT`）。
 * **「店に並べたくないもの」が最適解になってはいけない**ので、**1日に買える数を止める。**
 *
 * ## ⚠ 引いた日をセーブに積む理由（`PeddlerStock` ／ `DeliveryOrders` と同じ事故）
 *
 * **持たずに数え直すと、買ってからロードし直すだけで何度でも買える。**
 * **買い直せる上限は上限ではない**ので、**日と、その日に買った数をセーブに載せる。**
 *
 * ## 買う口はどこか
 *
 * **`PurchaseMenu` だけ**（島の商人タブと行商人は同じ組み立てを通る）。
 * ⚠ **行商人も同じ関を通ること。**行商人の値段は `買値 × 1.5` なので救済の品は**そこでも0**で、
 *   通さないと**行商人から上限なしで買えてしまう。**
 */
export class RescueSupply {
  /** 0 は「まだ一度も配っていない」。**日付そのもの**（1日1回の判定はこれで足りる） */
  private day = 0
  private taken = 0

  /** その日ぶんを配った日（セーブに積む） */
  getDay(): number {
    return this.day
  }

  /** 今日まだ買える数 */
  remaining(): number {
    return Math.max(0, RESCUE_DAILY_LIMIT - this.taken)
  }

  /**
   * **その日ぶんに戻す。1日1回。**
   *
   * ⚠ **同じ日に2度呼んでも戻さない**（`false` を返して何もしない）。
   *   呼ぶ側は日の変わり目とロード直後の両方から呼ぶので、
   *   ここで守らないと**買ってからロードし直すだけで数が戻る。**
   *
   * @returns 戻したか
   */
  refresh(day: number): boolean {
    const d = Math.max(1, Math.floor(day))
    if (d === this.day) return false
    this.day = d
    this.taken = 0
    return true
  }

  /**
   * 買ったぶんを減らす。**足りなければ何もせず `false`。**
   *
   * ⚠ **買う側は先に `remaining()` で訊くこと**（`PeddlerStock.take` と同じ作り）。
   *   「払ってから足りないと分かる」を起こさない。
   */
  take(quantity: number): boolean {
    if (quantity <= 0) return false
    if (this.remaining() < quantity) return false
    this.taken += quantity
    return true
  }

  toRecord(): RescueRecord {
    return { day: this.day, taken: this.taken }
  }

  /**
   * ロードで戻す。
   *
   * ⚠ **救済の品が無かった頃のセーブは `undefined` で来る。**空として読む
   *   （`peddler` ／ `orders` と同じ慣行）。日は 0 のままになるので、
   *   **呼ぶ側の `refresh(今日)` がその日ぶんを配る。**
   */
  restore(record: RescueRecord | undefined): void {
    if (!record || typeof record.day !== 'number' || typeof record.taken !== 'number') {
      this.day = 0
      this.taken = 0
      return
    }
    this.day = Math.max(0, Math.floor(record.day))
    this.taken = Math.max(0, Math.min(RESCUE_DAILY_LIMIT, Math.floor(record.taken)))
  }
}
