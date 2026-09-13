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
