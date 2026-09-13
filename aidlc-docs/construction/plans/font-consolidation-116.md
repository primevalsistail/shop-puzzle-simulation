# #116 —— 画面に直書きされた `fontSize` 49箇所を `layout.ts` へ寄せる

**作成**: 2026-09-15 ／ **ブランチ**: `feat/resolution-10` の続き
**issue**: #116 ／ **出どころ**: #10 のスコープ外として起票

---

## 目的

**文字の大きさを、寸法と同じ1箇所で持つ。**

`layout.ts` の冒頭にある規則が、フォントについてだけ守られていない状態を解く。

> ⚠ **区画の値をここ以外に書かないこと。**写しを持つと、片方を動かしても
> もう片方が気づかず、**重なっていることをテストが見逃す**

---

## 決定済みの前提

| | 事実 |
|---|---|
| **直書きの数** | **49箇所 / 13ファイル**（`GameScene` 11 ／ `PurchaseMenu` 7 ／ `InventoryPanel` 7 ／ `CraftMenu` 6 ／ `Tutorial` 4 ／ `SaveLoadMenu` 4 ／ `HUD` 3 ／ `CharacterStrip` 2 ／ `PresetMenu`・`PlaceFrame`・`MessageLog`・`FloorRenderer`・`DebugTools` 各1） |
| **`layout.ts` が既に持つ数** | **`*_FONT_PX` が 31個** |
| **名前の付け方** | ⚠ **既にある31個に倣う**。`<場所>_<役割>_FONT_PX`（`HUD_MONEY_FONT_PX` ／ `CRAFT_BTN_FONT_PX` ／ `MSG_SPEAKER_FONT_PX`） |
| **小数がある** | ⚠ **`16.5px` ／ `19.5px` のような小数は #10 の ×1.5 の結果で、正しい値。丸めないこと** |

---

## ⚠ 今回決めないこと

- ⚠ **文字の大きさを1つも変えない。**寄せるだけ。**画面は1ドットも変わらない**
- ⚠ **同じ px だからといって、既にある定数を使い回さないこと。**
  **別の場所の文字なら別の定数にする** —— **使い回すと、片方を動かしたときに
  もう片方が黙って動く。**それは #116 が解こうとしている問題そのもの
- **色（`color:`）・太さ（`fontStyle`）・`padding` は今回の対象外**

---

## 受入条件

1. **`grep -rn "fontSize: '" src --include=*.ts | grep -v '\.test\.'` が 0件**
2. **足した定数はすべて `layout.ts` にあり、`<場所>_<役割>_FONT_PX` の形**
3. ⚠ **値が1つも変わっていない。**寄せる前後で、各行が使う px が同じ
4. **`npx vitest run` 全件パス ／ `npx tsc --noEmit` ／ `npm run build`**
5. ⚠ **画面が変わっていないこと。**
   **`/tmp/pwdriver/res10-shots.mjs` で撮り、寄せる前と画素で突き合わせる**（main がやる）

---

## 触らない範囲

- ⚠ **`src/taxonomy/`**
- ⚠ **`package.json` ／ `aidlc-docs/`**
