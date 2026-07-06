# Unit 3: Items, Crafting & Inventory — コード生成プラン

## ユニット概要
- **目的**: 全アイテムデータ・クラフトシステム・倉庫管理
- **依存**: Unit 2 (FloorGrid, ItemRegistry, EventBus, TimeManager)

## 生成ファイル一覧
```
src/
├── data/
│   ├── items.ts          (更新: 素材5種追加・隣接ボーナス付与・itemType追加)
│   └── recipes.ts        (新規: レシピ定義)
├── components/
│   ├── items/
│   │   ├── ItemRegistry.ts   (更新: itemType対応)
│   │   └── CraftingSystem.ts (新規: クラフトロジック)
│   └── economy/
│       └── Inventory.ts      (新規: 倉庫在庫管理)
├── ui/
│   └── CraftMenu.ts          (新規: クラフトメニューUI)
└── scenes/
    └── GameScene.ts          (更新: クラフト・在庫統合)
```

## 実行ステップ
- [ ] Step 1: ItemRegistry.ts 拡張 (itemType追加)
- [ ] Step 2: data/items.ts 完全版 (素材5+製品8, 隣接ボーナス)
- [ ] Step 3: data/recipes.ts (5レシピ)
- [ ] Step 4: components/economy/Inventory.ts
- [ ] Step 5: components/items/CraftingSystem.ts
- [ ] Step 6: ui/CraftMenu.ts
- [ ] Step 7: scenes/GameScene.ts 更新
- [ ] Step 8: テスト生成・実行
