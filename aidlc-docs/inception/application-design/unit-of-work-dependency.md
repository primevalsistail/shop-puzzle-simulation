# ユニット依存関係

## 依存マトリクス

| ユニット | 依存先ユニット | 依存の理由 |
|---------|-------------|-----------|
| Unit 1: Foundation | なし | 独立した基盤 |
| Unit 2: Grid & Placement | Unit 1 | Phaser.js Scene・EventBus が必要 |
| Unit 3: Items, Crafting & Inventory | Unit 1, Unit 2 | EventBus・FloorGrid との連携が必要 |
| Unit 4: Sales & Economy | Unit 1, Unit 2, Unit 3 | 全システムを統合して初めてゲームループが成立 |
| Unit 5: UI & Progression | Unit 1〜4 すべて | 全状態を読み取ってUIに反映するため |

## 実装順序グラフ

```
Unit 1: Foundation
  ↓ 必須
Unit 2: Grid & Placement
  ↓ 必須
Unit 3: Items, Crafting & Inventory
  ↓ 必須
Unit 4: Sales & Economy
  ↓ 必須
Unit 5: UI & Progression
```

## ユニット間インターフェース

### Unit 1 → Unit 2 が提供するもの
- `EventBus` インスタンス（シングルトン）
- Phaser `Scene` 基底クラス・`GameScene`
- `GameTime` 型定義

### Unit 2 → Unit 3 が提供するもの
- `FloorGrid` — スロット配置・取得API
- `AdjacencyEngine` — ボーナス計算API
- `DisplaySlot` 型定義
- `ItemRegistry`（形状データ版） — Unit 3で完全版に拡張

### Unit 3 → Unit 4 が提供するもの
- `ItemRegistry`（完全版） — 全アイテム・レシピ・隣接相性
- `Inventory` — 在庫管理API
- `CraftingSystem` — クラフトAPI
- `ItemDef`, `RecipeDef`, `AdjacencyRule` 型定義

### Unit 4 → Unit 5 が提供するもの
- `GameService` — `onAdvancePressed()` などゲームループAPI
- `ShopService` — 店舗操作API
- `EconomyManager` — 資金・売上API
- `SaleResult`, `ShopState` 型定義

## ビルド上の注意

- 各ユニットは TypeScript のコンパイルが通る状態で完了とする
- `ItemRegistry` は Unit 2 でスタブ実装し、Unit 3 で完全実装に差し替える
- `UIManager` は Unit 2〜4 の進行に合わせて段階的に機能追加する（Unit 5 で完成）
