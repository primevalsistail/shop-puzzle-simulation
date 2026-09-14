# 絵の置き場（設計資料）

**主人公ノエラの画風候補・配色候補・三面図をここに置く。**
依頼書 → [prompt-noera-visual.md](../prompts/prompt-noera-visual.md)

⚠ **直下の `v3-*.png` は設計資料であって、ゲームが読む場所ではない。**
三面図は**画面に出す絵ではなく、そこから外れていないかを照合するための設計図。**

⚠ **`face/` と `sd/` は画面に出す絵そのもの**（2026-09-14 に納品）。
**ただし、まだゲームは読んでいない**（`BootScene` の `preload` は空のまま）。
**読み込み先をどこにするかは別サイクルで決める。**ここは受け取った原本の置き場。

## `face/` — 顔絵（**252 × 370**）

右パネルの、時計と所持金の下に出す。**9人ぶん。**

`baren` ／ `izel` ／ `korna` ／ `nem` ／ `noela` ／ `orv` ／ `rene` ／ `sadi` ／ `terena`

## `sd/` — 立ち姿

| ファイル | 大きさ | 出る場所 |
|---|---|---|
| `noela_shopkeeper.png` | **162 × 216** | キャラ帯の上半分（店番）。⚠ **主人公だけ** |
| `*_customer.png`（9枚） | **162 × 138** | キャラ帯の下半分（来店客）。**縦に3枠** |

⚠ **来店客はまだ画面に出せない。**`CharacterStrip.addCustomer` を呼ぶ側が無く、
**客は1ゲーム分で消える**（滞在時間を持っていない）ので、**出すには滞留の仕組みが要る。**

⚠ **名前のある9人の `*_customer.png` とは別に、名前を持たない来店客24体を作る。**
**置き場は `sd/customer/`**（**四つの島 × 6通り** ＝ `halvera-boy` … `mifuyria-oldwoman`）。
**6通りは 男子・女子・男性・女性・老人男性・老人女性**（PO 指定 2026-09-14）。
**12体は納品済み**（`halvera-boy` ほか。⚠ **`1`〜`3` の名で届いたものを、6通りの名に改めた**）。
**残り12体は、済んだ絵を見本に添えて追加で頼む。**
依頼書 → [handoff-customers.md](../prompts/handoff-customers.md)

寸法の根拠と納品条件 → [handoff-art-size.md](../prompts/handoff-art-size.md)

## 設計資料（主人公の検討過程）

| 段 | ファイル |
|---|---|
| **Step 1** | `v3-full.png`（⚠ **全身1枚だけ**） |
| Step 2 | `v3-color-1.png` ／ `v3-color-2.png` ／ `v3-color-3.png` |
| Step 3 | `v3-front.png` ／ `v3-side.png` ／ `v3-back.png` |

⚠ **第1版・第2版の絵はすべて削除した**（PO 判断 2026-09-13。どちらも駄作だった）。
**何が出たかの記述だけ**が [prompt-noera-visual.md](../prompts/prompt-noera-visual.md) §1 に残っている。
**記述まで消すと、同じ依頼書をまた書く。**
