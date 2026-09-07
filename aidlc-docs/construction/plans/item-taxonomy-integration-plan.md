# `src/taxonomy` をゲーム本体に接続する — 実行計画（[#30](https://github.com/primevalsistail/shop-puzzle-simulation/issues/30)）

## 現状

| | 品数 | 状態 |
|---|---|---|
| `src/data/items.ts`（旧） | 13品 | **ゲームが動かしているのはこちら** |
| `src/taxonomy/items.ts`（新） | **122品** | テストからしか呼ばれていない |

新体系の API は揃っている:
`evaluate(placements, state)` → 升目ごとの `売れやすさ／値段／集客` ＋ **店全体** ／
`finalModifiers(result, slotId)` ／ `stockedByIslandMerchant(items, state)`

## ⚠ 先に決めることが1つある — 「島」が本体に存在しない

**`src/` 全体を検索して、`島`・`現在地`・巡航にあたるものは `src/taxonomy/` の外に1つも無い。**
新体系の規則のうち、**現在地を要求するもの**が動かない:

| 規則 | 中身 |
|---|---|
| D1（需要表4行） | 向く土地が今いる島の気候と合う品は売れやすい |
| D2 | よその島の産の品は目に留まりやすい |
| U3・U4 | 島の商人が並べる品（場所の条件） |

R5（同じ島の産を並べると集客）と層1の隣接規則は**現在地なしでも動く**。

---

## Question 1
どこまで繋ぎますか。

A) **現在地を固定して繋ぐ**（暫定でハルヴェラ）**【推奨】**
   122品・積み上げ価格・層1の隣接規則・店全体の効き目・R5 が**すべて動く**。
   需要表は1行だけ効く。**巡航は別 issue** にする。
   **いま作ったものが画面に出る**のが最短。#25（時間モデル）にも依存しない
B) **巡航も作る**（10日ごとに島が変わる）
   4島ぶんの需要表と入荷解禁が動く。ただし**#25（一日の定義・加工による時間経過）が未確定**で、
   そこが決まらないと10日を数えられない。**接続と新機能を同時にやることになる**
C) **島まわりを外して繋ぐ**（品・価格・層1の隣接規則だけ）
   D1・D2・U3・U4・R5 を無効にする。**いちばん小さいが、島の個性が何も出ない**
X) Other（[Answer]: の後に記述してください）

[Answer]: 

---

## 実行計画（Question 1 = A の場合）

### 段1 — 型と登録
- [ ] `ItemRegistry` を `src/taxonomy` の `ItemDef` に載せ替える
- [ ] 旧 `ItemDef` の `price` / `purchasePrice` を**導出**（`salePrice` / `purchasePrice`）に差し替え
- [ ] 旧 `ItemDef.adjacencyBonuses`（**ItemId 直書き**）を廃止 — #19 の本丸
- [ ] 旧 `ItemDef.baseSaleProb` を廃止（売れやすさは規則側の倍率で出す）

### 段2 — 規則の評価
- [ ] `AdjacencyEngine` を `evaluate()` の呼び出しに置き換える
      （隣接判定は `adjacentPairs` が持っている。`DisplaySlot` → `Placement` の変換だけ書く）
- [ ] `CustomerSimulator` を `Modifiers`（売れやすさ・値段・集客）で動かす
- [ ] **`店全体` の効き目を通す**（新機構。現行は品ごとにしか効かない）

### 段3 — 入荷
- [ ] `GameState`（`現在地` ＋ `累計販売数`）を持つ場所を作る
- [ ] `PurchaseMenu` を `stockedByIslandMerchant` で組む（固定品揃え → 解禁つき）
- [ ] 売れた品を `累計販売数` に積む（U2 の解禁条件がこれを読む）

### 段4 — 旧実装の撤去
- [ ] `src/data/items.ts`（13品）と `src/data/recipes.ts` を削除
- [ ] 旧IDを使っている**テスト5本**を新品IDへ移行
      （Inventory / CraftingSystem / FloorGrid / AdjacencyEngine / CustomerSimulator）
- [ ] `types/index.ts` の `AdjacencyBonus` を整理（`bonusType` 3種 → `Modifiers` へ）

### 段5 — 確認
- [ ] `npm test` 全件パス ／ `npx tsc --noEmit` ／ `npm run build`
- [ ] **実際に起動して、122品が画面に出て売れることを確認する**

---

## 予想される影響

- **既存テストは壊れる。**5本が旧13品のIDに依存している。**これは移行であって回帰ではない**
- `AdjacencyEngine` は**役目がほぼ無くなる**（隣接判定は taxonomy 側にある）。薄い変換だけ残すか、消す
- **価格が変わる。**旧は手書き（小麦粉30など）、新は積み上げ。**ゲームの手応えは確実に変わる**
