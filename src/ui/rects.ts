/**
 * 矩形の引き算。**破棄ゾーンから盤面をくり抜く**のに使う。
 *
 * ⚠ **なぜ要るか**: 破棄ゾーン（画面の外周 84px）の上端は **y 0〜84**、
 *   盤面の1行目は **y 12〜99**。**1行目の 82% が破棄ゾーンに重なる。**
 *   そのままだと「**棚の品を一番上の行へ動かそうとすると、棚から外れる**」。
 */

export interface Rect {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

/**
 * `outer` から `hole` を取り除いた残りを、**重ならない矩形の集まり**で返す。
 *
 * 重なっていなければ `outer` をそのまま1つ返す。
 * 完全に覆われていれば空を返す。
 */
export function subtractRect(outer: Rect, hole: Rect): Rect[] {
  if (outer.w <= 0 || outer.h <= 0) return []

  const ox2 = outer.x + outer.w
  const oy2 = outer.y + outer.h
  // 重なっている範囲
  const ix = Math.max(outer.x, hole.x)
  const iy = Math.max(outer.y, hole.y)
  const ix2 = Math.min(ox2, hole.x + hole.w)
  const iy2 = Math.min(oy2, hole.y + hole.h)
  if (ix >= ix2 || iy >= iy2) return [outer]

  const out: Rect[] = []
  // 上・下は横いっぱい、左・右はその間だけ。こう切ると重ならない
  if (iy > outer.y) out.push({ x: outer.x, y: outer.y, w: outer.w, h: iy - outer.y })
  if (iy2 < oy2) out.push({ x: outer.x, y: iy2, w: outer.w, h: oy2 - iy2 })
  if (ix > outer.x) out.push({ x: outer.x, y: iy, w: ix - outer.x, h: iy2 - iy })
  if (ix2 < ox2) out.push({ x: ix2, y: iy, w: ox2 - ix2, h: iy2 - iy })
  return out
}

/** その点が矩形の中にあるか（右端・下端は含まない） */
export function contains(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h
}
