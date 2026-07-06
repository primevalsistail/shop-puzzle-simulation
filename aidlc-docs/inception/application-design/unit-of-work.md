# ユニット・オブ・ワーク定義

## 開発方針
- **開発体制**: ソロ開発
- **実装順序**: 順次（Unit 1 → 2 → 3 → 4 → 5）
- **各ユニット完了後**: 動作確認してから次へ進む

---

## Unit 1: Foundation（基盤）

**目的**: Phaser.js の環境構築とゲームの骨格を作る

**含むコンポーネント**:
- `GameEngine` — Phaser.Game 初期化・シーン管理
- `EventBus` — イベント発行・購読インフラ
- `TimeManager` — ゲーム内時間管理・「進める」機能

**含まないコンポーネント**: その他すべて（後続ユニットで実装）

**ディレクトリ**:
```
src/
├── main.ts
├── scenes/
│   ├── BootScene.ts
│   └── GameScene.ts   (空のシーン)
├── components/core/
│   ├── GameEngine.ts
│   └── TimeManager.ts
├── services/
│   └── EventBus.ts
└── types/index.ts     (共通型定義)
```

**完了条件**:
- Vite dev serverでブラウザにPhaser.jsのキャンバスが表示される
- 「進める」ボタンを押すとコンソールに時刻ログが出力される
- EventBusでイベントの発行・購読が動作する

---

## Unit 2: Grid & Placement（グリッドと配置）

**目的**: 店舗フロアのグリッドシステムとアイテム配置のコアメカニクスを実装する

**含むコンポーネント**:
- `FloorGrid` — グリッド状態管理
- `PlacementManager` — ドラッグ&ドロップ・回転
- `AdjacencyEngine` — 隣接ボーナス計算
- `ItemRegistry`（形状データのみ） — ハードコードしたサンプルアイテム数種類

**ディレクトリ**:
```
src/
├── components/
│   ├── floor/
│   │   ├── FloorGrid.ts
│   │   ├── PlacementManager.ts
│   │   └── AdjacencyEngine.ts
│   └── items/
│       └── ItemRegistry.ts    (形状データのみ)
├── data/
│   └── items.ts               (サンプルアイテム定義)
└── scenes/
    └── GameScene.ts           (グリッド描画追加)
```

**完了条件**:
- 6×5グリッドが画面に描画される
- サンプルアイテム（3〜5種類）をドラッグ&ドロップで配置できる
- 回転（90°）ができる
- 配置不可エリアが赤くハイライトされる
- 隣接ボーナス発生時に視覚フィードバックがある

---

## Unit 3: Items, Crafting & Inventory（アイテム・クラフト・在庫）

**目的**: 全アイテムデータ・クラフトシステム・倉庫管理を実装する

**含むコンポーネント**:
- `ItemRegistry`（完全版） — 全アイテム・全レシピ・アンロック管理
- `CraftingSystem` — クラフト実行・時間停止
- `Inventory` — 倉庫在庫管理（種類数・999上限）

**ディレクトリ**:
```
src/
├── components/
│   └── items/
│       ├── ItemRegistry.ts    (完全版に拡張)
│       └── CraftingSystem.ts
├── components/economy/
│   └── Inventory.ts
├── data/
│   ├── items.ts               (全アイテム・素材)
│   ├── recipes.ts             (全レシピ)
│   └── adjacencyRules.ts      (隣接相性データ)
└── ui/
    └── CraftMenu.ts           (クラフトメニューUI)
```

**完了条件**:
- 仕入れで素材を倉庫に追加できる（種類数・999上限が機能する）
- クラフトメニューが開き、レシピを選んでクラフトできる
- クラフト中は時間が止まり、完了後に倉庫に製品が入る
- 倉庫→フロアへアイテムを移動して陳列できる

---

## Unit 4: Sales & Economy（販売・経済）

**目的**: 顧客シミュレーション・売上処理・ゲームループの統合を実装する

**含むコンポーネント**:
- `CustomerSimulator` — 来店・購買判定シミュレーション
- `EconomyManager` — 資金管理・仕入れ・売上
- `GameService` — メインゲームループ統括
- `ShopService` — 店舗操作オーケストレーション

**ディレクトリ**:
```
src/
├── components/
│   ├── economy/
│   │   └── EconomyManager.ts
│   └── simulation/
│       └── CustomerSimulator.ts
└── services/
    ├── GameService.ts
    └── ShopService.ts
```

**完了条件**:
- 「進める」を押すと顧客が来店し、棚の商品が売れる（数量減少）
- 売上が資金に加算される
- 商品売り切れで「補充 / 撤去」プロンプトが表示される
- 補充・撤去が正しく動作する
- 資金不足時に仕入れが失敗する

---

## Unit 5: UI & Progression（UIと進行）

**目的**: HUD・全メニュー・ゲーム進行管理・セーブ/ロードを実装してゲームを完成させる

**含むコンポーネント**:
- `UIManager`（全サブコンポーネント） — HUD・全メニュー統括
- `GameProgress` — 目標管理・アンロック・ゲームオーバー・セーブ/ロード

**ディレクトリ**:
```
src/
├── components/
│   └── progress/
│       └── GameProgress.ts
└── ui/
    ├── UIManager.ts
    ├── components/
    │   ├── HUD.ts
    │   ├── PurchaseMenu.ts
    │   └── SlotActionPrompt.ts
    └── overlays/
        ├── EndingScreen.ts
        ├── GameOverScreen.ts
        └── Tutorial.ts
```

**完了条件**:
- HUDに資金・累計売上・目標残りが常時表示される
- 仕入れメニューが動作する
- 累計100万円でエンディング画面が表示される
- エンドレスモードに移行できる
- 資金ゼロでゲームオーバー画面が表示される
- セーブ/ロードが動作する（LocalStorage）
- チュートリアルが表示される
