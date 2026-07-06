import type { GridCell, Rotation } from '../../types/index.js'

export interface AdjacencyRule {
  adjacentItemId: string
  bonusType: 'sales_rate' | 'customer_attraction' | 'price_up'
  multiplier: number
}

export interface ItemDef {
  id: string
  name: string
  itemType: 'material' | 'product'
  shape: number[][]
  color: number
  category: string
  price: number          // 販売単価（客が払う値段）
  purchasePrice?: number // 仕入れ単価（プレイヤーが払う値段）
  baseSaleProb?: number  // 商品ごとの基本売れやすさ (0.0〜1.0)
  adjacencyBonuses?: AdjacencyRule[]
}

export interface RecipeDef {
  id: string
  name: string
  outputItemId: string
  outputQuantity: number
  ingredients: { itemId: string; quantity: number }[]
  durationMinutes: number
}

export class ItemRegistry {
  private items: Map<string, ItemDef>
  private recipes: Map<string, RecipeDef>

  constructor(items: ItemDef[], recipes: RecipeDef[] = []) {
    this.items = new Map(items.map(i => [i.id, i]))
    this.recipes = new Map(recipes.map(r => [r.id, r]))
  }

  getItem(id: string): ItemDef {
    const item = this.items.get(id)
    if (!item) throw new Error(`Item not found: ${id}`)
    return item
  }

  getAllItems(): ItemDef[] {
    return Array.from(this.items.values())
  }

  getProducts(): ItemDef[] {
    return this.getAllItems().filter(i => i.itemType === 'product')
  }

  getMaterials(): ItemDef[] {
    return this.getAllItems().filter(i => i.itemType === 'material')
  }

  getRecipe(id: string): RecipeDef {
    const recipe = this.recipes.get(id)
    if (!recipe) throw new Error(`Recipe not found: ${id}`)
    return recipe
  }

  getAllRecipes(): RecipeDef[] {
    return Array.from(this.recipes.values())
  }

  getRotatedShape(shape: number[][], rotation: Rotation): number[][] {
    let result = shape
    for (let r = 0; r < rotation; r++) {
      result = this.rotate90CW(result)
    }
    return result
  }

  shapeToOffsets(shape: number[][]): GridCell[] {
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
  getAnchorOffset(shape: number[][], rotation: Rotation): GridCell {
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
