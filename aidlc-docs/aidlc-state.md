# AI-DLC State

## Project Information
- **Project Name**: 在庫配置パズル型 店舗経営シミュレーション
- **Project Type**: Brownfield（既存コードあり）
- **Tech Stack**: TypeScript + Phaser.js 3 + Vite
- **Platform**: Webブラウザ
- **Started**: 2026-07-05T02:00:00Z
- **Last Updated**: 2026-09-06

## Current Status
- **Current Phase**: INCEPTION（**Cycle 4: アイテム体系** — 進行中）
- **Current Stage**: Requirements Analysis — Phase 0（不変条件）／Phase 1（問いを軸へ割り当て）
- **Next Stage**: Application Design — Phase 2（各軸の定義）→ **Phase 2 が終わったらコードへ**
- **Note**: Cycle 2（UI/UX全面リニューアル）はコミット b078be6 で完了済み。

## Cycle 1 — 初期実装（完了）

### INCEPTION PHASE
- [x] Workspace Detection - COMPLETED (2026-07-05T02:00:00Z)
- [x] Reverse Engineering - SKIPPED（Greenfieldのため不要）
- [x] Requirements Analysis - COMPLETED (2026-07-05T02:10:00Z)
- [x] User Stories - SKIPPED（単一プレイヤー・要件明確）
- [x] Workflow Planning - COMPLETED (2026-07-05T02:30:00Z)
- [x] Application Design - COMPLETED (2026-07-05T02:50:00Z)
- [x] Units Generation - COMPLETED (2026-07-05T03:00:00Z)

### CONSTRUCTION PHASE
- [x] Unit 1: Foundation — Code Generation COMPLETED（17テスト）
- [x] Unit 2: Grid & Placement — Code Generation COMPLETED（29テスト）
- [x] Unit 3: Items, Crafting & Inventory — Code Generation COMPLETED（22テスト）
- [x] Unit 4: Sales & Economy — Code Generation COMPLETED（22テスト）
- [x] Unit 5: UI & Progression — Code Generation COMPLETED
- [x] Build and Test — 101テスト全件パス

### OPERATIONS PHASE
- [ ] Operations - PLACEHOLDER

## Cycle 2 — UI/UX 全面リニューアル（完了）

### INCEPTION PHASE
- [x] Workspace Detection - COMPLETED（既存コード確認済み）
- [x] Reverse Engineering - SKIPPED（RE不要）
- [x] Requirements Analysis - COMPLETED
- [x] User Stories - SKIPPED（新ペルソナなし・要件明確）
- [x] Workflow Planning - COMPLETED
- [x] Application Design - SKIPPED（UI のみ・設計不要）
- [x] Units Generation - SKIPPED（単一ユニット）

### CONSTRUCTION PHASE（単一ユニット: UI Layout Overhaul）
- [x] Functional Design - SKIPPED（ロジック変更なし）
- [x] NFR Requirements - SKIPPED（スタック確定済み）
- [x] NFR Design - SKIPPED（同上）
- [x] Infrastructure Design - SKIPPED（静的ホスティング変更なし）
- [x] Code Generation - COMPLETED (2026-07-09T10:20:00Z)
- [x] Build and Test - COMPLETED (101テストパス, ビルド成功)

## Cycle 3 — 世界観（完了）

**2026-08-23**: 世界観の検討文書は**全削除**。一から考え直す。

- 削除対象: world-and-story.md / approach.md / step1-explanation-gaps.md /
  世界観関連の質問ファイル4件（いずれも git 未追跡のため復元不可）
- **保持**: [design-log/item-system.md](inception/design-log/item-system.md)（商品の話はステイ）

### 状態
- [x] 別セッション用プロンプトの検討ファイル作成 (2026-08-23)
      → [worldbuilding/prompts/](inception/worldbuilding/prompts/)（実行済み4本。手法の先例として保存）
- [x] 世界観を確定 (2026-08-30)
      → [worldbuilding/world.md](inception/worldbuilding/world.md) — 気候の違う四島を10日ごとに巡る店舟〈ペルラ号〉
- [x] 主人公を確定 (2026-09-04)
      → [worldbuilding/char.md](inception/worldbuilding/char.md) — ノエラ・キア／表層「見立て好き」
      深層要求「自分が持ってきたものが、その土地で喜ばれる瞬間を作り続けたい」
- [x] 主人公以外の人物を確定 (2026-09-06)
      → [worldbuilding/characters.md](inception/worldbuilding/characters.md) — 案B「淡々と取引する」を採用。
      伯母テレナ・キア／権限の持ち主「航路・荷預かり係」／猫ネム／行商人バレン／
      各島の商人4人／客の類型4種。経緯は [design-log/cast.md](inception/design-log/cast.md)

**Cycle 3 で残った未決事項**（world.md §8）: 島ごとの産物と需要（Cycle 4 の前提）／10日周期の妥当性（未検証）

### 2026-09-04 に変更した確定事項
- **店＝船倉。**荷を納めた船倉がそのまま売り場になる。「棚を組む」工程を廃止（造作の仕事は発生しない）
- **「この舟に思い入れがあって引き取る」を確定事項から未決へ降格。**
  要求は「なぜこの舟を持つことになったか」「何を目指す話か」が**プレイヤーに伝わること**だけ
- 主人公の年齢を **23歳 → 21歳**
- 検討記録: [design-log/character-motive.md](inception/design-log/character-motive.md)（外部検討には渡さない内部記録）

## Cycle 4 — アイテム体系の再設計（進行中）

**起票**: 2026-09-06
**設計ログ**: [design-log/item-system.md](inception/design-log/item-system.md)
　構造は §2 で確定済み（10件）。**§3 の却下案と得られた原則は着手前に必読。**
**進め方**: item-system.md §7 の **Phase 0〜4 を、AI-DLC ステージの中身として回す。**
　§7 の肝は各フェーズで「**決めないこと**」を明示する点。汎用ステージには無い機能なので捨てない。

### スコープ

| | |
|---|---|
| **含む** | 軸の確定と語彙／規則の条件言語（DSL）／取り合わせの2層化／最小実装と拡張ストレステスト |
| **含まない** | **利幅の数値バランス調整**（本が2.5倍/10分など。item-system.md §5 に「要調整・別件」と明記）。混ぜると「数値を早く出しすぎる」失敗を繰り返す |
| **前提ではない** | 世界観側の未決「島ごとの産物と需要」。Phase 0〜2 には不要で、実アイテムを入れる Phase 3 で必要になる |

### INCEPTION PHASE
- [x] Workspace Detection - COMPLETED（Cycle 3 完了時点で確認済み）
- [x] Reverse Engineering - SKIPPED（現行13品の実測は item-system.md §5 に記録済み）
- [ ] **Requirements Analysis** — **Phase 0**（不変条件を判定可能な形で）＋ **Phase 1**（アイテム体系が
      答えるべき問いを列挙し、各問いをちょうど1つの軸に割り当てる。ここで軸の本数が決まる）
      **草案あり**: 不変条件4本は §7、問い5つは §3「根本原因」
      **ここで決めない**: 軸の数（Phase 0）／各軸の値（Phase 1）
- [x] User Stories - SKIPPED（新ペルソナなし）
- [x] Workflow Planning - SKIPPED（§7 の Phase 0〜4 が計画そのもの）
- [ ] **Application Design** — **Phase 2**（各軸の定義を1行で。「tier とは加工の深さである」レベル）
      **ここで決めない**: 語彙・数値
- [x] Units Generation - SKIPPED（単一ユニット）

### CONSTRUCTION PHASE（単一ユニット: Item Taxonomy）
- [x] Functional Design - SKIPPED（Phase 2 が代替）
- [x] NFR Requirements - SKIPPED（スタック確定済み）
- [x] NFR Design - SKIPPED（同上）
- [x] Infrastructure Design - SKIPPED（静的ホスティング変更なし）
- [ ] **Code Generation** — **Phase 3**（型定義＋実アイテム20品＋規則評価器を書いて動かす。
      **ここで初めて具体値を入れる**）
- [ ] **Build and Test** — **Phase 4**（新品30個・新レシピ10本を投げ込み、Phase 0 の不変条件が
      破れるか確認。**破れたら Phase 1 に戻る**）

