import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * **確認を出す・出さないの記録**（#113）。
 *
 * ⚠ **`ConfirmDialog` は Phaser を型でしか読まない**ので、ここから本物を import できる。
 *   **見た目ではなく、覚え方だけを縛る。**
 * ⚠ **読み込みは import した瞬間に1度だけ走る**ので、
 *   **記録を差し替えるたびに `resetModules()` して読み直すこと。**
 */

const store = new Map<string, string>()

/** ⚠ **node には `localStorage` が無い。**本物と同じ形の最小のものを置く */
function useFakeStorage(): void {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v) },
    removeItem: (k: string) => { store.delete(k) },
  })
}

const KEY = 'shop_puzzle_confirm_off'

async function load() {
  vi.resetModules()
  return await import('./ConfirmDialog.js')
}

beforeEach(() => {
  store.clear()
  useFakeStorage()
})

describe('確認を出す行為の表', () => {
  it('既定はすべて「出す」（#113 の指示そのもの）', async () => {
    const { CONFIRM_ACTIONS, confirmNeeded } = await load()
    expect(CONFIRM_ACTIONS.length).toBeGreaterThan(0)
    for (const action of CONFIRM_ACTIONS) {
      expect(confirmNeeded(action), action).toBe(true)
    }
  })

  it('切り替えるとその行為だけ変わる', async () => {
    const { CONFIRM_ACTIONS, confirmNeeded, setConfirmNeeded } = await load()
    const [first, ...rest] = CONFIRM_ACTIONS
    setConfirmNeeded(first, false)
    expect(confirmNeeded(first)).toBe(false)
    for (const action of rest) expect(confirmNeeded(action), action).toBe(true)
  })

  /** ⚠ **記録するのは「出さない」ほうだけ**（足した行為の既定が決まるように） */
  it('記録に残るのは「出さない」行為だけ', async () => {
    const { CONFIRM_ACTIONS, setConfirmNeeded } = await load()
    setConfirmNeeded(CONFIRM_ACTIONS[0], false)
    expect(JSON.parse(store.get(KEY) as string)).toEqual([CONFIRM_ACTIONS[0]])

    setConfirmNeeded(CONFIRM_ACTIONS[0], true)
    expect(JSON.parse(store.get(KEY) as string)).toEqual([])
  })

  it('開き直しても残る', async () => {
    const first = (await load()).CONFIRM_ACTIONS[0]
    ;(await load()).setConfirmNeeded(first, false)
    expect((await load()).confirmNeeded(first)).toBe(false)
  })

  /**
   * ⚠ **これが「出さない」だけを記録している理由。**
   *   古い記録に名前が無い行為は、**既定の「出す」になる**（移し替えが要らない）。
   */
  it('記録に無い行為は「出す」になる', async () => {
    store.set(KEY, JSON.stringify(['まだ無い行為']))
    const { CONFIRM_ACTIONS, confirmNeeded } = await load()
    for (const action of CONFIRM_ACTIONS) expect(confirmNeeded(action), action).toBe(true)
  })

  it('壊れた記録でも落ちず、既定に戻る', async () => {
    for (const broken of ['{', '{"廃棄":false}', 'null']) {
      store.set(KEY, broken)
      const { CONFIRM_ACTIONS, confirmNeeded } = await load()
      for (const action of CONFIRM_ACTIONS) expect(confirmNeeded(action), broken).toBe(true)
    }
  })

  /** ⚠ **`localStorage` を使えない置き場（プライベート窓など）でも落ちないこと** */
  it('localStorage が無くても落ちない', async () => {
    vi.stubGlobal('localStorage', undefined)
    const { CONFIRM_ACTIONS, confirmNeeded, setConfirmNeeded } = await load()
    expect(() => { setConfirmNeeded(CONFIRM_ACTIONS[0], false) }).not.toThrow()
    expect(confirmNeeded(CONFIRM_ACTIONS[0])).toBe(false)
  })
})
