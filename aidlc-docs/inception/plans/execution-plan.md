# 実行計画

## 変更影響分析

### 変更影響評価
- **ユーザー向け変更**: Yes - ゲーム全体がユーザー体験
- **構造的変更**: Yes - 新規プロジェクト、全コンポーネントを新規設計
- **データモデル変更**: Yes - アイテム形状、レシピ、フロアグリッドなど新規定義
- **APIの変更**: N/A - 内部ゲームシステム間のインターフェース
- **NFR影響**: Yes - 60FPS要件、ブラウザ互換性

### リスク評価
- **リスクレベル**: Medium
- **ロールバック複雑度**: Easy（新規プロジェクトのため）
- **テスト複雑度**: Moderate（複数の相互作用するゲームシステム）

**リスク要因:**
- グリッド配置ロジック（衝突判定、回転）の複雑さ
- 隣接ボーナス計算の複雑さ
- Phaser.jsでのゲームループ設計

## ワークフロー可視化

```
INCEPTION PHASE
├── [COMPLETED] Workspace Detection
├── [SKIPPED]   Reverse Engineering（Greenfield のため不要）
├── [COMPLETED] Requirements Analysis
├── [SKIPPED]   User Stories（単一プレイヤー、ペルソナ1種、要件が明確）
├── [COMPLETED] Workflow Planning（現在）
├── [EXECUTE]   Application Design
└── [EXECUTE]   Units Generation

CONSTRUCTION PHASE（ユニットごとに繰り返し）
├── [EXECUTE]   Functional Design（複雑なゲームロジックのため）
├── [EXECUTE]   NFR Requirements（60FPS、ブラウザ互換性）
├── [EXECUTE]   NFR Design（NFR Requirementsを実行するため）
├── [SKIPPED]   Infrastructure Design（静的ファイル配信のみ、設計不要）
├── [EXECUTE]   Code Generation（常に実行）
└── [EXECUTE]   Build and Test（常に実行）

OPERATIONS PHASE
└── [PLACEHOLDER] Operations
```

## 実行ステージ一覧

### INCEPTION PHASE

| ステージ | 判定 | 理由 |
|---------|------|------|
| Workspace Detection | COMPLETED | 実行済み |
| Reverse Engineering | SKIPPED | Greenfieldプロジェクト |
| Requirements Analysis | COMPLETED | 実行済み |
| User Stories | SKIPPED | 単一プレイヤー・単一ペルソナ・要件が十分明確 |
| Workflow Planning | IN PROGRESS | 現在実行中 |
| Application Design | **EXECUTE** | 新規コンポーネント複数・複雑なシステム間インターフェース定義が必要 |
| Units Generation | **EXECUTE** | 独立した複数システム（グリッド・クラフト・経済・UI）に分解できる |

### CONSTRUCTION PHASE（各ユニットに対して実行）

| ステージ | 判定 | 理由 |
|---------|------|------|
| Functional Design | **EXECUTE** | グリッド衝突判定・隣接ボーナス・顧客行動など複雑なビジネスロジック |
| NFR Requirements | **EXECUTE** | 60FPS要件・ブラウザ互換性・パフォーマンス設計が必要 |
| NFR Design | **EXECUTE** | NFR Requirementsを実行するため連動 |
| Infrastructure Design | SKIPPED | 静的ファイル配信のみ、クラウドインフラ設計は不要 |
| Code Generation | **EXECUTE** | 常に実行 |
| Build and Test | **EXECUTE** | 常に実行 |

## 想定ユニット構成（Units Generation で詳細化）

Application Design と Units Generation で以下の単位に分解予定：

1. **Core Foundation** — Phaser.js セットアップ、ゲームループ、シーン管理
2. **Grid System** — フロアグリッドレンダリング、アイテム配置・衝突判定、回転
3. **Item & Bonus System** — アイテム定義、隣接ボーナス計算
4. **Crafting System** — レシピ管理、クラフトメニュー、時間停止メカニクス
5. **Economy System** — 倉庫・仕入れ・販売シミュレーション・顧客ロジック
6. **UI Layer** — HUD、各種メニュー、セーブ/ロード

## 成功基準

- **主目標**: コアゲームプレイ（仕入れ→クラフト→陳列→販売）が動作するWebゲーム
- **主要成果物**: TypeScript + Phaser.js実装のWebゲーム、ブラウザで動作
- **品質ゲート**: 60FPS動作、クラッシュなし、チュートリアル完了可能
