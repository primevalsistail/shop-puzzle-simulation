import { describe, it, expect } from 'vitest'
import { ItemRegistry } from './ItemRegistry.js'
import { SAMPLE_ITEMS } from '../../data/items.js'

describe('ItemRegistry', () => {
  const reg = new ItemRegistry(SAMPLE_ITEMS)

  it('アイテムIDで取得できる', () => {
    const item = reg.getItem('apple')
    expect(item.name).toBe('りんご')
    expect(item.price).toBe(100)
  })

  it('存在しないIDで例外を投げる', () => {
    expect(() => reg.getItem('not_exist')).toThrow('Item not found: not_exist')
  })

  it('全アイテムを返す', () => {
    // SAMPLE_ITEMS は ALL_ITEMS から products のみ抽出したもの (8種)
    expect(reg.getAllItems()).toHaveLength(8)
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
    for (const item of SAMPLE_ITEMS) {
      expect(reg.getRotatedShape(item.shape, 0)).toEqual(item.shape)
    }
  })

  it('shapeToOffsetsで1セルの位置を返す', () => {
    const offsets = reg.shapeToOffsets([[1]])
    expect(offsets).toEqual([{ x: 0, y: 0 }])
  })

  it('shapeToOffsets: L字形の複数セル', () => {
    // book: [[1,0],[1,0],[1,1]]
    const offsets = reg.shapeToOffsets([[1, 0], [1, 0], [1, 1]])
    expect(offsets).toHaveLength(4)
    expect(offsets).toContainEqual({ x: 0, y: 0 })
    expect(offsets).toContainEqual({ x: 0, y: 2 })
    expect(offsets).toContainEqual({ x: 1, y: 2 })
  })
})
