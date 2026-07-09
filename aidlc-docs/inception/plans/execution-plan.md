# 実行計画 — Cycle 2: UI/UX 全面リニューアル

## 詳細分析サマリー

### 変更スコープ
- **変更タイプ**: UI レイヤー全面再設計（ゲームロジック変更なし）
- **主な変更**: ウィンドウ全体化 + 新レイアウト + 新コンポーネント 2 件
- **影響ファイル**: 7 ファイル更新、2 ファイル新規

### 変更インパクト評価
| 項目 | 内容 |
|------|------|
| ユーザー体験変更 | Yes — 全画面化、新レイアウト、カテゴリフィルタ、メッセージログ |
| 構造変更 | No — アーキテクチャは既存のまま |
| データモデル変更 | No — category フィールドは既存コードに存在済み |
| API/イベント変更 | No — EventBus イベントは全て既存のまま |
| NFR 影響 | 軽微 — Scale.FIT でウィンドウ利用率が大幅改善 |

### リスク評価
- **リスクレベル**: Medium（複数ファイル修正、ただしロジック変更ゼロ）
- **ロールバック**: Easy（座標変更を戻すだけ）
- **テスト影響**: なし（101 件の既存テストは全てロジック層、UI テストなし）

---

## ワークフロー

```
INCEPTION PHASE:
  [v] Workspace Detection   - COMPLETED
  [-] Reverse Engineering   - SKIPPED (brownfield だが RE 不要)
  [v] Requirements Analysis - COMPLETED
  [-] User Stories          - SKIPPED (新ペルソナなし、要件明確)
  [v] Workflow Planning     - IN PROGRESS (現在地)
  [-] Application Design    - SKIPPED (UI のみの新コンポーネント)
  [-] Units Generation      - SKIPPED (単一ユニット)

CONSTRUCTION PHASE:
  [-] Functional Design     - SKIPPED (ビジネスロジック変更なし)
  [-] NFR Requirements      - SKIPPED (技術スタック確定済み)
  [-] NFR Design            - SKIPPED (同上)
  [-] Infrastructure Design - SKIPPED (静的ホスティング変更なし)
  [ ] Code Generation       - EXECUTE (次ステップ)
  [ ] Build and Test        - EXECUTE

OPERATIONS PHASE:
  [ ] Operations            - PLACEHOLDER
```

---

## スキップ根拠

| ステージ | 根拠 |
|---------|------|
| Application Design | 新コンポーネント 2 件（CharacterStrip, MessageLog）は既存パターン踏襲のシンプルな UI コンポーネント |
| Units Generation | 全変更が「UI レイヤー再設計」という単一まとまりの作業。並列開発不要。 |
| Functional Design | ビジネスロジック変更ゼロ |
| NFR Requirements | TypeScript + Phaser スタック確定済み、Scale.FIT で性能問題なし |
| Infrastructure Design | 静的ホスティング変更なし |

---

## Code Generation 対象ファイル（単一ユニット: UI Layout Overhaul）

| # | ファイル | 種別 | 変更内容 |
|---|---------|------|----------|
| 1 | src/main.ts | 更新 | Phaser Scale.FIT + CENTER_BOTH 設定追加 |
| 2 | src/ui/CharacterStrip.ts | 新規 | 店番主人公・来店客プレースホルダー |
| 3 | src/ui/MessageLog.ts | 新規 | 販売ログ・イベントメッセージ表示 |
| 4 | src/ui/FloorRenderer.ts | 更新 | 新グリッド原点・新セルサイズ対応 |
| 5 | src/ui/InventoryPanel.ts | 更新 | カテゴリフィルタトグル追加 |
| 6 | src/ui/HUD.ts | 更新 | 右パネル位置に移設 |
| 7 | src/scenes/GameScene.ts | 更新 | 新レイアウト統合・全コンポーネント配置 |

### レイアウト定数（内部解像度 1280x720）

```
LEFT_PANEL:   x=0,    width=220
GRID_AREA:    x=220,  width=760
CHAR_STRIP:   x=980,  width=110
RIGHT_PANEL:  x=1090, width=190
MSG_WINDOW:   y=610,  height=110

グリッド (6x5):
  CELL_SIZE = 120px (min(floor(760/6)=126, floor(600/5)=120) = 120)
  GRID_WIDTH  = 720px
  GRID_HEIGHT = 600px
  GRID_ORIGIN_X = 220 + (760-720)/2 = 240
  GRID_ORIGIN_Y = 5
```

---

## 成功基準
- ブラウザウィンドウ全体に拡張、新レイアウト適用
- カテゴリフィルタ動作確認
- メッセージログ動作確認
- npm run test で 101 テスト全件パス継続
- npm run dev で動作確認
