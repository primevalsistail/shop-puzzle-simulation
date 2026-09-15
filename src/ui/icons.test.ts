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
   * ⚠ **`進める` と `停止` は、両方とも絵か、両方とも字か。**
   *   **片方だけ絵にすると、押した瞬間に□が出る**（`⏸` はフォントに無い）。
   */
  it('進めると停止は、そろって絵か、そろって字か', () => {
    const panel = buttonPanel()
    const hasPlayGlyph = panel.includes('▶')
    const hasPauseGlyph = scene.includes('⏸')
    if (ADVANCE_ICON_READY) {
      expect(hasPlayGlyph, '進めるが字のまま').toBe(false)
      expect(hasPauseGlyph, '停止が字のまま').toBe(false)
    } else {
      expect(hasPlayGlyph, '進めるだけ絵になっている').toBe(true)
      expect(hasPauseGlyph, '停止だけ絵になっている').toBe(true)
    }
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
      ['save', 'load', 'preset', 'options', 'help', 'trade', 'craft', 'advance'],
    )
  })
})
