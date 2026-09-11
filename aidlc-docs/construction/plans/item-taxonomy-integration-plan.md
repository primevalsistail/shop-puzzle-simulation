# `src/taxonomy` をゲーム本体に接続する — 実行計画（[#30](https://github.com/primevalsistail/shop-puzzle-simulation/issues/30)）

## 目的

**ゲーム本体が動かすデータを、旧 `src/data/items.ts`（13品）から `src/taxonomy`（122品）へ移す。**
Cycle 4 で作った軸・積み上げ価格・条件規則は、今どこからも呼ばれていない。
これを通すまで、Cycle 4 の成果は1つもプレイヤーに届かない。

## 決定済みの前提と出典

| 前提 | 出典 |
|---|---|
| 今回の対象は #30 | [next-cycle-questions.md](../../inception/plans/next-cycle-questions.md) Q1 = A |
| 接続範囲は **A（現在地を固定）** | 本ファイル Question 1 = A |
| 現在地は **ハルヴェラ**に固定 | 同上 |
| 巡航（10日ごとの島替え）は作らない | [#2](https://github.com/primevalsistail/shop-puzzle-simulation/issues/2) が引き取る |
| 時間モデルは確定済み | #25 / `287268a` |
| **ブラウザ実機確認はこの環境では出来ない** | `aidlc-state.md` Current Status |

## 今回決めないこと

- **数値バランス**（#35 加工時間・#36 買値・#22 利幅）。価格の出方は変わるが、**係数は触らない**
- **巡航**（#2）・**島と日付の表示**（#44）
- **条件言語の拡張**（#31）。`D2`・`U3`・`U4` が評価器側にある歪みは、そのまま持ち越す
- **`AdjacencyEngine` を消すかどうか**。今回は「使わなくする」までとし、削除は段4で判断する
  → **削除した**（隣接は盤面を持つ `FloorGrid` が出すことにしたため）

### 着手後にスコープ外と判断したもの（すべて issue 化済み）

| 判断 | 理由 | issue |
|---|---|---|
| 実機確認をやらない | この環境ではブラウザが動かない | [#47](https://github.com/primevalsistail/shop-puzzle-simulation/issues/47) |
| レシピの解禁を繋がない | 品の解禁（U1・U2）とは別の軸が要る。#30 は品の接続 | [#48](https://github.com/primevalsistail/shop-puzzle-simulation/issues/48) |
| 初期在庫の全品所持を外さない | #42 はユーザー依頼で入れたもの。外すかはPO判断 | [#49](https://github.com/primevalsistail/shop-puzzle-simulation/issues/49) |
| スクロール以上の操作を足さない | 並べ替え・検索は見え方の設計でPO判断 | [#50](https://github.com/primevalsistail/shop-puzzle-simulation/issues/50) |

## 受入条件

1. `npx vitest run` 全件パス（**旧13品IDに依存するテストは新品IDへ移行する。これは移行であって回帰ではない**）
2. `npx tsc --noEmit` ／ `npm run build` 成功
3. `src/data/items.ts` ・ `src/data/recipes.ts` が**リポジトリから消えている**
4. `src/` 全体の grep で、旧 `ItemDef.adjacencyBonuses` ・ `baseSaleProb` の参照が**0件**
5. 仕入れメニューに並ぶ品が `stockedByIslandMerchant`（ハルヴェラ）の結果と**一致する**
6. **⚠ 満たせないもの**: 「起動して122品が売れるのを目で見る」。
   この環境ではブラウザが動かないので、**1〜5 までしか保証しない。実機確認は残作業として明記する**

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
   4島ぶんの需要表と入荷解禁が動く。**接続と新機能を同時にやることになる**
   **⚠ 2026-09-11 追記: この選択肢の前提は変わった。**
   ここに書いていた「#25（一日の定義・加工による時間経過）が未確定」は**もう成立しない**。
   #25 は `287268a` で main に入り、`TimeManager` が日を数えられる。
   **それでも B を採らないのは、接続と新機能を分けるため**であって、時間モデルが無いからではない
C) **島まわりを外して繋ぐ**（品・価格・層1の隣接規則だけ）
   D1・D2・U3・U4・R5 を無効にする。**いちばん小さいが、島の個性が何も出ない**
X) Other（[Answer]: の後に記述してください）

[Answer]: A（2026-09-11）

**出典**: [next-cycle-questions.md](../../inception/plans/next-cycle-questions.md) Q1 へのユーザー回答
「優先度の高いものをこなしたい。推奨ないしはissueの中で優先して解決するべき事象を対応したい」。
これを推奨への委任と読み、**両方の質問で A** とした。
**巡航は #2 が引き取る**（このサイクルでは作らない）。**現在地はハルヴェラに固定**する。

---

## 実行計画（Question 1 = A）

### 技術判断 — 橋渡しの方式

**本体の `ItemDef` を捨て、`src/taxonomy/axes.ts` の `ItemDef` をそのまま使う。**
アダプタ（起動時に taxonomy から旧 `ItemDef` を組み立てる）は採らない。
理由: アダプタは `salePrice()` の**導出結果を `price` という固定フィールドに焼き付ける**ことになり、
[item-system-lessons](../../../CLAUDE.md) が戒めた「導出結果を一次情報扱いする」型に戻る。
差し替えの手間も実測で小さい（`.name` / `.color` / `.itemType` 等の参照は**本体全体で14箇所**）。
**この選択でプレイヤーの体験は変わらない**ので技術判断とした。

### 段1 — 型と登録
- [x] `ItemRegistry` を `src/taxonomy` の `ItemDef` / `RecipeDef` で持つように変える
- [x] 旧 `ItemDef.price` → `salePrice(item)`、`purchasePrice` → `purchasePrice(item)`（`derive.ts`）
- [x] 旧 `ItemDef.adjacencyBonuses`（**ItemId 直書き**）を廃止 — #19 の本丸
- [x] 旧 `ItemDef.baseSaleProb` を廃止（売れやすさは規則側の倍率で出す）
- [x] `itemType` は `tier(id) === 1 ? 'material' : 'product'` で出す（旧フィールドは持たない）
- [x] `item.name` → `item.display.name`、`item.color` → `item.display.color`（**14箇所**）

### 段2 — 規則の評価
- [x] `GameService.onMinutePassed` を `evaluate(placements, state)` の呼び出しに置き換える
      （`DisplaySlot` → `Placement` の変換だけ書く。隣接判定は `adjacentPairs` が持っている）
- [x] `CustomerSimulator` を `Modifiers`（売れやすさ・値段・集客）で動かす
      — `finalModifiers(result, slotId)` を使う
- [x] **`店全体` の効き目を通す**（新機構。現行は品ごとにしか効かない）
- [x] `AdjacencyEngine` は**削除した**（段4の判断）。隣接は盤面を持つ `FloorGrid` が出す
- [x] **⚠ 計画に無かった修正**: `evaluate()` 既定の `adjacentPairs` は品の**回転前**のかたちで
      隣接を見るため、**回転した品があると隣接を取り違える**。`Placement` が回転を持たないのが原因。
      `evaluate()` に**隣接の組を外から渡せる引数を足し**（既定は従来どおり）、
      `FloorGrid.getAdjacentSlotIds` が実際の占有升目で出した組を `GameService` が渡す。
      既存の呼び出しと taxonomy 側のテストは無傷

### 段2.5 — リストが品数に耐えるようにする（**着手後に判明。計画に無かった**）

**実測**: 仕入れ **18品**（ハルヴェラ・累計販売0の時点）／ 在庫の加工品 **72品** ／ レシピ **72本**。
**現行の3つのリストはスクロールを持たない。**固定位置に等間隔で並べるだけで、
在庫パネルは1品70px、クラフトは1行に固定高、仕入れは56px間隔。
今は8品・5レシピなので成立しているが、**72件を並べると画面外に出て届かない。**
繋いでも触れないので、受入条件5（仕入れ品が `stockedByIslandMerchant` と一致）を目で確かめられない。

- [x] 在庫パネル・クラフトメニュー・仕入れメニューに**ホイールでのスクロール**を入れる
- [x] 在庫パネルの絞り込みを `category`（食品・飲物・雑貨・素材）から
      **`主種類`（食料・飲みもの・衣類・道具）** に張り替える。旧 `category` は新体系に無い

**⚠ これはプレイヤーの見え方が変わる変更で、本来はPO判断。**
繋ぐために不可欠なので**いちばん単純な形（ホイールのみ。ページ送り・検索窓は作らない）で入れた。**
ページ送り・並べ替え・検索を足すかは [#50](https://github.com/primevalsistail/shop-puzzle-simulation/issues/50)。

### 段3 — 入荷
- [x] `GameState`（`現在地: 'ハルヴェラ'` ＋ `累計販売数`）を持つ場所を作る
- [x] `PurchaseMenu` を `stockedByIslandMerchant` で組む（固定品揃え → 解禁つき）
- [x] 売れた品を `累計販売数` に積む（U2 の解禁条件がこれを読む）
- [x] `SaveData` に `累計販売数` を載せる（積まないとセーブで解禁が巻き戻る）
- [x] **⚠ 計画に無かった修正**: 在庫パネルを**加工品だけ → 全品**に変えた。
      旧体系では素材は加工の材料でしかなかったが、新体系では**素材にも売値・かたち・需要の規則がかかる**。
      島の商人が序盤に並べるのは素材だけ（U1）なので、素材を出さないと**買った品を1つも置けない**

### 段4 — 旧実装の撤去
- [x] `src/data/items.ts`（13品）と `src/data/recipes.ts` を削除
- [x] 旧IDを使っているテストを新品IDへ移行
      （Inventory / CraftingSystem / FloorGrid / CustomerSimulator / ItemRegistry / GameProgress）
- [x] `types/index.ts` の `AdjacencyBonus` を整理（`bonusType` 3種 → `Modifiers` へ）
- [x] `AdjacencyEngine` の去就を決める（薄い変換だけ残すか、消すか）

### 段5 — 確認
- [x] `npx vitest run` 全件パス ／ `npx tsc --noEmit` ／ `npm run build`
- [x] 受入条件 4（旧フィールド参照0件）・5（仕入れ品が `stockedByIslandMerchant` と一致）を grep / テストで確かめる
- [x] **⚠ 実機確認は出来なかった。**残作業として issue に切り出した

---

## 結果（2026-09-11）

**172テスト全件パス**（実装前は162）／ `npx tsc --noEmit` ／ `npm run build` 成功。

| 受入条件 | 結果 |
|---|---|
| 1. テスト全件パス | ✅ **172件**。旧13品IDに依存していた6ファイルを新品IDへ移行 |
| 2. `tsc` / `build` | ✅ |
| 3. `src/data/` が消えている | ✅ `items.ts` / `recipes.ts` ともに削除。`AdjacencyEngine` も削除 |
| 4. 旧フィールドの参照0件 | ✅ 残るのは**なぜ消したかを書いた注記のみ**（コードの参照は0） |
| 5. 仕入れ品が `stockedByIslandMerchant` と一致 | ✅ `GameScene` が直接呼ぶ。データ側は `WorldState.test.ts` が検査 |
| 6. 起動して目で見る | ❌ **未了**。この環境ではブラウザが動かない → [#47](https://github.com/primevalsistail/shop-puzzle-simulation/issues/47) |

**実測**: ハルヴェラ・累計販売0の時点で仕入れに並ぶのは **18品**（すべて tier1）。
売った実績が付くと U2 で加工品が並び始める。

---

## 予想される影響

- **既存テストは壊れる。**旧13品のIDに依存しているものがある。**これは移行であって回帰ではない**
- `AdjacencyEngine` は**役目がほぼ無くなる**（隣接判定は taxonomy 側にある）
- **価格が変わる。**旧は手書き（小麦粉30など）、新は積み上げ。**ゲームの手応えは確実に変わる**
- **仕入れに並ぶ品が変わる。**固定の材料一覧 → ハルヴェラの商人が並べる品（tier と累計販売数で解禁）
- **#19・#22 が閉じられる状態になる**（本体が新体系で動くため）
