/**
 * 測る道具の入口。**単発で回す**（`npx vitest run` からは走らない）。
 *
 * ```
 * npx vite-node src/sim/run.ts
 * npx vite-node src/sim/run.ts -- --days=400 --seed=7 --policy=deep --step=20
 * ```
 *
 * ⚠ **`vite-node` を使うのは `package.json` を触らないため。**`.ts` を `.js` 拡張子で
 *   import している（`moduleResolution: bundler`）ので、素の node では解決できない。
 *   `vite-node` は `vitest` に付いてくるので、追加の依存は要らない。
 */

import { DEFAULT_OPTIONS, SimWorld } from './SimWorld.js'
import type { DayRecord, SimOptions, SimResult } from './SimWorld.js'
import { POLICIES } from './policies.js'
import { DEMAND_RULES, FOREIGN_ORIGIN_RULE, SET_RULES } from '../taxonomy/rules.js'

/**
 * ⚠ **`@types/node` を入れていない**（`package.json` は触らない範囲）。
 *   使うのは引数だけなので、ここで最小限だけ宣言する。
 */
declare const process: { readonly argv: readonly string[] }

function parseArgs(argv: readonly string[]): { opts: SimOptions; names: string[]; step: number } {
  const flags = new Map<string, string>()
  for (const arg of argv) {
    const m = /^--([\w-]+)=(.*)$/.exec(arg)
    if (m) flags.set(m[1], m[2])
  }
  const num = (key: string, fallback: number): number => {
    const v = flags.get(key)
    if (v === undefined) return fallback
    const n = Number(v)
    if (!Number.isFinite(n)) throw new Error(`--${key} が数ではない: ${v}`)
    return n
  }
  const policy = flags.get('policy') ?? 'all'
  const names = policy === 'all' ? Object.keys(POLICIES) : policy.split(',')
  for (const name of names) {
    if (!POLICIES[name]) throw new Error(`知らない方針: ${name}（${Object.keys(POLICIES).join(' / ')}）`)
  }
  return {
    names,
    step: num('step', 20),
    opts: {
      days: num('days', DEFAULT_OPTIONS.days),
      seed: num('seed', DEFAULT_OPTIONS.seed),
      stockTarget: num('stock', DEFAULT_OPTIONS.stockTarget),
      buyRatio: num('buy-ratio', DEFAULT_OPTIONS.buyRatio),
      cashFloor: num('cash-floor', DEFAULT_OPTIONS.cashFloor),
      upgradeAffordRatio: num('upgrade-ratio', DEFAULT_OPTIONS.upgradeAffordRatio),
    },
  }
}

/** 表の桁幅 */
const COLS = [11, 9, 9, 9, 10, 10, 10, 15, 8, 9, 4, 9, 5]

const int = (n: number): string => Math.round(n).toLocaleString('en-US')
const pad = (s: string, w: number): string => s.padStart(w)

function sum(rows: readonly DayRecord[], pick: (r: DayRecord) => number): number {
  return rows.reduce((acc, r) => acc + pick(r), 0)
}

function report(result: SimResult, step: number): void {
  const rows = result.days
  const last = rows[rows.length - 1]
  console.log('')
  console.log(`━━━ ${result.policy} ━━━  種 ${result.seed} ／ ${rows.length}日`)
  if (result.goalDay !== null) {
    console.log(
      `目標 ${int(result.goalAmount)} レン: **Day ${result.goalDay} 到達**` +
      `　／　そのとき回れていた島 ${result.islandsVisited} / ${result.islandsTotal}`,
    )
  } else {
    console.log(
      `目標 ${int(result.goalAmount)} レン: **未到達**（最終 ${int(last.money)} レン` +
      ` ＝ 目標の ${(last.money / result.goalAmount * 100).toFixed(1)}%）` +
      `　／　回れた島 ${result.islandsVisited} / ${result.islandsTotal}`,
    )
  }
  console.log(
    // ⚠ **GAME OVER はもう無い**（2026-09-15）。**詰みかけた日**として出す
    `所持金0以下になった日: ${result.zeroMoneyDay === null ? 'なし' : `Day ${result.zeroMoneyDay}`}`,
  )
  console.log(
    `解禁されたレシピ ${result.unlockedRecipes} 本（いちばん深いのは tier${result.unlockedTopTier}）` +
    `　／　実際に作れたいちばん深い品 tier${Math.max(0, ...rows.map(r => r.topTier))}`,
  )

  console.log('')
  console.log('1日の稼ぎの内訳（**取り分**＝売上−元手。区間の1日あたり平均／レン）')
  console.log(
    '  ' + ['区間', '転売', '加工', '納品', '仕入', '改装', '純増/日', '所持金(区間末)', '加工分', '客ロス分', '区画', '升/棚', '最深'].
      map((h, i) => pad(h, COLS[i])).join(''),
  )
  for (let i = 0; i < rows.length; i += step) {
    const chunk = rows.slice(i, i + step)
    const n = chunk.length
    const end = chunk[n - 1]
    const cells = [
      `Day ${pad(String(chunk[0].day), 3)}-${pad(String(end.day), 3)}`,
      int(sum(chunk, r => r.resellProfit) / n),
      int(sum(chunk, r => r.craftProfit) / n),
      int(sum(chunk, r => r.deliveryProfit) / n),
      '-' + int(sum(chunk, r => r.purchaseSpend) / n),
      '-' + int(sum(chunk, r => r.upgradeSpend) / n),
      int((end.money - (i === 0 ? result.startMoney : rows[i - 1].money)) / n),
      int(end.money),
      int(sum(chunk, r => r.craftMinutes) / n),
      int(sum(chunk, r => r.lostBusinessMinutes) / n),
      String(end.slots),
      `${end.cells}/${end.cellCapacity}`,
      `T${Math.max(...chunk.map(r => r.topTier))}`,
    ]
    console.log('  ' + cells.map((c, k) => pad(c, COLS[k])).join(''))
  }

  console.log('')
  console.log('効き目の平均（毎朝、組み終えた盤面を `evaluate()` にかけて測ったもの）')
  console.log(
    `  区画平均: 売れやすさ ×${result.modifiers.売れやすさ.toFixed(3)}` +
    ` ／ 値段 ×${result.modifiers.値段.toFixed(3)}` +
    ` ／ 集客 ×${result.modifiers.集客.toFixed(3)}`,
  )
  console.log(`  店全体の集客（客が来るかどうかに掛かる）: ×${result.modifiers.店全体の集客.toFixed(3)}`)
  console.log(
    `  R5 が当たりうる区画（産地が1島に定まる）: ${(result.modifiers.産地あり * 100).toFixed(1)}%` +
    `　／　いちばん大きい同産地の固まり: ${(result.modifiers.最大の同産地 * 100).toFixed(1)}%`,
  )

  console.log('')
  console.log('当たった規則の回数（1日1回の測定 × 日数ぶん。**0 は一度も当たっていない**）')
  // ⚠ **規則の名前を書き写さない。**`rules.ts` から引く（足された規則もそのまま出る）
  const ids = [
    ...SET_RULES.map(r => ({ id: r.id, description: r.description })),
    ...DEMAND_RULES.map(r => ({ id: r.id, description: r.description })),
    { id: FOREIGN_ORIGIN_RULE.id, description: FOREIGN_ORIGIN_RULE.description },
  ]
  for (const rule of ids) {
    const hits = result.ruleHits.get(rule.id) ?? 0
    console.log(`  ${pad(rule.id, 12)} ${pad(int(hits), 10)}   ${rule.description}`)
  }

  const total = {
    resell: sum(rows, r => r.resellProfit),
    craft: sum(rows, r => r.craftProfit),
    delivery: sum(rows, r => r.deliveryProfit),
  }
  const all = total.resell + total.craft + total.delivery
  const pct = (v: number): string => all === 0 ? '0.0%' : `${(v / all * 100).toFixed(1)}%`
  console.log('')
  console.log(
    `全期間の取り分: 転売 ${int(total.resell)}（${pct(total.resell)}）` +
    ` ／ 加工 ${int(total.craft)}（${pct(total.craft)}）` +
    ` ／ 納品 ${int(total.delivery)}（${pct(total.delivery)}）`,
  )
}

function main(): void {
  const { opts, names, step } = parseArgs(process.argv.slice(2))
  console.log(
    `設定: 日数 ${opts.days} ／ 種 ${opts.seed} ／ 補充目標 ${opts.stockTarget}個` +
    ` ／ 仕入れ割合 ${opts.buyRatio} ／ 所持金の下限 ${int(opts.cashFloor)}` +
    ` ／ 改装は値段の ${opts.upgradeAffordRatio} 倍持っていたら買う`,
  )
  for (const name of names) {
    const started = Date.now()
    const result = new SimWorld(POLICIES[name], opts).run()
    report(result, step)
    console.log(`（${((Date.now() - started) / 1000).toFixed(1)} 秒）`)
  }
}

main()
