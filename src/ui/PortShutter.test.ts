import { describe, it, expect } from 'vitest'
import sceneSource from '../scenes/GameScene.ts?raw'
import { PortShutter, portShutterHalves, PORT_SHUTTER_MS, PORT_SHUTTER_DEPTH } from './PortShutter.js'
import { CELL_SIZE, GRID_ORIGIN_X, GRID_ORIGIN_Y } from './layout.js'

/**
 * 寄港の開店（#6）。⚠ **`PortShutter` は Phaser を型でしか読まない**ので本物を import できる。
 *   **見た目ではなく、覆えているかと、いつ出るかを縛る。**
 */

type FakePlate = {
  x: number; y: number; w: number; h: number
  origin: [number, number]; depth: number; destroyed: boolean
  setOrigin(ox: number, oy: number): FakePlate
  setStrokeStyle(): FakePlate
  setDepth(d: number): FakePlate
  destroy(): void
}

function fakeScene() {
  const plates: FakePlate[] = []
  const tweens: { targets: unknown; scaleX: number; duration: number; onComplete: () => void }[] = []
  const scene = {
    add: {
      rectangle(x: number, y: number, w: number, h: number): FakePlate {
        const plate: FakePlate = {
          x, y, w, h, origin: [0.5, 0.5], depth: 0, destroyed: false,
          setOrigin(ox, oy) { plate.origin = [ox, oy]; return plate },
          setStrokeStyle() { return plate },
          setDepth(d) { plate.depth = d; return plate },
          destroy() { plate.destroyed = true },
        }
        plates.push(plate)
        return plate
      },
    },
    tweens: { add(cfg: (typeof tweens)[number]) { tweens.push(cfg) } },
  }
  return { scene, plates, tweens }
}

describe('寄港の開店（#6）', () => {
  /** ⚠ **隙間があると、開く前から棚が覗く。**重なりがあると、そこだけ色が濃く出る */
  it('左右2枚で、盤面の下地をちょうど覆う（隙間も重なりも無い）', () => {
    const size = { width: 6, height: 5 }
    const { left, right } = portShutterHalves(size)

    expect(left.x + left.w).toBe(right.x)
    expect(left.y).toBe(right.y)
    expect(left.h).toBe(right.h)
    // 下地は `GameScene.resizeGridBackdrop` が `gw+15 / gh+6` で置いている
    expect(left.x).toBe(GRID_ORIGIN_X - 7.5)
    expect(left.y).toBe(GRID_ORIGIN_Y - 3)
    expect(left.w + right.w).toBe(size.width * CELL_SIZE + 15)
    expect(left.h).toBe(size.height * CELL_SIZE + 6)
  })

  /** ⚠ **盤面は強化で広がる。**写しを持つと、広げたあと右端が覆えない */
  it('盤面が広がれば、板も広がる', () => {
    const small = portShutterHalves({ width: 6, height: 5 })
    const big = portShutterHalves({ width: 10, height: 8 })
    expect(big.left.w).toBeGreaterThan(small.left.w)
    expect(big.left.h).toBeGreaterThan(small.left.h)
    expect(big.right.x + big.right.w).toBe(GRID_ORIGIN_X - 7.5 + 10 * CELL_SIZE + 15)
  })

  /**
   * ⚠ **原点が外側の端に無いと、板がその場で痩せるだけ**になり「開いた」に見えない。
   *   **左は左端（0）・右は右端（1）。**
   */
  it('板は外側の端を軸に、左右へ引かれて開く', () => {
    const { scene, plates, tweens } = fakeScene()
    new PortShutter(scene as never).play({ width: 6, height: 5 })

    expect(plates).toHaveLength(2)
    expect(plates[0].origin[0]).toBe(0)
    expect(plates[1].origin[0]).toBe(1)
    expect(plates.every(p => p.depth === PORT_SHUTTER_DEPTH)).toBe(true)

    expect(tweens).toHaveLength(1)
    expect(tweens[0].scaleX).toBe(0)
    expect(tweens[0].duration).toBe(PORT_SHUTTER_MS)
  })

  /** ⚠ **開き終わったら消すこと。**残すと、次の寄港で板が二重に積まれる */
  it('開き終わると板を片付ける', () => {
    const { scene, plates, tweens } = fakeScene()
    new PortShutter(scene as never).play({ width: 6, height: 5 })
    tweens[0].onComplete()
    expect(plates.every(p => p.destroyed)).toBe(true)
  })

  /** ⚠ **200日で20回見る。**長くすると必ず邪魔になる（PO 判断 2026-09-15） */
  it('0.4秒で開き切る', () => {
    expect(PORT_SHUTTER_MS).toBeLessThanOrEqual(400)
  })

  /**
   * ⚠ **島が変わった時だけ。**日が変わるたびに出すと、10日続けて開店演出が出る。
   * ⚠ **盤面が出ているときだけ。**店を離れている間は盤面ごと消えているので、板だけが宙に出る。
   */
  it('島が変わり、かつ盤面が出ているときだけ出す', () => {
    const at = sceneSource.indexOf('this.portShutter.play(')
    expect(at, 'GameScene が呼んでいない').toBeGreaterThan(0)
    const before = sceneSource.slice(0, at)
    expect(before.lastIndexOf('before.island !== after.island'))
      .toBeGreaterThan(before.lastIndexOf('private onDayChanged'))
    expect(sceneSource.slice(at - 120, at)).toContain('this.gridBackdrop.visible')
  })
})
