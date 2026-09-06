# AI-DLC State

## Project Information
- **Project Name**: 在庫配置パズル型 店舗経営シミュレーション
- **Project Type**: Brownfield（既存コードあり）
- **Tech Stack**: TypeScript + Phaser.js 3 + Vite
- **Platform**: Webブラウザ
- **Started**: 2026-07-05T02:00:00Z
- **Last Updated**: 2026-09-06（Phase 3 完了）

## Current Status
- **Current Phase**: CONSTRUCTION（**Cycle 4: アイテム体系** — 進行中）
- **Current Stage**: Code Generation ＝ **Phase 3 — 完了（2026-09-06）**。
  `src/taxonomy/` に **110品（素材50＋加工品60）＋レシピ60本**。新規41テスト（合計142テスト全件パス）
- **Next Stage**: **Phase 3 の評価 — 別セッションで行う**
  → [依頼書](construction/plans/item-taxonomy-evaluation-handoff.md)。
  Phase 2 §7「確かめること」5件を計測・判定し、**Phase 4 へ進むか軸の設計に戻るかを決める**
  **⚠ 起こすセッションと評価するセッションを分ける**というユーザー判断（Q4）による。
  起こした側が判定すると、偏りが出たときに品を差し替えて偏りを消してしまい自己採点になる
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

**Cycle 3 で残った未決事項**（world.md §8）: ~~島ごとの産物と需要~~ → **Cycle 4 / Phase 3 で決着（2026-09-06）**
→ [island-goods.md](inception/worldbuilding/island-goods.md)。**残るは 10日周期の妥当性のみ**（未検証）

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

### Phase 3 で決まった主要事項 — 素材と加工品の起こし直し（2026-09-06 後半）

**★ユーザーの全体方針**: **「問題を複雑化しない」方向へ倒す。**軸・値・例外・特別扱いを増やさない。

- **★四島 ＝ 春夏秋冬**（ユーザー判断）。**設計側の土台であって、ゲームに季節名は出さない**
  （world.md §1「四季という観念はない」は維持。**world.md の書き換えは不要だった**）
- **★産地は「その品が一般的にどの季節のイメージか」だけで決まる。**生育条件は持ち込まない。
  **旬を持たない（通年）ものは産地 `なし`**。これで重複が 6件 → 1件に減った
- **旬が付いているのは生きもの。**そこから採れるものはすべて同じ島
  （竹＝春 ／ 稲わら＝秋 ／ 蜜蝋＝夏 ／ 羊の乳＝春 ／ トナカイの革＝冬）。**規則を拡張せずに済んだ**
- **加工品は旬を持たないので、すべて産地 `なし`。**「主材料の産地」は
  四島にまたがる品で主材料を決められず**恣意的な選択が入る**ので採らなかった
- **U1 を `tier == 1` に変更。**素材だけが商人の店先に並ぶ。加工品は作るか U2 で解禁する
- **粘土を足さなかった** — 旬が無く海のものでもないので**産地が決まらない。規則を壊す**
- **★`向く土地` の5値を書き直した（INV-2b 違反の修正）** — 詳細は下記

### ⚠ Phase 3 で `向く土地` の INV-2b 違反が見つかり、Phase 2 に戻って直した

**110品に `向く土地` を振らせたセッションが、こちらの疑いを一切伝えていない状態で独立に指摘した。**

> `寒い土地`／`暑い土地` は**品の性質**を問うている（品を手に取れば決まる）。
> `温暖な土地`／`実りの土地` は**買い手の暮らしぶり**を問うている（品を見ても決まらない）。
> `実りの土地` の定義文は二通りに読め、**同じ定義文から4倍違う結果**（20品超 vs 5品）。
> `どこでも` 62／110 は**軸の設計を測っている数字**。

**修正**（→ [Phase 2 §4-E](inception/application-design/cycle4-phase2-axes.md)）:
4値すべてを「その土地で何が起きるか／人が何に困るか」で揃えた。
寒い＝**熱を守る** ／ 暑い＝**熱を逃がす** ／ 温暖＝**外で過ごす時間の長い暮らしに役立つ** ／
実り＝**多すぎる収穫を捌くのに役立つ**。**値の数は5のまま。軸も値も増やしていない。**
振り直した結果 `どこでも` 62 → 56、`温暖な土地` 11 → 19、`実りの土地` は**ぶれずに**5。

**⚠ 残った判断の揺れ5件**（保存食／温かい飲食／生魚／持ち歩き／用途が広い素材）は
**解決していない。**評価セッションへの依頼書 §4 に**開示して**渡した。

### Phase 3 で決まった主要事項（2026-09-06。詳細は [item-system.md §2 #21〜#25](inception/design-log/item-system.md)）

- **産地は「品に割り当てる」のではなく「島から品を起こす」**（#21）。
  割り当て向きだと「この品はどの島か」の選択が毎回発生する。規律を作っても
  **恣意性が〈島の選択〉から〈品への修飾語〉へ移るだけ**だった（実物を island-goods.md §2-A に保存）。
  向きを変えると**産地は選択ではなく出自**になる
- **産地 `なし` ＝ 海のもの**（#22）。world.md §1「四島とそれを結ぶ穏やかな海」から導出
- **気候は「何が育つか」しか決めない**（#23）。よって**かたちになったものはどの島も産さず**、
  着るもの・使うものは tier2 以上に来る
- **効き目の合成は加算** `1 + Σ(mᵢ − 1)`、**上限なし**（#24）。
  乗算は暴走し、上限値はバランス調整の数値（スコープ外）になるため
- **⚠ 条件言語に「軸どうしの比較」が無い**（#25）。`産地 == 現在地` が書けない。
  **U3・D2・R5 の3規則がこれを要求**しており、いまは評価器が個別に持っている。
  条件言語に足すかは Phase 4 以降の判断
- **一次情報と導出結果を取り違えない**（Step 1 で2回滑った）。
  characters.md の商人の扱い品は**気候から導かれた結果**であって産物の定義ではない。
  歯止めを island-goods.md §1-B に残した

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
| **前提ではない** | ~~世界観側の未決「島ごとの産物と需要」~~ → Phase 3 の Step 1 で**決着させた**（→ [island-goods.md](inception/worldbuilding/island-goods.md)）。Phase 0〜2 には不要だった |

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
- [x] **Code Generation** - COMPLETED (2026-09-06) — **Phase 3**
      → **実装**: [`src/taxonomy/`](../src/taxonomy/) — axes.ts（5軸の型）／ islands.ts（四島＋**需要表4行**）／
        items.ts（**110品** ＝ 素材50＋加工品60）／ recipes.ts（**60本**・tier1〜4）／
        derive.ts（tier・積み上げ価格）／ rules.ts（条件言語＋規則データ）／
        evaluate.ts（規則評価器・**`店全体` の新機構**）
      → **世界観**: [island-goods.md](inception/worldbuilding/island-goods.md)（産地の規則）／
        [materials.md](inception/worldbuilding/materials.md)（素材50）／
        [crafted-goods.md](inception/worldbuilding/crafted-goods.md)（加工品60）
      → **テスト**: invariants.test.ts（INV-1・3・4・5・6）＋ evaluate.test.ts。
        **新規41テスト。既存101テストは無傷**（Q4=A の並走方針。既存 src/data/items.ts は触っていない）
      → **前提を閉じた**: world.md §8「島ごとの産物と需要」→ [island-goods.md](inception/worldbuilding/island-goods.md)

      **Phase 3 で決まったこと**
      - **産地は「品に割り当てる」のではなく「島から品を起こす」**（item-system.md §2 #21）。
        割り当て向きの規律は**恣意性を〈島の選択〉から〈品への修飾語〉へ移すだけ**で解決しなかった
      - **産地 `なし` ＝ 海のもの**（#22）／ **気候は「何が育つか」しか決めない**（#23）
      - **効き目の合成は加算** `1 + Σ(mᵢ − 1)`、上限なし（#24）

      **⚠ Phase 3 で見つかった穴**（#25）: **条件言語に「軸どうしの比較」が無い**（`産地 == 現在地` が書けない）。
      **U3・D2・R5 の3規則がこれを要求**しており、いまは評価器が個別に持っている。
      条件言語に足すかは Phase 4 以降の判断

- [ ] **Phase 3 の評価** ← **いまここ。別セッションで行う**
      → [依頼書](construction/plans/item-taxonomy-evaluation-handoff.md)（自己完結。他資料を読ませない）
      **判定してもらうこと**: Phase 2 §7「確かめること」5件（`道具` の品数／`どこでも` への偏り／
      産地 `なし` の割合／`主種類4 × 贅沢さ3` の12通りへの散り方／U2 の解禁条件の数）
      **切り分け**: 偏りが「**軸の設計の問題**」（→ Phase 1 に戻る）か
      「**品の起こし方の問題**」（→ 品を足す）か
      **⚠ 依頼書に合格ラインは書いていない。**書くと起こした側の後付けになるため
- [ ] **Build and Test** — **Phase 4**（新品30個・新レシピ10本を投げ込み、Phase 0 の不変条件が
      破れるか確認。**破れたら Phase 1 に戻る**）
      **⚠ 実施するかどうかは評価セッションが決める。**Phase 3 の5件の結果しだいでは
      Phase 4 へ進まずに軸の設計へ戻る
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

