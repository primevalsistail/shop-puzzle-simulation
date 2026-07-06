# サービス層定義

サービスはコンポーネント間の複雑な連携を調整するオーケストレーター層です。
コンポーネントはビジネスロジックを担い、サービスはその組み合わせを担います。

---

## EventBus

**目的**: コンポーネント間の疎結合な非同期通信

**責務**:
- イベントの発行・購読
- 重要なゲームイベントを関心のあるコンポーネントに通知

**発行イベント一覧**:

| イベント名 | 発行元 | 購読先 | ペイロード |
|-----------|--------|--------|-----------|
| `time:minute-passed` | TimeManager | GameService, CustomerSimulator | `GameTime` |
| `time:advance-started` | TimeManager | UIManager | - |
| `time:advance-stopped` | TimeManager | UIManager | - |
| `economy:money-changed` | EconomyManager | UIManager, GameProgress | `{ money, delta }` |
| `economy:purchase-failed` | EconomyManager | UIManager | `{ reason }` |
| `floor:slot-emptied` | ShopService | UIManager | `{ slotId }` |
| `floor:slot-placed` | ShopService | AdjacencyEngine, UIManager | `{ slot }` |
| `floor:slot-removed` | ShopService | AdjacencyEngine, UIManager | `{ slotId }` |
| `crafting:started` | CraftingSystem | UIManager, TimeManager | `{ job }` |
| `crafting:completed` | CraftingSystem | UIManager, Inventory | `{ job, result }` |
| `progress:goal-complete` | GameProgress | UIManager, GameService | `{ goalAmount }` |
| `progress:game-over` | GameProgress | UIManager, GameService | - |

---

## GameService

**目的**: ゲームのメインループと時間進行の統括オーケストレーション

**責務**:
- 「進める」ボタン押下時の処理フロー制御
- 各minuteTickでの顧客シミュレーション→販売処理→UI更新の連携
- ゴール達成・ゲームオーバーのチェックと画面遷移
- ゲーム開始・ロード時の初期化

**主要フロー**:

```
プレイヤーが「進める」押下
  └─ TimeManager.advance()
       └─ [1分ごとにtick]
            ├─ 現在のFloorGrid状態を取得
            ├─ AdjacencyEngine.calculateAllBonuses(slots)
            ├─ CustomerSimulator.simulateMinute(slots, bonuses)
            ├─ 各SaleResultを処理:
            │    ├─ FloorGrid のslot.quantityを減算
            │    ├─ EconomyManager.earn(revenue)
            │    ├─ GameProgress.addRevenue(revenue)
            │    └─ quantity===0 なら EventBus.emit('floor:slot-emptied')
            └─ GameProgress.checkGoalComplete() / checkGameOver()
```

**メソッド**:

```typescript
startNewGame(): void
  // 新規ゲームを初期化する

loadGame(): boolean
  // セーブデータをロードしてゲームを復元する（なければ false）

onAdvancePressed(): void
  // 「進める」ボタン処理のエントリーポイント

onMinuteTick(time: GameTime): void
  // 1分tick処理（顧客シミュ→売上処理→ゴールチェック）

onGoalComplete(): void
  // ゴール達成時の処理（エンディング画面 → エンドレス移行）

onGameOver(): void
  // ゲームオーバー時の処理（ゲームオーバー画面表示）
```

---

## ShopService

**目的**: 店舗状態（フロア + 倉庫）に関連する操作のオーケストレーション

**責務**:
- フロアへのアイテム配置（Inventory減算 + FloorGrid配置）
- 陳列スペースへの補充（Inventory減算 + slot.quantity加算）
- 陳列スペースの撤去（FloorGrid解放）
- フロア全体の状態取得

**主要フロー**:

```
プレイヤーがアイテムを陳列スペースに配置
  ├─ Inventory.hasRoomForType(itemId) 確認
  ├─ FloorGrid.canPlace(shape, position, rotation) 確認
  ├─ Inventory.remove(itemId, initialQty)
  └─ FloorGrid.place(newDisplaySlot)
       └─ EventBus.emit('floor:slot-placed', slot)

プレイヤーが空スペースに「補充」を選択
  ├─ Inventory.getStock(itemId) 確認
  ├─ Inventory.remove(itemId, qty)
  └─ slot.quantity += qty

プレイヤーが空スペースに「撤去」を選択
  └─ FloorGrid.remove(slotId)
       └─ EventBus.emit('floor:slot-removed', slotId)
```

**メソッド**:

```typescript
placeItemOnFloor(
  itemId: string,
  position: GridCell,
  rotation: Rotation,
  initialQty: number
): boolean
  // アイテムをフロアに陳列する（Inventory消費 + FloorGrid配置）

restockSlot(slotId: string, qty: number): boolean
  // 陳列スペースに在庫を補充する（Inventory消費）

removeSlot(slotId: string): void
  // 陳列スペースを撤去してグリッドを解放する

getShopState(): ShopState
  // フロア全スロットと倉庫在庫をまとめて返す

moveItemToInventory(slotId: string): void
  // フロアのアイテムを倉庫に戻す（リアレンジ用）
```

---

## 型定義

```typescript
interface ShopState {
  slots: DisplaySlot[]
  inventory: Map<string, number>
  gridSize: GridSize
}
```
