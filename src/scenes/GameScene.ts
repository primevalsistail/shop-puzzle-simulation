import Phaser from 'phaser'
import { TimeManager } from '../components/core/TimeManager.js'
import { ItemRegistry } from '../components/items/ItemRegistry.js'
import { FloorGrid } from '../components/floor/FloorGrid.js'
import { PlacementManager } from '../components/floor/PlacementManager.js'
import { Inventory } from '../components/economy/Inventory.js'
import { EconomyManager } from '../components/economy/EconomyManager.js'
import { CraftingSystem } from '../components/items/CraftingSystem.js'
import type { CraftResult } from '../components/items/CraftingSystem.js'
import { CustomerSimulator } from '../components/simulation/CustomerSimulator.js'
import { ShopService } from '../services/ShopService.js'
import { GameService } from '../services/GameService.js'
import { GameProgress } from '../components/progress/GameProgress.js'
import { WorldState } from '../components/progress/WorldState.js'
import { FloorRenderer, GRID_ORIGIN_X, GRID_ORIGIN_Y, CELL_SIZE, DISCARD_MARGIN } from '../ui/FloorRenderer.js'
import { InventoryPanel } from '../ui/InventoryPanel.js'
import { CraftMenu } from '../ui/CraftMenu.js'
import { SlotActionPrompt } from '../ui/SlotActionPrompt.js'
import { HUD } from '../ui/HUD.js'
import { PurchaseMenu } from '../ui/PurchaseMenu.js'
import { Tutorial } from '../ui/Tutorial.js'
import { SaveLoadMenu } from '../ui/SaveLoadMenu.js'
import { CharacterStrip } from '../ui/CharacterStrip.js'
import { MessageLog } from '../ui/MessageLog.js'
import { EventBus } from '../services/EventBus.js'
import { GameEvents } from '../types/index.js'
import type { DisplaySlot, GameTime, GridCell, Rotation } from '../types/index.js'
import { ALL_ITEMS } from '../taxonomy/items.js'
import { ALL_RECIPES } from '../taxonomy/recipes.js'
import { stockedByIslandMerchant } from '../taxonomy/evaluate.js'

const INITIAL_GRID = { width: 6, height: 5 }

/**
 * 新しく始めたときの在庫。**動作確認をしやすくするため、登録されている全品目を
 * 同じ数だけ持たせる**（ユーザー依頼 2026-09-11「テストしづらいので各品目10000個」）。
 *
 * ⚠ これは遊びの初期条件ではなく確認用の値。セーブから読み込んだ場合は
 *   保存された在庫が使われるので、既存のセーブはこの値の影響を受けない。
 *
 * ⚠ **#30 以降、これは仕入れの仕組みを丸ごと隠す。**島の商人は序盤は素材18品しか並べず（U1）、
 *   売った実績で加工品が並び始める（U2）。最初から全122品を10000個持っていると、
 *   **仕入れメニューを開く理由が無くなる。**
 *   **PO判断（2026-09-11）: テスト用なので残す。**撤去は issue #51 がまとめて扱う。
 */
const INITIAL_STOCK_PER_ITEM = 10000

const INITIAL_STOCK: Record<string, number> = Object.fromEntries(
  ALL_ITEMS.map(item => [item.id, INITIAL_STOCK_PER_ITEM]),
)

export class GameScene extends Phaser.Scene {
  private timeManager!: TimeManager
  private registry_!: ItemRegistry
  private floorGrid!: FloorGrid
  private placementManager!: PlacementManager
  private inventory!: Inventory
  private economy!: EconomyManager
  private craftingSystem!: CraftingSystem
  private customerSim!: CustomerSimulator
  private shopService!: ShopService
  private gameService!: GameService
  private progress!: GameProgress
  private world!: WorldState

  private floorRenderer!: FloorRenderer
  private inventoryPanel!: InventoryPanel
  private craftMenu!: CraftMenu
  private saveLoadMenu!: SaveLoadMenu
  private slotPrompt!: SlotActionPrompt
  private hud!: HUD
  private purchaseMenu!: PurchaseMenu
  private tutorial!: Tutorial
  private characterStrip!: CharacterStrip
  private messageLog!: MessageLog

  private advanceBtnBg!: Phaser.GameObjects.Rectangle
  private advanceBtnLabel!: Phaser.GameObjects.Text
  private tooltip!: Phaser.GameObjects.Text

  private selectedItemId: string | null = null
  private currentRotation: Rotation = 0
  private pendingMoveSlot: DisplaySlot | null = null
  private goalCompleted = false

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.registry_ = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)
    this.world = new WorldState()
    this.floorGrid = new FloorGrid(INITIAL_GRID, this.registry_)
    this.placementManager = new PlacementManager(this.floorGrid, this.registry_)
    this.inventory = new Inventory()
    this.economy = new EconomyManager()
    this.timeManager = new TimeManager()
    this.craftingSystem = new CraftingSystem(this.registry_, this.inventory, this.timeManager)
    this.customerSim = new CustomerSimulator(this.registry_)
    this.shopService = new ShopService(this.floorGrid, this.placementManager, this.inventory, this.registry_)
    this.gameService = new GameService(
      this.floorGrid,
      this.placementManager,
      this.customerSim,
      this.economy,
      this.world,
    )
    this.progress = new GameProgress(
      this.economy, this.inventory, this.floorGrid, this.timeManager, this.world,
    )

    // ── 描画レイヤー確立: 背景→FloorRenderer→UI の順で生成 ──
    this.setupBackground()

    // FloorRenderer は背景より後に init() することで z-order が正しくなる
    this.floorRenderer = new FloorRenderer(this, this.registry_)
    this.floorRenderer.init()
    this.floorRenderer.drawGrid(INITIAL_GRID)

    this.inventoryPanel = new InventoryPanel(this, this.registry_)
    // メニューが開いている間は、背後の在庫リストがホイールで動かないようにする
    this.inventoryPanel.setScrollBlocked(() =>
      this.craftMenu?.isVisible() || this.purchaseMenu?.isVisible() || this.saveLoadMenu?.isVisible(),
    )
    this.hud = new HUD(this)
    this.tutorial = new Tutorial(this)
    this.characterStrip = new CharacterStrip(this)
    this.characterStrip.create()
    this.messageLog = new MessageLog(this)
    this.messageLog.create()

    this.craftMenu = new CraftMenu(
      this,
      this.craftingSystem,
      this.inventory,
      this.registry_,
      () => this.onCraftMenuClosed(),
    )
    this.slotPrompt = new SlotActionPrompt(
      this,
      this.shopService,
      this.inventory,
      (slotId, action) => this.onSlotAction(slotId, action),
    )
    this.purchaseMenu = new PurchaseMenu(
      this,
      this.registry_,
      this.economy,
      this.inventory,
      () => this.onPurchaseMenuClosed(),
    )

    this.saveLoadMenu = new SaveLoadMenu(
      this,
      (slot) => this.progress.getSlotMeta(slot),
      (slot) => {
        this.progress.save(slot)
        this.updateStatus(`スロット${slot + 1}に保存しました`)
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
        this.world.restore(data.soldCounts ?? {})
        this.world.setDay(data.currentTime.day)  // 現在地は日付から決まる（#2）
        this.timeManager.setTime(data.currentTime)

        // HUD・パネルを更新
        this.hud.updateMoney(data.money)
        this.hud.updateRevenue(data.totalRevenue, this.gameService.isInEndlessMode())
        this.hud.updateTime(data.currentTime.day, data.currentTime.hour, data.currentTime.minute)
        this.hud.updateLocation(this.world.getLocation())
        this.refreshInventoryPanel()
        this.updateStatus(`スロット${slot + 1}からロードしました`)
      },
    )

    this.inventory.setInitialStock(INITIAL_STOCK)

    this.hud.create()
    this.world.setDay(this.timeManager.getCurrentTime().day)
    this.hud.updateLocation(this.world.getLocation())
    this.inventoryPanel.onSelect(id => {
      this.selectedItemId = id
      this.currentRotation = 0
      this.slotPrompt.hide()
      this.updateStatus()
    })
    this.refreshInventoryPanel()

    this.setupUI()
    this.setupInput()
    this.setupEvents()
    this.updateStatus()

    // 右クリックのブラウザメニューを無効化
    this.input.mouse?.disableContextMenu()

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
    this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e)
    // 左パネル (x=0〜220, 全高)
    this.add.rectangle(110, 360, 220, 720, 0x16213e)
    // グリッドエリア下地 (CELL_SIZE は FloorRenderer 定数から自動計算)
    const gw = INITIAL_GRID.width * CELL_SIZE
    const gh = INITIAL_GRID.height * CELL_SIZE
    this.add.rectangle(
      GRID_ORIGIN_X + gw / 2,
      GRID_ORIGIN_Y + gh / 2,
      gw + 10,
      gh + 4,   // bottom = 5+300+302 = 607 < 610 (メッセージ境界に収める)
      0x0d2340,
    )
    // 右パネル (x=1090〜1280)
    this.add.rectangle(1185, 305, 190, 610, 0x13122a)
      .setStrokeStyle(1, 0x2a2a4a)
    // キャラ絵プレースホルダー（HUD下〜ボタン上: y=135〜355）
    this.add.rectangle(1185, 245, 170, 220, 0x0d1530)
      .setStrokeStyle(1, 0x223355).setDepth(1)
    this.add.text(1185, 245, 'キャラ絵\n(準備中)', {
      fontSize: '13px', color: '#445577', align: 'center',
    }).setOrigin(0.5).setDepth(2)
    // メッセージウィンドウ区切り（グリッド+キャラ+右パネルのみ。左パネルはアイテムリストが続く）
    const divGfx = this.add.graphics()
    divGfx.lineStyle(1, 0x334455, 0.6)
    divGfx.lineBetween(220, 609, 1280, 609)
  }

  private setupUI(): void {
    this.setupButtonPanel()
  }

  private setupButtonPanel(): void {
    const DEPTH = 10

    // Panel geometry — 右パネル (x=1090, width=190) 下段
    const R = 1278               // panel right edge
    const PW = 176               // panel width
    const L = R - PW             // panel left (= 1102)
    const IW = 40, IH = 38      // icon button size
    const AH = 42                // action button height
    const GAP = 5

    // Y positions (built from bottom up, within main area y=0〜609)
    const yAdv   = 609 - 16 - AH / 2
    const yCraft = yAdv   - AH / 2 - GAP - AH / 2
    const yPurch = yCraft - AH / 2 - GAP - AH / 2
    const yIcon  = yPurch - AH / 2 - GAP - IH / 2
    const iconGap = (PW - 4 * IW) / 3  // ~5px

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
      { emoji: '⚙️', tip: 'オプション', action: () => this.updateStatus('オプション: 準備中') },
      { emoji: '❓', tip: 'ヘルプ',    action: () => this.tutorial.show(() => this.updateStatus()) },
    ]
    iconDefs.forEach(({ emoji, tip, action }, i) => {
      const cx = L + IW / 2 + i * (IW + iconGap)
      const bg = this.add.rectangle(cx, yIcon, IW, IH, 0x2a2a4a)
        .setStrokeStyle(1, 0x555577).setInteractive({ useHandCursor: true }).setDepth(DEPTH)
      this.add.text(cx, yIcon, emoji, { fontSize: '18px' }).setOrigin(0.5).setDepth(DEPTH)
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

    makeAction(yPurch, '仕入れ', '🛒', 0x6a5a2a, 0x8a7a3a, () => this.openPurchaseMenu())
    makeAction(yCraft, 'クラフト', '🔨', 0x4a6a3a, 0x5a8a4a, () => this.openCraftMenu())

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
      if (!this.selectedItemId || this.craftMenu.isVisible() || this.purchaseMenu.isVisible() || this.saveLoadMenu.isVisible()) {
        this.floorRenderer.clearDragGhost()
        this.floorRenderer.clearPreview()
        return
      }

      // アイテムゴーストをカーソル中心に追従
      this.floorRenderer.drawDragGhost(this.selectedItemId, this.currentRotation, pointer.x, pointer.y)

      // 床アイテム移動中は外周破棄ゾーンを更新
      if (this.pendingMoveSlot) {
        const inZone = this.isOverDiscardZone(pointer.x, pointer.y)
        this.floorRenderer.drawDiscardZone(inZone)
        if (inZone) {
          this.messageLog.addMessage('離すとリストへ返します', 'info')
          this.floorRenderer.clearPreview()
          return
        }
      }

      // グリッド上ならプレビュー表示（中心基点で計算）
      if (this.floorRenderer.isOverGrid(pointer.x, pointer.y, INITIAL_GRID)) {
        const cell = this.floorRenderer.worldToGrid(pointer.x, pointer.y)
        if (cell) {
          const placementCell = this.calcPlacementCell(cell)
          const valid = this.placementManager.canPlaceAt(this.selectedItemId, placementCell, this.currentRotation)
          this.floorRenderer.drawPreview(this.selectedItemId, placementCell, this.currentRotation, valid)
          return
        }
      }
      this.floorRenderer.clearPreview()
    })

    // ── pointerdown: 右クリック=回転 / 左クリック=空スロットプロンプト ──
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 右クリック → 時計回り回転
      if (pointer.rightButtonDown()) {
        if (this.selectedItemId) {
          this.currentRotation = ((this.currentRotation + 1) % 4) as Rotation
          this.updateStatus()
        }
        return
      }

      // 左クリック かつ アイテム未保持 → スロット操作
      if (!this.selectedItemId && !this.craftMenu.isVisible() && !this.purchaseMenu.isVisible() && !this.saveLoadMenu.isVisible()) {
        if (this.floorRenderer.isOverGrid(pointer.x, pointer.y, INITIAL_GRID)) {
          const cell = this.floorRenderer.worldToGrid(pointer.x, pointer.y)
          if (cell) {
            const slot = this.floorGrid.getSlotAt(cell)
            if (slot) {
              this.startMovingSlot(slot)
            } else {
              this.slotPrompt.hide()
            }
          }
        }
      }
    })

    // ── pointerup: 左ボタンを離したとき → 配置 / 破棄 / キャンセル ──
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.selectedItemId) return
      if (!pointer.leftButtonReleased()) return
      if (this.craftMenu.isVisible() || this.purchaseMenu.isVisible() || this.saveLoadMenu.isVisible()) return

      // 外周破棄ゾーン: 床アイテムをリストへ返す
      if (this.pendingMoveSlot && this.isOverDiscardZone(pointer.x, pointer.y)) {
        this.discardToInventory()
        return
      }

      if (this.floorRenderer.isOverGrid(pointer.x, pointer.y, INITIAL_GRID)) {
        const cell = this.floorRenderer.worldToGrid(pointer.x, pointer.y)
        if (cell) {
          this.tryPlaceItem(this.calcPlacementCell(cell))
          return
        }
      }
      // グリッド外で離した → キャンセル（元の位置に戻す）
      this.cancelDrag()
    })

    // ⚠ テスト用（#43）。いまの日を切り上げて翌朝へ飛ばす。撤去は #51 がまとめて扱う。
    //    skipMinutes は TIME_MINUTE_PASSED を出さない＝飛ばした分に客は来ない（#25）
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.N).on('down', () => {
      if (this.craftMenu.isVisible() || this.purchaseMenu.isVisible() || this.saveLoadMenu.isVisible()) return
      this.timeManager.skipMinutes(this.timeManager.minutesUntilEndOfDay())
      const t = this.timeManager.getCurrentTime()
      this.hud.updateTime(t.day, t.hour, t.minute)
      this.updateStatus(`[テスト用] Day ${t.day} へ飛ばしました`)
    })

    // ESC: メニューを閉じる（ドラッグキャンセルは左ボタン離しで行う）
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.on('down', () => {
      if (this.saveLoadMenu.isVisible()) { this.saveLoadMenu.close(); return }
      if (this.craftMenu.isVisible()) { this.craftMenu.close(); return }
      if (this.purchaseMenu.isVisible()) { this.purchaseMenu.close(); return }
      this.slotPrompt.hide()
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

  private isOverDiscardZone(x: number, y: number): boolean {
    const { width, height } = this.scale
    return x < DISCARD_MARGIN || x > width - DISCARD_MARGIN ||
           y < DISCARD_MARGIN || y > height - DISCARD_MARGIN
  }

  private cancelDrag(): void {
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

  private discardToInventory(): void {
    if (!this.pendingMoveSlot) return
    const { itemId, quantity } = this.pendingMoveSlot
    if (quantity > 0) {
      this.inventory.add(itemId, quantity)
      this.refreshInventoryPanel()
      this.updateStatus(`リストへ返しました`)
    } else {
      this.updateStatus(`撤去しました`)
    }
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
    this.slotPrompt.hide()
    this.floorRenderer.drawDiscardZone(false)
    this.updateStatus()
  }

  private setupEvents(): void {
    EventBus.on(GameEvents.TIME_MINUTE_PASSED, (time: unknown) => {
      const t = time as GameTime
      this.hud.updateTime(t.day, t.hour, t.minute)
      // ⚠ 航海中は店が開かない（#4）。営業時間帯かどうかとは別の条件
      this.gameService.onMinutePassed(Math.random, this.timeManager.isOpen() && !this.world.isAtSea())
      this.hud.updateRevenue(this.economy.getTotalRevenue(), this.gameService.isInEndlessMode())
    })

    // 日が変わると現在地が動く（#2）。10日寄港して1日航海する
    EventBus.on(GameEvents.TIME_DAY_CHANGED, (time: unknown) => {
      this.onDayChanged((time as GameTime).day)
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

    EventBus.on(GameEvents.ECONOMY_MONEY_CHANGED, (money: unknown) => {
      this.hud.updateMoney(money as number)
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
      const s = sale as { slotId: string; revenue: number }
      const slot = this.floorGrid.getAllSlots().find(sl => sl.id === s.slotId)
      if (slot) {
        this.floorRenderer.refreshSlot(slot)
        this.showSalePopup(s.revenue, slot)
        const item = this.registry_.getItem(slot.itemId)
        this.messageLog.addMessage(`${item.display.name}が売れた！ +¥${s.revenue}`, 'sale')
      }
    })

    EventBus.on(GameEvents.CRAFTING_COMPLETED, (payload: unknown) => {
      const { recipeId, times, quantity } = payload as CraftResult
      const recipe = this.registry_.getRecipe(recipeId)
      this.messageLog.addMessage(
        `${recipe.display.name} ×${times}回 完了！ ${quantity}個入手（${recipe.durationMinutes * times}分）`,
        'event',
      )
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
   * 島が変わった／航海に出た／着いた、はそのあとの表示の話。
   */
  private onDayChanged(day: number): void {
    const before = this.world.getLocation()
    this.world.setDay(day)
    const after = this.world.getLocation()
    this.hud.updateLocation(after)

    if (!before.atSea && after.atSea) {
      this.messageLog.addMessage(`${after.island}島を出た。${after.next}島へ向かう`, 'event')
    } else if (before.atSea && !after.atSea) {
      this.messageLog.addMessage(`${after.island}島に着いた`, 'event')
    }
    // 島が変われば商人の品揃えも需要も変わるので、開いているメニューは閉じる
    if (before.island !== after.island && this.purchaseMenu.isVisible()) this.purchaseMenu.close()
  }

  private tryPlaceItem(cell: GridCell): void {
    if (!this.selectedItemId) return
    const isMoving = this.pendingMoveSlot !== null
    const quantity = isMoving
      ? this.pendingMoveSlot!.quantity
      : this.inventory.getQuantity(this.selectedItemId)

    if (!isMoving && quantity <= 0) {
      this.updateStatus('在庫がありません')
      return
    }

    const slot = this.placementManager.tryPlace(this.selectedItemId, cell, this.currentRotation, quantity)
    if (!slot) {
      this.updateStatus('配置できません')
      if (isMoving) {
        this.floorGrid.place(this.pendingMoveSlot!)
        this.floorRenderer.drawSlot(this.pendingMoveSlot!)
        this.pendingMoveSlot = null
        this.selectedItemId = null
        this.inventoryPanel.clearSelection()
        this.floorRenderer.clearPreview()
        this.floorRenderer.clearDragGhost()
      }
      return
    }

    if (!isMoving) {
      this.inventory.remove(this.selectedItemId, quantity)
      this.inventoryPanel.updateQuantity(this.selectedItemId, 0)
    }

    this.pendingMoveSlot = null
    this.selectedItemId = null
    this.inventoryPanel.clearSelection()
    this.floorRenderer.clearPreview()
    this.floorRenderer.clearDragGhost()
    this.floorRenderer.clearDiscardZone()
    this.updateStatus()
  }

  private onSlotAction(slotId: string, action: 'restock' | 'remove'): void {
    if (action === 'restock') {
      const slot = this.floorGrid.getAllSlots().find(s => s.id === slotId)
      if (slot) this.floorRenderer.refreshSlot(slot)
      this.refreshInventoryPanel()
    } else {
      this.floorRenderer.clearSlot(slotId)
    }
    this.updateStatus()
  }

  private openCraftMenu(): void {
    if (this.timeManager.isAdvancing()) {
      this.timeManager.stopAdvancing()
      this.advanceBtnLabel.setText('▶  進める'); this.advanceBtnBg.setFillStyle(0x4a4a8a)
      
    }
    this.craftMenu.open()
  }

  private onCraftMenuClosed(): void {
    this.refreshInventoryPanel()
    this.updateStatus()
  }

  private openPurchaseMenu(): void {
    if (this.timeManager.isAdvancing()) {
      this.timeManager.stopAdvancing()
      this.advanceBtnLabel.setText('▶  進める'); this.advanceBtnBg.setFillStyle(0x4a4a8a)
      
    }
    // 航海中は島の商人がいない（#4）
    if (this.world.isAtSea()) {
      this.updateStatus(`航海中です。${this.world.getLocation().next}島に着くまで仕入れられません`)
      return
    }
    // 固定の材料一覧ではなく、**その島の商人が並べる品**（#30）。
    // tier と累計販売数で解禁されるので、売るほど品揃えが増える
    this.purchaseMenu.open(
      stockedByIslandMerchant(this.registry_.getAllItems(), this.world.getState()).slice(),
      this.world.getIsland(),
    )
  }

  private onPurchaseMenuClosed(): void {
    this.refreshInventoryPanel()
    this.updateStatus()
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
    const items = this.registry_.getAllItems()
    const stock = this.inventory.getAllStock()
    const quantities: Record<string, number> = {}
    for (const item of items) {
      quantities[item.id] = stock[item.id] ?? 0
    }
    this.inventoryPanel.render(items, quantities)
  }

  private showSalePopup(revenue: number, slot: DisplaySlot): void {
    const item = this.registry_.getItem(slot.itemId)
    const offsets = this.registry_.shapeToOffsets(this.registry_.getRotatedShape(item.shape, slot.rotation))
    if (offsets.length === 0) return
    const cx = offsets.reduce((s, o) => s + o.x, 0) / offsets.length
    const cy = offsets.reduce((s, o) => s + o.y, 0) / offsets.length
    const px = GRID_ORIGIN_X + (slot.position.x + cx + 0.5) * CELL_SIZE
    const py = GRID_ORIGIN_Y + (slot.position.y + cy) * CELL_SIZE
    const popup = this.add.text(px, py, `+¥${revenue}`, {
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
    this.add.text(width / 2, height / 2 - 80, '🎉 目標達成!', {
      fontSize: '52px', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201)
    this.add.text(width / 2, height / 2, `累計売上 ¥${this.economy.getTotalRevenue().toLocaleString()}`, {
      fontSize: '26px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(201)

    const endlessBtn = this.add.text(width / 2, height / 2 + 90, 'エンドレスモードへ', {
      fontSize: '22px', color: '#ffffff', backgroundColor: '#4a4a8a', padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true })
    endlessBtn.on('pointerdown', () => {
      overlay.destroy(); endlessBtn.destroy()
      this.gameService.enterEndlessMode()
      this.progress.setEndlessMode(true)
      this.updateStatus('エンドレスモード開始!')
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

  private onAdvancePressed(): void {
    if (this.craftMenu.isVisible() || this.purchaseMenu.isVisible() || this.saveLoadMenu.isVisible()) return
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
