import { describe, it, expect } from 'vitest'
import { ItemRegistry } from './ItemRegistry.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import { ALL_RECIPES } from '../../taxonomy/recipes.js'
import { ROUTE } from '../../taxonomy/islands.js'
import type { IslandName } from '../../taxonomy/islands.js'

describe('ItemRegistry', () => {
  const reg = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)

  it('アイテムIDで取得できる', () => {
    const item = reg.getItem('snap_pea')
    expect(item.display.name).toBe('さやえんどう')
  })

  it('値段はフィールドではなく導出値（#30）', () => {
    // tier1 は基準値 × 贅沢さ、tier2以上は 材料費 + 加工利益。どちらも都度出す
    expect(reg.salePriceOf('snap_pea')).toBeGreaterThan(0)
    expect(reg.tierOf('snap_pea')).toBe(1)
    expect(reg.tierOf('buckwheat_flour')).toBe(2)
    // 作った品は材料より高い（INV-6）
    expect(reg.salePriceOf('buckwheat_flour')).toBeGreaterThan(reg.salePriceOf('buckwheat'))
  })

  it('買値は全品が売値より安い（買ってそのまま売れば薄利で成立する）', () => {
    // ⚠ 2026-09-12 に反転させた。以前は加工品だけ「買値 > 売値」で、買うと必ず損だった。
    //    tier1 は転売で儲かるのに tier2以上は損、という符号の非対称が説明できなかった
    for (const id of ['snap_pea', 'buckwheat_flour', 'buckwheat_bread']) {
      expect(reg.purchasePriceOf(id)).toBeLessThan(reg.salePriceOf(id))
    }
  })

  it('材料を買って作るほうが、買って転売するより儲かる（4島 × 全72レシピ ＋ 割引なし）', () => {
    // これがこのゲームの土台。**買値率を1本に保つだけで自動的に成立する**:
    //   作る利益 − 転売利益 ＝ 加工利益 × 買値率 … 常に正
    //
    // ⚠ **島ごとに測る**（段4-6）。産地割引は素材（tier1）にしか当たらないので、
    //   割り引かれるのは材料費の側だけ。符号は**強くなる方向にしか動かない**が、
    //   「動かない」ではなく「強くなる」ことを見に行く検査にしてある。
    const places: (IslandName | undefined)[] = [undefined, ...ROUTE]
    for (const at of places) {
      for (const recipe of reg.getAllRecipes()) {
        const id = recipe.outputItemId
        const resale = reg.salePriceOf(id) - reg.purchasePriceOf(id, at)
        const materialCost = recipe.ingredients
          .reduce((sum, g) => sum + reg.purchasePriceOf(g.itemId, at) * g.quantity, 0) / recipe.outputQuantity
        const craft = reg.salePriceOf(id) - materialCost
        expect(craft, `${at ?? '割引なし'} / ${id}`).toBeGreaterThan(resale)
      }
    }
  })

  it('産地の島でだけ安く買える。割引は素材にしか当たらない（段4-6）', () => {
    // **例外を1つも書いていない**ことの検査。産地を持つのが tier1 だけなので、
    // 「加工品を除く」と書かなくても加工品には当たらない
    for (const at of ROUTE) {
      for (const item of reg.getAllItems()) {
        const discounted = reg.purchasePriceOf(item.id, at) < reg.purchasePriceOf(item.id)
        expect(discounted, `${at} / ${item.id}`).toBe(item.origin === at)
        if (discounted) expect(reg.tierOf(item.id), `${item.id}`).toBe(1)
      }
    }
  })

  it('レシピの出来上がりは、どの島でも割引を受けない（転売側は安くならない）', () => {
    for (const at of ROUTE) {
      for (const recipe of reg.getAllRecipes()) {
        expect(reg.purchasePriceOf(recipe.outputItemId, at))
          .toBe(reg.purchasePriceOf(recipe.outputItemId))
      }
    }
  })

  it('配置の倍率は加工利益にだけ乗る（材料費には乗らない）', () => {
    const plain = reg.salePriceOf('buckwheat_flour')
    const boosted = reg.finalPriceOf('buckwheat_flour', 2.0)
    expect(boosted).toBeGreaterThan(plain)
    expect(boosted).toBeLessThan(plain * 2)  // 材料費まで倍になっていないこと
  })

  it('存在しないIDで例外を投げる', () => {
    expect(() => reg.getItem('not_exist')).toThrow('Item not found: not_exist')
  })

  it('全アイテムを返す', () => {
    expect(reg.getAllItems()).toHaveLength(ALL_ITEMS.length)
  })

  it('素材と加工品は tier で分かれる（itemType フィールドは持たない）', () => {
    expect(reg.getMaterials().length + reg.getProducts().length).toBe(ALL_ITEMS.length)
    expect(reg.getMaterials().every(i => reg.tierOf(i.id) === 1)).toBe(true)
    expect(reg.getProducts().every(i => reg.tierOf(i.id) >= 2)).toBe(true)
  })

  it('rotation=0で形状を変えない', () => {
    const shape = [[1, 0], [1, 1]]
    expect(reg.getRotatedShape(shape, 0)).toEqual(shape)
  })

  it('rotation=1で90度CW回転', () => {
    // [[1,0],[1,1]]: rows=2,cols=2
    // rotated[c][rows-1-r]=shape[r][c]
    // → rotated[0]=[1,1], rotated[1]=[1,0]
    const shape = [[1, 0], [1, 1]]
    const rotated = reg.getRotatedShape(shape, 1)
    expect(rotated).toEqual([[1, 1], [1, 0]])
  })

  it('rotation=2で180度回転', () => {
    // rot1 of [[1,0],[1,1]] = [[1,1],[1,0]]
    // rot2: rotated[c][rows-1-r]=rot1[r][c]
    // → rotated[0]=[1,1], rotated[1]=[0,1]
    const shape = [[1, 0], [1, 1]]
    const r2 = reg.getRotatedShape(shape, 2)
    expect(r2).toEqual([[1, 1], [0, 1]])
  })

  it('4回回転で元の形状に戻る', () => {
    for (const item of ALL_ITEMS) {
      expect(reg.getRotatedShape(item.shape, 0)).toEqual(item.shape)
    }
  })

  it('shapeToOffsetsで1セルの位置を返す', () => {
    const offsets = reg.shapeToOffsets([[1]])
    expect(offsets).toEqual([{ x: 0, y: 0 }])
  })

  it('shapeToOffsets: L字形の複数セル', () => {
    // L字（3段）
    const offsets = reg.shapeToOffsets([[1, 0], [1, 0], [1, 1]])
    expect(offsets).toHaveLength(4)
    expect(offsets).toContainEqual({ x: 0, y: 0 })
    expect(offsets).toContainEqual({ x: 0, y: 2 })
    expect(offsets).toContainEqual({ x: 1, y: 2 })
  })
})
