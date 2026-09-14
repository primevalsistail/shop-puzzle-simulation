import type { IslandName } from '../taxonomy/islands.js'

/**
 * 画面に出す絵の名札と、その置き場（#15・#21）。
 *
 * ⚠ **原本は `aidlc-docs/inception/worldbuilding/art/` にある。**`public/art/` はそこからの写しで、
 *   **配るためだけのもの。**絵を描き直したら原本を直し、`public/` へ写す（逆をしない）。
 * ⚠ **誰を出すかは `characters.md` が正。**ここはその写しなので、人が入れ替わったら
 *   **向こうを直してからここへ持ってくる。**
 */

/** 顔絵。**252×370。**`CHAR_ART_*` の枠（255×約420）にそのまま収まる */
export const FACE_KEYS = [
  'noela', 'rene', 'sadi', 'korna', 'orv', 'baren', 'izel', 'nem', 'terena',
] as const
export type FaceKey = typeof FACE_KEYS[number]

/** 店番の立ち姿。**162×216。**キャラ帯の上半分（165×約458）に収まる */
export const SHOPKEEPER_KEY = 'sd-noela-shopkeeper'

/**
 * ⚠ **`vite.config.ts` の `base` が `/` ではない**ので、`/art/...` と直に書くと配った先で 404 になる。
 *   **`BASE_URL` を頭に付けること。**
 */
const BASE = import.meta.env.BASE_URL

export function facePath(key: FaceKey): string {
  return `${BASE}art/face/${key}.png`
}

export function shopkeeperPath(): string {
  return `${BASE}art/sd/noela_shopkeeper.png`
}

/**
 * 仕入れ先（島の商人）。⚠ **出典は [`characters.md`](../../aidlc-docs/inception/worldbuilding/characters.md) の商人の表。**
 */
export const ISLAND_MERCHANT_FACE: Readonly<Record<IslandName, FaceKey>> = {
  ハルヴェラ: 'rene',
  リナツィア: 'sadi',
  ノアキータ: 'korna',
  ミフユリア: 'orv',
}
