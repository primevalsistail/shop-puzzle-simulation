# ユニット・オブ・ワーク プラン

## 実行ステップ
- [x] Application Designのコンポーネントを分析
- [ ] ユニット分解の提案・確認
- [ ] unit-of-work.md 生成
- [ ] unit-of-work-dependency.md 生成
- [ ] unit-of-work-story-map.md 生成

---

## 提案するユニット構成

Application Designの12コンポーネントを以下の5ユニットに分解します。
各ユニットは前のユニットの成果物の上に積み上がる順序で設計しています。

```
Unit 1: Foundation
  └─► Unit 2: Grid & Placement
        └─► Unit 3: Items, Crafting & Inventory
              └─► Unit 4: Sales & Economy
                    └─► Unit 5: UI & Progression
```

| ユニット | 含むコンポーネント | 独立して動作確認できる内容 |
|---------|-----------------|----------------------|
| **Unit 1: Foundation** | GameEngine, EventBus, TimeManager | Phaser.jsが起動し、「進める」で時間が進む |
| **Unit 2: Grid & Placement** | FloorGrid, PlacementManager, AdjacencyEngine, ItemRegistry（形状データのみ） | グリッドにアイテムを配置・回転できる、隣接ハイライト表示 |
| **Unit 3: Items, Crafting & Inventory** | ItemRegistry（完全版）, CraftingSystem, Inventory | 素材仕入れ→クラフト→製品を倉庫に格納できる |
| **Unit 4: Sales & Economy** | CustomerSimulator, EconomyManager, GameService, ShopService | 「進める」で顧客が来て売れる、資金が増減する |
| **Unit 5: UI & Progression** | UIManager（全サブコンポーネント）, GameProgress | HUD表示、全メニュー操作、セーブ/ロード、ゴール達成判定 |

---

## 確認質問

## Question 1
開発体制を教えてください。ユニットの並行開発の方針に影響します。

A) ひとりで開発する（ユニットを順番に実装）
B) 複数人で開発する（一部ユニットを並行して進めたい）
C) その他（[Answer]: タグの後に具体的に説明してください）

[Answer]: A

---

回答が完了したら「完了」と教えてください。
