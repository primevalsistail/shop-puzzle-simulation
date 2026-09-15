# 確認ダイアログを行為ごとに切り替える設定画面（#113）

## 目的

**「確認を出すか」を行為ごとに ON/OFF できる設定画面を作る。**
判定の口（`confirmNeeded()`）と表（`CONFIRM_ON`）は既にあり、**画面から書き換える手段だけが無い。**

## いまの状態（実物）

**受け口**: [src/ui/ConfirmDialog.ts:28-54](../../../src/ui/ConfirmDialog.ts#L28-L54)

```ts
export type ConfirmAction = '廃棄' | 'マイセットの上書き' | 'マイセットの削除' | '営業時間を削る加工'
const CONFIRM_ON: Record<ConfirmAction, boolean> = { … }   // 既定は全部 true
export function confirmNeeded(action: ConfirmAction): boolean { return CONFIRM_ON[action] }
```

**押す側は全部この関数を通っている**（3ファイル・4箇所）:

| 行為 | 場所 |
|---|---|
| 廃棄 | [DeliveryTab.ts:216](../../../src/ui/DeliveryTab.ts#L216) |
| マイセットの上書き | [PresetMenu.ts:303](../../../src/ui/PresetMenu.ts#L303) |
| マイセットの削除 | [PresetMenu.ts:320](../../../src/ui/PresetMenu.ts#L320) |
| 営業時間を削る加工 | [CraftMenu.ts:460](../../../src/ui/CraftMenu.ts#L460) |

**開き口も既にある** —— 上段の **⚙️** ボタン（[GameScene.ts:657](../../../src/scenes/GameScene.ts#L657)）。
いまは `オプション: 準備中` と出すだけなので、**ここを差し替える。**

## 決定済みの前提と出典

- **PO 指示（#113 本文）**: 「それぞれの行為で確認ダイアログを出すか ON/OFF できるようにしたい。
  **デフォルトはすべて ON**」
- **⚙️ から開く。**新しいボタンは足さない（上段は5つで埋まっている）
- **面の作りは既存に合わせる** —— **全画面の暗幕 ＋ 画面中央の不透明な面**。
  この形は `Tutorial` ／ `SaveLoadMenu` ／ できごとの窓 ／ `ConfirmDialog` の4つで、
  **5つ目の形を作らない**（`MessageWindow` の注記）
- **覚えさせ方は `localStorage`。**`Tutorial` と同じ形にする
  （[Tutorial.ts:34-40](../../../src/ui/Tutorial.ts#L34-L40) と `:122-128`）。
  ⚠ **読み書きは必ず `try/catch` で囲む**（`Tutorial` がそうしている）
- **深さ（重なり順）**: `SaveLoadMenu` が 150、`ConfirmDialog` が 130、幕が 200。
  **設定は 150 と同じ帯**（どこからでも開くものなので、場所の画面より上）

## やること

1. `ConfirmDialog.ts` の `CONFIRM_ON` を**読み書きできる形にする**
   （`setConfirmNeeded(action, on)` を足す。`confirmNeeded()` の呼び手は変えない）
2. **`localStorage` から起動時に読み、変えたら書く**
3. **`OptionsMenu`** を作り、⚙️ から開く。
   **行は `ConfirmAction` の値から作る**（型に行為を足したら、設定の行も自動で増える）
4. 寸法・字の大きさは **`layout.ts` に定数を置く**（`ui/` に直値を書かない）

## 触らないもの

- **`package.json`**
- `confirmNeeded()` の**呼び手4箇所**（判定の口は変えない）
- `ConfirmDialog` 自体の見た目・寸法
- **セーブデータ**（設定は遊びの記録とは別に持つ。枠3つのセーブに混ぜない）

## 受入条件

1. `npx vitest run` が通る（いまは **801本**）
2. **⚙️ で開き、4つの行が出て、切り替えられる**
3. **OFF にした行為は、確認を出さずにそのまま実行される**
4. **ページを開き直しても設定が残る**
5. **`ConfirmAction` に5つ目を足すと、設定の行も増える**（テストで縛る）
6. `layout.test.ts` に、**面の中に文字が収まる**ことの判定を足す

## 確かめ方

- `npm run dev -- --port 5181 --strictPort` で起動して、⚙️ → 切り替え → 実際に廃棄
- ⚠ **ブラウザでの確認手順は `aidlc-docs/aidlc-state.md` の「ブラウザで動かす方法」**にある
- ⚠ **`node_modules` はセッションを跨ぐと消える。**`npm install` から始める

## ⚠ 踏むと痛いところ

- **`<input>` は HTML なので、深さを上げても暗幕の下に回らない。**
  設定を開いている間、**工房の検索欄と回数欄・マイセットの名前欄は隠す**
  （`CraftMenu` が `ConfirmDialog` を開くときに同じことをしている。
  [CraftMenu.ts:470-480](../../../src/ui/CraftMenu.ts#L470-L480) の `openConfirm`）
- **`aidlc-docs/` を `git add aidlc-docs/` でまとめて足さない。**並行セッションがいる。名指しで足す
- **`main` に入った時点で #113 を close する。**コメントにコミットハッシュと実装内容を書く
