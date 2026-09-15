/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest'
import sceneSource from '../scenes/GameScene.ts?raw'
import bootSource from '../scenes/BootScene.ts?raw'
import { ICON_KEYS, ADVANCE_ICON_READY } from './icons.js'

/**
 * **ボタンの絵**（#69）。
 *
 * ⚠ **絵文字に戻す直しを止めるためのテスト。**フォントに無い環境では
 *   **`🛒💾📂🗂❓🔨` と `⏸` が豆腐（□）で出る**（実測 2026-09-15）。
 *   **画面を見ても、絵文字が出る環境では気づけない。**
 * ⚠ **`GameScene` は Phaser を読むので import できない。**ソースとして縛る
 *   （`domInput.test.ts` と同じ）。
 */
const strip = (src: string) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')

const scene = strip(sceneSource)

/** 操作板を組み立てているところだけを見る */
function buttonPanel(): string {
  const at = scene.indexOf('private setupButtonPanel(')
  expect(at, 'setupButtonPanel が無い').toBeGreaterThanOrEqual(0)
  const rest = scene.slice(at)
  const end = rest.indexOf('\n  }')
  return rest.slice(0, end)
}

describe('ボタンの絵（#69）', () => {
  /**
   * ⚠ **絵文字を1つでも混ぜない。**5つのうち1つだけ字だと、
   *   **その環境では□が1つ並ぶ**ことになる。
   */
  it('操作板に絵文字が残っていない', () => {
    const panel = buttonPanel()
    for (const emoji of ['💾', '📂', '🗂', '⚙️', '⚙', '❓', '🛒', '🔨']) {
      expect(panel, `${emoji} が残っている`).not.toContain(emoji)
    }
  })

  it('絵はすべて名札で指している（ファイル名の直書きをしない）', () => {
    const panel = buttonPanel()
    for (const key of ['save', 'load', 'preset', 'options', 'help', 'trade', 'craft']) {
      expect(panel, `${key} を指していない`).toContain(`'${key}'`)
    }
    expect(panel, '絵の置き場を直書きしている').not.toContain('art/icon/')
  })

  /**
   * **#69 受入条件1 —— 操作板に絵文字が1つも残っていない（`▶` `⏸` を含む）。**
   *
   * ⚠ **`⏸` はフォントに無い環境がある**（実測 2026-09-15）。**字では出せない。**
   *   いまは**ボタンの字を `進める` ／ `停止` だけにして、絵を横に置いている**ので、
   *   **絵を取り下げても□にならない。**
   */
  it('進めると停止に絵文字を使っていない', () => {
    expect(scene, '▶ が残っている').not.toContain('▶')
    expect(scene, '⏸ が残っている').not.toContain('⏸')
  })

  /**
   * ⚠ **三角と縦棒は1つのボタンの表と裏。**
   *   **片方だけ指すと、押した瞬間に絵が消える**（無い名札を渡すことになる）。
   */
  it('進めると停止は、そろって絵になる', () => {
    if (!ADVANCE_ICON_READY) return
    expect(scene, "'advance' を指していない").toContain("'advance'")
    expect(scene, "'pause' を指していない").toContain("'pause'")
  })

  /**
   * ⚠ **切り替える場所は5つある。**`setText` を直に書く場所を増やすと、
   *   **字は「停止」なのに絵は三角、という食い違いが出る。**
   */
  it('進めるボタンの切り替えは1箇所にまとめてある', () => {
    expect(scene, 'advanceBtnLabel.setText を直に書いている')
      .not.toMatch(/advanceBtnLabel\.setText\('/)
    expect(scene.match(/this\.setAdvanceButton\(/g)!.length).toBeGreaterThan(4)
  })

  it('読み込むのは BootScene（場面の途中で読まない）', () => {
    expect(strip(bootSource)).toContain('ICON_KEYS')
    expect(scene).not.toContain('iconPath')
  })

  /** ⚠ **配った先で 404 にしない**（`base` が `/` ではない） */
  it('絵の置き場は BASE_URL から作る', async () => {
    const { iconPath } = await import('./icons.js')
    expect(iconPath('save')).toContain('art/icon/save.png')
    expect(iconPath('save').startsWith('/art/')).toBe(false)
  })

  it('名札はファイル名と同じ', () => {
    expect([...ICON_KEYS]).toEqual(
      ['save', 'load', 'preset', 'options', 'help', 'trade', 'craft', 'advance', 'pause'],
    )
  })
})
