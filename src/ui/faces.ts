import type { IslandName } from '../taxonomy/islands.js'
import { ROUTE } from '../taxonomy/islands.js'
import type { CustomerType } from '../taxonomy/customers.js'
import { CUSTOMER_TYPES } from '../taxonomy/customers.js'

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

// ─── 来店客（#21） ────────────────────────────────────────────

/**
 * ⚠ **絵が揃うまで `false`。**`BootScene` はこの旗が立つまで来店客の絵を読み込まず、
 *   **キャラ帯は人の形のまま**出る（無い絵を読ませると 404 が並ぶ）。
 *
 * **絵が届いたときにやること**: 原本（`aidlc-docs/.../art/sd/customer/`）の24枚を
 * `public/art/sd/customer/` へ写し、**ここを `true` にする。それだけ。**
 */
export const CUSTOMER_ART_READY = false

/** 年ごろ → 絵のファイル名。⚠ **`customers.ts` の6通りと1対1**（片方だけ増やさない） */
const CUSTOMER_ART_NAME: Readonly<Record<CustomerType, string>> = {
  男子: 'boy', 女子: 'girl',
  男性: 'man', 女性: 'woman',
  老人男性: 'oldman', 老人女性: 'oldwoman',
}

/** 島 → 絵のファイル名 */
const ISLAND_ART_NAME: Readonly<Record<IslandName, string>> = {
  ハルヴェラ: 'halvera',
  リナツィア: 'linatia',
  ノアキータ: 'noakita',
  ミフユリア: 'mifuyria',
}

/** 来店客の立ち姿の名札。**162×138**（キャラ帯の下半分に等倍で3つ並ぶ） */
export function customerKey(island: IslandName, type: CustomerType): string {
  return `sd-customer-${ISLAND_ART_NAME[island]}-${CUSTOMER_ART_NAME[type]}`
}

export function customerPath(island: IslandName, type: CustomerType): string {
  return `${BASE}art/sd/customer/${ISLAND_ART_NAME[island]}-${CUSTOMER_ART_NAME[type]}.png`
}

/** 24枚（四つの島 × 6通り）。`BootScene` が読み込む列 */
export const CUSTOMER_ART: readonly { key: string; path: string }[] =
  ROUTE.flatMap(island => CUSTOMER_TYPES.map(type => ({
    key: customerKey(island, type),
    path: customerPath(island, type),
  })))

/**
 * 仕入れ先（島の商人）。⚠ **出典は [`characters.md`](../../aidlc-docs/inception/worldbuilding/characters.md) の商人の表。**
 */
export const ISLAND_MERCHANT_FACE: Readonly<Record<IslandName, FaceKey>> = {
  ハルヴェラ: 'rene',
  リナツィア: 'sadi',
  ノアキータ: 'korna',
  ミフユリア: 'orv',
}
