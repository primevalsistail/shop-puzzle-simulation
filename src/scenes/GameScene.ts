import Phaser from 'phaser'
import { TimeManager } from '../components/core/TimeManager.js'
import { ItemRegistry } from '../components/items/ItemRegistry.js'
import { FloorGrid } from '../components/floor/FloorGrid.js'
import { PlacementManager } from '../components/floor/PlacementManager.js'
import { Inventory, MAX_QUANTITY } from '../components/economy/Inventory.js'
import { EconomyManager } from '../components/economy/EconomyManager.js'
import { CraftingSystem } from '../components/items/CraftingSystem.js'
import type { CraftResult } from '../components/items/CraftingSystem.js'
import { CustomerSimulator } from '../components/simulation/CustomerSimulator.js'
import { GameService } from '../services/GameService.js'
import { GameProgress } from '../components/progress/GameProgress.js'
import { WorldState } from '../components/progress/WorldState.js'
import { DeliveryOrders } from '../components/progress/DeliveryOrders.js'
import { PeddlerStock } from '../components/progress/PeddlerStock.js'
import { RecipeUnlocks, groupLabel } from '../components/progress/RecipeUnlocks.js'
import { Upgrades } from '../components/progress/Upgrades.js'
import { FloorRenderer, GRID_ORIGIN_X, GRID_ORIGIN_Y, CELL_SIZE } from '../ui/FloorRenderer.js'
import { InventoryPanel } from '../ui/InventoryPanel.js'
import { ShelfPresets } from '../components/floor/ShelfPresets.js'
import { PresetMenu } from '../ui/PresetMenu.js'
import { CraftMenu } from '../ui/CraftMenu.js'
import { HUD } from '../ui/HUD.js'
import { PurchaseMenu } from '../ui/PurchaseMenu.js'
import { UpgradeMenu } from '../ui/UpgradeMenu.js'
import { Tutorial } from '../ui/Tutorial.js'
import { SaveLoadMenu } from '../ui/SaveLoadMenu.js'
import { CharacterStrip } from '../ui/CharacterStrip.js'
import { PlaceFrame } from '../ui/PlaceFrame.js'
import {
  LEFT_PANEL_R, RIGHT_PANEL_L, LOG_T, SCREEN_W, SCREEN_H,
  BTN_PANEL_L, BTN_PANEL_W, BTN_ICON_W, BTN_ICON_H, BTN_ACTION_H,
  BTN_Y_ADVANCE, BTN_Y_SPEED, BTN_Y_CRAFT, BTN_Y_PEDDLER, BTN_Y_PURCHASE,
  BTN_Y_UPGRADE, BTN_Y_ICON,
  CHAR_ART_CX, CHAR_ART_CY, CHAR_ART_W, CHAR_ART_H, PEDDLER_TITLE, craftTimeLabel,
} from '../ui/layout.js'
import { MessageLog } from '../ui/MessageLog.js'
import { OrderBar } from '../ui/OrderBar.js'
import { money } from '../ui/money.js'
import { goalReachedLine } from '../ui/goal.js'
import { installDebugTools } from '../debug/DebugTools.js'
import { EventBus } from '../services/EventBus.js'
import { GameEvents } from '../types/index.js'
import type { DisplaySlot, GameTime, GridCell, GridSize, Rotation } from '../types/index.js'
import { ALL_ITEMS } from '../taxonomy/items.js'
import { ALL_RECIPES } from '../taxonomy/recipes.js'
import { becameBuyable, merchantListing } from '../taxonomy/evaluate.js'
import type { IslandName } from '../taxonomy/islands.js'
import { materialNeeds } from '../taxonomy/materials.js'

/** 初期の盤面。**棚の強化で広がる**（`Upgrades.gridSize()`） */
const INITIAL_GRID = { width: 6, height: 5 }

/** これ以上動かしたら「掴んだ」とみなす（押して離すだけなら補充） */
const DRAG_THRESHOLD = 6

/**
 * 新しく始めたときの在庫。**伯母から預かったぶん**という想定で、3品を15個ずつ。
 *
 * ⚠ **ここを大きくしないこと。**初日から棚を埋められると「個数で殴る」形になり、
 *   仕入れの解禁（U1・U2）も「買うか作るか」の判断も起きなくなる。
 *   テスト用に膨らませる場合は #51 で一括して外す。
 */
const INITIAL_STOCK: Record<string, number> = {
  sheep_milk: 15,       // 羊の乳
  apple: 15,            // りんご
  buckwheat_bread: 15,  // 蕎麦粉のパン
}

export class GameScene extends Phaser.Scene {
  private timeManager!: TimeManager
  private registry_!: ItemRegistry
  private floorGrid!: FloorGrid
  private placementManager!: PlacementManager
  private inventory!: Inventory
  private economy!: EconomyManager
  private craftingSystem!: CraftingSystem
  private customerSim!: CustomerSimulator
  private gameService!: GameService
  private progress!: GameProgress
  private recipeUnlocks!: RecipeUnlocks
  private world!: WorldState
  private upgrades!: Upgrades
  /** 納品の注文（#28）。**寄港ごとに1件、自動で出る** */
  private deliveryOrders!: DeliveryOrders
  /** 行商人バレンの積荷（#9）。**1日1回、船に来る** */
  private peddler!: PeddlerStock
  /** 品出しの型（マイセット。#27） */
  private shelfPresets = new ShelfPresets()

  private floorRenderer!: FloorRenderer
  private inventoryPanel!: InventoryPanel
  private craftMenu!: CraftMenu
  private saveLoadMenu!: SaveLoadMenu
  private hud!: HUD
  private purchaseMenu!: PurchaseMenu
  private upgradeMenu!: UpgradeMenu
  private tutorial!: Tutorial
  private characterStrip!: CharacterStrip
  private messageLog!: MessageLog
  /** いま受けている注文の1行（#28） */
  private orderBar!: OrderBar
  /** 「行く場所」の枠（#58）。**いまどこに居るかはこれが持つ** */
  private placeFrame!: PlaceFrame
  private presetMenu!: PresetMenu

  private speedLabel!: Phaser.GameObjects.Text
  /** グリッドの下地。棚を広げたら一緒に広げる */
  private gridBackdrop!: Phaser.GameObjects.Rectangle
  private advanceBtnBg!: Phaser.GameObjects.Rectangle
  private advanceBtnLabel!: Phaser.GameObjects.Text
  private tooltip!: Phaser.GameObjects.Text

  private selectedItemId: string | null = null
  private currentRotation: Rotation = 0
  private pendingMoveSlot: DisplaySlot | null = null
  /** 押された区画。**動かし始めるまで掴まない**（押して離すだけなら補充） */
  private pressedSlot: { slot: DisplaySlot; x: number; y: number } | null = null
  private goalCompleted = false

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.registry_ = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)
    this.world = new WorldState()
    this.upgrades = new Upgrades()
    this.floorGrid = new FloorGrid(INITIAL_GRID, this.registry_)
    this.placementManager = new PlacementManager(this.floorGrid, this.registry_)
    this.inventory = new Inventory()
    this.economy = new EconomyManager()
    this.timeManager = new TimeManager()
    this.craftingSystem = new CraftingSystem(this.registry_, this.inventory, this.timeManager, this.upgrades)
    this.customerSim = new CustomerSimulator(this.registry_, this.inventory)
    this.gameService = new GameService(
      this.floorGrid,
      this.inventory,
      this.customerSim,
      this.economy,
      this.world,
      this.upgrades,
    )
    this.deliveryOrders = new DeliveryOrders(this.inventory, this.economy)
    this.peddler = new PeddlerStock()
    this.progress = new GameProgress(
      this.economy, this.inventory, this.floorGrid, this.timeManager, this.world, this.upgrades,
      this.shelfPresets, this.deliveryOrders, this.peddler,
    )
    this.recipeUnlocks = new RecipeUnlocks(this.registry_, this.inventory, this.progress)

    // ── 描画レイヤー確立: 背景→FloorRenderer→UI の順で生成 ──
    this.setupBackground()

    // FloorRenderer は背景より後に init() することで z-order が正しくなる
    this.floorRenderer = new FloorRenderer(this, this.registry_, this.inventory)
    this.floorRenderer.init()
    this.floorRenderer.drawGrid(INITIAL_GRID)

    // ⚠ **強化の利益率を渡す**（#76）。渡さないと**一覧の売値と実際に売れる額がずれる**
    this.inventoryPanel = new InventoryPanel(
      this, this.registry_, () => this.upgrades.marginMultiplier(),
    )
    this.placeFrame = new PlaceFrame(this, visible => this.setShopVisible(visible))
    this.hud = new HUD(this)
    this.tutorial = new Tutorial(this)
    this.characterStrip = new CharacterStrip(this)
    this.characterStrip.create()
    this.messageLog = new MessageLog(this)
    this.messageLog.create()
    this.orderBar = new OrderBar(this)
    this.orderBar.create()

    this.craftMenu = new CraftMenu(
      this,
      this.craftingSystem,
      this.inventory,
      this.registry_,
      this.recipeUnlocks,
      this.placeFrame,
      () => this.world.getIsland(),
      () => this.upgrades.marginMultiplier(),
      () => this.onCraftMenuClosed(),
    )
    this.purchaseMenu = new PurchaseMenu(
      this,
      this.registry_,
      this.economy,
      this.inventory,
      this.placeFrame,
      // ⚠ **解禁済みのレシピだけで数える**（#33）。作り方を知らない品は買うしかないので、
      //   そこで展開が止まり、それが実際の不足と一致する
      () => materialNeeds(this.recipeUnlocks.unlockedRecipes()),
      () => this.world.daysUntilReturn(),
      () => this.world.getLocation().daysLeftAtPort,
      () => this.onPurchaseMenuClosed(),
    )

    this.upgradeMenu = new UpgradeMenu(
      this,
      this.economy,
      this.upgrades,
      this.placeFrame,
      () => this.updateStatus(),
      () => this.applyShelfSize(),
      // ⚠ **1段買ったら持ち物一覧を作り直す**（#76）。利益率を買うと**一覧に出る売値が変わる**。
      //   左パネルは改装の画面を開いている間も見えているので、閉じるまで待たない
      () => this.refreshInventoryPanel(),
    )

    this.presetMenu = new PresetMenu(
      this,
      this.shelfPresets,
      this.registry_,
      this.placeFrame,
      () => this.floorGrid.getGridSize(),
      () => this.floorGrid.getAllSlots().length,
      index => this.savePreset(index),
      index => this.applyPreset(index),
      index => this.deletePreset(index),
      () => this.updateStatus(),
    )

    this.saveLoadMenu = new SaveLoadMenu(
      this,
      (slot) => this.progress.getSlotMeta(slot),
      (slot) => {
        this.progress.save(slot)
        this.updateStatus(`スロット ${slot + 1}に保存しました`)
      },
      (slot) => {
        const data = this.progress.load(slot)
        if (!data) return

        // 時間を止める
        if (this.timeManager.isAdvancing()) this.timeManager.stopAdvancing()

        // フロアを全クリア（表示 + データ）
        for (const existing of this.floorGrid.getAllSlots()) {
          this.floorRenderer.clearSlot(existing.id)
        }
        this.floorGrid.clear()

        // フロアスロットを復元
        for (const slot of data.floor) {
          this.floorGrid.place(slot)
          this.floorRenderer.drawSlot(slot)
        }

        // 経済・インベントリ・時間を復元
        this.economy.restore(data.money, data.totalRevenue)
        this.inventory.setInitialStock(data.inventory)
        this.inventory.restoreEverHeld(data.everHeld ?? Object.keys(data.inventory))
        this.world.restore(data.soldCounts ?? {})
        this.world.setDay(data.currentTime.day)  // 現在地は日付から決まる（#2）
        this.upgrades.restore(data.upgrades ?? {})
        this.shelfPresets.restore(data.shelfPresets)
        this.deliveryOrders.restore(data.orders)
        // ⚠ **積荷ごと戻す。**戻さずに引き直すと、**欲しい品が出るまでロードし直せる**
        //   （10種類・各10個という上限が意味を失う。`PeddlerStock` の注記）
        this.peddler.restore(data.peddler)
        this.progress.restoreUnlockedRecipes(data.unlockedRecipes ?? [])
        // ⚠ **クリア後の状態を戻す**（#80）。読まないと**エンドレスが解け、達成の幕がまた出る**
        //   （所持金は 1000万を超えたままなので、次の1分で `GameService` がまた出す）
        if (data.isEndlessMode) {
          this.gameService.enterEndlessMode()
          this.progress.setEndlessMode(true)
        }
        this.applyShelfSize()
        this.timeManager.setTime(data.currentTime)
        // 解禁が無かった頃のセーブは空で来る。枠は日付から出るのでここで追いつく（#48）
        this.checkRecipeUnlocks()

        // HUD・パネルを更新
        this.hud.updateMoney(data.money)
        this.hud.updateGoal(data.money, this.gameService.isInEndlessMode())
        this.hud.updateTime(data.currentTime.day, data.currentTime.hour, data.currentTime.minute)
        this.hud.updateLocation(this.world.getLocation())
        // ⚠ **注文が無かった頃のセーブは空で来る。**寄港中は必ず1件ある状態なので、
        //   空なら**その寄港ぶんを出し直す**（出し直さないと、次の島へ着くまで納品が消える）
        if (!this.deliveryOrders.getActive()) this.issueOrder()
        // ⚠ **行商人が無かった頃のセーブは日が 0 で来る。**その日ぶんをここで引く。
        //   同じ日の積荷が入っていれば `refresh` は何もしない（1日1回。`PeddlerStock`）
        this.visitPeddler(data.currentTime.day)
        this.refreshInventoryPanel()
        this.updateStatus(`スロット ${slot + 1}からロードしました`)
      },
    )

    this.inventory.setInitialStock(INITIAL_STOCK)
    this.checkRecipeUnlocks()

    this.hud.create()
    // 器を置いただけでは値が入らない。初期値をここで流し込む
    const t0 = this.timeManager.getCurrentTime()
    this.world.setDay(t0.day)
    this.hud.updateTime(t0.day, t0.hour, t0.minute)
    this.hud.updateLocation(this.world.getLocation())
    this.hud.updateMoney(this.economy.getMoney())
    this.hud.updateGoal(this.economy.getMoney(), false)
    // 初日ぶんの注文。**寄港したら必ず1件ある**（#28）
    this.issueOrder()
    // 初日ぶんの行商人。**来訪は1日1回**（#9）
    this.visitPeddler(t0.day)
    this.inventoryPanel.onSelect(id => {
      // 1つの品は棚に1区画まで。**掴んだ時点で知らせる**（どこへ持って行っても置けないため）
      if (this.placementManager.isDisplayed(id)) {
        const item = this.registry_.getItem(id)
        this.updateStatus(`${item.display.name}はもう棚に出しています`)
        this.inventoryPanel.clearSelection()
        return
      }
      this.selectedItemId = id
      this.currentRotation = 0
      // ⚠ **押した瞬間に盤面へかたちを出す**（#70・PO 指示 2026-09-13）。
      //   これが無いと、**マウスを動かすまで盤面に何も出ない** —— 押しただけでは
      //   「持てている」ことが分からず、「押しても何も起きない」に見える
      this.showGrabbedShape()
      this.updateStatus()
    })
    this.refreshInventoryPanel()

    // 店を離れている間は、背後の在庫リストがホイールで動かないようにする
    this.inventoryPanel.setScrollBlocked(() => this.isShelfBlocked())

    this.setupUI()
    this.setupInput()
    this.setupEvents()
    this.updateStatus()

    // 右クリックのブラウザメニューを無効化
    this.input.mouse?.disableContextMenu()

    // ⚠ 確認用の道具。**出荷前に丸ごと外す**（issue #51）。外すのはこの1行と `src/debug/` だけ
    installDebugTools(this, {
      economy: this.economy,
      inventory: this.inventory,
      timeManager: this.timeManager,
      registry: this.registry_,
      world: this.world,
      upgrades: this.upgrades,
      refresh: (message: string) => {
        const t = this.timeManager.getCurrentTime()
        this.world.setDay(t.day)
        this.hud.updateTime(t.day, t.hour, t.minute)
        this.hud.updateLocation(this.world.getLocation())
        this.hud.updateMoney(this.economy.getMoney())
        this.refreshInventoryPanel()
        this.updateStatus(message)
      },
      applyShelfSize: () => this.applyShelfSize(),
      isMenuOpen: () => this.isShelfBlocked(),
    })

    if (this.tutorial.shouldShow()) {
      this.tutorial.show(() => this.updateStatus())
    }
  }

  update(_time: number, delta: number): void {
    this.timeManager.update(delta)
    this.craftingSystem.update(delta)
  }

  private setupBackground(): void {
    // 全体背景
    this.add.rectangle(SCREEN_W / 2, SCREEN_H / 2, SCREEN_W, SCREEN_H, 0x1a1a2e)
    // 左パネル（船倉の中身）
    this.add.rectangle(LEFT_PANEL_R / 2, SCREEN_H / 2, LEFT_PANEL_R, SCREEN_H, 0x16213e)
    // グリッドエリア下地。⚠ **棚を広げたら `applyShelfSize` で一緒に広げること。**
    //   ここを固定にすると、広げた部分だけ地の色が違って見える
    this.gridBackdrop = this.add.rectangle(0, 0, 1, 1, 0x0d2340)
    this.resizeGridBackdrop(INITIAL_GRID)
    // 右パネル
    this.add.rectangle((RIGHT_PANEL_L + SCREEN_W) / 2, LOG_T / 2, SCREEN_W - RIGHT_PANEL_L, LOG_T, 0x13122a)
      .setStrokeStyle(1, 0x2a2a4a)
    // キャラ絵プレースホルダー（HUD の下〜ボタン列の上）。
    // ⚠ **高さを直書きしないこと。**ボタン列に行を足すと列が上へ伸びる（`layout.ts` の注記）
    this.add.rectangle(CHAR_ART_CX, CHAR_ART_CY, CHAR_ART_W, CHAR_ART_H, 0x0d1530)
      .setStrokeStyle(1, 0x223355).setDepth(1)
    // メッセージウィンドウ区切り（グリッド+キャラ+右パネルのみ。左パネルはアイテムリストが続く）
    const divGfx = this.add.graphics()
    divGfx.lineStyle(1, 0x334455, 0.6)
    divGfx.lineBetween(LEFT_PANEL_R, LOG_T - 1, SCREEN_W, LOG_T - 1)
  }

  /** グリッドの下地を盤面の大きさに合わせる */
  private resizeGridBackdrop(size: GridSize): void {
    const gw = size.width * CELL_SIZE
    const gh = size.height * CELL_SIZE
    this.gridBackdrop
      .setPosition(GRID_ORIGIN_X + gw / 2, GRID_ORIGIN_Y + gh / 2)
      .setSize(gw + 10, gh + 4)
  }

  private setupUI(): void {
    this.setupButtonPanel()
  }

  private setupButtonPanel(): void {
    const DEPTH = 10

    // ⚠ **寸法と Y の並びは `layout.ts` が持つ**（写しを作らない）。
    //   行商人の行を足したぶん（#9）、列が上へ伸びてキャラ絵の枠が縮む —— それも向こうで決まる
    const PW = BTN_PANEL_W
    const L = BTN_PANEL_L
    const IW = BTN_ICON_W, IH = BTN_ICON_H
    const AH = BTN_ACTION_H
    const yAdv = BTN_Y_ADVANCE
    const ySpeed = BTN_Y_SPEED
    const yCraft = BTN_Y_CRAFT
    const yPeddle = BTN_Y_PEDDLER
    const yPurch = BTN_Y_PURCHASE
    const yUpg = BTN_Y_UPGRADE
    const yIcon = BTN_Y_ICON
    const iconGap = (PW - 5 * IW) / 4

    // ── Tooltip ──────────────────────────────────────
    this.tooltip = this.add.text(0, 0, '', {
      fontSize: '12px', color: '#dddddd',
      backgroundColor: '#111133',
      padding: { x: 8, y: 5 },
    }).setDepth(DEPTH + 1).setVisible(false)

    const showTip = (x: number, y: number, text: string) => {
      this.tooltip.setText(text)
      const tx = Phaser.Math.Clamp(x - this.tooltip.width / 2, 4, 1280 - this.tooltip.width - 4)
      this.tooltip.setPosition(tx, y - IH / 2 - this.tooltip.height - 6)
      this.tooltip.setVisible(true)
    }
    const hideTip = () => this.tooltip.setVisible(false)

    // ── Icon buttons ─────────────────────────────────
    const iconDefs: { emoji: string; tip: string; action: () => void }[] = [
      { emoji: '💾', tip: 'セーブ',    action: () => this.doSave() },
      { emoji: '📂', tip: 'ロード',    action: () => this.doLoad() },
      { emoji: '🗂', tip: '品出しの型', action: () => this.openPresetMenu() },
      { emoji: '⚙️', tip: 'オプション', action: () => this.updateStatus('オプション: 準備中') },
      { emoji: '❓', tip: 'ヘルプ',    action: () => this.tutorial.show(() => this.updateStatus()) },
    ]
    iconDefs.forEach(({ emoji, tip, action }, i) => {
      const cx = L + IW / 2 + i * (IW + iconGap)
      const bg = this.add.rectangle(cx, yIcon, IW, IH, 0x2a2a4a)
        .setStrokeStyle(1, 0x555577).setInteractive({ useHandCursor: true }).setDepth(DEPTH)
      this.add.text(cx, yIcon, emoji, { fontSize: '16px' }).setOrigin(0.5).setDepth(DEPTH)
      bg.on('pointerdown', action)
      bg.on('pointerover', () => { bg.setFillStyle(0x4a4a6a); showTip(cx, yIcon, tip) })
      bg.on('pointerout',  () => { bg.setFillStyle(0x2a2a4a); hideTip() })
    })

    // ── Action buttons ───────────────────────────────
    const acx = L + PW / 2  // center x for all action buttons

    const makeAction = (
      cy: number, label: string, icon: string,
      normal: number, hover: number,
      action: () => void,
    ) => {
      const bg = this.add.rectangle(acx, cy, PW, AH, normal)
        .setStrokeStyle(1, 0x666688).setInteractive({ useHandCursor: true }).setDepth(DEPTH)
      this.add.text(acx, cy, `${icon}  ${label}`, { fontSize: '17px', color: '#ffffff' })
        .setOrigin(0.5).setDepth(DEPTH)
      bg.on('pointerdown', action)
      bg.on('pointerover', () => bg.setFillStyle(hover))
      bg.on('pointerout',  () => bg.setFillStyle(normal))
      return bg
    }

    makeAction(yUpg, '改装', '⬆', 0x3a5a8a, 0x4a7ab0, () => this.openUpgradeMenu())
    // ⚠ **行った先の見出しと同じ名にすること**（`PlaceFrame.show('商人のところ')`）。
    //   同じ場所を2つの名で呼ばない（`クラフト`→`工房` と同じ直し。束M）
    makeAction(yPurch, '商人のところ', '🛒', 0x6a5a2a, 0x8a7a3a, () => this.openPurchaseMenu())
    // 行商人は**船まで来る**ので「行く場所」ではないが、枠は同じものを使う（#58 の器）。
    // ⚠ **見出しと同じ名にすること**（`PEDDLER_TITLE`）
    makeAction(yPeddle, PEDDLER_TITLE, '⛵', 0x5a3a6a, 0x7a4a8a, () => this.openPeddlerMenu())
    makeAction(yCraft, '工房', '🔨', 0x4a6a3a, 0x5a8a4a, () => this.openCraftMenu())

    // 速度切り替え。⚠ 飛ばすのではなく速くする（飛ばすと売れた実感が消える）。
    //   **「進める」ボタンの上に独立した行として置く。**ボタンの中に入れると文字が重なる
    const speedBg = this.add.rectangle(acx, ySpeed, PW, 16, 0x2a2a4a)
      .setStrokeStyle(1, 0x555577).setInteractive({ useHandCursor: true }).setDepth(DEPTH)
    this.speedLabel = this.add.text(acx, ySpeed, `速さ ×${this.timeManager.getSpeed()}`, {
      fontSize: '11px', color: '#ccddff',
    }).setOrigin(0.5).setDepth(DEPTH)
    speedBg.on('pointerdown', () => {
      this.speedLabel.setText(`速さ ×${this.timeManager.cycleSpeed()}`)
    })

    this.advanceBtnBg = this.add.rectangle(acx, yAdv, PW, AH, 0x4a4a8a)
      .setStrokeStyle(1, 0x6666aa).setInteractive({ useHandCursor: true }).setDepth(DEPTH)
    this.advanceBtnLabel = this.add.text(acx, yAdv, '▶  進める', { fontSize: '17px', color: '#ffffff' })
      .setOrigin(0.5).setDepth(DEPTH)
    this.advanceBtnBg.on('pointerdown', () => this.onAdvancePressed())
    this.advanceBtnBg.on('pointerover', () => {
      if (!this.timeManager.isAdvancing()) this.advanceBtnBg.setFillStyle(0x6a6aaa)
    })
    this.advanceBtnBg.on('pointerout', () => {
      this.advanceBtnBg.setFillStyle(this.timeManager.isAdvancing() ? 0x8a4a4a : 0x4a4a8a)
    })
  }

  private setupInput(): void {
    // ── ポインター移動: ゴーストとグリッドプレビュー ──
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // 押したまま動かしたら、そこで初めて掴む
      if (this.pressedSlot && !this.selectedItemId) {
        const moved = Math.hypot(pointer.x - this.pressedSlot.x, pointer.y - this.pressedSlot.y)
        if (moved > DRAG_THRESHOLD) {
          const slot = this.pressedSlot.slot
          this.pressedSlot = null
          this.startMovingSlot(slot)
        }
      }
      if (!this.selectedItemId || this.isShelfBlocked()) {
        this.floorRenderer.clearDragGhost()
        this.floorRenderer.clearPreview()
        return
      }

      // アイテムゴーストをカーソル中心に追従
      this.floorRenderer.drawDragGhost(this.selectedItemId, this.currentRotation, pointer.x, pointer.y)

      // 床アイテム移動中は外周破棄ゾーンを更新
      if (this.pendingMoveSlot) {
        const inZone = this.isOverDiscardZone(pointer.x, pointer.y)
        this.floorRenderer.drawDiscardZone(inZone, this.floorGrid.getGridSize())
        if (inZone) {
          // ⚠ **`pointermove` ごとに呼ぶが、同じ文は `MessageLog` が落とす**（束M）。
          //   ⚠ **呼び出し側ごとに印を持たないこと。**同じ失敗が別の経路でまた出る
          this.messageLog.addMessage('離すと持ち物へ戻る', 'info')
          this.floorRenderer.clearPreview()
          return
        }
      }

      // カーソルの下（盤面の外なら中央）にかたちを出す
      this.showGrabbedShape()
    })

    // ── pointerdown: 右クリック=回転 / 左クリック=空スロットプロンプト ──
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 右クリック → 時計回り回転
      if (pointer.rightButtonDown()) {
        if (this.selectedItemId) {
          this.currentRotation = ((this.currentRotation + 1) % 4) as Rotation
          // 盤面の外で回しても、出しているかたちが向きに追いつくようにする（#70）
          this.showGrabbedShape()
          this.updateStatus()
        }
        return
      }

      // 左クリック かつ アイテム未保持 → スロット操作
      if (!this.selectedItemId && !this.isShelfBlocked()) {
        if (this.floorRenderer.isOverGrid(pointer.x, pointer.y, this.floorGrid.getGridSize())) {
          const cell = this.floorRenderer.worldToGrid(pointer.x, pointer.y)
          if (cell) {
            const slot = this.floorGrid.getSlotAt(cell)
            if (slot) {
              // ⚠ **ここではまだ掴まない。**押して離すだけなら補充、動かしたら移動。
              //   多くのソフトと同じ分け方なので、操作の説明が要らない
              this.pressedSlot = { slot, x: pointer.x, y: pointer.y }
            } else {
            }
          }
        }
      }
    })

    // ── pointerup: 左ボタンを離したとき → 配置 / 破棄 / キャンセル ──
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      // 動かさずに離した ＝ その品を補充しに行く
      // ⚠ **クリックに「消す」を割り当てない。**触っただけで棚から消えてしまう。
      //   下ろすのは**画面の外へドラッグして離す**（`isOverDiscardZone`）ほうに任せる
      if (this.pressedSlot) {
        const slot = this.pressedSlot.slot
        this.pressedSlot = null
        this.restock(slot.itemId)
        return
      }
      if (!this.selectedItemId) return
      if (!pointer.leftButtonReleased()) return
      if (this.isShelfBlocked()) return

      // 外周破棄ゾーン: 床アイテムをリストへ返す
      if (this.pendingMoveSlot && this.isOverDiscardZone(pointer.x, pointer.y)) {
        this.discardToInventory()
        return
      }

      if (this.floorRenderer.isOverGrid(pointer.x, pointer.y, this.floorGrid.getGridSize())) {
        const cell = this.floorRenderer.worldToGrid(pointer.x, pointer.y)
        if (cell) {
          this.tryPlaceItem(this.calcPlacementCell(cell))
          return
        }
      }
      // グリッド外で離した → キャンセル（元の位置に戻す）
      this.cancelDrag()
    })

    // ESC: メニューを閉じる（ドラッグキャンセルは左ボタン離しで行う）
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.on('down', () => {
      if (this.saveLoadMenu.isVisible()) { this.saveLoadMenu.close(); return }
      // 場所ごとの出口は持たせない。「← 店に戻る」と同じ1つを通す（#58）
      if (this.placeFrame.isShown()) { this.placeFrame.requestBack(); return }
      this.cancelDrag()
    })
  }

  // カーソルセルをシェイプのアンカーブロック基点に変換（中心ブロックがカーソル位置に来る）
  private calcPlacementCell(cursorCell: GridCell): GridCell {
    if (!this.selectedItemId) return cursorCell
    const item = this.registry_.getItem(this.selectedItemId)
    const anchor = this.registry_.getAnchorOffset(item.shape, this.currentRotation)
    return {
      x: cursorCell.x - anchor.x,
      y: cursorCell.y - anchor.y,
    }
  }

  /**
   * **掴んでいる品のかたちを盤面へ出す**（#70）。
   *
   * ⚠ **カーソルが盤面の外にあるときは、盤面の中央へ出す。**
   *   一覧を押した瞬間、カーソルは左パネルの上にあって**置き場所はまだ決まっていない。**
   *   中央なら盤面のどの端からも等距離なので、「ここに置く」ではなく
   *   「**こういうかたちを持っている**」と読める。
   * ⚠ **棚の区画を動かしている最中は、中央へ出さない。**その品は元の場所から外してあり、
   *   盤面の外で離せば元へ戻る。中央に出すと**そこへ移るように読める。**
   * ⚠ **場所へ行っている間は何も出さない**（#58 の既決。判定は `isShelfBlocked()` の1つだけ）。
   */
  private showGrabbedShape(): void {
    if (!this.selectedItemId || this.isShelfBlocked()) {
      this.floorRenderer.clearPreview()
      return
    }
    const size = this.floorGrid.getGridSize()
    const p = this.input.activePointer
    const cursorCell = this.floorRenderer.isOverGrid(p.x, p.y, size)
      ? this.floorRenderer.worldToGrid(p.x, p.y)
      : this.pendingMoveSlot
        ? null
        : { x: Math.floor(size.width / 2), y: Math.floor(size.height / 2) }
    if (!cursorCell) {
      this.floorRenderer.clearPreview()
      return
    }
    const cell = this.calcPlacementCell(cursorCell)
    const valid = this.placementManager.canPlaceAt(this.selectedItemId, cell, this.currentRotation)
    this.floorRenderer.drawPreview(this.selectedItemId, cell, this.currentRotation, valid)
  }

  /**
   * そこで離したら棚から下ろすか。判定は `FloorRenderer` が持つ（描くのと同じ規則を使うため）。
   *
   * ⚠ **盤面の上は破棄ゾーンではない。**上端の帯は盤面の1行目に食い込むので、
   *   除かないと「**一番上の行へ動かそうとすると棚から外れる**」。
   */
  private isOverDiscardZone(x: number, y: number): boolean {
    return this.floorRenderer.isOverDiscardZone(x, y, this.floorGrid.getGridSize())
  }

  private cancelDrag(): void {
    this.pressedSlot = null
    if (this.pendingMoveSlot) {
      this.floorGrid.place(this.pendingMoveSlot)
      this.floorRenderer.drawSlot(this.pendingMoveSlot)
      this.pendingMoveSlot = null
    }
    this.selectedItemId = null
    this.inventoryPanel.clearSelection()
    this.floorRenderer.clearPreview()
    this.floorRenderer.clearDragGhost()
    this.floorRenderer.clearDiscardZone()
    this.updateStatus()
  }

  /** 売り場の外へ出して離す ＝ 下ろす。⚠ **持ち物は減らない** */
  private discardToInventory(): void {
    if (!this.pendingMoveSlot) return
    const item = this.registry_.getItem(this.pendingMoveSlot.itemId)
    this.updateStatus(`${item.display.name}を売り場から下ろした`)
    this.refreshInventoryPanel()
    this.pendingMoveSlot = null
    this.selectedItemId = null
    this.inventoryPanel.clearSelection()
    this.floorRenderer.clearPreview()
    this.floorRenderer.clearDragGhost()
    this.floorRenderer.clearDiscardZone()
  }

  private startMovingSlot(slot: DisplaySlot): void {
    this.pendingMoveSlot = { ...slot }
    this.placementManager.removeSlot(slot.id)
    this.selectedItemId = slot.itemId
    this.currentRotation = slot.rotation
    this.floorRenderer.drawDiscardZone(false, this.floorGrid.getGridSize())
    this.updateStatus()
  }

  private setupEvents(): void {
    EventBus.on(GameEvents.TIME_MINUTE_PASSED, (time: unknown) => {
      const t = time as GameTime
      this.hud.updateTime(t.day, t.hour, t.minute)
      this.gameService.onMinutePassed(Math.random, this.timeManager.isOpen())
    })

    // 日が変わると現在地が動く（#2）
    EventBus.on(GameEvents.TIME_DAY_CHANGED, (time: unknown) => {
      const day = (time as GameTime).day
      this.onDayChanged(day)
      this.pauseAt(`Day ${day} が始まった`)
    })

    // ⚠ **節目で必ず止める。**速さを上げると判断すべき瞬間を通り過ぎてしまう。
    //   止まるのは「作業→営業」「営業→作業」の2回と、上の日付の切り替わり。
    EventBus.on(GameEvents.TIME_PHASE_CHANGED, (phase: unknown) => {
      if (phase === '営業') this.pauseAt('店を開けた')
      else if (phase === '作業') this.pauseAt('店を閉めた')
    })

    // 加工で時計が飛んだとき（TimeManager.skipMinutes）。
    // skipMinutes は TIME_MINUTE_PASSED を出さない＝その間は客が来ない（#25）ので、
    // 表示だけをここで追いつかせる。売買は回さない。
    EventBus.on(GameEvents.TIME_SKIPPED, (payload: unknown) => {
      const { time } = payload as { minutes: number; time: GameTime }
      this.hud.updateTime(time.day, time.hour, time.minute)
    })

    EventBus.on(GameEvents.TIME_ADVANCE_STOPPED, () => {
      this.advanceBtnLabel.setText('▶  進める'); this.advanceBtnBg.setFillStyle(0x4a4a8a)
      
    })

    // ⚠ **進捗バーもここで動かす**（#73）。バーが測るのは**所持金**なので、
    //   売れたときだけでなく**払ったときにも動く**（改装を買えば縮む）。
    //   所持金が変わる経路はすべて `EconomyManager` がこの出来事を出すので、ここ1箇所で足りる
    EventBus.on(GameEvents.ECONOMY_MONEY_CHANGED, (money: unknown) => {
      this.hud.updateMoney(money as number)
      this.hud.updateGoal(money as number, this.gameService.isInEndlessMode())
    })

    EventBus.on(GameEvents.FLOOR_SLOT_PLACED, (slot: unknown) => {
      this.floorRenderer.drawSlot(slot as DisplaySlot)
    })

    EventBus.on(GameEvents.FLOOR_SLOT_REMOVED, (slotId: unknown) => {
      this.floorRenderer.clearSlot(slotId as string)
    })

    EventBus.on(GameEvents.FLOOR_SLOT_EMPTIED, (slotId: unknown) => {
      const slot = this.floorGrid.getAllSlots().find(s => s.id === slotId)
      if (slot) this.floorRenderer.refreshSlot(slot)
    })

    EventBus.on(GameEvents.FLOOR_SLOT_SOLD, (sale: unknown) => {
      const s = sale as { slotId: string; revenue: number; itemId: string; qtySold: number }
      const slot = this.floorGrid.getAllSlots().find(sl => sl.id === s.slotId)
      if (slot) {
        this.floorRenderer.refreshSlot(slot)
        this.refreshInventoryPanel()
        this.showSalePopup(s.revenue, slot)
        const item = this.registry_.getItem(slot.itemId)
        this.messageLog.addMessage(`${item.display.name}が売れた！ +${money(s.revenue)}`, 'sale')
      }
      this.checkStockUnlock(s.itemId, s.qtySold)
    })

    EventBus.on(GameEvents.CRAFTING_COMPLETED, (payload: unknown) => {
      const { recipeId, times, quantity, minutes, businessMinutes } = payload as CraftResult
      const recipe = this.registry_.getRecipe(recipeId)
      // ⚠ **払った額を後からも言う**（#53）。`recipe.durationMinutes × times` は
      //   手際を掛ける前の素の値なので使わない。**営業を削ったならその分数まで言う**
      //   ——削ったことに気づけないと、売上が落ちた理由が加工だと結びつかない。
      this.messageLog.addMessage(
        `${recipe.display.name} ×${times}回 完了！ ${quantity}個入手（${craftTimeLabel(minutes, businessMinutes)}）`,
        'event',
      )
      // 在庫上限（段4-7）。**買う側は押せなくして防げるが、加工は出来上がってから溢れる。**
      // 黙って消さず、ここで言う。上限を下げるときはこの知らせも見直すこと
      if (this.inventory.isFull(recipe.outputItemId)) {
        const item = this.registry_.getItem(recipe.outputItemId)
        this.messageLog.addMessage(
          `${item.display.name}は在庫上限 ${MAX_QUANTITY} に達した。これ以上は増えない`,
          'event',
        )
      }
      this.refreshInventoryPanel()
    })

    EventBus.on(GameEvents.PROGRESS_GOAL_COMPLETE, () => {
      if (this.goalCompleted) return
      this.goalCompleted = true
      this.timeManager.stopAdvancing()
      this.showGoalComplete()
    })

    EventBus.on(GameEvents.PROGRESS_GAME_OVER, () => {
      this.timeManager.stopAdvancing()
      this.showGameOver()
    })
  }

  /**
   * 日が変わったとき。現在地は日付から決まる（#2）ので、ここで `WorldState` に日を渡すだけでよい。
   */
  private onDayChanged(day: number): void {
    const before = this.world.getLocation()
    this.world.setDay(day)
    const after = this.world.getLocation()
    this.hud.updateLocation(after)

    // 島が変われば商人の品揃えも需要も変わるので、開いているメニューは閉じる
    if (before.island !== after.island) {
      if (this.purchaseMenu.isVisible()) this.purchaseMenu.close()
      this.settleDelivery(after.island)
      this.issueOrder()
    }

    // ⚠ **島が変わったあとに引く。**次の寄港地は島が変わった時点で変わるので、
    //   先に引くと「1日だけ、いまの次の島の産を積んだ行商人」が出る（#9）
    this.visitPeddler(day)

    // 滞在中にも解禁が起きる（段4-4）。枠は4日に1つ増える ＝ 1寄港あたり2〜3回
    this.checkRecipeUnlocks()
  }

  /**
   * 棚の強化を買ったあと、盤面を広げて描き直す。
   *
   * ⚠ **並べてある品はそのまま残す。**広げるだけなので、既にある区画の位置は変わらない。
   */
  private applyShelfSize(): void {
    const size = this.upgrades.gridSize()
    this.floorGrid.expandGrid(size)
    this.resizeGridBackdrop(size)
    this.floorRenderer.drawGrid(size)
    for (const slot of this.floorGrid.getAllSlots()) this.floorRenderer.drawSlot(slot)
    this.updateStatus(`売り場が ${size.width}×${size.height} に広がった`)
  }

  private tryPlaceItem(cell: GridCell): void {
    if (!this.selectedItemId) return
    const isMoving = this.pendingMoveSlot !== null

    // ⚠ **在庫は減らない。**棚は「どこに出しているか」を表すだけで、持ち物は1つしかない
    const slot = this.placementManager.tryPlace(this.selectedItemId, cell, this.currentRotation)
    if (!slot) {
      const already = !isMoving && this.placementManager.isDisplayed(this.selectedItemId)
      this.updateStatus(already ? 'もう棚に出しています' : 'ここには置けません')
      if (isMoving) {
        this.floorGrid.place(this.pendingMoveSlot!)
        this.floorRenderer.drawSlot(this.pendingMoveSlot!)
      }
      this.clearSelection()
      return
    }

    this.clearSelection()
    this.refreshInventoryPanel()
  }

  private clearSelection(): void {
    this.pendingMoveSlot = null
    this.pressedSlot = null
    this.selectedItemId = null
    this.inventoryPanel.clearSelection()
    this.floorRenderer.clearPreview()
    this.floorRenderer.clearDragGhost()
    this.floorRenderer.clearDiscardZone()
    this.updateStatus()
  }

  /**
   * 棚の品を補充しに行く。
   *
   * ⚠ 在庫は1つなので「棚へ移す」という補充は無い。**もっと手に入れる**のが補充にあたる。
   *   この島の商人が扱っていれば仕入れへ、作れるならクラフトへ、その品を映した状態で移る。
   */
  private restock(itemId: string): void {
    const item = this.registry_.getItem(itemId)
    const listing = this.merchantListing()

    // ⚠ **「もうすぐ買える」側へは飛ばさない。**そこからは買えないので、
    //   補充の答えにならない。作れるならこの下で工房へ回る（#66）
    if (listing.stocked.some(i => i.id === itemId)) {
      this.stopAdvancing()
      this.purchaseMenu.open(
        listing.stocked.slice(), this.world.getIsland(), listing.upcoming, itemId,
      )
      return
    }

    const recipe = this.registry_.getAllRecipes().find(r => r.outputItemId === itemId)
    if (recipe) {
      this.stopAdvancing()
      this.craftMenu.open(recipe.id)
      return
    }

    this.updateStatus(`${item.display.name}は${this.world.getIsland()}島では手に入りません`)
  }

  /**
   * 棚に手が出せない状態か。
   *
   * **場所へ行っている間**（商人のところ・工房・改装。#58）と、
   * **セーブ／ロードが開いている間**（ここだけダイアログのまま。PO 判断 Q2）。
   *
   * ⚠ **判定はここ1つだけにする。**以前は同じ `||` の連鎖が**7箇所に散らばって**いて、
   *   **うち1箇所だけ強化メニューが抜けていた**（強化を開いたまま棚を掴めた）。
   *   条件を足すときもここだけを直す。
   */
  private isShelfBlocked(): boolean {
    return this.placeFrame.isShown() || this.saveLoadMenu.isVisible()
  }

  /**
   * 売り場の見え方を切り替える。**`PlaceFrame` から呼ばれる。**
   *
   * ⚠ **覆うのではなく消す。**盤面は最大 x982 まで伸びて場所の領域（〜976）を
   *   6px はみ出すので、覆う方式だとその帯だけ残る。
   */
  private setShopVisible(visible: boolean): void {
    // ⚠ **行きも帰りも掴んだものを離す**（main の技術判断。#70）。
    //   行き: 掴んだまま店を離れると、帰ってきたときその区画が宙に浮く（盤面から外してある）。
    //   帰り: 場所にいる間の `pointerup` は早期 return するので選択が残り、
    //         **店に戻って最初にマウスを動かすといきなりゴーストが出る**
    this.cancelDrag()
    this.floorRenderer.setVisible(visible)
    this.gridBackdrop.setVisible(visible)
    // ⚠ **キャラ帯も隠す。**商人のところに居るのに「店番」「来店客」の枠が出ているのは、
    //   そこに居ないのだからおかしい（PO 2026-09-12）。
    //   場所の領域はこの帯に重なるので、隠さないと下から覗く
    this.characterStrip.setVisible(visible)
    this.orderBar.setShopVisible(visible)
  }

  /** 時間が進んでいたら止める。場所へ移る前に必ず呼ぶ */
  private stopAdvancing(): void {
    if (!this.timeManager.isAdvancing()) return
    this.timeManager.stopAdvancing()
    this.advanceBtnLabel.setText('▶  進める')
    this.advanceBtnBg.setFillStyle(0x4a4a8a)
  }

  private openCraftMenu(): void {
    this.stopAdvancing()
    // 買った直後に開いても取りこぼさないよう、ここでも判定する。
    // **枠は日付で決まる**ので、何度呼んでも解禁の速さは変わらない（RecipeUnlocks）
    this.checkRecipeUnlocks()
    this.craftMenu.open()
  }

  /**
   * レシピの解禁（#48 ／ 段4-4）。**開いた系統だけを知らせる。**
   * 1本ずつ知らせると、まとめて開く意味が消えるうえ、log が流れる。
   */
  private checkRecipeUnlocks(): void {
    const day = this.timeManager.getCurrentTime().day
    for (const event of this.recipeUnlocks.advanceTo(day)) {
      this.messageLog.addMessage(
        `${groupLabel(event)}の作り方が分かった（${event.recipes.length}種）`,
        'event',
      )
    }
  }

  /**
   * 売った数が届いて、**商人に並ぶようになった**か（#60）。
   *
   * 段4-4 で「**作れる**ようになった」は知らせているのに、**買えるほうは静かだった。**
   *
   * ⚠ **しきい値（100）をここに書き写さない。**それは規則データの中の値なので、
   *   `becameBuyable` が**売る前と売った後で規則そのものを評価**して比べる。
   * ⚠ **1品につき生涯1回**しか起きず、売れるのは1分に1件ずつなので、
   *   系統単位にまとめなくても log は埋まらない（レシピの解禁とはそこが違う）。
   */
  private checkStockUnlock(itemId: string, qtySold: number): void {
    const after = this.world.getSoldCount(itemId)
    const item = this.registry_.getItem(itemId)
    if (!becameBuyable(item, this.world.getIsland(), after - qtySold, after)) return
    // **買えることが得だとは言わない。**買値は売値の7割で、作るほうが取り分は大きい
    this.messageLog.addMessage(
      `${item.display.name}が商人の店先に並ぶようになった。作るより高いが、時間はかからない`,
      'event',
    )
  }

  private onCraftMenuClosed(): void {
    this.refreshInventoryPanel()
    this.updateStatus()
  }

  private openUpgradeMenu(): void {
    this.stopAdvancing()
    this.upgradeMenu.open()
  }

  private openPurchaseMenu(): void {
    this.stopAdvancing()
    const listing = this.merchantListing()
    this.purchaseMenu.open(listing.stocked.slice(), this.world.getIsland(), listing.upcoming)
  }

  /**
   * 行商人バレンのところ（#9。#34 をここに畳んだ）。
   *
   * ⚠ **引き直さない。**品揃えは `PeddlerStock` が1日1回引いたものをそのまま出す。
   *   ここで引くと**開き直すたびに品揃えが変わる。**
   */
  private openPeddlerMenu(): void {
    this.stopAdvancing()
    // ⚠ **消えた品IDを弾く。**`getItem` は無いIDで例外を投げるので、
    //   品が入れ替わった頃のセーブ（先例: 旧13品時代のID。#30）で画面が落ちる
    const items = this.peddler.list()
      .filter(e => this.registry_.has(e.itemId))
      .map(e => this.registry_.getItem(e.itemId))
    this.purchaseMenu.openPeddler(this.peddler, items, this.world.getIsland())
  }

  /**
   * その日の行商人（#9）。**来訪は1日1回。**
   *
   * ⚠ **知らせは `event`。**`info` は同じ文が続くと抑止されるので、
   *   毎日出るこの知らせには使えない（2日目以降が黙って消える）。
   */
  private visitPeddler(day: number): void {
    const came = this.peddler.refresh(
      day,
      this.registry_.getAllItems(),
      this.world.getState(),
      // ⚠ **次の寄港地の産は積まない**（#9。島を巡る動機を直接削るため）
      this.world.getLocation().next,
    )
    if (!came) return
    const kinds = this.peddler.list().length
    if (kinds === 0) return
    this.messageLog.addMessage(`${PEDDLER_TITLE}が船に寄った（${kinds}種）`, 'event')
  }

  /**
   * 商人のところに出す行（#30・#66）。
   *
   * 固定の材料一覧ではなく、**その島の商人が並べる品**。tier と累計販売数で解禁されるので、
   * 売るほど品揃えが増える。
   *
   * ⚠ **「買えるもの」だけではない**（PO 決定 2026-09-13）。**一度でも手にした品**は、
   *   まだ U2 を通っていなくても `あとN個売れば並ぶ` の行として並ぶ。**その行は買えない。**
   * ⚠ **「一度でも手にしたか」は `Inventory.hasEverHeld`。**いま持っている数ではない
   *   （売り切って0個になった品も「手にした品」のまま）。
   */
  private merchantListing(): ReturnType<typeof merchantListing> {
    return merchantListing(
      this.registry_.getAllItems(),
      this.world.getState(),
      id => this.inventory.hasEverHeld(id),
    )
  }

  private onPurchaseMenuClosed(): void {
    this.refreshInventoryPanel()
    this.updateStatus()
  }

  private openPresetMenu(): void {
    this.stopAdvancing()
    this.presetMenu.open()
  }

  /**
   * いまの並びを型に覚える（#27）。
   *
   * ⚠ **在庫も持ち物も動かない。**棚は「どこに何をどの向きで出しているか」を表すだけで、
   *   並べても在庫は減らない（段2.5）。だから覚えるのも呼び出すのも**何も消費しない。**
   */
  private savePreset(index: number): void {
    const slots = this.floorGrid.getAllSlots()
    // ⚠ **覚えるときの島を一緒に持たせる**（#67）。`12区画` が2つ並ぶと
    //   文字が完全に同一になり、縮小図しか手がかりが無かった。
    //   ⚠ **呼び出すときの島ではない。**型はどの島でも呼べる
    this.shelfPresets.save(index, slots, this.world.getIsland())
    this.presetMenu.refresh()
    this.updateStatus(
      slots.length === 0 ? '「全部下ろす」を型に覚えた' : `いまの${slots.length}区画を型に覚えた`,
    )
  }

  /** 覚えた型を消す（#27） */
  private deletePreset(index: number): void {
    if (!this.shelfPresets.get(index)) return
    this.shelfPresets.clear(index)
    this.presetMenu.refresh()
    this.updateStatus('型を1つ消した')
  }

  /**
   * 型を呼び出して並べ直す（#27）。
   *
   * ⚠ **入らないものは黙って落とさず、数を言う。**棚は強化で広がるので、
   *   **広い盤面で覚えた型を狭い盤面で呼ぶ**ことが起こる（ロード直後など）。
   * ⚠ **手持ちが0の品も並べる。**棚は在庫を持たないので置けてしまうが、
   *   **売り切れとして赤く出る**ので「何を仕入れ直すか」がそのまま分かる。
   */
  private applyPreset(index: number): void {
    const preset = this.shelfPresets.get(index)
    if (!preset) return

    for (const existing of this.floorGrid.getAllSlots()) this.floorRenderer.clearSlot(existing.id)
    this.floorGrid.clear()

    let placed = 0
    for (const p of preset.slots) {
      // `tryPlace` が品から今のかたちを引き直す。型はかたちを覚えていない
      if (this.placementManager.tryPlace(p.itemId, p.position, p.rotation)) placed++
    }

    const dropped = preset.slots.length - placed
    this.presetMenu.refresh()
    this.refreshInventoryPanel()
    this.updateStatus(
      dropped === 0
        ? `型を呼び出した（${placed}区画）`
        : `型を呼び出した（${placed}区画。${dropped}区画は盤面に入らず外した）`,
    )
  }

  private doSave(): void { this.saveLoadMenu.openSave() }
  private doLoad(): void { this.saveLoadMenu.openLoad() }

  /**
   * 売り場に並べられる品の一覧。
   *
   * ⚠ **加工品だけでなく全品を出す**（#30）。旧体系では素材は加工の材料でしかなかったが、
   *   新体系では**素材にも売値・かたち・需要の規則がかかる**。実際、島の商人が並べるのは
   *   序盤は素材だけ（U1）なので、素材を出さないと**買った品を1つも置けない。**
   */
  private refreshInventoryPanel(): void {
    // ⚠ **手に入れたことがある品だけ出す。**135品すべてを「在庫0」で並べると、
    //   何が手元にあるのか読めなくなる。減って0になった品は残す（また仕入れられるので）
    const items = this.registry_.getAllItems().filter(i => this.inventory.hasEverHeld(i.id))
    const stock = this.inventory.getAllStock()
    const quantities: Record<string, number> = {}
    for (const item of items) {
      quantities[item.id] = stock[item.id] ?? 0
    }
    // 棚に出している品には印を付ける。数量は持ち物と同じなので分けて出さない
    const onShelf = new Set(this.floorGrid.getAllSlots().map(s => s.itemId))
    // 現在地も渡す。**買値は島で変わる**ので、渡さないと仕入れ画面と食い違う（段4-6）
    this.inventoryPanel.render(items, quantities, onShelf)
    // ⚠ **帯の「手持ち」も持ち物の表示である。**別の経路で更新すると片方だけ古くなる
    this.refreshOrderBar()
  }

  /** 納品の帯を引き直す。**注文が無ければ帯ごと消える** */
  private refreshOrderBar(): void {
    const order = this.deliveryOrders.getActive()
    if (!order) {
      this.orderBar.update(null, '', 0)
      return
    }
    const item = this.registry_.getItem(order.itemId)
    this.orderBar.update(order, item.display.name, this.inventory.getQuantity(order.itemId))
  }

  /**
   * この寄港ぶんの注文を出す（#28）。**納品先は次の島。**
   *
   * ⚠ **知らせは `event` で出す。**`info` は同じ文が続くと抑止されるので、
   *   注文のような「1回きりで、見落とすと困る」知らせには使わない。
   */
  private issueOrder(): void {
    const order = this.deliveryOrders.issue(
      this.registry_.getAllItems(),
      this.world.getState(),
      this.world.getLocation().next,
      this.timeManager.getCurrentTime().day,
      // ⚠ **作れる品も候補に入れる**（#85）。買えるものだけだと候補が
      //   「産地＝この島の素材」に限られ、20回の寄港で目標の 0.2% にしかならなかった
      new Set(this.recipeUnlocks.unlockedRecipes().map(r => r.outputItemId)),
    )
    if (order) {
      const item = this.registry_.getItem(order.itemId)
      this.messageLog.addMessage(
        `${order.island}島へ ${item.display.name} ×${order.quantity} の注文が入った`
        + `（納めると ${money(order.reward)}）`,
        'event',
      )
    }
    this.refreshOrderBar()
  }

  /**
   * 納品先に着いた（#28）。**積んであれば自動で納まる。**
   *
   * ⚠ **果たせなくても罰は無い**（PO 判断 Q4=A）。注文が流れるだけ。
   */
  private settleDelivery(island: IslandName): void {
    const result = this.deliveryOrders.settleArrival(island)
    if (!result) return
    const item = this.registry_.getItem(result.order.itemId)
    this.messageLog.addMessage(
      result.delivered
        ? `${item.display.name} ×${result.order.quantity} を納めた　+${money(result.order.reward)}`
        : `${item.display.name} ×${result.order.quantity} の注文は流れた`,
      'event',
    )
  }

  private showSalePopup(revenue: number, slot: DisplaySlot): void {
    const item = this.registry_.getItem(slot.itemId)
    const offsets = this.registry_.shapeToOffsets(this.registry_.getRotatedShape(item.shape, slot.rotation))
    if (offsets.length === 0) return
    const cx = offsets.reduce((s, o) => s + o.x, 0) / offsets.length
    const cy = offsets.reduce((s, o) => s + o.y, 0) / offsets.length
    const px = GRID_ORIGIN_X + (slot.position.x + cx + 0.5) * CELL_SIZE
    const py = GRID_ORIGIN_Y + (slot.position.y + cy) * CELL_SIZE
    const popup = this.add.text(px, py, `+${money(revenue)}`, {
      fontSize: '14px', color: '#ffee44',
      stroke: '#000000', strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(0.5, 1).setDepth(100)
    this.tweens.add({
      targets: popup,
      y: py - 36,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.Out',
      onComplete: () => popup.destroy(),
    })
  }

  private showGoalComplete(): void {
    const { width, height } = this.scale
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setDepth(200)
    this.add.text(width / 2, height / 2 - 80, '🎉 目標達成！', {
      fontSize: '52px', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201)
    // ⚠ **クリア条件と同じものを出す**（#73）。届いたのは所持金なので、出すのも所持金
    this.add.text(width / 2, height / 2, goalReachedLine(this.economy.getMoney()), {
      fontSize: '26px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(201)

    const endlessBtn = this.add.text(width / 2, height / 2 + 90, 'エンドレスモードへ', {
      fontSize: '22px', color: '#ffffff', backgroundColor: '#4a4a8a', padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true })
    endlessBtn.on('pointerdown', () => {
      overlay.destroy(); endlessBtn.destroy()
      this.gameService.enterEndlessMode()
      this.progress.setEndlessMode(true)
      // ⚠ **その場でバーを ∞ に切り替える**（#73）。所持金が動くまで待つと、
      //   目標を越えたあとも「目標 100%」がしばらく残る
      this.hud.updateGoal(this.economy.getMoney(), true)
      this.updateStatus('エンドレスモード開始！')
    })
  }

  private showGameOver(): void {
    const { width, height } = this.scale
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85).setDepth(200)
    this.add.text(width / 2, height / 2 - 40, 'GAME OVER', {
      fontSize: '52px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201)
    this.add.text(width / 2, height / 2 + 30, '資金が尽きました', {
      fontSize: '22px', color: '#cccccc',
    }).setOrigin(0.5).setDepth(201)
  }

  /**
   * 節目で時間を止める。
   *
   * ⚠ **止めるだけで、プレイヤーの操作を奪わない。**もう一度「進める」を押せば続く。
   *   速さの設定は変えない（次の区間も同じ速さで流したいことが多いため）。
   */
  private pauseAt(reason: string): void {
    if (!this.timeManager.isAdvancing()) return
    this.timeManager.stopAdvancing()
    this.advanceBtnLabel.setText('▶  進める')
    this.advanceBtnBg.setFillStyle(0x4a4a8a)
    this.updateStatus(reason)
  }

  private onAdvancePressed(): void {
    // ⚠ **店を離れている間は時間を進められない**（商人のところ・工房・改装。#58）。
    //   離れている間に店が回ってしまうのを避ける。
    //   加工そのものは時間を消費するが、それは `CraftingSystem` が別に行う
    if (this.isShelfBlocked()) return
    if (this.timeManager.isAdvancing()) {
      this.timeManager.stopAdvancing()
    } else {
      this.timeManager.startAdvancing()
      this.advanceBtnLabel.setText('⏸  停止'); this.advanceBtnBg.setFillStyle(0x8a4a4a)
      
    }
  }

  private updateStatus(msg?: string): void {
    if (msg) {
      this.messageLog.addMessage(msg, 'info')
      return
    }
    if (this.selectedItemId) {
      const item = this.registry_.getItem(this.selectedItemId)
      const rotLabels = ['↑', '→', '↓', '←']
      this.messageLog.addMessage(
        `つかんでいる: ${item.display.name}  [${rotLabels[this.currentRotation]}]  右クリックで回転`,
        'info',
      )
    }
  }
}
