import { ALL_ITEMS, ITEMS_BY_ID } from '/home/senoo_s/simulation/src/taxonomy/items.js'
import { ALL_RECIPES } from '/home/senoo_s/simulation/src/taxonomy/recipes.js'
import { tier, salePrice } from '/home/senoo_s/simulation/src/taxonomy/derive.js'
import type { ItemDef, RecipeDef, Luxury } from '/home/senoo_s/simulation/src/taxonomy/axes.js'

const S=[[1]] as any, R=(w:number,h:number)=>Array.from({length:h},()=>Array(w).fill(1)) as any
const it=(id:string,name:string,k:any,o:any,l:Luxury,s:any,shape:any,bp?:number):ItemDef=>
  ({id,display:{name,color:0x888888},mainKind:k,origin:o,luxury:l,suitedLand:s,shape,
    ...(bp!==undefined?{basePrice:bp}:{}),originReason:'Phase 4 ストレステスト'} as ItemDef)

const NEW_ITEMS: ItemDef[] = [
  // A: 素直な追加（tier1）
  it('p4_fukinoto','ふきのとう','食料','ハルヴェラ','上等','温暖な土地',R(1,1),56),
  it('p4_peach','桃','食料','リナツィア','上等','温暖な土地',R(1,1),80),
  it('p4_matsutake','松茸','食料','ノアキータ','贅沢','温暖な土地',R(1,1),240),
  it('p4_radish','大根','食料','ミフユリア','日用','温暖な土地',R(1,2),20),
  it('p4_plum','梅','食料','ハルヴェラ','日用','温暖な土地',R(1,1),40),
  it('p4_cod','鱈','食料','なし','日用','温暖な土地',R(1,2),96),
  it('p4_wakame','わかめ','食料','なし','日用','どこでも',R(1,1),24),
  // A: 加工品
  it('p4_umeboshi','梅干し','食料','なし','日用','どこでも',R(1,1)),
  it('p4_hoshigaki','干し柿','食料','なし','上等','温暖な土地',R(1,1)),
  it('p4_rice_flour','米の粉','食料','なし','日用','どこでも',R(1,1)),
  it('p4_pine_tea','松の葉の茶','飲みもの','なし','日用','寒い土地',R(1,1)),
  it('p4_wool_socks','毛糸の靴下','衣類','なし','日用','寒い土地',R(1,1)),
  it('p4_tenugui','木綿の手ぬぐい','衣類','なし','日用','暑い土地',R(1,1)),
  it('p4_birch_box','白樺の皮の箱','道具','なし','上等','実りの土地',R(2,2)),
  it('p4_wood_spoon','木の匙','道具','なし','日用','どこでも',R(1,1)),
  // B: 置きにくいが、4軸が埋まったもの
  it('p4_beehive','蜜蜂の巣箱','道具','なし','上等','どこでも',R(2,2)),
  it('p4_sapling','りんごの苗木','道具','ハルヴェラ','贅沢','実りの土地',R(1,3),120),
  it('p4_ember_pot','種火の壺','道具','なし','日用','寒い土地',R(1,1),12),
  it('p4_water','真水の樽','飲みもの','なし','日用','どこでも',R(2,2),4),
  it('p4_rag','端切れ','衣類','なし','日用','どこでも',R(1,1),2),
  it('p4_kombu_dashi','昆布のだし','飲みもの','なし','日用','どこでも',R(1,1)),
  it('p4_gull_egg','海鳥の卵','食料','なし','上等','温暖な土地',R(1,1),44),
  it('p4_pumpkin','かぼちゃ','食料','ノアキータ','日用','温暖な土地',R(2,2),32),
]
const LR:Record<Luxury,number>={日用:0,上等:1,贅沢:2}
const mul=(min:number,l:Luxury)=>Math.round((1.30+0.25*Math.min(min/480,2)+0.15*LR[l])*100)/100
const rc=(id:string,out:string,q:number,ing:[string,number][],min:number):RecipeDef=>{
  const l=NEW_ITEMS.find(i=>i.id===out)!.luxury
  return {id,display:{name:id},outputItemId:out,outputQuantity:q,
    ingredients:ing.map(([itemId,quantity])=>({itemId,quantity})),
    durationMinutes:min,craftMultiplier:mul(min,l)}
}
const NEW_RECIPES:RecipeDef[]=[
  rc('p4_r1','p4_umeboshi',6,[['p4_plum',6],['salt',1]],300),
  rc('p4_r2','p4_hoshigaki',5,[['persimmon',5],['rope',1]],240),
  rc('p4_r3','p4_rice_flour',3,[['rice',3]],45),
  rc('p4_r4','p4_pine_tea',2,[['pine',1],['p4_water',1]],20),
  rc('p4_r5','p4_wool_socks',1,[['wool_yarn',3]],90),
  rc('p4_r6','p4_tenugui',2,[['cotton_yarn',2]],60),
  rc('p4_r7','p4_birch_box',1,[['birch',2],['rope',1]],70),
  rc('p4_r8','p4_wood_spoon',3,[['birch',1],['file',1]],40),
  rc('p4_r9','p4_kombu_dashi',4,[['kelp',2],['p4_water',1]],30),
  rc('p4_r10','p4_beehive',1,[['pine',3],['beeswax',1],['rope',1]],120),
]
// 材料IDの実在チェック（名前→ID の当てが外れていないか）
const all=[...ALL_ITEMS,...NEW_ITEMS], byId=new Map(all.map(i=>[i.id,i]))
const missing=NEW_RECIPES.flatMap(r=>r.ingredients.map(g=>g.itemId)).filter(id=>!byId.has(id))
if(missing.length){console.log('材料ID不明:',[...new Set(missing)]);process.exit(1)}

const recByOut=new Map([...ALL_RECIPES,...NEW_RECIPES].map(r=>[r.outputItemId,r]))
const look=(id:string)=>{const i=byId.get(id); if(!i) throw new Error('no item '+id); return i}

console.log(`投げ込んだ: 品 ${NEW_ITEMS.length}/30（7品は型に置けず除外）／ レシピ ${NEW_RECIPES.length}/10`)
console.log(`合計 ${all.length}品 / ${recByOut.size}レシピ\n`)

// INV-1 既存の値が動かないか
let moved=0
for(const i of ALL_ITEMS){
  const t0=tier(i.id), t1=tier(i.id,recByOut)
  const p0=salePrice(i.id), p1=salePrice(i.id,recByOut,look)
  if(t0!==t1||p0!==p1){moved++;console.log(`  INV-1 違反: ${i.display.name} tier ${t0}→${t1} 売値 ${p0}→${p1}`)}
}
console.log(`INV-1 既存120品の tier・売値が動いた数: ${moved}`)

// INV-3 tier1 のみ basePrice
const bad3=NEW_ITEMS.filter(i=>{const has=i.basePrice!==undefined; const t1=!recByOut.has(i.id); return has!==t1})
console.log(`INV-3 basePrice の付け方が tier と食い違う新品: ${bad3.length}`)

// INV-6
let bad6=0
for(const r of NEW_RECIPES){
  const out=salePrice(r.outputItemId,recByOut,look)*r.outputQuantity
  const ing=r.ingredients.reduce((s,g)=>s+salePrice(g.itemId,recByOut,look)*g.quantity,0)
  if(out<=ing){bad6++;console.log(`  INV-6 違反: ${r.outputItemId} ${out} <= ${ing}`)}
}
console.log(`INV-6 違反: ${bad6} / ${NEW_RECIPES.length}`)

// 分布
const c=(f:(i:ItemDef)=>string)=>{const m=new Map<string,number>();for(const i of all)m.set(f(i),(m.get(f(i))??0)+1);return [...m].sort((a,b)=>b[1]-a[1])}
console.log('\n向く土地:',JSON.stringify(c(i=>i.suitedLand)))
console.log('主種類:',JSON.stringify(c(i=>i.mainKind)))
const rows=['寒い土地','暑い土地','温暖な土地','実りの土地'].map(v=>all.filter(i=>i.suitedLand===v).length)
console.log('需要4行:',rows.join(':'),'→比',(Math.max(...rows)/Math.min(...rows)).toFixed(2)+'倍')
const any=all.filter(i=>i.suitedLand==='どこでも').length
console.log('どこでも:',any,'=',(any/all.length*100).toFixed(1)+'%')
console.log('新品の売値:',NEW_ITEMS.map(i=>`${i.display.name}${salePrice(i.id,recByOut,look)}`).join(' '))
