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
- **Current Stage**: Application Design — **完了（2026-09-06）**。**軸は5本で確定**
- **Next Stage**: CONSTRUCTION / Code Generation — **Phase 3（型定義＋実アイテム20品＋規則評価器）。別セッションで行う**
  → **ここで初めて具体値を入れる。**前提として world.md §8 の未決「島ごとの産物と需要」が必要になる
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
　構造は §2 で確定済み（20件）。**§3 の却下案と得られた原則は着手前に必読。**
**進め方**: item-system.md §7 の **Phase 0〜4 を、AI-DLC ステージの中身として回す。**
　§7 の肝は各フェーズで「**決めないこと**」を明示する点。汎用ステージには無い機能なので捨てない。

### Phase 2 で決まった主要事項（詳細は [Phase 2](inception/application-design/cycle4-phase2-axes.md)）

- **軸は5本。** 主種類（食料・飲みもの・衣類・道具）／ tier（導出）／ 産地（四島＋なし）／
  **贅沢さ**（日用<上等<贅沢・順序あり）／ **向く土地**（寒い・暑い・温暖・実り・どこでも）
- **「誰に売れやすいか」は品側に持たない。規則側に置く。** 品側に置くと客を1種増やすたびに
  既存の全品を書き換えることになり、§6 の ID 直書きと同じ壊れ方をする
- **島は品側に持ってよい**（`向く土地`）。ただし**品は島の名前を知らず**、**4行の需要表**が結ぶ。
  島は増減しないので上記の壊れ方が起きない。**バランス調整はこの4行に集まる**
- **効き目は 種類3（売れやすさ・値段・集客）× 範囲2（その品・店全体）。** `店全体` は**新機構**
- **落とした面3本**: 保存（定義文が書けない）／ 客層（向きが逆）／
  **消耗（根拠だった「同じ客が繰り返し買う」がこの世界に存在しなかった）**
- **産地距離は不採用。** Phase 1 §5 の有力案「遠い島ほど高く売れる」は採らない
- **客のモデルは Cycle 4 で定義しない** → **Cycle 5「客と需要」**。条件言語の器だけ用意した
- **⚠ Phase 4 で重くなった検査**: 回転率を担うのが `贅沢さ` 3値だけになったため、
  「最適戦略が一致していないか」の検査の重要度が上がった。**かたち・大きさの比重も上がる**

### 2026-09-06（Phase 0・Phase 1）に決まった主要事項（詳細は [Phase 1 §5](inception/requirements/cycle4-phase1-axes.md)）

- **要素は面（facet）に分ける。**平らなタグ袋は保存性と客層を混ぜており INV-2b 違反（「書物」と同型）
- **産地を面として持ち、値に「なし」を含む。**産地なしの品が島の個性のコントラストと詰み回避を担う
- **placeable は廃止。全品売れる。**全品が「今売るか、材料にするか」の選択になる
- **売値は積み上げ式。**tier1 のみ手書き、tier2以上は `Σ材料の売値 × 加工倍率`
- **中間品は「その品を100個売る」と買えるようになる**（ただし買う方が高い＝時間を金で買う）
- **採らなかった案**: 他島でも割高（1.0〜1.3倍）で買えるようにする
  → characters.md:92 のバレンの制約（10種10個を超えると島を巡る必要がなくなる）と矛盾する
- ~~**有力案（Phase 3 で検証）**: 産地から遠い島で売るほど高く売れる~~
  → **Phase 2 で不採用**（「どの島で売れるかは距離に依存しない」）。代わりに `向く土地` と4行の需要表
- **⚠ 必ず守ること**: 加工倍率を所要時間**だけ**から決めない。`利益/時間` が一定になり
  「何を買ってどう売っても結局同じ」になる。面（贅沢／日用）による回転率の差を必ず併せて入れる

### スコープ

| | |
|---|---|
| **含む** | 軸の確定と語彙／規則の条件言語（DSL）／取り合わせの2層化／最小実装と拡張ストレステスト |
| **含まない** | **利幅の数値バランス調整**（本が2.5倍/10分など。item-system.md §5 に「要調整・別件」と明記）。混ぜると「数値を早く出しすぎる」失敗を繰り返す |
| **前提ではない** | 世界観側の未決「島ごとの産物と需要」。Phase 0〜2 には不要で、実アイテムを入れる Phase 3 で必要になる |

### INCEPTION PHASE
- [x] Workspace Detection - COMPLETED（Cycle 3 完了時点で確認済み）
- [x] Reverse Engineering - SKIPPED（現行13品の実測は item-system.md §5 に記録済み）
- [x] **Requirements Analysis** - COMPLETED (2026-09-06)
      → [Phase 0 不変条件](inception/requirements/cycle4-phase0-invariants.md) — INV-1〜6 ＋ 判定規律 PR-1〜3。
        §7 の4本を判定手順つきに整形し、**INV-5（追加コストが定数）**と**INV-6（作った品は材料より高い）**を追加。
        §3 の却下案8件＋新規2件がすべて落ちることを検算済み
      → [Phase 1 問いと軸](inception/requirements/cycle4-phase1-axes.md) — 問い11件を (a)軸/(b)規則/(c)導出 に仕分け。
        **軸は 3 + N 本**（主種類・tier・産地 ＋ 要素の面 N 本）。N は Phase 2 で確定
      → [回答済み質問票](inception/requirements/cycle4-phase01-questions.md)
- [x] User Stories - SKIPPED（新ペルソナなし）
- [x] Workflow Planning - SKIPPED（§7 の Phase 0〜4 が計画そのもの）
- [x] **Application Design** - COMPLETED (2026-09-06) — **Phase 2**
      → [Phase 2 各軸の定義](inception/application-design/cycle4-phase2-axes.md) — **軸は 5 本**
        （主種類4値 ／ tier導出 ／ 産地5値 ／ **贅沢さ**3値 ／ **向く土地**5値。**N=2**）
      → 実行計画 [cycle4-phase2-plan.md](inception/plans/cycle4-phase2-plan.md)
      → 議論 [質問票](inception/application-design/cycle4-phase2-questions.md) ／
        [追加確認](inception/application-design/cycle4-phase2-clarification-questions.md)
      **PR-3 に従い規則を先に列挙して逆算した結果、Phase 1 の面の候補が3本とも落ちた**（保存・客層・消耗）
- [x] Units Generation - SKIPPED（単一ユニット）

### CONSTRUCTION PHASE（単一ユニット: Item Taxonomy）
- [x] Functional Design - SKIPPED（Phase 2 が代替）
- [x] NFR Requirements - SKIPPED（スタック確定済み）
- [x] NFR Design - SKIPPED（同上）
- [x] Infrastructure Design - SKIPPED（静的ホスティング変更なし）
- [ ] **Code Generation** — **Phase 3**（型定義＋実アイテム20品＋規則評価器を書いて動かす。
      **ここで初めて具体値を入れる**） ← **いまここ。別セッションで行う**
      **入力**: [Phase 2 各軸の定義](inception/application-design/cycle4-phase2-axes.md) §4（軸）／ §5（条件言語）／ §7（申し送り）
      **実装するもの**: 型定義（5軸）／ 規則評価器 ／ **効き目の適用範囲 `店全体`（新機構）** ／
        **島の需要表4行** ／ 状態述語 `累計販売数(この品)` `現在地`
      **前提として必要**: world.md §8 の未決「**島ごとの産物と需要**」
- [ ] **Build and Test** — **Phase 4**（新品30個・新レシピ10本を投げ込み、Phase 0 の不変条件が
      破れるか確認。**破れたら Phase 1 に戻る**）
      **追加の検査項目**（Phase 1 §5 より）: 新レシピ10本の `売値(出力) > Σ売値(材料)`（INV-6）／
      新品30個について**最適戦略が一致していないか**（「何を買ってどう売っても結局同じ」の検出）
      **⚠ Phase 2 でこの検査の重要度が上がった**: 面「消耗」を落としたため、回転率を担うのが
      `贅沢さ` 3値だけになっている。戦略差は 利益・時間・**場所（かたち・大きさ）**・現在地 で作る

## Cycle 5 — 客と需要（未起票）

**Phase 2 で切り出された。** 客の**来訪モデル**（何人来るか／島で変わるか／何を見て選ぶか）は
現状**どこにも定義がなく**、コード（CustomerSimulator.ts）にも**客の実体も類型も存在しない**
（毎分30%で来店判定し全スロットを独立に購買判定するだけ）。
characters.md 末尾にあるのは4類型と縛り2件（個人を作らない／取引行動で分ける）のみ。

- **入力**: [Phase 2 §3-B・§3-D](inception/application-design/cycle4-phase2-axes.md)
- **器は用意済み**: 客の好み規則 `{ 客の類型, 条件, 補正 }` は Phase 2 の条件言語でそのまま書ける
- **⚠ 守ること**: 「誰が買うか」は**規則側**に置く。品側に `客層` を足さない（Phase 2 §3-B）

