import type { GridCell, Rotation } from '../../types/index.js'
import type { ItemDef, ItemId, RecipeDef, Shape } from '../../taxonomy/axes.js'
import { tier, salePrice, purchasePrice, finalPrice } from '../../taxonomy/derive.js'
import type { IslandName } from '../../taxonomy/islands.js'

export type { ItemDef, ItemId, RecipeDef, Shape }

/**
 * 品とレシピの引き当て。
 *
 * ⚠ **型は `src/taxonomy/axes.ts` のものをそのまま使う。**本体側に別の `ItemDef` を持たない。
 *   値段・売れやすさ・隣接ボーナスを**フィールドとして持たせない。**
 *   これらは導出値か規則側の持ち物で、フィールドに持つと `salePrice()` の結果を焼き付けることになり、
 *   **導出結果を一次情報扱いする**ことになる。
 *
 * 値段は `salePriceOf` / `purchasePriceOf` / `finalPriceOf` が **その都度導出する**。
 */
export class ItemRegistry {
  private items: Map<ItemId, ItemDef>
  private recipes: Map<string, RecipeDef>

  constructor(items: readonly ItemDef[], recipes: readonly RecipeDef[] = []) {
    this.items = new Map(items.map(i => [i.id, i]))
    this.recipes = new Map(recipes.map(r => [r.id, r]))
  }

  getItem(id: ItemId): ItemDef {
    const item = this.items.get(id)
    if (!item) throw new Error(`Item not found: ${id}`)
    return item
  }

  has(id: ItemId): boolean {
    return this.items.has(id)
  }

  getAllItems(): ItemDef[] {
    return Array.from(this.items.values())
  }

  /** tier2以上 ＝ レシピを持つ品 */
  getProducts(): ItemDef[] {
    return this.getAllItems().filter(i => this.tierOf(i.id) >= 2)
  }

  /** tier1 ＝ レシピを持たない品 */
  getMaterials(): ItemDef[] {
    return this.getAllItems().filter(i => this.tierOf(i.id) === 1)
  }

  getRecipe(id: string): RecipeDef {
    const recipe = this.recipes.get(id)
    if (!recipe) throw new Error(`Recipe not found: ${id}`)
    return recipe
  }

  getAllRecipes(): RecipeDef[] {
    return Array.from(this.recipes.values())
  }

  // ─── 導出値（フィールドではない） ──────────────────────
  tierOf(id: ItemId): number {
    return tier(id)
  }

  /** 素の売値 */
  salePriceOf(id: ItemId): number {
    return salePrice(id)
  }

  /** 配置の効き目を乗せた実売値。倍率は加工利益にだけ乗る（derive.ts の注記を参照） */
  finalPriceOf(id: ItemId, priceModifier: number): number {
    return finalPrice(id, priceModifier)
  }

  /**
   * 仕入れ値。`at` にいまいる島を渡すと、**その島を産地とする品だけ**安くなる（段4-6）。
   *
   * ⚠ 省くと割引なしの素の買値。**買う画面と持ち物一覧は必ず `at` を渡すこと。**
   *   片方だけ渡すと、同じ品に2つの値段が出ることになる。
   */
  purchasePriceOf(id: ItemId, at?: IslandName): number {
    return purchasePrice(id, at)
  }

  // ─── かたち ───────────────────────────────────────────
  getRotatedShape(shape: Shape, rotation: Rotation): number[][] {
    let result: number[][] = shape.map(row => [...row])
    for (let r = 0; r < rotation; r++) {
      result = this.rotate90CW(result)
    }
    return result
  }

  shapeToOffsets(shape: Shape): GridCell[] {
    const offsets: GridCell[] = []
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 1) {
          offsets.push({ x: col, y: row })
        }
      }
    }
    return offsets
  }

  // Returns offset of the anchor cell (closest to centroid in rotation 0) after the given rotation.
  // The SAME physical cell is tracked across all rotations so the cursor never jumps.
  getAnchorOffset(shape: Shape, rotation: Rotation): GridCell {
    const rot0 = this.shapeToOffsets(shape)
    if (rot0.length === 0) return { x: 0, y: 0 }

    // Pick anchor cell in rotation-0 shape (closest to centroid)
    const cx = rot0.reduce((s, o) => s + o.x, 0) / rot0.length
    const cy = rot0.reduce((s, o) => s + o.y, 0) / rot0.length
    let r0 = rot0[0].y, c0 = rot0[0].x, best = Infinity
    for (const o of rot0) {
      const d = (o.x - cx) ** 2 + (o.y - cy) ** 2
      if (d < best) { best = d; r0 = o.y; c0 = o.x }
    }

    // One CW rotation: cell (r, c) in rows×cols → {x: rows-1-r, y: c} in cols×rows.
    // Closed-form after 0–3 rotations:
    const rows = shape.length
    const cols = shape[0]?.length ?? 1
    switch (rotation) {
      case 0: return { x: c0, y: r0 }
      case 1: return { x: rows - 1 - r0, y: c0 }
      case 2: return { x: cols - 1 - c0, y: rows - 1 - r0 }
      case 3: return { x: r0, y: cols - 1 - c0 }
    }
  }

  private rotate90CW(shape: number[][]): number[][] {
    const rows = shape.length
    const cols = shape[0].length
    const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0))
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = shape[r][c]
      }
    }
    return rotated
  }
}
