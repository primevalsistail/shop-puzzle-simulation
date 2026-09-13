import type { GameState } from '../../taxonomy/evaluate.js'
import type { IslandName } from '../../taxonomy/islands.js'
import { ROUTE, DAYS_PER_PORT } from '../../taxonomy/islands.js'
import type { ItemId } from '../../taxonomy/axes.js'

export interface Location {
  readonly island: IslandName
  /** 次の寄港地 */
  readonly next: IslandName
  /** あと何日この島にいるか（今日を含む） */
  readonly daysLeftAtPort: number
}

/**
 * 自由航行（#7）の航路。**セーブに積むのはこの2つだけ。**
 *
 * ⚠ **無いセーブを読めるようにしておくこと**（`orders` ／ `peddler` と同じ）。
 *   クリア前のセーブにも、#7 より前のセーブにも入っていない。
 */
export interface VoyageRecord {
  /** いま居る島。⚠ **日付からは出せない**（選んだ結果、順から外れているため） */
  readonly island: IslandName
  /** 次の寄港地として選んだ島。**選んでいなければ `null`**（＝順どおり） */
  readonly next: IslandName | null
}

/** 何度目の寄港か（0 始まり）。⚠ **島の数で折り返さない** —— 寄港をまたいだ回数を数えるため */
function portIndexOf(day: number): number {
  return Math.floor((Math.max(1, Math.floor(day)) - 1) / DAYS_PER_PORT)
}

/** 順どおりの次の寄港地。**選ばなければこれになる** */
export function nextInRoute(island: IslandName): IslandName {
  const i = ROUTE.indexOf(island)
  return ROUTE[(i + 1) % ROUTE.length]
}

/**
 * 次の寄港地に選べる島（#7）。**いま居る島は入らない** ——
 * 1寄港10日という周期は変えないので、**「動かない」は選択肢ではない**（計画「決めたこと 3」）。
 *
 * ⚠ **並びは順どおりの次から始める。**先頭が `nextInRoute` と一致するので、
 *   **1つも選ばずにいるのと、先頭を選ぶのが同じ**になる。
 */
export function nextPortCandidates(island: IslandName): readonly IslandName[] {
  const i = ROUTE.indexOf(island)
  return ROUTE.map((_, k) => ROUTE[(i + 1 + k) % ROUTE.length]).slice(0, ROUTE.length - 1)
}

/**
 * 規則が読む世界の状態（`現在地` と `累計販売数`）を持つ。
 *
 * **現在地は日付から決まる**（#2）。順序は固定で、プレイヤーは選べない ——
 * ⚠ **目標に届くまでは。**クリア後だけ、次にどの島へ行くかを選べるようになる（#7・自由航行）。
 * ⚠ **クリア前の導出は1行も変わっていない。**`chosenIsland` が `null` のあいだ、
 *   `getLocation()` は下の表そのままを返す（`WorldState.test.ts` の「巡回（#2）」が固定している）。
 *
 *   Day 1-10 ハルヴェラ ／ Day 11-20 リナツィア ／ Day 21-30 ノアキータ ／ …
 *
 * ⚠ **航海日は作らない**（#74）。このゲームは「毎日どこに投じるか決める」のが骨格で、
 *   営業も仕入れもできない日は**判断の無い日**になる。
 *   周期10日・4島一周40日で、`world.md` の「10日ごとに移る」と一致する。
 *   **200日 ＝ 20回の寄港・5周。**
 *
 * `累計販売数` は U2（その品を一定数売ると買えるようになる）が読む。
 */
export class WorldState {
  private day = 1
  private soldCounts = new Map<ItemId, number>()
  /**
   * 自由航行に入ってからの現在地。**`null` のあいだは日付から導出する**（クリア前）。
   *
   * ⚠ **ここが `null` かどうかが、クリア前とクリア後を分ける唯一の分岐。**
   */
  private chosenIsland: IslandName | null = null
  /** 次の寄港地として選んだ島。`null` なら順どおり（`nextInRoute`） */
  private chosenNext: IslandName | null = null

  /**
   * 日付を設定する。現在地はここから導出され、保存も日付だけでよい。
   *
   * ⚠ **自由航行に入っているあいだは、寄港をまたいだ回数だけ船を進める。**
   *   進めないと、日が変わっても選んだ島へ移らない（受入条件3）。
   *   ロードは `restoreVoyage()` が島を上書きするので、日付が戻っても食い違わない。
   */
  setDay(day: number): void {
    const next = Math.max(1, Math.floor(day))
    const from = portIndexOf(this.day)
    const to = portIndexOf(next)
    this.day = next
    if (this.chosenIsland === null) return
    for (let i = from; i < to; i++) this.sailToNextPort()
  }

  /** 寄港が1つ進んだ。**選んでいればその島へ、選んでいなければ順どおりの次へ** */
  private sailToNextPort(): void {
    this.chosenIsland = this.chosenNext ?? nextInRoute(this.chosenIsland!)
    this.chosenNext = null
  }

  /**
   * 自由航行を始める（#7）。**いま居る島から始める**ので、この時点では何も動かない。
   *
   * ⚠ **商船を買ったときだけ呼ぶ**（`GameScene.buyShip()` ／ ロードの復元）。
   *   ⚠ **2026-09-15 に入口が変わった**（#97）。**以前は目標額に届いた幕の
   *   「エンドレスモードへ」**だった。**所持金が届いただけでは解禁されない。**
   */
  beginFreeSailing(): void {
    const here = this.getLocation()
    this.chosenIsland = here.island
    this.chosenNext = null
  }

  isFreeSailing(): boolean {
    return this.chosenIsland !== null
  }

  /**
   * 次の寄港地を選ぶ。**滞在中いつでも呼べ、何度でも変えられる**（計画「決めたこと 4」）。
   *
   * ⚠ **自由航行に入る前は何もしない。**クリア前に順を変えられると、
   *   「次はノアキータだから今のうちに買う」という先読みが成り立たなくなる（同 1）。
   */
  chooseNextPort(island: IslandName): void {
    if (this.chosenIsland === null) return
    if (!nextPortCandidates(this.chosenIsland).includes(island)) return
    this.chosenNext = island
  }

  /** いま選べる島（`nextPortCandidates`）。自由航行前は空 */
  availableNextPorts(): readonly IslandName[] {
    return this.chosenIsland === null ? [] : nextPortCandidates(this.chosenIsland)
  }

  /** セーブに積む航路。⚠ **自由航行に入っていなければ `null`**（クリア前は日付だけで足りる） */
  voyageRecord(): VoyageRecord | null {
    if (this.chosenIsland === null) return null
    return { island: this.chosenIsland, next: this.chosenNext }
  }

  /**
   * ロードで航路を戻す。
   *
   * ⚠ **無い（`undefined` ／ `null`）なら日付からの導出へ戻す。**クリア前のセーブと、
   *   #7 より前のセーブがそれで来る。**クリア済みなのに空だったとき**は、
   *   呼び出し側が続けて `beginFreeSailing()` を呼ぶ（`GameScene`）。
   * ⚠ **知らない島名も同じ扱い。**壊れたセーブで落ちないようにする。
   */
  restoreVoyage(record: VoyageRecord | null | undefined): void {
    if (!record || !ROUTE.includes(record.island)) {
      // ⚠ **消す側もここでやる。**クリア済みのセーブを読んだあとにクリア前のセーブを読むと、
      //   消さなければ**前のセーブの現在地が居座る**（日付からの導出に戻らない）
      this.chosenIsland = null
      this.chosenNext = null
      return
    }
    this.chosenIsland = record.island
    this.chosenNext = record.next && ROUTE.includes(record.next) ? record.next : null
  }

  getDay(): number {
    return this.day
  }

  getLocation(): Location {
    const elapsed = this.day - 1
    const indexInPort = elapsed % DAYS_PER_PORT
    const portIndex = Math.floor(elapsed / DAYS_PER_PORT) % ROUTE.length
    // ⚠ **クリア前はここが `null` で、下の2行は日付からの導出そのまま**（#2）
    const island = this.chosenIsland ?? ROUTE[portIndex]
    return {
      island,
      next: this.chosenNext ?? nextInRoute(island),
      daysLeftAtPort: DAYS_PER_PORT - indexInPort,
    }
  }

  getState(): GameState {
    return { 現在地: this.getLocation().island, 累計販売数: this.soldCounts }
  }

  getIsland(): IslandName {
    return this.getLocation().island
  }

  /**
   * 次にこの島へ戻るまでの日数（今日から数える）。
   *
   * ⚠ **島を出ると30日戻らない**（一周40日・寄港10日）。
   *   素材は産地の島でしか買えないので、**いま買わないと次は30日後**になる。
   *   これを仕入れの画面に出すのが #33。
   *
   * ⚠ **自由航行（#7）では見込みでしかない。**順どおりに回った場合の日数を返すので、
   *   プレイヤーが別の島を選べば実際はこれより早くも遅くもなる。
   *   **先の選択は誰にも分からない**ので、ここで当てにいかない。
   */
  daysUntilReturn(): number {
    return this.getLocation().daysLeftAtPort + (ROUTE.length - 1) * DAYS_PER_PORT
  }

  recordSale(itemId: ItemId, quantity = 1): void {
    this.soldCounts.set(itemId, (this.soldCounts.get(itemId) ?? 0) + quantity)
  }

  getSoldCount(itemId: ItemId): number {
    return this.soldCounts.get(itemId) ?? 0
  }

  toRecord(): Record<string, number> {
    return Object.fromEntries(this.soldCounts)
  }

  restore(record: Record<string, number>): void {
    this.soldCounts = new Map(Object.entries(record))
  }
}
