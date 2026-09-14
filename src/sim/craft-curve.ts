import { ALL_RECIPES } from '../taxonomy/recipes.js'
import { ALL_ITEMS, getItem } from '../taxonomy/items.js'
import { tier, craftProfit, cellCount } from '../taxonomy/derive.js'
import { craftMinutes } from '../taxonomy/craft.js'
import { SKILL_INITIAL, SKILL_MAX } from '../taxonomy/craft.js'

const rows = ALL_RECIPES.map(r => {
  const item = getItem(r.outputItemId)
  const t = tier(r.outputItemId)
  const minInit = craftMinutes(r.outputItemId, SKILL_INITIAL)
  const minMax = craftMinutes(r.outputItemId, SKILL_MAX)
  const profitPerBatch = craftProfit(item) * r.outputQuantity
  return { id: r.id, t, dur: r.durationMinutes, minInit, minMax, out: r.outputQuantity,
           profit: craftProfit(item), profitPerBatch, perMin: profitPerBatch / minInit,
           cells: cellCount(item) }
})
const byTier = new Map<number, typeof rows>()
for (const r of rows) { (byTier.get(r.t) ?? byTier.set(r.t, []).get(r.t)!).push(r) }
const med = (a: number[]) => { const s=[...a].sort((x,y)=>x-y); return s[Math.floor(s.length/2)] }
console.log('tier  本数   初期1回(中央)  MAX1回  出力数  1回の取り分  取り分/分(初期)  取り分/分(MAX)')
for (const t of [...byTier.keys()].sort()) {
  const g = byTier.get(t)!
  console.log([
    't' + t, g.length,
    med(g.map(r => r.minInit)).toFixed(1) + '分',
    med(g.map(r => r.minMax)).toFixed(1) + '分',
    med(g.map(r => r.out)).toFixed(0),
    Math.round(med(g.map(r => r.profitPerBatch))),
    med(g.map(r => r.perMin)).toFixed(1),
    med(g.map(r => r.profitPerBatch / r.minMax)).toFixed(1),
  ].join('\t'))
}
console.log('\n初期手際で 1日(1080分) に作れる回数と取り分（中央値）')
for (const t of [...byTier.keys()].sort()) {
  const g = byTier.get(t)!
  console.log('t'+t+'\t' + med(g.map(r => 1080 / r.minInit)).toFixed(0) + '回\t' +
    Math.round(med(g.map(r => (1080 / r.minInit) * r.profitPerBatch))) + 'レン/日')
}
console.log('\n最長・最短の初期1回')
const s = [...rows].sort((a,b)=>b.minInit-a.minInit)
for (const r of s.slice(0,3)) console.log('長', r.id, 't'+r.t, r.minInit.toFixed(1)+'分')
for (const r of s.slice(-3)) console.log('短', r.id, 't'+r.t, r.minInit.toFixed(1)+'分')

// ── 連鎖ぜんぶを自分で作る場合（材料の材料まで遡る） ─────────────
import { RECIPES_BY_OUTPUT } from '../taxonomy/recipes.js'
import { salePrice, purchasePrice } from '../taxonomy/derive.js'

/** 1個ぶん作るのにかかる総分数（材料も自分で作る） */
function chainMinutes(id: string, skill: number): number {
  const r = RECIPES_BY_OUTPUT.get(id)
  if (!r) return 0
  const own = craftMinutes(id, skill) / r.outputQuantity
  return own + r.ingredients.reduce((s, ing) => s + chainMinutes(ing.itemId, skill) * ing.quantity / 1, 0)
}
/** 1個ぶんの大もとの仕入れ額（tier1 まで遡る。産地割引なし） */
function chainRawCost(id: string): number {
  const r = RECIPES_BY_OUTPUT.get(id)
  if (!r) return purchasePrice(id as never, null as never)
  return r.ingredients.reduce((s, ing) => s + chainRawCost(ing.itemId) * ing.quantity, 0) / r.outputQuantity
}

console.log('\n連鎖ぜんぶ自分で作る（1個ぶん・初期手際）')
console.log('tier\t総分数\t売値\t大もと仕入\t取り分\t取り分/分')
const byT = new Map<number, {m:number;p:number}[]>()
for (const r of ALL_RECIPES) {
  const t = tier(r.outputItemId)
  const m = chainMinutes(r.outputItemId, SKILL_INITIAL)
  const p = salePrice(r.outputItemId) - chainRawCost(r.outputItemId)
  ;(byT.get(t) ?? byT.set(t, []).get(t)!).push({ m, p })
}
for (const t of [...byT.keys()].sort()) {
  const g = byT.get(t)!
  console.log(['t'+t, med(g.map(x=>x.m)).toFixed(1), '', '', Math.round(med(g.map(x=>x.p))),
    med(g.map(x=>x.p/x.m)).toFixed(2)].join('\t'))
}

console.log('\n1区画あたりの実力（棚は升が限られる。1品は1区画まで）')
console.log('tier\t升数\t売値\t売値/升\t回転（贅沢さ）\t売値×回転/升')
import { luxuryTurnover } from '../taxonomy/derive.js'
const byT2 = new Map<number, {c:number;p:number;tv:number}[]>()
for (const it of ALL_ITEMS) {
  const t = tier(it.id)
  const c = cellCount(it)
  const p = salePrice(it.id)
  ;(byT2.get(t) ?? byT2.set(t, []).get(t)!).push({ c, p, tv: luxuryTurnover(it) })
}
for (const t of [...byT2.keys()].sort()) {
  const g = byT2.get(t)!
  console.log(['t'+t, med(g.map(x=>x.c)).toFixed(1), Math.round(med(g.map(x=>x.p))),
    med(g.map(x=>x.p/x.c)).toFixed(1), med(g.map(x=>x.tv)).toFixed(2),
    med(g.map(x=>x.p*x.tv/x.c)).toFixed(1)].join('\t'))
}
