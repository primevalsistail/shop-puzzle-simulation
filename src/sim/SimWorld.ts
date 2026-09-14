/**
 * 測る道具 —— **N日回して結果を出す**（段階4 の作業1）。
 *
 * ## 唯一の存在理由
 *
 * ⚠ **式を書き写さないこと。**売値も加工利益も所要分も売れ行きも、
 *   **本番と同じ `derive.ts` / `evaluate.ts` / `CustomerSimulator` / `Upgrades` を
 *   実際に import して回す。**写した式は必ずずれる（#33）。
 *   ここにあるのは**遊び手の代わりに判断する部分**（何を買い、何を作り、どう並べるか）と、
 *   **数えて出す部分**だけである。
 *
 * ## 本番との対応
 *
 * `GameScene` が Phaser の上でやっている配線を、画面抜きでやり直したもの。
 * **1分の売買**（`GameService.onMinutePassed`）・**日の変わり目**（現在地・行商人・
 * ミッション・レシピ解禁）・**加工の時間消費**（`skipMinutes`。**その間は客が来ない**）は
 * すべて本番のクラスがそのまま動く。
 *
 * ⚠ **本番からは呼ばない。**`src/sim/` を import する本番コードがあってはいけない。
 * ⚠ **`npx vitest run` からは走らない**（テストファイルではないため）。回し方は `run.ts`。
 */

import { ALL_ITEMS } from '../taxonomy/items.js'
import { ALL_RECIPES } from '../taxonomy/recipes.js'
import type { ItemDef, ItemId, RecipeDef } from '../taxonomy/axes.js'
import { DAYS_PER_PORT, ROUTE } from '../taxonomy/islands.js'
import type { IslandName } from '../taxonomy/islands.js'
import { isRescueItem, originReach, tier } from '../taxonomy/derive.js'
import { finalModifiers, merchantListing } from '../taxonomy/evaluate.js'
import type { GameState } from '../taxonomy/evaluate.js'
import { ItemRegistry } from '../components/items/ItemRegistry.js'
import { FloorGrid } from '../components/floor/FloorGrid.js'
import { PlacementManager } from '../components/floor/PlacementManager.js'
import { Inventory } from '../components/economy/Inventory.js'
import { EconomyManager } from '../components/economy/EconomyManager.js'
import { TimeManager, CLOSE_HOUR } from '../components/core/TimeManager.js'
import { CraftingSystem } from '../components/items/CraftingSystem.js'
import type { CraftResult } from '../components/items/CraftingSystem.js'
import { CustomerSimulator } from '../components/simulation/CustomerSimulator.js'
import { GameService, evaluateFloor } from '../services/GameService.js'
import { WorldState } from '../components/progress/WorldState.js'
import { Upgrades, UPGRADE_KINDS } from '../components/progress/Upgrades.js'
import type { UpgradeKind } from '../components/progress/Upgrades.js'
import { DeliveryOrders } from '../components/progress/DeliveryOrders.js'
import { PeddlerStock } from '../components/progress/PeddlerStock.js'
import { RescueSupply } from '../components/progress/RescueSupply.js'
import { RecipeUnlocks } from '../components/progress/RecipeUnlocks.js'
import type { UnlockStore } from '../components/progress/RecipeUnlocks.js'
import { EventBus } from '../services/EventBus.js'
import { GameEvents } from '../types/index.js'
import type { GameTime, GridCell, GridSize, SaleResult } from '../types/index.js'
import { makeRng } from './rng.js'

/**
 * ⚠ **`GameScene` の private 定数の写し**（`src/scenes/` は触らない範囲なので export できない）。
 *   **式ではなくデータ**だが、**写しであることに変わりはない** —— `GameScene` 側を変えたら
 *   ここも変わる。**初期の盤面は写していない**（`Upgrades.gridSize()` の 0段目がそれ）。
 */
const INITIAL_STOCK: Record<string, number> = {
  sheep_milk: 15,
  apple: 15,
  buckwheat_bread: 15,
}

/** 方針のつまみ。⚠ **実装から読める値ではない。**どれも「遊び手がそう決めた」ぶん */
export interface SimOptions {
  /** 回す日数 */
  readonly days: number
  /** 乱数の種 */
  readonly seed: number
  /** 1品の補充目標（個） */
  readonly stockTarget: number
  /** 1日の仕入れに回す割合（残りは改装の元手として残る） */
  readonly buyRatio: number
  /** 所持金の下限。仕入れでここを割らない（0 にすると GAME OVER を踏む） */
  readonly cashFloor: number
  /** 改装は「値段の何倍の所持金があるか」で買う */
  readonly upgradeAffordRatio: number
}

export const DEFAULT_OPTIONS: SimOptions = {
  days: 400,
  seed: 1,
  stockTarget: 60,
  buyRatio: 0.5,
  cashFloor: 1000,
  upgradeAffordRatio: 2,
}

/** 仕入れの注文。**個数まで方針が決める**（種まきの1個と、補充の60個を同じ列で扱うため） */
export interface BuyOrder {
  readonly id: ItemId
  readonly qty: number
}

/** 方針が盤面を見るための窓。**読むだけ**（動かすのは `SimWorld`） */
export interface SimContext {
  readonly day: number
  readonly island: IslandName
  readonly registry: ItemRegistry
  readonly inventory: Inventory
  readonly economy: EconomyManager
  readonly crafting: CraftingSystem
  readonly upgrades: Upgrades
  readonly recipeUnlocks: RecipeUnlocks
  /** 規則が読む世界の状態（`WorldState.getState()`）。**条件式を当てるのに要る** */
  readonly state: GameState
  /** いまこの島の商人が並べている品（`merchantListing().stocked`） */
  readonly stocked: readonly ItemDef[]
  /** 補充目標（`SimOptions.stockTarget`） */
  readonly stockTarget: number
  /**
   * **前の日に棚へ並べられた区画の数。**
   * ⚠ **「何種類仕入れるか」の目安に使う。**升目から見積もらずに、
   *   **実際に並んだ数**を使うので、置いた数を勝手に決めずに済む。
   */
  readonly shelfKinds: number
}

/**
 * 盤面を触るための道具（`arrange` に渡す）。
 *
 * ⚠ **升目の勘定は方針に持たせない。**かたち・回転・隣接はすべて `FloorGrid` が持っているので、
 *   方針が決めるのは**どの品をどこに置くか**だけにする。
 */
export interface LayoutTools {
  readonly size: GridSize
  /** そこに置けるか（`FloorGrid.canPlace`。**回転はしない**） */
  canPlace(id: ItemId, cell: GridCell): boolean
  /** そこに置いたとき**辺を接することになる、すでに置いてある品**（`FloorGrid` が出す） */
  neighborsOf(id: ItemId, cell: GridCell): ItemId[]
  /** 置く（`PlacementManager.tryPlace`）。置けたら true */
  place(id: ItemId, cell: GridCell): boolean
}

/** 何を仕入れ、何を作り、どう並べるか。⚠ **差し替えられること**（比べられないと意味がない） */
export interface Policy {
  readonly name: string
  buyTargets(ctx: SimContext): readonly BuyOrder[]
  craftTargets(ctx: SimContext): readonly RecipeDef[]
  displayTargets(ctx: SimContext): readonly ItemId[]
  /**
   * **並べ方を自分で決める**（省くと「左上から詰める」既定になる）。
   *
   * `order` は `displayTargets` が返した列。**並べ替えても、間引いても構わない。**
   */
  arrange?(ctx: SimContext, tools: LayoutTools, order: readonly ItemId[]): void
}

/** 1日ぶんの記録 */
export interface DayRecord {
  readonly day: number
  readonly island: IslandName
  /** その日の終わりの所持金 */
  readonly money: number
  /** tier1 が売れたぶん（＝転売） */
  readonly resellRevenue: number
  /** tier2以上が売れたぶん（＝加工） */
  readonly craftRevenue: number
  /** 納品の報酬 */
  readonly deliveryRevenue: number
  /** 上の3つから**元手**（仕入れ値まで遡った原価）を引いたもの */
  readonly resellProfit: number
  readonly craftProfit: number
  readonly deliveryProfit: number
  /** 仕入れに払った額 */
  readonly purchaseSpend: number
  /** 改装に払った額 */
  readonly upgradeSpend: number
  /** 加工に使った分 */
  readonly craftMinutes: number
  /** そのうち営業時間を削った分（**客が来なかった分**） */
  readonly lostBusinessMinutes: number
  /** 棚に並んでいた区画の数 */
  readonly slots: number
  /**
   * その日に作った品のいちばん深い tier（作らなかった日は 0）。
   * ⚠ **「深い品を作る」方針が本当に深く作れているか**は、これを見ないと分からない
   */
  readonly topTier: number
}

export interface SimResult {
  readonly policy: string
  readonly seed: number
  readonly days: DayRecord[]
  /** 目標（`GameService.getGoalAmount()`）に届いた日。届かなければ null */
  readonly goalDay: number | null
  readonly goalAmount: number
  /** 目標に届いた時点で回れていた島の数（届かなければ最後まで回った数） */
  readonly islandsVisited: number
  /** 島の数（`ROUTE.length`）。⚠ **4 と書かない** */
  readonly islandsTotal: number
  /** 始めたときの所持金（`EconomyManager` の既定）。⚠ **写さずにここから読む** */
  readonly startMoney: number
  /**
   * **所持金が 0 以下になった日。**無ければ null。
   *
   * ⚠ **もう GAME OVER ではない**（2026-09-15。`GameService` から判定ごと消えた）。
   *   **ここで数え続けているのは、詰みかけたかどうかが方針の出来を測る材料だから。**
   */
  readonly zeroMoneyDay: number | null
  /**
   * **毎朝、組み終えた盤面を `evaluate()` にかけて測った倍率の平均。**
   *
   * `区画平均` は `finalModifiers`（その品ぶん × 店全体ぶん）を区画で平均したもの。
   * `店全体の集客` は `EvaluationResult.shopWide.集客` で、**客が来るかどうか**に掛かる。
   *
   * ⚠ **盤面は日に1度しか組み替えないので、1日1回の測定でその日を言い尽くす。**
   *   取り合わせの規則は `累計販売数` を読まないので、日中に答えが変わることはない。
   */
  readonly modifiers: {
    readonly 売れやすさ: number
    readonly 値段: number
    readonly 集客: number
    readonly 店全体の集客: number
    /**
     * 棚に出した区画のうち、**材料を遡った産地が1島に定まるもの**の割合。
     * ⚠ **R5 が当たりうるのはここだけ**（`産地 != なし` が甲乙の条件）。**集客の天井はこれで決まる。**
     */
    readonly 産地あり: number
    /** そのうち**いちばん大きい同産地の固まり**の割合。⚠ **R5 は産地が一致しないと当たらない** */
    readonly 最大の同産地: number
  }
  /** どの規則が何回当たったか（`EvaluationResult.firedRules` を日ごとに数えた合計） */
  readonly ruleHits: ReadonlyMap<string, number>
  /** 終わった時点で解禁されていたレシピの本数 */
  readonly unlockedRecipes: number
  /**
   * そのうちいちばん深い tier。
   * ⚠ **`DayRecord.topTier`（実際に作った深さ）と並べて見る。**
   *   **開いていないのか、開いているのに作れていないのか**は別の話で、直し方も違う
   */
  readonly unlockedTopTier: number
}

/** 解禁済みレシピの置き場。**`GameProgress` は localStorage を要るので、ここだけ持つ** */
class MemoryUnlockStore implements UnlockStore {
  private ids = new Set<string>()
  isRecipeUnlocked(recipeId: string): boolean {
    return this.ids.has(recipeId)
  }
  unlockRecipe(recipeId: string): void {
    this.ids.add(recipeId)
  }
}

/**
 * 元手の帳面。**「1日の稼ぎ」を売上ではなく取り分で出すために要る。**
 *
 * ⚠ **値段の計算はしていない。**買った額をそのまま覚え、加工では
 *   **材料の元手を出来高で割って移す**だけ。売値は `derive.ts` が出したものを使う。
 * ⚠ **初期在庫（伯母から預かった3品）の元手は 0。**買っていないので払った額が無い。
 */
class CostLedger {
  private qty = new Map<ItemId, number>()
  private cost = new Map<ItemId, number>()

  add(id: ItemId, n: number, totalCost: number): void {
    if (n <= 0) return
    this.qty.set(id, (this.qty.get(id) ?? 0) + n)
    this.cost.set(id, (this.cost.get(id) ?? 0) + totalCost)
  }

  /** n 個ぶんの元手を抜き出す。持っている以上は抜けない */
  take(id: ItemId, n: number): number {
    const have = this.qty.get(id) ?? 0
    if (have <= 0 || n <= 0) return 0
    const use = Math.min(have, n)
    const unit = (this.cost.get(id) ?? 0) / have
    this.qty.set(id, have - use)
    this.cost.set(id, (this.cost.get(id) ?? 0) - unit * use)
    return unit * use
  }
}

/**
 * `TimeManager` を1分進めるのに要る deltaMs。
 *
 * ⚠ **刻み幅（`TICK_INTERVAL_MS`）を写さない。**あれは private なので、
 *   **使い捨ての `TimeManager` で測って出す。**写すと本番を変えたときに黙ってずれる。
 */
function minuteDeltaMs(): number {
  const probe = new TimeManager()
  probe.startAdvancing()
  const start = probe.getCurrentTime().minute
  let ms = 0
  while (probe.getCurrentTime().minute === start) {
    probe.update(1)
    ms++
    if (ms > 100_000) throw new Error('TimeManager が1分も進まない')
  }
  return ms
}

export class SimWorld {
  private readonly registry = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)
  private readonly world = new WorldState()
  private readonly upgrades = new Upgrades()
  private readonly floorGrid: FloorGrid
  private readonly placement: PlacementManager
  private readonly inventory = new Inventory()
  private readonly economy = new EconomyManager()
  private readonly time = new TimeManager()
  private readonly crafting: CraftingSystem
  private readonly customerSim: CustomerSimulator
  private readonly gameService: GameService
  private readonly delivery: DeliveryOrders
  private readonly peddler = new PeddlerStock()
  /** 救済の品の1日の上限。**本番と同じ関を通す**（通さないと ただの品を無限に買える） */
  private readonly rescue = new RescueSupply()
  private readonly recipeUnlocks: RecipeUnlocks
  private readonly ledger = new CostLedger()
  private readonly rng: () => number
  private readonly minuteMs = minuteDeltaMs()

  private readonly records: DayRecord[] = []
  private goalDay: number | null = null
  private goalIslands = 0
  private zeroMoneyDay: number | null = null
  /** 始めたときの所持金。`EconomyManager` の既定なので、写さずに読み取る */
  private startMoney = 0
  /** 当たった規則の回数（`EvaluationResult.firedRules` を数えたもの） */
  private readonly ruleHits = new Map<string, number>()
  /** 倍率の合計と、測った日数（平均を出すため） */
  private modSum = { 売れやすさ: 0, 値段: 0, 集客: 0, 店全体の集客: 0, 産地あり: 0, 最大の同産地: 0 }
  private modDays = 0

  // ── その日ぶんの数え（日の頭で 0 に戻す） ──
  private dResell = 0
  private dCraft = 0
  private dDelivery = 0
  private dResellProfit = 0
  private dCraftProfit = 0
  private dDeliveryProfit = 0
  private dPurchase = 0
  private dUpgrade = 0
  private dCraftMinutes = 0
  private dLostMinutes = 0
  private dTopTier = 0
  private shelfKinds = 3

  constructor(
    private readonly policy: Policy,
    private readonly opts: SimOptions = DEFAULT_OPTIONS,
  ) {
    this.rng = makeRng(opts.seed)
    this.floorGrid = new FloorGrid(this.upgrades.gridSize(), this.registry)
    this.placement = new PlacementManager(this.floorGrid, this.registry)
    this.crafting = new CraftingSystem(this.registry, this.inventory, this.time, this.upgrades)
    this.customerSim = new CustomerSimulator(this.registry, this.inventory)
    this.gameService = new GameService(
      this.floorGrid, this.inventory, this.customerSim, this.economy, this.world, this.upgrades,
    )
    this.delivery = new DeliveryOrders(this.inventory, this.economy)
    this.recipeUnlocks = new RecipeUnlocks(this.registry, this.inventory, new MemoryUnlockStore())
  }

  run(): SimResult {
    this.wire()
    this.begin()
    for (let i = 0; i < this.opts.days; i++) this.runDay()
    const unlocked = this.recipeUnlocks.unlockedRecipes()
    EventBus.removeAllListeners()
    return {
      policy: this.policy.name,
      seed: this.opts.seed,
      days: this.records,
      goalDay: this.goalDay,
      goalAmount: this.gameService.getGoalAmount(),
      islandsVisited: this.goalDay === null ? this.islandsSoFar() : this.goalIslands,
      islandsTotal: ROUTE.length,
      zeroMoneyDay: this.zeroMoneyDay,
      startMoney: this.startMoney,
      unlockedRecipes: unlocked.length,
      unlockedTopTier: unlocked.length === 0
        ? 0
        : Math.max(...unlocked.map(r => tier(r.outputItemId))),
      modifiers: {
        売れやすさ: this.modAvg('売れやすさ'),
        値段: this.modAvg('値段'),
        集客: this.modAvg('集客'),
        店全体の集客: this.modAvg('店全体の集客'),
        産地あり: this.modAvg('産地あり'),
        最大の同産地: this.modAvg('最大の同産地'),
      },
      ruleHits: this.ruleHits,
    }
  }

  // ── 本番と同じ配線（`GameScene.setupEvents` にあたる） ──
  private wire(): void {
    // ⚠ **持ち越しを残さない。**`EventBus` は singleton なので、
    //   同じ process で2つ目の方針を回すと前の回の購読が生き残る
    EventBus.removeAllListeners()

    EventBus.on(GameEvents.TIME_MINUTE_PASSED, () => {
      this.gameService.onMinutePassed(this.rng, this.time.isOpen())
    })

    EventBus.on(GameEvents.TIME_DAY_CHANGED, (t: unknown) => {
      this.onDayChanged((t as GameTime).day)
    })

    EventBus.on(GameEvents.FLOOR_SLOT_SOLD, (s: unknown) => {
      const sale = s as SaleResult
      const cogs = this.ledger.take(sale.itemId, sale.qtySold)
      if (this.registry.tierOf(sale.itemId) === 1) {
        this.dResell += sale.revenue
        this.dResellProfit += sale.revenue - cogs
      } else {
        this.dCraft += sale.revenue
        this.dCraftProfit += sale.revenue - cogs
      }
    })

    EventBus.on(GameEvents.CRAFTING_COMPLETED, (r: unknown) => {
      const result = r as CraftResult
      const recipe = this.registry.getRecipe(result.recipeId)
      let moved = 0
      for (const ing of recipe.ingredients) {
        moved += this.ledger.take(ing.itemId, ing.quantity * result.times)
      }
      this.ledger.add(recipe.outputItemId, result.quantity, moved)
      this.dCraftMinutes += result.minutes
      this.dLostMinutes += result.businessMinutes
      this.dTopTier = Math.max(this.dTopTier, tier(recipe.outputItemId))
    })

    // ⚠ **`PROGRESS_GAME_OVER` の購読は 2026-09-15 に消した。**
    //   **誰も出さなくなった**（`GameService` から判定ごと消えた）ので、
    //   **所持金0以下は日の終わりに自分で見る**（`closeDay`）。
  }

  /** `GameScene.create()` の初日ぶん */
  private begin(): void {
    this.startMoney = this.economy.getMoney()
    this.inventory.setInitialStock(INITIAL_STOCK)
    this.recipeUnlocks.unlockEligible()
    const t0 = this.time.getCurrentTime()
    this.world.setDay(t0.day)
    this.rollMission(t0.day)
    this.visitPeddler(t0.day)
    this.rescue.refresh(t0.day)
    this.time.startAdvancing()
  }

  /** `GameScene.onDayChanged()` */
  private onDayChanged(day: number): void {
    this.world.setDay(day)
    this.visitPeddler(day)
    this.rescue.refresh(day)
    this.rollMission(day)
    this.recipeUnlocks.unlockEligible()
  }

  private visitPeddler(day: number): void {
    this.peddler.refresh(
      day, this.registry.getAllItems(), this.world.getState(),
      this.world.getLocation().next, this.rng,
    )
  }

  private rollMission(day: number): void {
    this.delivery.rollDaily(
      this.registry.getAllItems(), this.world.getState(), day,
      new Set(this.recipeUnlocks.unlockedRecipes().map(r => r.outputItemId)),
      this.rng,
    )
  }

  // ── 1日 ──
  private runDay(): void {
    const day = this.time.getCurrentTime().day
    // ⚠ **島はここで控える。**日が終わると `onDayChanged` がもう次の島へ動かしているので、
    //   日の終わりに訊くと**1日ぶん先の島**が記録に残る（実測: 30日回して「4島」と出た）
    const island = this.world.getIsland()
    this.resetDay()

    // 朝（6:00）の判断。**改装 → 仕入れ → 加工 → 納品 → 陳列**
    const ctx = this.context()
    this.buyUpgrades()
    this.purchase(this.policy.buyTargets(ctx))
    this.craftPass(this.policy.craftTargets(ctx), true)
    this.deliverAll()
    const layoutCtx = this.context()
    this.layout(layoutCtx, this.policy.displayTargets(layoutCtx))
    // ⚠ **組み終えてから測る。**日中は盤面が変わらないので、ここ1回で足りる
    this.measureBoard()

    // 時計を回す。**営業 10:00-20:00 の間だけ客が来る**（`GameService.onMinutePassed`）
    let eveningDone = false
    let guard = 0
    while (this.time.getCurrentTime().day === day) {
      if (++guard > 200_000) throw new Error(`Day ${day} が終わらない`)
      if (!eveningDone && this.time.getCurrentTime().hour >= CLOSE_HOUR) {
        eveningDone = true
        // 閉店後（20:00-24:00）。**営業時間を削らずに仕込める枠**
        this.craftPass(this.policy.craftTargets(this.context()), false)
        continue
      }
      this.time.update(this.minuteMs)
    }

    this.closeDay(day, island)
  }

  private resetDay(): void {
    this.dResell = 0; this.dCraft = 0; this.dDelivery = 0
    this.dResellProfit = 0; this.dCraftProfit = 0; this.dDeliveryProfit = 0
    this.dPurchase = 0; this.dUpgrade = 0
    this.dCraftMinutes = 0; this.dLostMinutes = 0; this.dTopTier = 0
  }

  private closeDay(day: number, island: IslandName): void {
    const slots = this.floorGrid.getAllSlots().length
    this.shelfKinds = Math.max(3, slots)
    const money = this.economy.getMoney()
    this.records.push({
      day,
      island,
      money,
      resellRevenue: this.dResell,
      craftRevenue: this.dCraft,
      deliveryRevenue: this.dDelivery,
      resellProfit: this.dResellProfit,
      craftProfit: this.dCraftProfit,
      deliveryProfit: this.dDeliveryProfit,
      purchaseSpend: this.dPurchase,
      upgradeSpend: this.dUpgrade,
      craftMinutes: this.dCraftMinutes,
      lostBusinessMinutes: this.dLostMinutes,
      slots,
      topTier: this.dTopTier,
    })
    // ⚠ **止めない。**測るのが目的なので、踏んだ日だけ覚えて回し続ける
    if (this.zeroMoneyDay === null && money <= 0) this.zeroMoneyDay = day
    if (this.goalDay === null && money >= this.gameService.getGoalAmount()) {
      this.goalDay = day
      this.goalIslands = this.islandsSoFar()
    }
  }

  /**
   * ここまでに回った島の数。
   *
   * ⚠ **`WorldState` を覗いて数えない。**日が変わった時点で船はもう次の島に居るので、
   *   **回った日の記録から数える**（そうしないと Day 20 で「3島」になる）。
   */
  private islandsSoFar(): number {
    return new Set(this.records.map(r => r.island)).size
  }

  private context(): SimContext {
    return {
      day: this.time.getCurrentTime().day,
      island: this.world.getIsland(),
      registry: this.registry,
      inventory: this.inventory,
      economy: this.economy,
      crafting: this.crafting,
      upgrades: this.upgrades,
      recipeUnlocks: this.recipeUnlocks,
      state: this.world.getState(),
      stocked: merchantListing(
        this.registry.getAllItems(), this.world.getState(),
        id => this.inventory.hasEverHeld(id),
      ).stocked,
      stockTarget: this.opts.stockTarget,
      shelfKinds: this.shelfKinds,
    }
  }

  // ── 遊び手の代わりにやること ──

  /**
   * 改装を買う。**安いものから、値段の `upgradeAffordRatio` 倍の所持金があるときだけ。**
   *
   * ⚠ **実装から読める順番ではない。**「いま買うか、目標まで我慢するか」は
   *   遊び手の判断そのもので、ここに置いたのは**測るために1つ決めた**だけである。
   */
  private buyUpgrades(): void {
    for (;;) {
      let best: { kind: UpgradeKind; cost: number } | null = null
      for (const kind of UPGRADE_KINDS) {
        const cost = this.upgrades.nextCost(kind)
        if (cost === null) continue
        if (this.economy.getMoney() < cost * this.opts.upgradeAffordRatio) continue
        if (!best || cost < best.cost) best = { kind, cost }
      }
      if (!best) return
      if (!this.economy.spend(best.cost)) return
      this.upgrades.advance(best.kind)
      this.dUpgrade += best.cost
      // `GameScene.applyShelfSize()` にあたる
      if (best.kind === '棚') this.floorGrid.expandGrid(this.upgrades.gridSize())
    }
  }

  /** 仕入れ。**買値は `ItemRegistry.purchasePriceOf(id, 現在地)`**（産地割引はここが持つ） */
  private purchase(targets: readonly BuyOrder[]): void {
    let budget = Math.max(0, this.economy.getMoney() - this.opts.cashFloor) * this.opts.buyRatio
    for (const order of targets) {
      const unit = this.registry.purchasePriceOf(order.id, this.world.getIsland())
      // ⚠ **ただの品（救済の品）は元手が要らないので、予算が尽きていても買える。**
      //   **`budget <= 0` で打ち切らない**のはこのため（打ち切ると詰みからの立ち直りが測れない）
      if (unit > 0 && budget <= 0) continue
      const want = Math.min(
        order.qty - this.inventory.getQuantity(order.id),
        this.inventory.spaceFor(order.id),
        // ⚠ **ただの品を「予算 ÷ 0」で数えない。**上限は下の1日の数のほうが持つ
        unit > 0 ? Math.floor(budget / unit) : Number.MAX_SAFE_INTEGER,
        // ⚠ **救済の品は1日の上限まで**（`RescueSupply`）。**本番と同じ関を通す**
        isRescueItem(order.id) ? this.rescue.remaining() : Number.MAX_SAFE_INTEGER,
      )
      if (want <= 0) continue
      if (!this.economy.spend(unit * want)) continue
      if (isRescueItem(order.id)) this.rescue.take(want)
      this.inventory.add(order.id, want)
      this.ledger.add(order.id, want, unit * want)
      this.dPurchase += unit * want
      budget -= unit * want
    }
  }

  /**
   * 加工。**1回ずつ `CraftingSystem.startCraft` を呼ぶ**ので、
   * 材料・在庫の空き・当日の残り時間の検査も、時計を飛ばすのも本番のまま。
   *
   * @param freeWindowOnly true なら**営業時間を1分も削らない**ぶんだけ作る
   *   （`CraftingSystem.fitsBeforeOpen`）。false なら 24:00 までいっぱいに使う。
   */
  private craftPass(targets: readonly RecipeDef[], freeWindowOnly: boolean): void {
    // ⚠ **日をまたいだら止める。**`canCraft` が見るのは「今日のうちに終わるか」だけなので、
    //   24:00 を越えて 6:00 に出た時点でまた真になり、**放っておくと何日ぶんも作り続ける**
    //   （実測: 止めないと 120日ぶん回したつもりが Day 143 まで進み、間の日が記録から消えた）
    const day = this.time.getCurrentTime().day
    for (const recipe of targets) {
      let guard = 0
      while (this.time.getCurrentTime().day === day && this.crafting.canCraft(recipe.id, 1)) {
        if (++guard > 500) break
        if (freeWindowOnly && !this.crafting.fitsBeforeOpen(recipe.id, 1)) break
        if (!this.crafting.startCraft(recipe.id, 1)) break
      }
    }
  }

  /**
   * 納品。**報酬は売値の3倍**（`ORDER_REWARD_RATE`）なので、出せるものは必ず出す。
   *
   * ⚠ **果たせないものは捨てる。**抱えられるのは10件まで（`MISSION_CAP`）なので、
   *   捨てないと**果たせない依頼が枠を埋め、以後1件も出なくなる**（実測: 種1・全部転売で
   *   Day 50 以降の納品がゼロになっていた）。**一寄港（`DAYS_PER_PORT`）待って
   *   果たせなければ捨てる**、というのはここで置いた**方針のつまみ**である。
   */
  private deliverAll(): void {
    const today = this.time.getCurrentTime().day
    for (const order of [...this.delivery.list()]) {
      if (this.delivery.canDeliver(order)) {
        const cogs = this.ledger.take(order.itemId, order.quantity)
        const done = this.delivery.deliver(order.id)
        if (!done) continue
        this.dDelivery += done.reward
        this.dDeliveryProfit += done.reward - cogs
        continue
      }
      if (today - order.issuedDay >= DAYS_PER_PORT) this.delivery.discard(order.id)
    }
  }

  /**
   * 陳列。**毎朝いちど組み直す。**
   *
   * ⚠ **並べ方を工夫していない**（左上から詰めるだけ・回転しない）。
   *   取り合わせ（R1〜R6・S1・S2）が効く並べ方を探すのは**別の方針の仕事**で、
   *   ここは「どの方針でも同じ並べ方」にして、稼ぎ方の違いだけを見えるようにしている。
   */
  private layout(ctx: SimContext, order: readonly ItemId[]): void {
    this.floorGrid.clear()
    if (this.policy.arrange) {
      this.policy.arrange(ctx, this.layoutTools(), order)
      return
    }
    const size = this.floorGrid.getGridSize()
    for (const id of order) {
      if (this.inventory.getQuantity(id) <= 0) continue
      let placed = false
      for (let y = 0; y < size.height && !placed; y++) {
        for (let x = 0; x < size.width && !placed; x++) {
          if (this.placement.tryPlace(id, { x, y }, 0)) placed = true
        }
      }
    }
  }

  /**
   * 方針に渡す盤面の道具。**升目の勘定は全部 `FloorGrid` に任せる。**
   *
   * ⚠ **回転しない**（`rotation: 0`）。既定の並べ方と条件を揃えるため ——
   *   回転を入れると「並べ方を変えた」以外の差が混ざる。
   */
  private layoutTools(): LayoutTools {
    const offsetsOf = (id: ItemId): GridCell[] =>
      this.registry.shapeToOffsets(this.registry.getRotatedShape(this.registry.getItem(id).shape, 0))
    return {
      size: this.floorGrid.getGridSize(),
      canPlace: (id, cell) => this.floorGrid.canPlace(this.registry.getItem(id).shape, cell, 0),
      neighborsOf: (id, cell) => {
        const own = new Set(offsetsOf(id).map(o => `${cell.x + o.x},${cell.y + o.y}`))
        const found = new Set<ItemId>()
        for (const o of offsetsOf(id)) {
          const x = cell.x + o.x
          const y = cell.y + o.y
          for (const d of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
            if (own.has(`${x + d.x},${y + d.y}`)) continue
            const slot = this.floorGrid.getSlotAt({ x: x + d.x, y: y + d.y })
            if (slot) found.add(slot.itemId)
          }
        }
        return [...found]
      },
      place: (id, cell) => this.placement.tryPlace(id, cell, 0) !== null,
    }
  }

  /**
   * 組み終えた盤面を **本番の `evaluateFloor()` そのもの**にかけ、倍率と当たった規則を数える。
   *
   * ⚠ **隣接の組を自分で組み立てない**（2026-09-15 に写しをやめた）。
   *   毎分の売買が通るのと**同じ関数**を呼ぶので、#30 の直しから外れようがない。
   */
  private measureBoard(): void {
    const slots = this.floorGrid.getAllSlots()
    if (slots.length === 0) return
    const result = evaluateFloor(this.floorGrid, slots, this.world.getState())
    let 売れやすさ = 0
    let 値段 = 0
    let 集客 = 0
    for (const slot of slots) {
      const m = finalModifiers(result, slot.id)
      売れやすさ += m.売れやすさ
      値段 += m.値段
      集客 += m.集客
    }
    this.modSum.売れやすさ += 売れやすさ / slots.length
    this.modSum.値段 += 値段 / slots.length
    this.modSum.集客 += 集客 / slots.length
    this.modSum.店全体の集客 += result.shopWide.集客
    // **集客の天井がどこから来ているか**（R5 は「産地が `なし` でなく、かつ一致」で当たる）
    const byOrigin = new Map<string, number>()
    for (const slot of slots) {
      const origin = originReach(this.registry.getItem(slot.itemId))
      if (origin === 'なし') continue
      byOrigin.set(origin, (byOrigin.get(origin) ?? 0) + 1)
    }
    const withOrigin = [...byOrigin.values()].reduce((a, b) => a + b, 0)
    this.modSum.産地あり += withOrigin / slots.length
    this.modSum.最大の同産地 += Math.max(0, ...byOrigin.values()) / slots.length
    this.modDays++
    for (const id of result.firedRules) {
      this.ruleHits.set(id, (this.ruleHits.get(id) ?? 0) + 1)
    }
  }

  private modAvg(key: keyof typeof this.modSum): number {
    return this.modDays === 0 ? 1 : this.modSum[key] / this.modDays
  }
}
