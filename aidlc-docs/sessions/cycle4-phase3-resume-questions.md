# Cycle 4 / Phase 3 セッション再開 — 質問

**作成**: 2026-09-06T06:24:54Z

## 現在の状態（aidlc-state.md より）

- **プロジェクト**: 在庫配置パズル型 店舗経営シミュレーション（Brownfield / TS + Phaser 3 + Vite）
- **現在フェーズ**: **CONSTRUCTION** — Cycle 4「アイテム体系の再設計」
- **直前の完了**: Application Design ＝ **Phase 2**（2026-09-06）
  → [各軸の定義](../inception/application-design/cycle4-phase2-axes.md)。**軸は5本**
  （主種類4値 ／ tier導出 ／ 産地5値 ／ 贅沢さ3値 ／ 向く土地5値）
- **現在ステージ**: **Code Generation ＝ Phase 3**（未着手）
  - **やること**（Phase 2 §7）: 型定義（5軸）／ 実アイテム20品 ／ 規則評価器 ／
    **効き目の適用範囲 `店全体`（新機構）** ／ **島の需要表4行** ／ 状態述語 `累計販売数(この品)` `現在地`
  - **ここで初めて具体値を入れる**（item-system.md §7）
- **次ステージ**: Build and Test ＝ **Phase 4**（新品30個・新レシピ10本のストレステスト）
- **スコープ外**: 利幅の**数値バランス調整**（item-system.md §5「要調整・別件」）

---

## 読み込んだ状態で見つかった論点（Q2・Q4 の背景）

### 論点1 — 前提が1件、未決のまま残っている

[world.md §8](../inception/worldbuilding/world.md) の未決「**島ごとの産物と需要**」が、
Cycle 3 完了時から「Phase 3 の前提」として持ち越されている。

Phase 3 は `産地`（四島＋なし）と `向く土地`（寒い／暑い／温暖／実り／どこでも）に
**具体値を入れる工程**なので、ここを通らずには 20 品を書けない。

### 論点2 — 現行コードは Phase 2 が落とした形をしている

現行 [items.ts](../../src/data/items.ts) の 13 品は
`adjacencyBonuses: [{ adjacentItemId: 'milk', ... }]` という **ItemId 直書き**。
これは Phase 2 §6 が **INV-4 違反**として落とした形そのもの（＝取り合わせ層2に相当）。
そして**既存101テストがこの形に依存している**ため、置き換え方に選択肢が出る。

---

## Question 1
今回のセッションで何をしますか？

A) **Cycle 4 の続き（推奨）** — Code Generation ＝ **Phase 3** を実行する
   （型定義＋実アイテム20品＋規則評価器を書いて動かす）
B) 先に **Phase 2 までの成果物をレビュー**したい（軸の定義を読み直す／直す）
C) Cycle 4 を中断して別のことをする
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
前提の未決「**島ごとの産物と需要**」（world.md §8）をどう扱いますか？

A) **Phase 3 の最初の手順として、この場で決める（推奨）** — 四島それぞれの産物の傾向を
   気候から導いて確定させ、world.md §8 を閉じてから 20 品を書く。
   決めるのは**傾向**（どの主種類・どの向く土地が採れる島か）であって、品名の割り当ては 20 品と同時
B) **20 品の割り当てと同時に、事実上そこで決める** — 先に「島ごとの傾向」を文書化せず、
   20 品に `産地` を振る作業の結果として島の性格が決まる。world.md §8 は後から追記して閉じる
C) **別セッションに複数案を出させて比較する** — 島の性格は正解が1つに定まらない設計判断なので、
   Cycle 3 の [worldbuilding/prompts/](../inception/worldbuilding/prompts) と同じ手法を使う
   （→ 先に fanout-prompt でプロンプトを作る。このセッションでは Phase 3 に入らない）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
Phase 3 の進め方はどれにしますか？

A) **こちらが草案を書いてから議論する（Phase 0〜2 と同じ・推奨）** — 型定義と 20 品の草案を先に出し、
   それを見て直す。この形で Phase 0/1 と Phase 2 がそれぞれ1セッションで決着している
B) 質問票で論点を一つずつ潰してから書く（草案なしで、選択式の問いに答えていく形）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4
新しいアイテム体系を、**既存コードに対してどう置きますか**？（論点2）

A) **新しい型と新しいデータを別ファイルに置き、既存を残したまま並走させる（推奨）** —
   `src/data/items2.ts` 相当を新設して 20 品を書き、規則評価器も新規に書く。
   **既存101テストは触らない**ので Phase 4 のストレステストまで安全に進める。
   ゲーム本体の差し替え（GameScene / CustomerSimulator の接続替え）は Phase 4 の後に別途行う
B) **既存の items.ts / types を直接書き換える** — 13品を20品で置き換え、`adjacencyBonuses` を捨てる。
   ゲームが最初から新体系で動くが、**既存101テストの相当数が同時に壊れる**ので
   Phase 3 の中でテスト修正まで背負うことになる
C) **型定義と規則評価器だけ先に書き、20品のデータは次の区切りに回す** —
   器が正しいかを先に確かめる。ただし item-system.md §7 の「実アイテムを入れて殴る」が
   Phase 3 の肝なので、当たり判定が弱くなる
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
このセッションをどこで止めますか？

A) **Phase 3 を終えたところで止める（推奨）** — 型定義＋20品＋規則評価器が書けて、
   Phase 2 §7「確かめること」5件（`道具` の品数／`どこでも` への偏り／産地 `なし` の割合／
   主種類4×贅沢さ3 の12通りへの散り方／U2 の解禁条件の数）に答えが出たらコミットして終了。
   **Phase 4 のストレステストは別セッション**
B) **Phase 4（ストレステスト）まで続ける** — 新品30個・新レシピ10本を投げ込み、
   不変条件が破れるか確認するところまで一気に行く
C) **AI-DLC の Code Generation 手順どおり、まず Part 1（計画書）だけ作って止める** —
   `construction/plans/item-taxonomy-code-generation-plan.md` を作って承認をもらい、
   実際のコード生成（Part 2）は次のセッション
D) Other (please describe after [Answer]: tag below)

[Answer]: A
