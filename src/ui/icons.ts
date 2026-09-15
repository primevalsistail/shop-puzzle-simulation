/**
 * 操作板のボタンの絵（#69）。
 *
 * ⚠ **絵文字をやめた理由は、見た目ではなく読めないこと。**
 *   **フォントに無い環境では `🛒💾📂🗂❓🔨` と `⏸` が豆腐（□）で出る**（2026-09-15 実測）。
 *   `▶` `⚙` はフォントにあるが、**1つの列に絵と字が混ざらないよう、まとめて絵にする。**
 * ⚠ **原本は `aidlc-docs/inception/worldbuilding/art/button-icons/`。**
 *   `public/art/icon/` はそこからの写しで、**描き直したら原本を直してから写す**（逆をしない）。
 *   `faces.ts` と同じ決まり。
 * ⚠ **`vite.config.ts` の `base` が `/` ではない**ので、`/art/...` と直に書くと配った先で 404 になる。
 *   **`BASE_URL` を頭に付けること。**
 */

/**
 * 絵の名札。**ファイル名と同じ。**
 *
 * ⚠ **`pause`（`⏸ 停止`）は待ち。**`進める` は押すと `停止` に変わるので、
 *   **片方だけ絵にすると、押した瞬間に□が出る。**届くまでは両方とも字のまま。
 */
export const ICON_KEYS = [
  'save', 'load', 'preset', 'options', 'help', 'trade', 'craft', 'advance',
] as const
export type IconKey = typeof ICON_KEYS[number]

const BASE = import.meta.env.BASE_URL

export function iconPath(key: IconKey): string {
  return `${BASE}art/icon/${key}.png`
}

/**
 * **`進める` ／ `停止` を絵にしてよいか。**
 *
 * ⚠ **`pause.png` が届いたら `true` にして、絵を写す。**`false` のあいだは
 *   **`▶` `⏸` の字のまま**で、**片方だけ絵になることがない。**
 *   取り下げるときもこの1行だけ（写した絵は消さない。`CUSTOMER_ART_READY` と同じ形）。
 */
export const ADVANCE_ICON_READY = false
