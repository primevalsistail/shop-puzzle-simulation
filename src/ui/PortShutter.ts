import type Phaser from 'phaser'
import { CELL_SIZE, GRID_ORIGIN_X, GRID_ORIGIN_Y } from './layout.js'
import { BG_PANEL, LINE_STRONG } from './palette.js'
import type { GridSize } from '../types/index.js'

/**
 * 寄港したときの開店（#6・PO 判断 2026-09-15「案B」）。
 *
 * **島が変わった朝、売り場が板で閉じた状態から始まり、左右に開く。**
 * 開いた先にあるのは**プレイヤー自身が並べた棚**なので、字を読まなくても
 * 「ここが店になった」が伝わる。
 *
 * ⚠ **200日で20回起きる。**長いと必ず邪魔になるので **0.4秒**で開き切る。
 *   **押して飛ばす口は付けない**（PO 判断。この長さなら要らない）。
 * ⚠ **絵を使わない。**島ごとの絵を待つと、生成が終わるまでこの演出そのものが止まる。
 * ⚠ **板は触れない。**開いている 0.4 秒のあいだ、下の棚はそのまま押せる
 *   —— **止めるほどの長さではない**し、止めると「固まった」と読まれる。
 */
export const PORT_SHUTTER_MS = 400

/**
 * ⚠ **棚（`FloorRenderer`）より上、上に重ねる画面より下。**
 *   売値の吹き出し（100）・ボタン列（10）・案内（500）とぶつからない帯を取る。
 */
export const PORT_SHUTTER_DEPTH = 50

/** 板1枚ぶんの矩形。**左上の角と大きさ**（重なりも隙間も無いことを検査できる形で持つ） */
export type ShutterHalf = { x: number; y: number; w: number; h: number }

/**
 * 盤面を左右2枚で覆う板の位置。
 *
 * ⚠ **覆うのは `gridBackdrop` と同じ広さ**（`GameScene.resizeGridBackdrop`）。
 *   **升ちょうどで覆うと、下地の縁が板の外へ出て「閉じきっていない」ように見える。**
 * ⚠ **盤面は強化で広がる**ので、**呼ぶたびに今の大きさから出す**（写しを持たない）。
 */
export function portShutterHalves(size: GridSize): { left: ShutterHalf; right: ShutterHalf } {
  const gw = size.width * CELL_SIZE
  const gh = size.height * CELL_SIZE
  const x = GRID_ORIGIN_X - 7.5
  const y = GRID_ORIGIN_Y - 3
  const w = gw + 15
  const h = gh + 6
  const half = w / 2
  return {
    left: { x, y, w: half, h },
    right: { x: x + half, y, w: half, h },
  }
}

export class PortShutter {
  /** 開いている途中の板。⚠ **次の寄港が重なったら、前のぶんを片付けてから出す** */
  private plates: Phaser.GameObjects.Rectangle[] = []

  constructor(private scene: Phaser.Scene) {}

  /**
   * 閉じた状態から開く。**呼んだ時点で板が出て、`PORT_SHUTTER_MS` かけて左右へ引く。**
   *
   * ⚠ **店を離れているあいだは呼ばないこと**（盤面が消えているので、板だけが宙に出る）。
   *   判断は呼ぶ側（`GameScene`）が持つ。
   */
  play(size: GridSize): void {
    this.clear()
    const { left, right } = portShutterHalves(size)

    // ⚠ **原点を外側の端に置く。**`scaleX` を 0 へ落とすと、板が**外へ引かれて**開く。
    //   中心に置くと、板がその場で痩せて「開いた」に見えない。
    const plateL = this.scene.add.rectangle(left.x, left.y, left.w, left.h, BG_PANEL).setOrigin(0, 0)
    const plateR = this.scene.add.rectangle(right.x + right.w, right.y, right.w, right.h, BG_PANEL)
      .setOrigin(1, 0)
    for (const plate of [plateL, plateR]) {
      plate.setStrokeStyle(1.5, LINE_STRONG).setDepth(PORT_SHUTTER_DEPTH)
      this.plates.push(plate)
    }

    this.scene.tweens.add({
      targets: this.plates,
      scaleX: 0,
      duration: PORT_SHUTTER_MS,
      ease: 'Cubic.Out',
      onComplete: () => this.clear(),
    })
  }

  /** 板を片付ける。**場面を抜けるときにも呼べる** */
  clear(): void {
    for (const plate of this.plates) plate.destroy()
    this.plates = []
  }
}
