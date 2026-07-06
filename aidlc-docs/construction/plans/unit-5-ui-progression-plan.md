# Unit 5: UI & Progression — コード生成プラン

## ユニット概要
- **目的**: HUD・全メニュー・ゲーム進行管理・セーブ/ロード
- **依存**: Unit 4 (GameService, EconomyManager, ShopService)

## 生成ファイル
```
src/
├── components/progress/
│   └── GameProgress.ts      (セーブ/ロード・アンロック)
├── ui/
│   ├── HUD.ts               (資金・目標・日付の常時表示)
│   ├── PurchaseMenu.ts      (素材仕入れメニュー)
│   └── Tutorial.ts          (初回チュートリアル)
└── scenes/GameScene.ts      (最終統合)
```

## 実行ステップ
- [ ] Step 1: components/progress/GameProgress.ts
- [ ] Step 2: ui/HUD.ts
- [ ] Step 3: ui/PurchaseMenu.ts
- [ ] Step 4: ui/Tutorial.ts
- [ ] Step 5: scenes/GameScene.ts 最終更新
- [ ] Step 6: テスト生成・実行
