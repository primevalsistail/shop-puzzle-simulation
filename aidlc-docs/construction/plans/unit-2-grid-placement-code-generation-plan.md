# Unit 2: Grid & Placement — コード生成プラン

## ユニット概要
- **目的**: 店舗フロアのグリッドシステムとアイテム配置のコアメカニクス
- **依存**: Unit 1 (EventBus, types)
- **スキップしたステージ**: Functional Design (ロジックはプラン内に記述)、NFR Requirements/Design、Infrastructure Design

## 対象シナリオ
- 6×5グリッドの表示
- アイテムのクリック選択 → グリッドへの配置
- 回転（Rキー）
- 配置不可エリアの赤ハイライト
- 隣接検出の視覚フィードバック

## 設計決定
- **操作方式**: クリック選択 → グリッドをクリックで配置（ドラッグより安定）
- **セルサイズ**: 64px
- **グリッド原点**: x=240, y=80
- **インベントリパネル**: 左側(x=20〜200)にサンプルアイテム表示

## 生成ファイル一覧
```
src/
├── data/items.ts
├── components/
│   ├── items/ItemRegistry.ts
│   └── floor/
│       ├── FloorGrid.ts
│       ├── AdjacencyEngine.ts
│       └── PlacementManager.ts
├── ui/
│   ├── FloorRenderer.ts
│   └── InventoryPanel.ts
├── scenes/GameScene.ts (更新)
└── tests: FloorGrid, ItemRegistry, PlacementManager, AdjacencyEngine

## 実行ステップ
- [ ] Step 1: src/data/items.ts（サンプルアイテム5種）
- [ ] Step 2: src/components/items/ItemRegistry.ts（形状ユーティリティ含む）
- [ ] Step 3: src/components/floor/FloorGrid.ts
- [ ] Step 4: src/components/floor/AdjacencyEngine.ts
- [ ] Step 5: src/components/floor/PlacementManager.ts
- [ ] Step 6: src/ui/FloorRenderer.ts（Phaserグリッド描画）
- [ ] Step 7: src/ui/InventoryPanel.ts（Phaserアイテムパレット）
- [ ] Step 8: src/scenes/GameScene.ts（全統合・操作実装）
- [ ] Step 9: テスト生成・実行
