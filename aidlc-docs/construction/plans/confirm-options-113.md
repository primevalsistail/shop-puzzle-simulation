# 確認ダイアログを行為ごとに切り替える設定画面（#113）

## 目的

**「確認を出すか」を行為ごとに ON/OFF できる設定画面を作る。**
判定の口（`confirmNeeded()`）と表（`CONFIRM_ON`）は既にあり、**画面から書き換える手段だけが無い。**

## いまの状態（実物）

**受け口**: [src/ui/ConfirmDialog.ts:28-54](../../../src/ui/ConfirmDialog.ts#L28-L54)

```ts
export type ConfirmAction = '廃棄' | '型の上書き' | '型の削除' | '営業時間を削る加工'
const CONFIRM_ON: Record<ConfirmAction, boolean> = { … }   // 既定は全部 true
export function confirmNeeded(action: ConfirmAction): boolean { return CONFIRM_ON[action] }
```

**押す側は全部この関数を通っている**（3ファイル・4箇所）:

| 行為 | 場所 |
|---|---|
| 廃棄 | [DeliveryTab.ts:216](../../../src/ui/DeliveryTab.ts#L216) |
| 型の上書き | [PresetMenu.ts:303](../../../src/ui/PresetMenu.ts#L303) |
| 型の削除 | [PresetMenu.ts:320](../../../src/ui/PresetMenu.ts#L320) |
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
  設定を開いている間、**工房の検索欄と回数欄・型の名前欄は隠す**
  （`CraftMenu` が `ConfirmDialog` を開くときに同じことをしている。
  [CraftMenu.ts:470-480](../../../src/ui/CraftMenu.ts#L470-L480) の `openConfirm`）
- **`aidlc-docs/` を `git add aidlc-docs/` でまとめて足さない。**並行セッションがいる。名指しで足す
- **`main` に入った時点で #113 を close する。**コメントにコミットハッシュと実装内容を書く

---

## 結果（2026-09-15・実装ずみ）

**受入条件6つはすべて満たした。**

| | 受入条件 | 結果 |
|---|---|---|
| 1 | `npx vitest run` が通る | ✅ **839本**（801 → +38） |
| 2 | ⚙️ で開き、4つの行が出て切り替わる | ✅ ブラウザで確認（`/tmp/shots/o113t/01-open,03-craft-off`。**つまみが右・濃い＝出す／左・薄い＝出さない**） |
| 3 | OFF にした行為は確認なしで実行 | ✅ 「営業時間を削る加工」を切にして加工 → **窓が出ずに完了**（`/tmp/shots/o113u/02-after.png`。記録の最終行「蕎麦粉をつくる ×33回 完了！99個入手（330分）」） |
| 4 | 開き直しても残る | ✅ 読み直しのあとも `["営業時間を削る加工"]` のまま |
| 5 | 行為を足すと設定の行も増える | ✅ `OptionsMenu.test.ts`（行は `options.ts` が `CONFIRM_ACTIONS.map` で作る。画面側に名前を書き写すことを禁じた） |
| 6 | 面の中に文字が収まる | ✅ `layout.test.ts`「オプションの面」10件。**実際に並ぶものを `optionSections()` から取って測るので、足したぶんが自動で判定に入る** |

### 計画から変えたところ

- ⚠ **`ConfirmAction` は union 型ではなく `CONFIRM_ACTIONS` 配列を本体にした。**
  **union 型は実行時に数えられない**ので、**そのままでは設定の行を自動で増やせない。**
  型は `typeof CONFIRM_ACTIONS[number]` で作るので、**呼び手4箇所は1文字も変えていない。**
- ⚠ **入／切はトグルのつまみにした**（PO 指示 2026-09-15）。「出す」「出さない」の2つのボタンを
  並べる形をやめた。**つまみの位置と色が状態そのもの**なので、**押したら面ごと作り直す。**
- ⚠ **設定に何が並ぶかを `src/ui/options.ts` に分けた**（PO 指示 2026-09-15
  「今後オプションは追加される可能性がある」）。**`OptionsMenu` は並べるだけで、何があるかを知らない。**
  **オプションを足すのは `options.ts` の1箇所**で、区分（見出し）ごとに項目を並べる。
  **面の高さは中身から出す**ので、足したぶん縦に伸びる ——
  **画面に収まらなくなったら `layout.test.ts` が落ちる。**
  ⚠ **入／切でないもの**（音量のような幅のある値、3つ以上から選ぶもの）**が要るようになったら、
  `OptionSwitch` の隣に型を足すこと。**旗を足して兼用しない。
- ⚠ **`localStorage` に書くのは「出さない」ほうの一覧だけ。**
  ON/OFF の表をそのまま書くと、**あとから行為を足したとき、古い記録に無い行為の既定が決まらない。**
  **「入っていない ＝ 出す」**なら移し替えが要らない（`ConfirmDialog.test.ts` で縛った）。

### 触った範囲

| ファイル | 中身 |
|---|---|
| `src/ui/ConfirmDialog.ts` | `CONFIRM_ACTIONS` ／ `setConfirmNeeded` ／ `localStorage` の読み書き |
| `src/ui/OptionsMenu.ts` | **新規。**⚙️ から開く面（並べて描くだけ） |
| `src/ui/options.ts` | **新規。**設定に並ぶもの一覧（**足すのはここ**。Phaser を読まない） |
| `src/ui/layout.ts` | `OPTIONS_*`（寸法・字の大きさ・画面に出す字）と `optionsLayout()`（中身から面の高さと位置を出す） |
| `src/scenes/GameScene.ts` | ⚙️ の差し替え ／ `isOverlayOpen` ／ `isShelfBlocked` ／ ESC |
| `src/ui/ConfirmDialog.test.ts` ／ `OptionsMenu.test.ts` ／ `layout.test.ts` | テスト38本 |
