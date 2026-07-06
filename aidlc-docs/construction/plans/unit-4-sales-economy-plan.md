# Unit 4: Sales & Economy — コード生成プラン

## ユニット概要
- **目的**: 顧客シミュレーション・売上処理・ゲームループ統合
- **依存**: Unit 3 (Inventory, CraftingSystem, FloorGrid, AdjacencyEngine)

## 設計
- 「進める」→ 1分単位で顧客シミュレーション
- 顧客が来店: アイテムごとに購入確率判定 (baseRate * adjacencyMultiplier)
- 売れたら FloorSlot.quantity-- → FLOOR_SLOT_EMPTIED
- EconomyManager が資金を管理
- 空スロット: SlotActionPrompt で補充/撤去を選べる

## 生成ファイル
```
src/
├── components/
│   ├── simulation/
│   │   └── CustomerSimulator.ts
│   └── economy/
│       └── EconomyManager.ts
├── services/
│   ├── GameService.ts
│   └── ShopService.ts
└── ui/
    └── SlotActionPrompt.ts
scenes/GameScene.ts (更新)
```

## 実行ステップ
- [ ] Step 1: components/economy/EconomyManager.ts
- [ ] Step 2: components/simulation/CustomerSimulator.ts
- [ ] Step 3: services/ShopService.ts
- [ ] Step 4: services/GameService.ts
- [ ] Step 5: ui/SlotActionPrompt.ts
- [ ] Step 6: scenes/GameScene.ts 更新
- [ ] Step 7: テスト生成・実行
