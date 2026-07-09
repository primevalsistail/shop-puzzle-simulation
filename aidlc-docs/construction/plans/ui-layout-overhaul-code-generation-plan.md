# UI Layout Overhaul — コード生成プラン

## ユニット概要
- **目的**: ウィンドウ全体化・新レイアウト・カテゴリフィルタ・メッセージログ・キャラストリップ
- **依存**: 既存全ユニット（ロジック変更なし）
- **スキップしたステージ**: Functional Design / NFR Requirements / Infrastructure Design

## 新レイアウト定数（内部解像度 1280×720）

```
LEFT_PANEL:   x=0,    width=220
GRID_AREA:    x=220,  width=760
CHAR_STRIP:   x=980,  width=110
RIGHT_PANEL:  x=1090, width=190
MSG_WINDOW:   y=610,  height=110

CELL_SIZE      = 120px  (変更: 64 → 120)
GRID_ORIGIN_X  = 240    (変更なし: 220 + (760-720)/2 = 240)
GRID_ORIGIN_Y  = 5      (変更: 80 → 5)
```

## 実行ステップ

- [x] Step 1: `src/components/core/GameEngine.ts` — Scale.FIT 設定追加
  - Phaser.Game config に `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1280, height: 720 }` を追加
  - ブラウザウィンドウ全体への拡張を有効化

- [x] Step 2: `src/ui/CharacterStrip.ts` — 新規コンポーネント
  - x=980, width=110, y=0, height=609
  - 上半分(y=0〜304): 店番主人公エリア
    - 背景: 0x1a2a3a の Rectangle
    - ラベル: "🏪 店番" テキスト
    - キャラクタープレースホルダー: 丸型 Graphics (0x4a7a9b)
  - 下半分(y=305〜609): 来店客エリア
    - 背景: 0x1a3a2a の Rectangle
    - ラベル: "👤 来店客" テキスト
    - 客スペース: プレースホルダー Rectangle
  - スタブメソッド: `addCustomer(id: string)`, `removeCustomer(id: string)` (将来拡張用)

- [x] Step 3: `src/ui/MessageLog.ts` — 新規コンポーネント
  - x=0, y=610, width=1280, height=110
  - 最大 5 件のメッセージキュー
  - `addMessage(text: string, type?: 'sale' | 'event' | 'info'): void`
    - sale: 色 0xffee44 (黄)
    - event: 色 0x00ffff (シアン)
    - info: 色 0xaaaaaa (グレー)
  - 新着メッセージは下に追加、上に押し上げ
  - Phaser.GameObjects.Text × 5 列を保持し、テキストを入れ替えて描画

- [x] Step 4: `src/ui/FloorRenderer.ts` — 定数更新
  - `CELL_SIZE = 64` → `CELL_SIZE = 120`
  - `GRID_ORIGIN_Y = 80` → `GRID_ORIGIN_Y = 5`
  - GRID_ORIGIN_X は 240 のまま（変更不要）
  - DISCARD_MARGIN は 56 のまま

- [x] Step 5: `src/ui/InventoryPanel.ts` — カテゴリフィルタ追加
  - カテゴリ定義: `{ id: 'material', label: '素材' } | { id: 'food', label: '食品' } | { id: 'drink', label: '飲み物' } | { id: 'misc', label: '雑貨' }`
  - フィルタボタン行を ITEM_START_Y の上（y=40〜90 付近）に配置
  - `activeCategories: Set<string>` で管理（初期値: 全カテゴリ）
  - `allItems` / `allInventory` をインスタンス変数に保持
  - フィルタ変更時に `_renderItems(filtered)` を呼び直す
  - `render()` 変更: 受け取ったリストを保存 → フィルタ適用 → `_renderItems()`
  - `ITEM_START_Y = 124` → `ITEM_START_Y = 160` (フィルタ行の高さ分下げる)

- [x] Step 6: `src/ui/HUD.ts` — 右パネル幅に収める
  - `PW = 224` → `PW = 174` (右パネル 190px - 余白 16px)
  - `panelX = width - PW / 2 - 8` → このまま（1280 - 87 - 8 = 1185 = 1090 + 95 ✓）
  - `panelY` は変更不要（上端から 8 + PH/2 = 62）

- [x] Step 7: `src/scenes/GameScene.ts` — 新レイアウト統合
  - `setupBackground()` 更新:
    - 全体背景: 0x1a1a2e (変更なし)
    - 左パネル: x=110, width=220
    - グリッドエリア背景: CELL_SIZE=120 で再計算 (720×600+20)
    - キャラストリップ背景: x=1035, width=110, 高さ=610
    - 右パネル背景: x=1185, width=190
    - キャラ絵プレースホルダー: 右パネル中段に Rectangle (0x0d2340)
    - メッセージウィンドウ背景: x=640, y=665, width=1280, height=110
  - タイトルテキスト ("Shop Puzzle Sim") を削除
  - `statusText` を削除 → `messageLog.addMessage()` に置き換え
  - `CharacterStrip` を初期化・追加
  - `MessageLog` を初期化・追加
  - `setupEvents()` 内: `FLOOR_SLOT_SOLD` で messageLog.addMessage() 呼び出し
  - `updateStatus()` を `addInfoMessage()` にリファクタ → messageLog 呼び出し
  - クラフト完了・仕入れ等のメッセージも messageLog に統合

## 完了基準
- `npm run test` で 101 テスト全件パス（ロジック変更なし）
- `npm run dev` でブラウザ全体に画面が広がる
- 全カテゴリフィルタが動作する
- 商品が売れるとメッセージログに表示される
- キャラストリップのプレースホルダーが表示される
