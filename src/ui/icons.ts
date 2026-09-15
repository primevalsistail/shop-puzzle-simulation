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
 * ⚠ **`advance`（三角）と `pause`（縦棒2本）は1つのボタンの表と裏。**
 *   **高さと上端をそろえて描いてある**（どちらも 163px・上端 y=48）ので、
 *   **片方だけ描き直すと、押すたびに絵が伸び縮みして見える。**
 */
export const ICON_KEYS = [
  'save', 'load', 'preset', 'options', 'help', 'trade', 'craft', 'advance', 'pause',
] as const
export type IconKey = typeof ICON_KEYS[number]

const BASE = import.meta.env.BASE_URL

export function iconPath(key: IconKey): string {
  return `${BASE}art/icon/${key}.png`
}

/**
 * **`進める` ／ `停止` を絵にしてよいか。**
 *
 * ⚠ **2つ一緒にしか切り替わらない。**`false` にすると `▶` `⏸` の字に戻り、
 *   **片方だけ絵になることがない**（`⏸` はフォントに無い環境があり、□ で出る）。
 *   取り下げるときもこの1行だけ（写した絵は消さない。`CUSTOMER_ART_READY` と同じ形）。
 */
export const ADVANCE_ICON_READY = true
