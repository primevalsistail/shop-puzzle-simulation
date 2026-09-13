# #93 / #94 —— 目標・GAME OVER の判定と、エンドレスの旗

**作成**: 2026-09-14 ／ **ブランチ**: `feat/resolution-10` の続き
**issue**: #93（棚が空だと幕も GAME OVER も出ない）／ #94（`∞ endless` が戻らない）

---

## 目的

**詰んだのに画面が何も言わない状態と、ロードで現在地と表示が食い違う状態を消す。**

⚠ **どちらも #7 で入った不具合ではない。**前からある形を直す。

---

## 決定済みの前提（調べて確かめた。出典つき）

| | 事実 | 出典 |
|---|---|---|
| **判定が売買の中にある** | `GameService.onMinutePassed()` は `if (!isOpen) return` と `if (slots.length === 0) return` の**後ろ**で目標と GAME OVER を見ている | `src/services/GameService.ts:47-73` |
| ⚠ **入出金は必ずイベントを出している** | `EconomyManager` の `addRevenue` / `addIncome` / `spend` / それ以外**すべて**が `ECONOMY_MONEY_CHANGED` を出す | `src/components/economy/EconomyManager.ts:32,48,57,68` |
| **エンドレスの旗を降ろす口が無い** | `GameService` は `enterEndlessMode()` だけ。`GameProgress` には**両方向の口がある**（`setEndlessMode(value)`） | `GameService.ts:107` ／ `GameProgress.ts:130` |
| **ロードが片道** | `if (data.isEndlessMode) { … }` に **else が無い** | `src/scenes/GameScene.ts:322-325` |
| **セーブには既に入っている** | `SaveData.isEndlessMode` | `src/types/index.ts:106` |

---

## ⚠ #97 と噛み合うので、先に書いておく

**#97（商船の購入＝エンディング）の PO 判断に「目標額に届いたら自動で出る幕はやめる」がある**
（`aidlc-docs/sessions/questions-96-97.md:53`）。

⚠ **つまり #93 の「目標達成の幕が出ない」半分は、#97 で消える側である。**
**#93 の本文も「痛いのは GAME OVER のほう」と言っている。**

**それでも今回は両方直す。**判定を1箇所へ出す作業は同じで、
**#97 が来たら目標側の1行を消すだけ**になるため。⚠ **#93 を閉じるとき、このことをコメントに書く。**

---

## 今回決めないこと

- ⚠ **#97 そのもの**（商船の購入・改装への行の追加・自動の幕の廃止）
- ⚠ **GAME OVER になった後どうなるか**（やり直し・続行の導線）。**いまの挙動のまま**
- ⚠ **確認用の `M`（金+100万）が判定を通らない件。**
  #93 本文が「これは確認用の道具の話で、こことは別」と言っている。
  ⚠ **ただし、今回の直しで `M` も判定を通るようになる**（`EconomyManager` に直接入れても
  `ECONOMY_MONEY_CHANGED` は出るため）。**そうなったことを close コメントに書く**

---

## やること

### #93 —— 判定を売買の中から出す

**`GameService` に、所持金だけを見る判定を1本作る。**
**`ECONOMY_MONEY_CHANGED` を購読して呼ぶ**（購読の場所は `GameScene` か `GameService` か、
**実装する側が読んで決めてよい。既存の購読の置き方に揃える**）。

⚠ **満たすこと**
- **棚が空でも出る**
- **閉店中でも出る。**⚠ **目標も破産も営業時間と関係が無い**（#93 本文）
- ⚠ **同じ幕を2回出さないこと。**`ECONOMY_MONEY_CHANGED` は1分に何度も飛ぶ
- ⚠ **`isEndlessMode` が立っているときは出さない**（いまと同じ）
- ⚠ **`onMinutePassed` の中の古い判定は消す**（2箇所に増やさない）

### #94 —— エンドレスの旗に、降ろす口を付ける

- **`GameService` に旗を設定する口を足す**（`enterEndlessMode()` は残してよい）
- **`GameScene` のロードで、`data.isEndlessMode` を*そのまま*反映する**（`true` も `false` も）
- ⚠ **`GameProgress.setEndlessMode()` も同じ値で揃える**
- ⚠ **自由航行のほうも見ること。**`GameScene.ts:330` の
  `if (data.isEndlessMode && !this.world.isFreeSailing()) this.world.beginFreeSailing()` も片道に見える。
  **`WorldState` に降ろす口があるか確かめ、無ければ #94 の範囲として足す。**
  ⚠ **`restoreVoyage(null)` で日付からの導出へ戻るなら、それで足りる。確かめてから決める**

---

## 受入条件

1. **棚に品が1つも無く、閉店中でも、所持金が 0 以下になったら GAME OVER が出る**
2. **同じ幕が2回以上出ない**
3. **クリア済みのセーブを読んだあとクリア前のセーブを読むと、`∞ endless` が戻る**
4. **そのあと目標に届いたら、ちゃんと幕が出る**（旗が降りている証拠）
5. **1〜4 それぞれにテストがある**
6. **`npx vitest run` 全件パス ／ `npx tsc --noEmit` ／ `npm run build`**

---

## 触らない範囲

- ⚠ **`src/ui/` と `layout.ts`**（直前の #10 で全面的に触っている。混ぜない）
- ⚠ **`package.json`**
- ⚠ **`aidlc-docs/`**

---

## 途中で出た判断（2026-09-14）

### ⚠ 引き金は `TIME_MINUTE_PASSED`。`ECONOMY_MONEY_CHANGED` にしない（main が差し戻した）

**サブは所持金が動いたら判定する形で実装したが、退行になるので戻した。**

**理由（実測）**: **`EconomyManager.canAfford()` は `this.money >= amount`** なので、
**残金ちょうどの仕入れが通る**（`PurchaseMenu.ts:565`）。**所持金が 0 になり、
`spend()` の `ECONOMY_MONEY_CHANGED` でその場で GAME OVER が出る。棚に品を並べた直後でも出る。**

⚠ **変更前はそうではなかった。**判定は売買ループの**後ろ**にあったので、
**次の1分で客が買えば所持金が戻り、幕は出なかった。**
**「所持金を全部仕入れに突っ込む」は正当な戦略で、それが即死になるのは退行である。**

**#93 本文の指定どおり**「**時間が進んだら**、棚の中身に関わらず見る」にする。
**`TIME_MINUTE_PASSED` の購読で `onMinutePassed()` の直後に呼ぶ** ——
⚠ **順序が要点。売買が先に走るので、売れて戻れば幕は出ない。**
**この購読は `isOpen` で囲われていないので、閉店中も棚が空でも走る**（受入条件1を満たす）。

### 自由航行は片道ではなかった（サブの調査。main が確認）

**`WorldState.restoreVoyage()` は `null` を渡すと自由航行そのものを解く**（`WorldState.ts:147-157`）。
**`GameScene` は条件なしで `restoreVoyage(data.voyage ?? null)` を呼んでおり、
クリア前のセーブは `voyage: null` で保存されている。**
**既存テストもある**（`WorldState.test.ts`）。
⚠ **計画の「無ければ足す」は不要だった。`WorldState` は1行も変えない。**

### ⚠ スコープ外にしたもの → **#118**

**「エンドレスモードへ」を押すと `curtainShown` が戻らず、以降 `<input>` が全部隠れたまま。**
⚠ **前からある不具合で、#93 / #94 とは別の話**（幕の後始末）。
**main が実物で確認して起票した。**
