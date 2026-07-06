# Unit 1: Foundation — コード生成プラン

## ユニット概要
- **目的**: Phaser.js + TypeScript + Vite の環境構築とゲームの骨格
- **スキップしたステージ**: Functional Design（複雑なビジネスロジックなし）、NFR Requirements（技術スタック確定済み）、NFR Design、Infrastructure Design
- **依存ユニット**: なし

## 対象シナリオ
- ゲーム起動（ブラウザでPhaser.jsが表示される）
- 時間進行（「進める」で時間が高速進行）
- 時間停止（クラフト中は停止）

## 生成ファイル一覧

```
simulation/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.ts
    ├── types/
    │   └── index.ts
    ├── services/
    │   └── EventBus.ts
    ├── components/core/
    │   ├── GameEngine.ts
    │   └── TimeManager.ts
    └── scenes/
        ├── BootScene.ts
        └── GameScene.ts
```

## 実行ステップ

- [x] Step 1: プロジェクト設定ファイル生成
  - [x] Step 1.1: `package.json`（依存関係：phaser, typescript, vite, vitest）
  - [x] Step 1.2: `vite.config.ts`
  - [x] Step 1.3: `tsconfig.json`
  - [x] Step 1.4: `index.html`

- [x] Step 2: 共通型定義 `src/types/index.ts`
  - GridCell, GridSize, Rotation, GameTime
  - DisplaySlot, AdjacencyBonus, SaleResult, CraftJob
  - HUDState, SaveData, ShopState
  - GameEvents（EventBusのイベント名定数）

- [x] Step 3: EventBus `src/services/EventBus.ts`
  - カスタムEventEmitterシングルトン（Phaser非依存・テスト容易）
  - 型安全なemit/on/off/onceメソッド
  - GameEventsの定数を使ったイベント名管理

- [x] Step 4: GameEngine `src/components/core/GameEngine.ts`
  - Phaser.Game の設定・初期化
  - 画面サイズ（1280×720）、背景色
  - シーン登録（BootScene, GameScene）

- [x] Step 5: TimeManager `src/components/core/TimeManager.ts`
  - GameTime（day/hour/minute）の管理
  - update(delta)：100ms=1ゲーム分の高速進行
  - startAdvancing/stopAdvancing：進行制御
  - pause() / resume()：クラフト中の停止・再開
  - EventBusへのイベント発行

- [x] Step 6: BootScene `src/scenes/BootScene.ts`
  - アセットのプリロード（現時点では最小限）
  - 完了後に GameScene へ遷移

- [x] Step 7: GameScene `src/scenes/GameScene.ts`
  - TimeManager・EventBus の初期化
  - 「進める/停止」トグルボタン
  - 時刻表示テキスト
  - 後続ユニットでグリッド・UI を追加していく土台

- [x] Step 8: エントリーポイント `src/main.ts`
  - GameEngine をインスタンス化してゲームを起動

- [x] Step 9: 基本テスト（17テスト全件パス）
  - `src/services/EventBus.test.ts`（6テスト）
  - `src/components/core/TimeManager.test.ts`（11テスト）

## 完了条件
- `npm run dev` でブラウザにPhaser.jsのキャンバスが表示される
- 「進める」ボタンでコンソールに時刻ログが出る
- `npm run test` でEventBus・TimeManagerのテストが通る
