# コンポーネントメソッド定義

※ 詳細なビジネスルール（判定ロジック・計算式など）はCONSTRUCTION フェーズのFunctional Designで定義します。

---

## GameEngine

```typescript
initialize(config: GameConfig): void
  // Phaser.Game を生成しシーンを登録する

getScene<T extends Phaser.Scene>(key: string): T
  // 指定キーのシーンインスタンスを返す

switchScene(key: string, data?: object): void
  // 指定シーンに切り替える（現在のシーンを停止）
```

---

## TimeManager

```typescript
advance(): void
  // プレイヤーが「進める」を押したときに呼ばれる
  // 高速で1分ずつtickを発行する

tick(): void
  // 1分進める。EventBus に 'time:minute-passed' を発行

pause(): void
  // 時間進行を停止（クラフト中など）

resume(): void
  // 時間進行を再開

getCurrentTime(): GameTime
  // 現在のゲーム内時刻 { day, hour, minute } を返す

isCrafting(): boolean
  // 現在クラフト中（時間停止中）かどうかを返す
```

---

## FloorGrid

```typescript
canPlace(shape: number[][], position: GridCell, rotation: Rotation): boolean
  // 指定形状・位置・回転でアイテムを配置できるか検証する
  // グリッド範囲内かつセルが空きかを確認

place(slot: DisplaySlot): void
  // DisplaySlot をグリッドに配置する
  // 対象セルを占有済みとしてマークする

remove(slotId: string): void
  // 指定IDのDisplaySlot を除去し、セルを解放する

getSlotAt(cell: GridCell): DisplaySlot | null
  // 指定セルのDisplaySlot を返す（なければnull）

getAllSlots(): DisplaySlot[]
  // 全DisplaySlot のリストを返す

getEmptySlots(): DisplaySlot[]
  // quantity === 0 の空陳列スペース一覧を返す

getGridSize(): GridSize
  // 現在の解放済みグリッドサイズ { width, height } を返す

expandGrid(newSize: GridSize): void
  // グリッドサイズを拡張する（アンロック時）
```

---

## PlacementManager

```typescript
startDrag(itemId: string, sourceType: 'inventory' | 'floor'): void
  // ドラッグ操作を開始する

rotate(): void
  // ドラッグ中のアイテムを90°回転する

cancelDrag(): void
  // ドラッグ操作をキャンセルする

confirmPlacement(targetCell: GridCell): boolean
  // 指定セルへの配置を確定する
  // 成功時 true、失敗時 false を返す

renderPreview(targetCell: GridCell): void
  // 配置プレビューを描画する（配置可: 緑、不可: 赤）

getCurrentRotation(): Rotation
  // 現在のドラッグ中アイテムの回転状態を返す
```

---

## AdjacencyEngine

```typescript
calculateAllBonuses(slots: DisplaySlot[]): Map<string, AdjacencyBonus>
  // 全DisplaySlot の隣接ボーナスを計算して返す
  // key: slotId, value: AdjacencyBonus

getBonusForSlot(slotId: string, slots: DisplaySlot[]): AdjacencyBonus
  // 指定スロットの隣接ボーナスを返す

getAdjacentSlots(slot: DisplaySlot, allSlots: DisplaySlot[]): DisplaySlot[]
  // 指定スロットに隣接する（形状が接触している）スロット一覧を返す

generateHighlightData(bonuses: Map<string, AdjacencyBonus>): HighlightData[]
  // UI描画用のハイライトデータを生成する
```

---

## ItemRegistry

```typescript
getItem(itemId: string): ItemDef
  // アイテム定義を返す

getRecipe(recipeId: string): RecipeDef
  // レシピ定義を返す

getAllItems(): ItemDef[]
  // 全アイテム定義を返す

getUnlockedRecipes(): RecipeDef[]
  // 解放済みレシピ一覧を返す

unlockRecipe(recipeId: string): void
  // レシピをアンロックする

getRotatedShape(shape: number[][], rotation: Rotation): number[][]
  // 形状データを指定回転数だけ90°回転して返す

shapeToOffsets(shape: number[][]): GridCell[]
  // 2次元配列形状をオフセット座標リストに変換する（内部利用）
```

---

## CraftingSystem

```typescript
canCraft(recipeId: string): boolean
  // クラフト可能か確認する（素材充足・アンロック済みか）

startCraft(recipeId: string): CraftJob
  // クラフトを開始する（素材を消費、CraftJobを返す）

completeCraft(job: CraftJob): void
  // クラフトを完了する（成果物をInventoryに追加）

getActiveCraftJobs(): CraftJob[]
  // 進行中のクラフトジョブ一覧を返す

cancelCraft(jobId: string): void
  // クラフトをキャンセルする（素材を返却）
```

---

## Inventory

```typescript
add(itemId: string, qty: number): boolean
  // 在庫を追加する
  // 種類数上限・999上限を超える場合は false を返す

remove(itemId: string, qty: number): boolean
  // 在庫を減らす
  // 不足する場合は false を返す

getStock(itemId: string): number
  // 指定アイテムの在庫数を返す（なければ0）

getInventory(): Map<string, number>
  // 全在庫 {itemId: qty} を返す

getTypeCount(): number
  // 現在扱っている商品種類数を返す

getTypeLimit(): number
  // 種類数の上限を返す

hasRoomForType(itemId: string): boolean
  // 新しい種類を追加できるか（既存 or 上限未達）を返す

expandTypeLimit(amount: number): void
  // 種類数上限を拡張する（アップグレード時）
```

---

## EconomyManager

```typescript
getMoney(): number
  // 現在の所持金を返す

spend(amount: number): boolean
  // 支払いを行う
  // 残高不足の場合は false を返す

earn(amount: number): void
  // 売上を加算する
  // EventBus に 'economy:money-changed' を発行

getTotalRevenue(): number
  // 累計売上を返す

purchaseItems(itemId: string, qty: number): boolean
  // アイテムを仕入れる（コスト支払い + Inventory.add）
  // 残高不足 or 在庫上限の場合は false
```

---

## CustomerSimulator

```typescript
simulateMinute(slots: DisplaySlot[], bonuses: Map<string, AdjacencyBonus>): SaleResult[]
  // 1分間の顧客来店・購買をシミュレートする
  // 売れた商品の一覧 SaleResult[] を返す

generateCustomerCount(time: GameTime): number
  // 時刻に応じた来店顧客数を生成する（ランダム）

decidePurchase(
  customer: Customer,
  slot: DisplaySlot,
  bonus: AdjacencyBonus
): boolean
  // 顧客が商品を購入するか判定する
```

---

## GameProgress

```typescript
addRevenue(amount: number): void
  // 累計売上を加算し、ゴール達成を確認する

getTotalRevenue(): number
  // 累計売上を返す

getGoalAmount(): number
  // 現在のゴール金額を返す（初回: 100万円）

checkGoalComplete(): boolean
  // ゴール達成済みかを返す

isEndlessMode(): boolean
  // エンドレスモードかどうかを返す

enableEndlessMode(): void
  // エンドレスモードに移行する

checkGameOver(): boolean
  // ゲームオーバー条件（資金ゼロ）を確認する

unlockFeature(featureId: string): void
  // 機能・エリアをアンロックする

getUnlockedFeatures(): string[]
  // アンロック済み機能一覧を返す

save(): void
  // ゲーム状態をLocalStorageに保存する

load(): SaveData | null
  // LocalStorageからゲーム状態を読み込む（なければnull）
```

---

## UIManager

```typescript
updateHUD(state: HUDState): void
  // HUD（資金・累計売上・目標残り）を更新する

openCraftMenu(): void
  // クラフトメニューモーダルを開く

closeCraftMenu(): void
  // クラフトメニューを閉じる

openPurchaseMenu(): void
  // 仕入れメニューモーダルを開く

closePurchaseMenu(): void
  // 仕入れメニューを閉じる

showAdjacencyHighlights(highlights: HighlightData[]): void
  // 隣接ボーナスのハイライトを描画する

clearHighlights(): void
  // ハイライトをクリアする

showSlotActionPrompt(slotId: string): void
  // 空になった陳列スペースに「補充 / 撤去」プロンプトを表示する

showNotification(message: string, type: 'info' | 'success' | 'warning'): void
  // 一時的な通知を表示する

showEndingScreen(): void
  // エンディング画面を表示する

showGameOverScreen(): void
  // ゲームオーバー画面を表示する
```

---

## 型定義（共通）

```typescript
type GridCell = { x: number; y: number }
type GridSize = { width: number; height: number }
type Rotation = 0 | 1 | 2 | 3  // 0=0°, 1=90°, 2=180°, 3=270°
type GameTime = { day: number; hour: number; minute: number }

interface DisplaySlot {
  id: string
  itemId: string
  shape: number[][]
  position: GridCell   // 左上の基準点
  rotation: Rotation
  quantity: number     // 0〜999
}

interface AdjacencyBonus {
  slotId: string
  bonusType: 'sales_rate' | 'customer_attraction' | 'price_up'
  multiplier: number
  sourceSlotIds: string[]
}

interface SaleResult {
  slotId: string
  itemId: string
  qtySold: number
  revenue: number
}

interface CraftJob {
  id: string
  recipeId: string
  startTime: GameTime
  completionTime: GameTime
}

interface HUDState {
  money: number
  totalRevenue: number
  goalAmount: number
  day: number
}

interface SaveData {
  money: number
  totalRevenue: number
  inventory: Record<string, number>
  floor: DisplaySlot[]
  unlockedFeatures: string[]
  unlockedRecipes: string[]
  currentTime: GameTime
  isEndlessMode: boolean
}
```
