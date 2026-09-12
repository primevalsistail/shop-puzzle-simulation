import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CraftingSystem, type CraftResult } from './CraftingSystem.js'
import { ItemRegistry } from './ItemRegistry.js'
import { Inventory } from '../economy/Inventory.js'
import { EventBus } from '../../services/EventBus.js'
import { GameEvents } from '../../types/index.js'
import { ALL_ITEMS } from '../../taxonomy/items.js'
import { ALL_RECIPES } from '../../taxonomy/recipes.js'
import { Upgrades } from '../progress/Upgrades.js'
import { TimeManager } from '../core/TimeManager.js'

function makeTimeManagerMock(): TimeManager {
  return {
    isAdvancing: vi.fn().mockReturnValue(false),
    startAdvancing: vi.fn(),
    stopAdvancing: vi.fn(),
    getCurrentTime: vi.fn().mockReturnValue({ day: 1, hour: 8, minute: 0 }),
    // 8:00 時点なので 24:00 まで 960分ある（#25 Q3 = B の判定に使う）
    minutesUntilEndOfDay: vi.fn().mockReturnValue(960),
    skipMinutes: vi.fn(),
    // 既定は「営業時間を削らない」。営業に食い込む場合は各テストで差し替える（#53）
    openMinutesWithin: vi.fn().mockReturnValue(0),
    getPhase: vi.fn().mockReturnValue('作業'),
    isOpen: vi.fn().mockReturnValue(false),
    update: vi.fn(),
  } as unknown as TimeManager
}

describe('CraftingSystem', () => {
  let registry: ItemRegistry
  let inventory: Inventory
  let timeManager: TimeManager
  let cs: CraftingSystem

  beforeEach(() => {
    EventBus.removeAllListeners()
    registry = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)
    inventory = new Inventory()
    timeManager = makeTimeManagerMock()
    cs = new CraftingSystem(registry, inventory, timeManager)
  })

  it('素材不足のときcanCraftはfalse', () => {
    expect(cs.canCraft('recipe_buckwheat_flour')).toBe(false)
  })

  it('素材が揃っているときcanCraftはtrue', () => {
    inventory.add('buckwheat', 3)
    expect(cs.canCraft('recipe_buckwheat_flour')).toBe(true)
  })

  it('startCraftで素材を消費する', () => {
    inventory.add('buckwheat', 5)
    cs.startCraft('recipe_buckwheat_flour')
    expect(inventory.getQuantity('buckwheat')).toBe(2) // 5 - 3
  })

  it('startCraftはゲーム内時間を所要分だけ飛ばす（＝その間は客が来ない）', () => {
    inventory.add('buckwheat', 3)
    cs.startCraft('recipe_buckwheat_flour') // 蕎麦粉: 90分
    expect(timeManager.skipMinutes).toHaveBeenCalledWith(90)
  })

  it('その日のうちに終わらない加工は着手できない（#25 Q3 = B）', () => {
    vi.mocked(timeManager.minutesUntilEndOfDay).mockReturnValue(60)
    inventory.add('buckwheat', 3)
    expect(cs.canCraft('recipe_buckwheat_flour')).toBe(false) // 90分 > 残り60分
    expect(cs.startCraft('recipe_buckwheat_flour')).toBe(false)
    expect(inventory.getQuantity('buckwheat')).toBe(3) // 素材は減らない
  })

  it('startCraftでCRAFTING_STARTEDを発火する', () => {
    const listener = vi.fn()
    EventBus.on(GameEvents.CRAFTING_STARTED, listener)
    inventory.add('buckwheat', 3)
    cs.startCraft('recipe_buckwheat_flour')
    // ⚠ 実際の分数と、削った営業分も載る（#53）。モックの時計は作業帯なので営業は0分
    expect(listener).toHaveBeenCalledWith(
      { recipeId: 'recipe_buckwheat_flour', times: 1, quantity: 3, minutes: 90, businessMinutes: 0 })
  })

  it('素材不足のときstartCraftはfalseを返す', () => {
    const result = cs.startCraft('recipe_buckwheat_flour')
    expect(result).toBe(false)
    expect(cs.isActive()).toBe(false)
  })

  it('着手した時点で製品が倉庫に入る（実時間では待たない）', () => {
    inventory.add('buckwheat', 3)
    cs.startCraft('recipe_buckwheat_flour') // 蕎麦粉: output 3
    expect(inventory.getQuantity('buckwheat_flour')).toBe(3)
  })

  it('CRAFTING_COMPLETEDはstartCraftの中で発火する', () => {
    const listener = vi.fn()
    EventBus.on(GameEvents.CRAFTING_COMPLETED, listener)
    inventory.add('buckwheat', 3)
    cs.startCraft('recipe_buckwheat_flour')
    // ⚠ 実際の分数と、削った営業分も載る（#53）。モックの時計は作業帯なので営業は0分
    expect(listener).toHaveBeenCalledWith(
      { recipeId: 'recipe_buckwheat_flour', times: 1, quantity: 3, minutes: 90, businessMinutes: 0 })
  })

  it('加工は途中の状態を持たない（着手＝完了）', () => {
    inventory.add('buckwheat', 3)
    cs.startCraft('recipe_buckwheat_flour')
    expect(cs.isActive()).toBe(false)
    expect(cs.getProgress()).toBe(0)
  })

  // ── まとめて作る（回数指定） ───────────────────────────
  describe('まとめて作る', () => {
    it('材料も所要時間も回数分かかり、出来高は出力単位で増える', () => {
      inventory.add('buckwheat', 10)
      expect(cs.startCraft('recipe_buckwheat_flour', 3)).toBe(true)
      expect(inventory.getQuantity('buckwheat')).toBe(1) // 10 − 3×3
      expect(inventory.getQuantity('buckwheat_flour')).toBe(9) // 3個 × 3回
      expect(timeManager.skipMinutes).toHaveBeenCalledWith(270) // 90分 × 3回
    })

    it('CRAFTING_COMPLETED は回数と総個数を伝える', () => {
      const listener = vi.fn()
      EventBus.on(GameEvents.CRAFTING_COMPLETED, listener)
      inventory.add('buckwheat', 6)
      cs.startCraft('recipe_buckwheat_flour', 2)
      expect(listener).toHaveBeenCalledWith(
        { recipeId: 'recipe_buckwheat_flour', times: 2, quantity: 6, minutes: 180, businessMinutes: 0 })
    })

    it('材料が1回分足りないときは何も起きない（材料も時間も減らない）', () => {
      inventory.add('buckwheat', 8) // 2回ぶん(6)はあるが3回ぶん(9)は無い
      expect(cs.startCraft('recipe_buckwheat_flour', 3)).toBe(false)
      expect(inventory.getQuantity('buckwheat')).toBe(8)
      expect(inventory.getQuantity('buckwheat_flour')).toBe(0)
      expect(timeManager.skipMinutes).not.toHaveBeenCalled()
    })

    it('当日に収まらない回数は着手できない（材料も時間も減らない）', () => {
      vi.mocked(timeManager.minutesUntilEndOfDay).mockReturnValue(200) // 90分なら2回まで
      inventory.add('buckwheat', 20)
      expect(cs.startCraft('recipe_buckwheat_flour', 3)).toBe(false)
      expect(inventory.getQuantity('buckwheat')).toBe(20)
      expect(timeManager.skipMinutes).not.toHaveBeenCalled()
      expect(cs.startCraft('recipe_buckwheat_flour', 2)).toBe(true)
    })

    it('maxCraftTimes は材料と当日の残り時間の小さいほうを返す', () => {
      inventory.add('buckwheat', 7) // 材料では2回、時間では10回 → 材料が効く
      expect(cs.maxCraftTimes('recipe_buckwheat_flour')).toBe(2)

      inventory.add('buckwheat', 100) // 材料では35回だが、960分では10回 → 時間が効く
      expect(cs.maxCraftTimes('recipe_buckwheat_flour')).toBe(10)

      vi.mocked(timeManager.minutesUntilEndOfDay).mockReturnValue(200) // 時間では2回
      expect(cs.maxCraftTimes('recipe_buckwheat_flour')).toBe(2)
    })

    it('材料が1回分も無ければ maxCraftTimes は 0', () => {
      expect(cs.maxCraftTimes('recipe_buckwheat_flour')).toBe(0)
      expect(cs.canCraft('recipe_buckwheat_flour', 1)).toBe(false)
    })

    it('0回・負の回数・小数は受け付けない', () => {
      inventory.add('buckwheat', 10)
      expect(cs.startCraft('recipe_buckwheat_flour', 0)).toBe(false)
      expect(cs.startCraft('recipe_buckwheat_flour', -1)).toBe(false)
      expect(cs.startCraft('recipe_buckwheat_flour', 1.5)).toBe(false)
      expect(inventory.getQuantity('buckwheat')).toBe(10)
    })

    it('複数素材レシピでは一番足りない材料が上限を決める', () => {
      // 塩鮭: salmon×2 + salt×1 → salted_salmon×3、180分
      inventory.add('salmon', 10) // 材料では5回
      inventory.add('salt', 3)    // 材料では3回 ← こちらが上限を決める
      expect(cs.maxCraftTimes('recipe_salted_salmon')).toBe(3)
      expect(cs.startCraft('recipe_salted_salmon', 4)).toBe(false)
      expect(cs.startCraft('recipe_salted_salmon', 3)).toBe(true)
      expect(inventory.getQuantity('salted_salmon')).toBe(9) // 3個 × 3回
      expect(inventory.getQuantity('salt')).toBe(0)
      expect(inventory.getQuantity('salmon')).toBe(4) // 10 − 2×3
    })
  })

  /**
   * #64 —— **作ってから溢れる。**
   *
   * 在庫の上限は1品 999個（`Inventory.MAX_QUANTITY`）。仕入れ側は `spaceFor` で
   * **買う前に**止めているが、加工側は作れてしまい、`Inventory.add` が丸めた
   * **溢れたぶんが黙って消えていた**（材料と時間だけ払って）。
   */
  describe('在庫の上限を超えて作れない（#64）', () => {
    /** 蕎麦粉: buckwheat×3 → buckwheat_flour×3、90分 */
    const RECIPE = 'recipe_buckwheat_flour'

    it('在庫が上限に達していたら、材料も時間もあっても作れない', () => {
      inventory.add('buckwheat', 100)      // 材料では33回
      inventory.add('buckwheat_flour', 999) // 空きゼロ
      expect(cs.fitsInStock(RECIPE, 1)).toBe(false)
      expect(cs.maxCraftTimes(RECIPE)).toBe(0)
      expect(cs.canCraft(RECIPE, 1)).toBe(false)
      expect(cs.startCraft(RECIPE, 1)).toBe(false)
      // ⚠ **材料も時間も払っていない**（払ってから溢れる、が起きない）
      expect(inventory.getQuantity('buckwheat')).toBe(100)
      expect(timeManager.skipMinutes).not.toHaveBeenCalled()
    })

    /**
     * ⚠ **空きは出来高で割る。**1回で3個できるので、空き7個なら **2回**（6個）まで。
     *   割らないと「空き7個だから7回」と読んで、押した瞬間に溢れる。
     */
    it('maxCraftTimes は在庫の空きを出来高で割る', () => {
      inventory.add('buckwheat', 100)          // 材料では33回、時間では10回
      inventory.add('buckwheat_flour', 999 - 7) // 空き7個 → 3個ずつなので2回
      expect(cs.maxCraftTimes(RECIPE)).toBe(2)
    })

    /** ⚠ **「最大」で入れた回数は、押した瞬間に溢れてはいけない**（工房の最大ボタン） */
    it('maxCraftTimes ちょうどなら作れて、1回でも多いと作れない', () => {
      inventory.add('buckwheat', 100)
      inventory.add('buckwheat_flour', 999 - 7)
      const max = cs.maxCraftTimes(RECIPE)
      expect(cs.canCraft(RECIPE, max + 1)).toBe(false)
      expect(cs.startCraft(RECIPE, max)).toBe(true)
      // 992 + 3×2 = 998。**丸められて消えたぶんは無い**
      expect(inventory.getQuantity('buckwheat_flour')).toBe(998)
    })

    it('上限ちょうどまでは作れる（999 で止まり、超えない）', () => {
      inventory.add('buckwheat', 100)
      inventory.add('buckwheat_flour', 999 - 9) // 空き9個 → ちょうど3回
      expect(cs.maxCraftTimes(RECIPE)).toBe(3)
      expect(cs.startCraft(RECIPE, 3)).toBe(true)
      expect(inventory.getQuantity('buckwheat_flour')).toBe(999)
    })

    /**
     * ⚠ **「時間が足りない」と「在庫がいっぱい」は別物。**
     *   待てば直るかどうかが違うので、`CraftMenu` が理由を書き分けられるよう検査も分けてある。
     */
    it('時間の検査と在庫の検査は別々に答える', () => {
      inventory.add('buckwheat', 100)
      inventory.add('buckwheat_flour', 999)
      // 在庫だけがだめ（時間は960分あるので10回ぶん足りている）
      expect(cs.fitsInToday(RECIPE, 1)).toBe(true)
      expect(cs.fitsInStock(RECIPE, 1)).toBe(false)

      // 時間だけがだめ
      const inv2 = new Inventory()
      const tm2 = makeTimeManagerMock()
      vi.mocked(tm2.minutesUntilEndOfDay).mockReturnValue(60)
      const cs2 = new CraftingSystem(registry, inv2, tm2)
      inv2.add('buckwheat', 100)
      expect(cs2.fitsInStock(RECIPE, 1)).toBe(true)
      expect(cs2.fitsInToday(RECIPE, 1)).toBe(false)
    })

    /** 複数素材でも同じ。塩鮭は1回3個できる */
    it('複数素材のレシピでも在庫の空きが上限を決める', () => {
      inventory.add('salmon', 100)
      inventory.add('salt', 100)
      inventory.add('salted_salmon', 999 - 4) // 空き4個 → 3個ずつなので1回
      expect(cs.maxCraftTimes('recipe_salted_salmon')).toBe(1)
      expect(cs.startCraft('recipe_salted_salmon', 2)).toBe(false)
      expect(inventory.getQuantity('salt')).toBe(100) // 材料は減らない
    })
  })

  it('複数素材レシピが動作する', () => {
    inventory.add('salmon', 2)
    inventory.add('salt', 1)
    const ok = cs.startCraft('recipe_salted_salmon')
    expect(ok).toBe(true)
    cs.update(4000)
    expect(inventory.getQuantity('salted_salmon')).toBe(3)
  })
})

/**
 * 加工が削る営業時間（#53）。
 *
 * ⚠ **コストは「これから足すもの」ではなく、すでに払っているもの。**
 *   `TimeManager.skipMinutes` が `TIME_MINUTE_PASSED` を出さないので加工中は客が来ない。
 *   実測: 営業600分のうち240分を加工に使うと、その日の売上は 41.7% 減った。
 *   足りないのは**払った額が画面に出ていないこと**なので、ここは**禁じる側に足さない。**
 */
describe('営業時間を何分削るか（#53）', () => {
  let registry: ItemRegistry
  let inventory: Inventory
  let cs: CraftingSystem

  /** 本物の TimeManager を使う（openMinutesWithin と skipMinutes の食い違いを見たいため） */
  function withRealClock(hour: number) {
    const tm = new TimeManager()
    tm.setTime({ day: 1, hour, minute: 0 })
    return { tm, cs: new CraftingSystem(registry, inventory, tm) }
  }

  beforeEach(() => {
    EventBus.removeAllListeners()
    registry = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)
    inventory = new Inventory()
  })

  it('夜20:00 に始めれば削らない（蕎麦粉90分）', () => {
    ;({ cs } = withRealClock(20))
    expect(cs.businessMinutesFor('recipe_buckwheat_flour')).toBe(0)
    expect(cs.fitsBeforeOpen('recipe_buckwheat_flour')).toBe(true)
  })

  it('営業中に始めれば所要ぶんそのまま削る', () => {
    ;({ cs } = withRealClock(12))
    expect(cs.businessMinutesFor('recipe_buckwheat_flour')).toBe(90)
    expect(cs.fitsBeforeOpen('recipe_buckwheat_flour')).toBe(false)
  })

  it('回数を増やすと削る分も増える', () => {
    ;({ cs } = withRealClock(20))
    // 20:00 から240分が無料枠。90分×3回=270分は 30分だけ翌朝の営業に食い込む…
    // …のではなく 24:00→6:00 へ飛ぶので、270分では 6:00+30分＝まだ作業
    expect(cs.businessMinutesFor('recipe_buckwheat_flour', 3)).toBe(0)
    // 6回 540分なら 6:00 から300分＝10:00 を越えて営業へ入る
    expect(cs.businessMinutesFor('recipe_buckwheat_flour', 6)).toBeGreaterThan(0)
  })

  /**
   * ⚠ **ここが #53 の本体。**`fitsInToday` は 24:00 に間に合うかしか見ないので、
   *   朝6:00 の「最大」は**営業日を丸ごと潰す回数**を通す。禁じないが、見えなくてよい理由はない。
   */
  it('⚠ 朝6:00 は fitsInToday を通るのに、営業をまるごと削ることがある', () => {
    let tm: TimeManager
    ;({ tm, cs } = withRealClock(6))
    inventory.add('buckwheat', 999)
    expect(tm.minutesUntilEndOfDay()).toBe(1080)
    // 12回 = 1080分。今日のうちには終わるので着手できる
    expect(cs.fitsInToday('recipe_buckwheat_flour', 12)).toBe(true)
    // しかし営業600分は丸ごと消える
    expect(cs.businessMinutesFor('recipe_buckwheat_flour', 12)).toBe(600)
    expect(cs.fitsBeforeOpen('recipe_buckwheat_flour', 12)).toBe(false)
  })

  it('⚠ 削っても着手は禁じない（深さを取る選択はプレイヤーのもの）', () => {
    ;({ cs } = withRealClock(12))
    inventory.add('buckwheat', 3)
    expect(cs.fitsBeforeOpen('recipe_buckwheat_flour')).toBe(false)
    expect(cs.canCraft('recipe_buckwheat_flour')).toBe(true) // それでも作れる
    expect(cs.startCraft('recipe_buckwheat_flour')).toBe(true)
  })

  it('CRAFTING_COMPLETED が、実際の分数と削った営業分を渡す', () => {
    ;({ cs } = withRealClock(12))
    inventory.add('buckwheat', 3)
    const payloads: CraftResult[] = []
    EventBus.on(GameEvents.CRAFTING_COMPLETED, p => payloads.push(p as CraftResult))
    cs.startCraft('recipe_buckwheat_flour')
    expect(payloads).toEqual([
      { recipeId: 'recipe_buckwheat_flour', times: 1, quantity: 3, minutes: 90, businessMinutes: 90 },
    ])
  })

  it('⚠ 飛ばす前に数えている（飛ばした後の時刻で数えると0になってしまう）', () => {
    ;({ cs } = withRealClock(19))          // 19:00 — 残りの営業は60分
    inventory.add('buckwheat', 3)
    const payloads: CraftResult[] = []
    EventBus.on(GameEvents.CRAFTING_COMPLETED, p => payloads.push(p as CraftResult))
    cs.startCraft('recipe_buckwheat_flour') // 90分 → 20:30 に終わる
    // 終わった時刻（20:30）は作業帯。後から数えたら0分になる。実際に削ったのは
    // 19:01〜19:59 の59分（20:00 ちょうどはもう閉店側 —— tick と同じ数え方）
    expect(payloads[0].businessMinutes).toBe(59)
  })
})

/**
 * ⚠ **画面に出す分数の出どころ**（#53）。
 *
 * 工房の行と完了の知らせは、以前 `recipe.durationMinutes × times` を出していた。
 * あれは**手際を掛ける前の素の値**で、`minutesFor` とは初期手際の時点ですでに食い違う。
 * **時間が加工の値段である以上、ここがずれると払う額を間違えて見せていることになる。**
 */
describe('画面に出す分数は minutesFor から取る（#53）', () => {
  it('⚠ 初期手際でも durationMinutes と実際の分数は一致しない', () => {
    const registry = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)
    const tm = new TimeManager()
    const cs = new CraftingSystem(registry, new Inventory(), tm, new Upgrades())

    // 難易度 D = tier×5 なので、初期手際 S=10 と釣り合うのは tier2 だけ。
    // tier3 以上は 2^((D−S)/5) 倍に伸びる
    const flour = registry.getRecipe('recipe_buckwheat_flour')   // tier2 — 一致する
    expect(cs.minutesFor('recipe_buckwheat_flour')).toBe(flour.durationMinutes)

    const bread = registry.getRecipe('recipe_buckwheat_bread')   // tier3 — 2倍になる
    expect(cs.minutesFor('recipe_buckwheat_bread')).toBe(bread.durationMinutes * 2)
  })

  it('⚠ 素の値で判定すると、営業を削る量を半分に見誤る', () => {
    const registry = new ItemRegistry(ALL_ITEMS, ALL_RECIPES)
    const tm = new TimeManager()
    tm.setTime({ day: 1, hour: 10, minute: 0 })   // 開店ちょうど
    const cs = new CraftingSystem(registry, new Inventory(), tm, new Upgrades())

    const bread = registry.getRecipe('recipe_buckwheat_bread')
    // 素は300分だが、初期手際での実際は600分 ＝ 開店から閉店まで丸ごと
    expect(bread.durationMinutes).toBe(300)
    expect(cs.minutesFor('recipe_buckwheat_bread')).toBe(600)
    // 削る営業分は599（600分目は 20:00 ちょうどで、もう閉店側）。
    // 素の値（300分）を信じると、失う売上を半分だと思い込む
    expect(cs.businessMinutesFor('recipe_buckwheat_bread')).toBe(599)
  })
})
