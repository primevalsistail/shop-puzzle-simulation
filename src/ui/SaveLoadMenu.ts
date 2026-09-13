import Phaser from 'phaser'
import type { SlotMeta } from '../types/index.js'
import { money } from './money.js'

const SLOT_COUNT = 3
/**
 * ⚠ **場所の枠（`PlaceFrame` の 90）と中身（100）より上に出すこと。**
 *   セーブは場所ではなくダイアログのまま残してある（PO 判断 2026-09-12 Q2）ので、
 *   **行った先からでも開ける。**低いと場所の画面の裏に隠れて、開いたことが分からない。
 *   目標達成・ゲームオーバーの幕（200）よりは下。
 */
const DEPTH = 150
const MW = 480  // menu width
const MH = 310  // menu height

type Push = (...objs: Phaser.GameObjects.GameObject[]) => void

export class SaveLoadMenu {
  private objects: Phaser.GameObjects.GameObject[] = []
  private mode: 'save' | 'load' = 'save'
  /**
   * ⚠ **確認待ちの枠の番号。`null` のときが枠の一覧。**
   *   **戻らない操作は、押した場では実行しない。**ここに番号を入れて確認を出し、
   *   **`onSave()` / `onLoad()` を呼ぶのは確認の「する」側を押したときだけ。**
   *
   *   - **上書き**（中身のある枠へのセーブ。PO 指示 2026-09-13）—— 枠の記録が消える
   *   - **ロード**（PO 指示 2026-09-14）—— **いま遊んでいる分が消える**
   *
   *   ⚠ **空の枠へのセーブだけは今までどおり即実行する**（消えるものが無い）。
   */
  private confirmSlot: number | null = null

  constructor(
    private scene: Phaser.Scene,
    private getSlotMeta: (slot: number) => SlotMeta | null,
    private onSave: (slot: number) => void,
    private onLoad: (slot: number) => void,
  ) {}

  openSave(): void { this.mode = 'save'; this.confirmSlot = null; this.build() }
  openLoad(): void { this.mode = 'load'; this.confirmSlot = null; this.build() }

  close(): void {
    this.clearObjects()
    this.confirmSlot = null
  }

  isVisible(): boolean { return this.objects.length > 0 }

  /**
   * ⚠ **`build()` が使う中身の捨て方。`close()` と違い、確認の状態は残す。**
   *   ここで `close()` を呼ぶと、確認を出すために作り直した瞬間に番号が消える。
   */
  private clearObjects(): void {
    for (const obj of this.objects) obj.destroy()
    this.objects = []
  }

  private build(): void {
    this.clearObjects()

    const { width, height } = this.scene.scale
    const cx = width / 2
    const cy = height / 2
    const push: Push = (...objs) => {
      objs.forEach(o => { this.objects.push(o) })
    }

    // Full-screen overlay
    const overlay = this.scene.add.rectangle(cx, cy, width, height, 0x000000, 0.65)
      .setInteractive().setDepth(DEPTH)
    push(overlay)

    // Panel
    push(
      this.scene.add.rectangle(cx, cy, MW, MH, 0x16213e)
        .setStrokeStyle(2, 0x5566cc).setDepth(DEPTH),
    )

    // Title
    const title = this.mode === 'save' ? 'セーブ' : 'ロード'
    push(
      this.scene.add.text(cx, cy - MH / 2 + 26, title, {
        fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(DEPTH),
    )

    if (this.confirmSlot !== null) this.buildConfirm(cx, cy, push)
    else                           this.buildSlots(cx, cy, push)
  }

  /** 枠の一覧 */
  private buildSlots(cx: number, cy: number, push: Push): void {
    const slotW = MW - 40
    const slotH = 52
    const firstSlotY = cy - MH / 2 + 74
    const slotGap = slotH + 8

    for (let i = 0; i < SLOT_COUNT; i++) {
      const sy = firstSlotY + i * slotGap
      const meta = this.getSlotMeta(i)
      const isEmpty = meta === null
      const disabled = this.mode === 'load' && isEmpty

      const fillNormal = disabled ? 0x222233 : isEmpty ? 0x2a2a55 : 0x253a25
      const fillHover  = disabled ? 0x222233 : isEmpty ? 0x4040aa : 0x3a5a3a
      const strokeCol  = disabled ? 0x333344 : isEmpty ? 0x5566aa : 0x44aa44

      const bg = this.scene.add.rectangle(cx, sy, slotW, slotH, fillNormal)
        .setStrokeStyle(1, strokeCol).setDepth(DEPTH)
      push(bg)

      // Slot number (left)
      push(
        this.scene.add.text(cx - slotW / 2 + 14, sy - 10, `スロット ${i + 1}`, {
          fontSize: '12px', color: disabled ? '#555566' : '#7799ff', fontStyle: 'bold',
        }).setOrigin(0, 0.5).setDepth(DEPTH),
      )

      // Slot info (center-left)
      const info = meta ? this.formatMeta(meta) : '--- 空スロット ---'
      push(
        this.scene.add.text(cx - slotW / 2 + 14, sy + 10, info, {
          fontSize: '12px', color: disabled ? '#444455' : meta ? '#cccccc' : '#777788',
        }).setOrigin(0, 0.5).setDepth(DEPTH),
      )

      if (!disabled) {
        bg.setInteractive({ useHandCursor: true })
        bg.on('pointerover', () => bg.setFillStyle(fillHover))
        bg.on('pointerout',  () => bg.setFillStyle(fillNormal))
        bg.on('pointerdown', () => {
          // ⚠ **ここで実行するのは、消えるものが無いときだけ**（空の枠へのセーブ）。
          //   **中身のある枠への上書きも、ロードも、確認を挟む。**
          if (isEmpty) { this.onSave(i); this.close(); return }
          this.confirmSlot = i
          this.build()
        })
      }
    }

    this.button(push, cx, cy + MH / 2 - 30, 'キャンセル', 0x3a3a4a, 0x555566,
      () => this.close())
  }

  /**
   * 上書き（セーブ）と読み込み（ロード）の確認。
   *
   * ⚠ **いま入っている記録を出す。**枠の番号だけだと、どの記録を潰すのか分からない
   *   （枠の一覧は消えているので、押した直前の行はもう見えない）。
   * ⚠ **ロードでは「いま遊んでいる分が消える」ことも書く。**
   *   **失われるのは枠の中身ではなく手元の進み**なので、記録の行だけでは伝わらない。
   */
  private buildConfirm(cx: number, cy: number, push: Push): void {
    const slot = this.confirmSlot as number
    const meta = this.getSlotMeta(slot)
    const saving = this.mode === 'save'

    const head = saving
      ? `スロット ${slot + 1} に上書きします`
      : `スロット ${slot + 1} を読み込みます`
    push(
      this.scene.add.text(cx, cy - 24, head, {
        fontSize: '16px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(DEPTH),
    )
    if (meta) {
      push(
        this.scene.add.text(cx, cy + 6,
          `${saving ? 'いまの記録' : '読む記録'}: ${this.formatMeta(meta)}`, {
            fontSize: '12px', color: '#cccccc',
          }).setOrigin(0.5).setDepth(DEPTH),
      )
    }
    if (!saving) {
      push(
        this.scene.add.text(cx, cy + 34, 'いま遊んでいる分は消えます', {
          fontSize: '13px', color: '#ffcc55',
        }).setOrigin(0.5).setDepth(DEPTH),
      )
    }

    // ⚠ **閉じてから呼ぶこと。**先に呼ぶと、結末が別の画面を開いたときに
    //   確認の面がその上に残る（`MessageWindow.show()` と同じ順）。
    const by = cy + MH / 2 - 30
    if (saving) {
      this.button(push, cx - 75, by, '上書きする', 0x6a3a3a, 0x8a4a4a, () => {
        this.close()
        this.onSave(slot)
      })
    } else {
      this.button(push, cx - 75, by, '読み込む', 0x2f5a2f, 0x3f7a3f, () => {
        this.close()
        this.onLoad(slot)
      })
    }
    this.button(push, cx + 75, by, 'やめる', 0x3a3a4a, 0x555566, () => {
      this.confirmSlot = null
      this.build()
    })
  }

  private button(
    push: Push, x: number, y: number, label: string,
    fill: number, hover: number, onClick: () => void,
  ): void {
    const bg = this.scene.add.rectangle(x, y, 130, 36, fill)
      .setStrokeStyle(1, 0x666677).setInteractive({ useHandCursor: true }).setDepth(DEPTH)
    push(
      bg,
      this.scene.add.text(x, y, label, {
        fontSize: '14px', color: '#bbbbcc',
      }).setOrigin(0.5).setDepth(DEPTH),
    )
    bg.on('pointerover', () => bg.setFillStyle(hover))
    bg.on('pointerout',  () => bg.setFillStyle(fill))
    bg.on('pointerdown', onClick)
  }

  private formatMeta(meta: SlotMeta): string {
    const d = new Date(meta.savedAt)
    const mm  = String(d.getMonth() + 1).padStart(2, '0')
    const dd  = String(d.getDate()).padStart(2, '0')
    const hh  = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `Day ${meta.day}  ${money(meta.totalRevenue)}  ${mm}/${dd} ${hh}:${min}`
  }
}
