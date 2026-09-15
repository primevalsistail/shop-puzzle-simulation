# 加工が営業時間を削ることを、作る前に知らせる（#109）

## 目的

**作る前に「店を開けている時間が何分減るか」を出し、そこで止まれるようにする。**

## 決まっていること（出典）

- **#109 のコメント（PO）: 「ダイアログ」。**常設の字で毎行に出すのは却下済み（PO 指示 2026-09-14）
- **[questions-measured-three.md](../../sessions/questions-measured-three.md) Question 2 = A**
  （2026-09-15）。**仕組みは触らない。止めどきを知らせるだけにする**
- **測った数**: 昼間にも作らせると、営業600分のうち 258〜276分を失い、
  200日目の所持金が 324万 → 2.5万まで落ちる（`13fd4af`）。**知らせる価値はここにある**
- **削る分は `CraftingSystem.businessMinutesFor(recipeId, times)` が既に出している**
  （`TimeManager.openMinutesWithin`）。**新しい計算を足さない**

## 今回決めないこと

- **仕組みそのもの**（削る分を減らす／営業中は作れなくする）。**Question 2 で A を選んでいる**
- **確認の ON/OFF の設定画面**（#113 の範囲）。**表に1行足すところまで**

## やること

1. `src/ui/workshop.ts`（新規・Phaser を読まない）に
   `craftBusinessConfirmLines(itemName, times, businessMinutes)` を置く。**2行**
2. `ConfirmDialog.ConfirmAction` に `'営業時間を削る加工'` を足し、`CONFIRM_ON` を `true` に
3. `CraftMenu.craft()` を `askCraft()` 経由にする。
   **`businessMinutesFor` が 0 なら今までどおり即座に作る**（朝と夜の加工に確認は出さない）
4. ⚠ **確認を出している間は回数の `<input>` と検索の欄を隠す**（`PresetMenu` と同じ理由。
   HTML は canvas より上に出るので depth では沈まない）。`SearchBox.setVisible()` を足す

## 受入条件

- **営業時間を1分も削らないときは確認が出ない**（`fitsBeforeOpen` と同じ判定）
- **出す文がいちばん長い組み合わせでも面からはみ出さない**（`CONFIRM_TEXT_MAX_W`）
- **確認の要否は `confirmNeeded('営業時間を削る加工')` 1箇所**（#113 の受け口）
- 既存 794本が通ること
