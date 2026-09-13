/**
 * Cycle 4 / Phase 3 — 島と需要表
 *
 * 出典: aidlc-docs/inception/worldbuilding/world.md §1（気候）
 *       aidlc-docs/inception/application-design/cycle4-phase2-axes.md §5（需要表4行）
 */

import type { SuitedLand } from './axes.js'

export type IslandName = 'ハルヴェラ' | 'リナツィア' | 'ノアキータ' | 'ミフユリア'

export interface Island {
  readonly name: IslandName
  /** world.md §1 の気候。一次情報 */
  readonly climate: string
  /** 寄港中の仕入れ相手（characters.md） */
  readonly merchant: string
}

/** 四島は増減しない（world.md §1 で確定）。これが `向く土地` を品側に置いてよい根拠 */
export const ISLANDS: readonly Island[] = [
  { name: 'ハルヴェラ', climate: '温暖',           merchant: 'レネ' },
  { name: 'リナツィア', climate: '陽が強く、暑い',  merchant: 'サディ' },
  { name: 'ノアキータ', climate: '実りが絶えない',  merchant: 'コルナ' },
  { name: 'ミフユリア', climate: '雪が絶えない',    merchant: 'フィエラ' },
] as const

/** 10日ごとに、決められた順でしか回れない（world.md §3 の縛り「移動」） */
export const ROUTE: readonly IslandName[] = [
  'ハルヴェラ', 'リナツィア', 'ノアキータ', 'ミフユリア',
] as const

export const DAYS_PER_PORT = 10

/**
 * 島の需要表（D1）。**この4行が「向く土地」と島を結ぶ唯一の場所。**
 *
 * 品は島の名前を知らない（axes.ts の SuitedLand を参照）。
 * 島の気候設定を変えても品は無傷で、書き換えるのはこの4行だけ。
 *
 * ⚠ **バランス調整はこの4行に集まる。**品を1つ足すときに書くのは `向く土地` の1語だけ。
 * ⚠ 倍率の値は一度置いたもので、調整していない。
 */
export interface DemandRow {
  readonly suitedLand: SuitedLand
  readonly island: IslandName
  readonly multiplier: number
}

export const DEMAND_TABLE: readonly DemandRow[] = [
  { suitedLand: '寒い土地',   island: 'ミフユリア', multiplier: 1.3 },
  { suitedLand: '暑い土地',   island: 'リナツィア', multiplier: 1.3 },
  { suitedLand: '温暖な土地', island: 'ハルヴェラ', multiplier: 1.3 },
  { suitedLand: '実りの土地', island: 'ノアキータ', multiplier: 1.3 },
] as const

/**
 * その `向く土地` の品が**高く売れる島**。
 *
 * ⚠ **`どこでも` の品は行を持たない**ので `undefined` を返す（**売れる島が無い**）。
 *   161品中65品がこれで、**工房の `需要` の列はそこが空欄になる**（PO 了承済み 2026-09-14）。
 * ⚠ **引くのは `DEMAND_TABLE` の4行だけ。**画面側に島の名を書かない。
 */
export function demandIsland(suitedLand: SuitedLand): IslandName | undefined {
  return DEMAND_TABLE.find(row => row.suitedLand === suitedLand)?.island
}

/**
 * 海。どの島のものでもなく四島に共通してある。
 * → island-goods.md §3。産地 `なし` の品はここから来る
 */
export const SEA = {
  /**
   * 海は島ではないので需要表に行を持たない。
   * ⚠ **産地 `なし` ＝ 海のもの、ではない。**`なし` は「旬を持たない」の意味で、
   *   113品中106品は加工品。海のものでも旬があれば島を持つ（鮭・昆布・かに）
   */
  description: '四つの島を結ぶ穏やかな海。どの島のものでもない',
} as const
