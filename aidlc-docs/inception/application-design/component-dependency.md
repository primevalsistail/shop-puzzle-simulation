# コンポーネント依存関係

## 依存関係マトリクス

| コンポーネント | 依存先 | 通信方式 |
|--------------|--------|---------|
| GameService | TimeManager, CustomerSimulator, EconomyManager, GameProgress, FloorGrid, AdjacencyEngine, UIManager | 直接呼び出し |
| ShopService | FloorGrid, Inventory, PlacementManager | 直接呼び出し |
| PlacementManager | FloorGrid, ItemRegistry | 直接呼び出し |
| AdjacencyEngine | ItemRegistry | 直接呼び出し |
| CraftingSystem | Inventory, ItemRegistry | 直接呼び出し |
| EconomyManager | Inventory | 直接呼び出し |
| CustomerSimulator | ItemRegistry | 直接呼び出し |
| UIManager | 各コンポーネント（読み取り） | EventBus購読 + 直接呼び出し |
| GameProgress | - | EventBus発行のみ |
| TimeManager | - | EventBus発行のみ |
| FloorGrid | - | - |
| Inventory | - | - |
| ItemRegistry | - | - |

## レイヤー構成

```
┌──────────────────────────────────────────────────┐
│                   UI Layer                        │
│  UIManager                                        │
└──────────────────────┬───────────────────────────┘
                       │ EventBus購読 / 直接読み取り
┌──────────────────────▼───────────────────────────┐
│               Service Layer                       │
│  GameService          ShopService                 │
└──────┬───────────────────────┬───────────────────┘
       │ 直接呼び出し           │ 直接呼び出し
┌──────▼───────────────────────▼───────────────────┐
│              Component Layer                      │
│  TimeManager    FloorGrid    Inventory            │
│  AdjacencyEngine  PlacementManager               │
│  CraftingSystem   CustomerSimulator              │
│  EconomyManager   GameProgress   ItemRegistry    │
└──────────────────────────────────────────────────┘
                       │
              EventBus（横断的通信）
```

## データフロー図

### 時間進行フロー（「進める」押下）

```
Player
  │ 「進める」押下
  ▼
GameService.onAdvancePressed()
  │
  ├─► TimeManager.advance()
  │     │ [1分ごとに]
  │     └─► EventBus.emit('time:minute-passed')
  │               │
  ▼               ▼
GameService.onMinuteTick()
  │
  ├─► FloorGrid.getAllSlots()           → slots[]
  ├─► AdjacencyEngine.calculateAllBonuses(slots) → bonuses
  ├─► CustomerSimulator.simulateMinute(slots, bonuses) → results[]
  │
  └─► [各SaleResultに対して]
        ├─► slot.quantity -= qtySold
        ├─► EconomyManager.earn(revenue)
        │     └─► EventBus.emit('economy:money-changed')
        ├─► GameProgress.addRevenue(revenue)
        └─► [quantity===0 なら]
              └─► EventBus.emit('floor:slot-emptied')
```

### アイテム陳列フロー

```
Player（ドラッグ操作）
  │
  ▼
PlacementManager.startDrag(itemId)
  │
  ├─► ItemRegistry.getItem(itemId)     → shape data
  └─► [ドロップ時]
        └─► ShopService.placeItemOnFloor(itemId, position, rotation, qty)
              ├─► Inventory.hasRoomForType(itemId)
              ├─► Inventory.remove(itemId, qty)
              └─► FloorGrid.place(newSlot)
                    └─► EventBus.emit('floor:slot-placed')
                          └─► AdjacencyEngine（ボーナス再計算）
                          └─► UIManager（ハイライト更新）
```

### クラフトフロー

```
Player（クラフトメニュー操作）
  │
  ▼
UIManager.openCraftMenu()
  │ [レシピ選択]
  ▼
CraftingSystem.canCraft(recipeId)
  └─► Inventory.getStock(each material)
  │
  ▼ [OKなら]
CraftingSystem.startCraft(recipeId)
  ├─► Inventory.remove(各素材)
  └─► EventBus.emit('crafting:started')
        └─► TimeManager: クラフト中フラグON（時間停止）

[クラフト完了時]
CraftingSystem.completeCraft(job)
  ├─► Inventory.add(outputItemId, qty)
  └─► EventBus.emit('crafting:completed')
        └─► TimeManager: クラフト中フラグOFF
        └─► UIManager: 完了通知
```

### 空スロット処理フロー

```
[量が0になったとき]
EventBus.emit('floor:slot-emptied', { slotId })
  └─► UIManager.showSlotActionPrompt(slotId)
        │
        ├─ 「補充」選択
        │    └─► ShopService.restockSlot(slotId, qty)
        │          ├─► Inventory.remove(itemId, qty)
        │          └─► slot.quantity += qty
        │
        └─ 「撤去」選択
             └─► ShopService.removeSlot(slotId)
                   └─► FloorGrid.remove(slotId)
                         └─► EventBus.emit('floor:slot-removed')
```

## 循環依存の防止

以下のルールで循環依存を避けます：
- **ItemRegistry** は他のコンポーネントに依存しない（純粋データ層）
- **FloorGrid / Inventory** は他のコンポーネントに依存しない（純粋状態層）
- **EventBus** は全コンポーネントから利用可能（共通インフラ）
- **UIManager** はイベント購読で状態変化を受け取り、コンポーネントを直接変更しない
- **Service層** だけが複数のコンポーネントをまたぐ操作を行う
