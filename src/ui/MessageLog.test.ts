import { describe, it, expect } from 'vitest'
import { MessageLog } from './MessageLog.js'

/**
 * Phaser を読み込まずに済むよう、`scene.add` の返り値だけを真似る。
 * ⚠ `MessageLog.ts` は `import type Phaser` なので実体は要らない。
 */
type FakeText = { text: string; color: string }

function fakeScene() {
  const texts: FakeText[] = []
  const wheels: ((p: { x: number; y: number }, o: unknown, dx: number, dy: number) => void)[] = []
  const chain = () => {
    const o: Record<string, unknown> = {}
    for (const k of ['setDepth', 'setStrokeStyle', 'lineStyle', 'lineBetween',
                     'clear', 'fillStyle', 'fillRect']) o[k] = () => o
    return o
  }
  const scene = {
    add: {
      rectangle: () => chain(),
      graphics: () => chain(),
      text: () => {
        const t: FakeText = { text: '', color: '' }
        const obj = {
          setDepth: () => obj,
          setText: (s: string) => { t.text = s; return obj },
          setStyle: (s: { color: string }) => { t.color = s.color; return obj },
        }
        texts.push(t)
        return obj
      },
    },
    input: {
      on: (_ev: string, fn: (p: { x: number; y: number }, o: unknown, dx: number, dy: number) => void) => {
        wheels.push(fn)
      },
    },
  }
  return { scene, texts, wheels }
}

function make() {
  const f = fakeScene()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const log = new MessageLog(f.scene as any)
  log.create()
  return { log, ...f }
}

const shownText = (texts: FakeText[]) => texts.map(t => t.text).filter(s => s !== '')

describe('MessageLog — 保持（#40）', () => {
  it('表示行数(5)を超えても古い行が消えない', () => {
    const { log } = make()
    for (let i = 0; i < 30; i++) log.addMessage(`売れた${i}`, 'sale')
    expect(log.historyLength()).toBe(30)
    expect(log.getHistory()[0]?.text).toBe('売れた0')
  })

  it('保持の上限(200)を超えたら古い順に落ちる', () => {
    const { log } = make()
    for (let i = 0; i < 250; i++) log.addMessage(`売れた${i}`, 'sale')
    expect(log.historyLength()).toBe(200)
    expect(log.getHistory()[0]?.text).toBe('売れた50')
    expect(log.getHistory()[199]?.text).toBe('売れた249')
  })

  it('表示は従来どおり5行で、最新5件が出る', () => {
    const { log, texts } = make()
    for (let i = 0; i < 30; i++) log.addMessage(`売れた${i}`, 'sale')
    expect(texts).toHaveLength(5)
    expect(log.getVisible().map(e => e.text))
      .toEqual(['売れた25', '売れた26', '売れた27', '売れた28', '売れた29'])
    expect(shownText(texts))
      .toEqual(['売れた25', '売れた26', '売れた27', '売れた28', '売れた29'])
  })

  it('5件に満たないうちは空行が残る（従来どおり）', () => {
    const { log, texts } = make()
    log.addMessage('着いた', 'event')
    expect(shownText(texts)).toEqual(['着いた'])
    expect(texts.filter(t => t.text === '')).toHaveLength(4)
  })
})

describe('MessageLog — 遡り（#40）', () => {
  it('遡ると古い5行が出る。表示は5行のまま', () => {
    const { log, texts } = make()
    for (let i = 0; i < 30; i++) log.addMessage(`売れた${i}`, 'sale')
    log.scrollBy(10)
    expect(log.getScroll()).toBe(10)
    expect(log.getVisible().map(e => e.text))
      .toEqual(['売れた15', '売れた16', '売れた17', '売れた18', '売れた19'])
    expect(shownText(texts)).toHaveLength(5)
  })

  it('先頭より前へは行かない', () => {
    const { log } = make()
    for (let i = 0; i < 8; i++) log.addMessage(`売れた${i}`, 'sale')
    log.scrollBy(100)
    expect(log.getScroll()).toBe(3)   // 8件 − 5行
    expect(log.getVisible().map(e => e.text))
      .toEqual(['売れた0', '売れた1', '売れた2', '売れた3', '売れた4'])
  })

  it('最新より先へは行かない', () => {
    const { log } = make()
    for (let i = 0; i < 8; i++) log.addMessage(`売れた${i}`, 'sale')
    log.scrollBy(-5)
    expect(log.getScroll()).toBe(0)
  })

  it('5行以下なら遡れない', () => {
    const { log } = make()
    log.addMessage('着いた', 'event')
    log.scrollBy(3)
    expect(log.getScroll()).toBe(0)
  })

  it('遡っている間は、新しい行が来ても読んでいる行が動かない', () => {
    const { log } = make()
    for (let i = 0; i < 30; i++) log.addMessage(`売れた${i}`, 'sale')
    log.scrollBy(10)
    const before = log.getVisible().map(e => e.text)
    log.addMessage('新着', 'sale')
    expect(log.getVisible().map(e => e.text)).toEqual(before)
    expect(log.getScroll()).toBe(11)
  })

  it('最新を見ているときは新しい行で流れる（従来どおり）', () => {
    const { log } = make()
    for (let i = 0; i < 30; i++) log.addMessage(`売れた${i}`, 'sale')
    log.addMessage('新着', 'sale')
    expect(log.getVisible()[4]?.text).toBe('新着')
  })

  it('最新へ戻せる', () => {
    const { log } = make()
    for (let i = 0; i < 30; i++) log.addMessage(`売れた${i}`, 'sale')
    log.scrollBy(10)
    log.scrollToLatest()
    expect(log.getScroll()).toBe(0)
    expect(log.getVisible()[4]?.text).toBe('売れた29')
  })
})

describe('MessageLog — ログ欄の中で遡る（行く場所にしない）', () => {
  it('ログ欄の上のホイールで遡り、外では動かない', () => {
    const { log, wheels } = make()
    for (let i = 0; i < 30; i++) log.addMessage(`売れた${i}`, 'sale')
    const wheel = wheels[0]!
    wheel({ x: 600, y: 650 }, null, 0, -1)   // ログ欄の上・上へ回す
    expect(log.getScroll()).toBe(1)
    wheel({ x: 600, y: 650 }, null, 0, 1)    // 下へ回す
    expect(log.getScroll()).toBe(0)
    wheel({ x: 600, y: 300 }, null, 0, -1)   // 盤面の上（ログ欄の外）
    expect(log.getScroll()).toBe(0)
    wheel({ x: 100, y: 650 }, null, 0, -1)   // 左パネルの上
    expect(log.getScroll()).toBe(0)
  })
})

describe('MessageLog — 同じ文の抑止（保持の側で行う）', () => {
  it('info の同じ文が続いたら保持しない（遡っても並ばない）', () => {
    const { log } = make()
    for (let i = 0; i < 50; i++) log.addMessage('離すと持ち物へ戻る', 'info')
    expect(log.historyLength()).toBe(1)
  })

  it('間に別の行が挟まれば、また保持する', () => {
    const { log } = make()
    log.addMessage('つかんでいる', 'info')
    log.addMessage('売れた', 'sale')
    log.addMessage('つかんでいる', 'info')
    expect(log.historyLength()).toBe(3)
  })

  it('sale と event は同じ文でも抑止しない（回数が情報）', () => {
    const { log } = make()
    log.addMessage('パンが売れた！', 'sale')
    log.addMessage('パンが売れた！', 'sale')
    log.addMessage('島に着いた', 'event')
    log.addMessage('島に着いた', 'event')
    expect(log.historyLength()).toBe(4)
  })
})
