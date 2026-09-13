import type { ItemDef, ItemId } from '../../taxonomy/axes.js'
import type { IslandName } from '../../taxonomy/islands.js'
import type { GameState } from '../../taxonomy/evaluate.js'
import { stockedByPeddler } from '../../taxonomy/evaluate.js'
import { purchasePrice } from '../../taxonomy/derive.js'

/**
 * 行商人が1日に扱う**品目数**の上限（#9 本文・必須）。
 *
 * ⚠ **緩めないこと。**行商人が何でもいくらでも運ぶと、**島を巡る必要が無くなり**、
 *   「島ごとに需要を変えて取捨選択させる」（方針6）という骨格が丸ごと死ぬ。
 */
export const PEDDLER_MAX_KINDS = 10

/**
 * 1品あたりの**個数**（PO 指示 2026-09-13「初期数量が乱数になっている。100に統一する」）。
 *
 * ⚠ **`1〜10 の乱数` をやめて、全品これで積む。**上限であると同時に**初期値**である。
 * ⚠ **#9 本文の「各10個まで」とは食い違う。**issue の本文をどう直すかは PO 判断へ回した
 *   （`construction/plans/peddler-tab-questions.md`）。
 *   **歯止めとして残っているのは3つ** —— **1日10種類まで**（`PEDDLER_MAX_KINDS`）、
 *   **次の寄港地の産は積まない**（`stockedByPeddler`）、**島の商人より高い**（`PEDDLER_MARKUP`）。
 */
export const PEDDLER_MAX_PER_KIND = 100

/**
 * 行商人の**割増率**。`買値 = 割引なしの買値 × これ`。
 *
 * ## なぜ `purchasePrice()` に引数を足さないのか
 *
 * `derive.ts` の買値は「**その島の中で率は2つだけ**」（産地なら `PURCHASE_RATE × ORIGIN_DISCOUNT`、
 * それ以外は `PURCHASE_RATE`）という形で成り立っている。3つ目の率を `purchasePrice()` に
 * 持ち込むと、島の中の値段が経路によって変わることになり、この不変条件が壊れる。
 * **行商人は島ではない**ので、率は行商人の側で掛ける（#34 のコメント・main の技術判断）。
 *
 * ## 値の根拠
 *
 * #34 でペルソナ5人全員が付けた歯止めは「**産地の1.5〜2倍**」
 * （＝「自分で運べば済むのにあえて買う＝完全に損」が成り立つ幅）。
 * 産地の買値は `0.7 × 0.8`、行商人は `0.7 × これ` なので、産地に対する倍率は `これ ÷ 0.8`。
 *
 *   **1.5 → 産地の 1.875倍 ／ 島の商人（産地でない島）の 1.5倍**
 *
 * ⚠ **仮置き（#61 の表へ）。**上の幅に入る、というだけの根拠しかない。
 */
export const PEDDLER_MARKUP = 1.5

/**
 * 行商人の買値。**島を渡さない**（行商人に島は無い ＝ 産地割引は乗らない）。
 *
 * ⚠ **必ず島の商人より高い。**産地の島なら 1.875倍、それ以外の島でも 1.5倍。
 *   「割高だが、いま手に入る」が #34 の救済の中身そのもので、
 *   **安くすると「巡るより便利」になって #9 の必須要件に反する。**
 */
export function peddlerPrice(itemId: ItemId): number {
  return Math.round(purchasePrice(itemId) * PEDDLER_MARKUP)
}

/** 行商人が今日1品ぶんに積んできたもの */
export interface PeddlerEntry {
  readonly itemId: ItemId
  /** **今日まだ買える数。**買うと減る（買い直しで上限をすり抜けさせない） */
  readonly remaining: number
}

/** セーブに載る形（`SaveData.peddler`） */
export interface PeddlerRecord {
  /** この品揃えが作られた日。**違う日に読んだら作り直す** */
  readonly day: number
  readonly entries: PeddlerEntry[]
}

/**
 * 行商人バレンの、**その日の積荷**（#9。#34 をここに畳んだ）。
 *
 * ## 何のためにあるか
 *
 * 素材は採れる島でしか買えず、切らすと**次にその島へ戻るまで最大40日**その品が作れない
 * （#34。遊ぶ人5人全員が同じ不満を挙げた）。行商人は、その罰を
 * **「待ち時間」から「金」へ置き換える**。割高で、**その日その10種類しか無い**ので、
 * **「取り寄せて損切りするか、次の周まで我慢して利幅を守るか」**という判断が増える。
 *
 * ## なぜ持つ必要があるか（毎回ランダムに作ってはいけない）
 *
 * ⚠ **持たずに開くたび引き直すと、画面を閉じて開き直すだけで品揃えが変わる。**
 *   引き直せる品揃えは品揃えではないので、**上限10種類も1品あたりの数も意味を失う**
 *   （欲しい品が出るまで開き直し、何度でも買える）。
 *   **だから日ごとに1度だけ引き、買ったぶんを減らし、セーブに載せる。**
 *
 * ## 歯止め（#9 の必須要件）
 *
 *   1. **1日10種類まで**（`PEDDLER_MAX_KINDS`）。
 *      ⚠ **各10個の上限は 100 に替わった**（PO 指示 2026-09-13）。`PEDDLER_MAX_PER_KIND` の注記
 *   2. **産地が次の寄港地の品は積まない**（`stockedByPeddler`。島を巡る動機を削らないため）
 *   3. **解禁は島の商人と同じ U1・U2**（行商人だけの解禁を作らない）
 *   4. **島の商人より高い**（`PEDDLER_MARKUP`）
 */
export class PeddlerStock {
  /** 0 は「まだ一度も来ていない」。**日付そのもの**（1日1回の判定はこれで足りる） */
  private day = 0
  private entries: PeddlerEntry[] = []

  /** この品揃えが作られた日 */
  getDay(): number {
    return this.day
  }

  list(): readonly PeddlerEntry[] {
    return this.entries
  }

  /** その品が今日まだ何個買えるか。積んでいない品は 0 */
  remaining(itemId: ItemId): number {
    return this.entries.find(e => e.itemId === itemId)?.remaining ?? 0
  }

  unitCost(itemId: ItemId): number {
    return peddlerPrice(itemId)
  }

  /**
   * **その日ぶんの積荷を引く。来訪は1日1回**（#9）。
   *
   * ⚠ **同じ日に2度呼んでも引き直さない**（`false` を返して何もしない）。
   *   呼ぶ側（`GameScene`）は日の変わり目とロード直後の両方から呼ぶので、
   *   ここで守らないと**ロードするたび品揃えが変わる。**
   *
   * @param next 次の寄港地。**その島の産は積まない**（`stockedByPeddler`）
   * @returns 引き直したか
   */
  refresh(
    day: number,
    items: readonly ItemDef[],
    state: GameState,
    next: IslandName,
    rand: () => number = Math.random,
  ): boolean {
    const d = Math.max(1, Math.floor(day))
    if (d === this.day) return false
    this.day = d
    this.entries = pick(stockedByPeddler(items, state, next), rand)
    return true
  }

  /**
   * 買ったぶんを減らす。**足りなければ何もせず `false`。**
   *
   * ⚠ **買う側は先に `remaining()` で訊くこと。**在庫の上限（`Inventory`）と同じ作りで、
   *   「払ってから足りないと分かる」を起こさない。
   */
  take(itemId: ItemId, quantity: number): boolean {
    if (quantity <= 0) return false
    const i = this.entries.findIndex(e => e.itemId === itemId)
    if (i < 0 || this.entries[i].remaining < quantity) return false
    this.entries[i] = { itemId, remaining: this.entries[i].remaining - quantity }
    return true
  }

  toRecord(): PeddlerRecord {
    return { day: this.day, entries: this.entries.map(e => ({ ...e })) }
  }

  /**
   * ロードで戻す。
   *
   * ⚠ **行商人が無かった頃のセーブは `undefined` で来る。**空として読む
   *   （`shelfPresets` / `orders` と同じ慣行）。日は 0 のままになるので、
   *   **呼ぶ側の `refresh(今日)` がその日ぶんを引き直す。**
   */
  restore(record: PeddlerRecord | undefined): void {
    if (!record || !Array.isArray(record.entries) || typeof record.day !== 'number') {
      this.day = 0
      this.entries = []
      return
    }
    this.day = Math.max(0, Math.floor(record.day))
    this.entries = record.entries
      .filter(e => e && typeof e.itemId === 'string' && typeof e.remaining === 'number')
      .slice(0, PEDDLER_MAX_KINDS)
      .map(e => ({
        itemId: e.itemId,
        remaining: Math.max(0, Math.min(PEDDLER_MAX_PER_KIND, Math.floor(e.remaining))),
      }))
  }
}

/**
 * 候補から**10種類まで**引き、それぞれ **`PEDDLER_MAX_PER_KIND` 個**積む。
 *
 * ⚠ **個数は乱数にしない**（PO 指示 2026-09-13「初期数量が乱数になっている。100に統一する」）。
 *   以前は 1〜10 の一様分布で、#34 の「**9個を10個にはできるが、0個を10個にはできない**」を
 *   個数のばらつきで作っていた。**いまその役を負っているのは種類のほう**
 *   （1日10種類まで ／ 次の寄港地の産は積まない）。
 * ⚠ **乱数は種類を選ぶところにだけ残っている。**`rand` を消さないこと。
 */
function pick(candidates: readonly ItemDef[], rand: () => number): PeddlerEntry[] {
  const pool = [...candidates]
  const out: PeddlerEntry[] = []
  const n = Math.min(PEDDLER_MAX_KINDS, pool.length)
  for (let i = 0; i < n; i++) {
    // 部分フィッシャー–イェーツ。**同じ品を2行出さない**
    const j = i + Math.min(pool.length - i - 1, Math.floor(rand() * (pool.length - i)))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
    out.push({ itemId: pool[i].id, remaining: PEDDLER_MAX_PER_KIND })
  }
  return out
}
