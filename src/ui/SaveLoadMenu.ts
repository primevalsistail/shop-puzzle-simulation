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
/** 確認の面の高さ。**枠の一覧より低い**（行が3つ無い） */
const CONFIRM_MH = 190

export class SaveLoadMenu {
  private objects: Phaser.GameObjects.GameObject[] = []
  private mode: 'save' | 'load' = 'save'
  /**
   * 確認待ちの枠（#PO 指示 2026-09-14「ロードの時は確認メッセージを表示する」）。
   *
   * ⚠ **ロードだけ。セーブは押した時点で保存する**（今までどおり）。
   *   上書きにも確認が要るかは PO へ回してある（`construction/plans/load-confirm.md`）。
   */
  private pending: number | null = null

  constructor(
    private scene: Phaser.Scene,
    private getSlotMeta: (slot: number) => SlotMeta | null,
    private onSave: (slot: number) => void,
    private onLoad: (slot: number) => void,
  ) {}

  openSave(): void { this.mode = 'save'; this.pending = null; this.build() }
  openLoad(): void { this.mode = 'load'; this.pending = null; this.build() }

  /**
   * 閉じる。**確認待ちも捨てる。**
   *
   * ⚠ **ESC はここへ来る**（`GameScene` の 1箇所）。**確認の面から一覧へ戻すのではなく、
   *   まるごと閉じる。**戻す作りにすると、ESC の意味が画面ごとに変わる。
   */
  close(): void {
    this.clearObjects()
    this.pending = null
  }

  /**
   * 開いているか。**`GameScene.isShelfBlocked()` がこれを見る。**
   * ⚠ **確認の面が出ている間も真であること。**偽だと、確認を出したまま棚を掴める。
   */
  isVisible(): boolean { return this.objects.length > 0 }

  private clearObjects(): void {
    for (const obj of this.objects) obj.destroy()
    this.objects = []
  }

  private push(...objs: Phaser.GameObjects.GameObject[]): void {
    objs.forEach(o => { this.objects.push(o) })
  }

  /** 全面の覆い＋パネル＋題。**一覧と確認で同じものを使う**（面が入れ替わったように見せない） */
  private buildFrame(panelH: number, title: string): { cx: number, cy: number } {
    const { width, height } = this.scene.scale
    const cx = width / 2
    const cy = height / 2

    this.push(
      this.scene.add.rectangle(cx, cy, width, height, 0x000000, 0.65)
        .setInteractive().setDepth(DEPTH),
      this.scene.add.rectangle(cx, cy, MW, panelH, 0x16213e)
        .setStrokeStyle(2, 0x5566cc).setDepth(DEPTH),
      this.scene.add.text(cx, cy - panelH / 2 + 26, title, {
        fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(DEPTH),
    )
    return { cx, cy }
  }

  private addButton(
    x: number, y: number, w: number, label: string,
    fill: number, hover: number, stroke: number, color: string,
    onClick: () => void,
  ): void {
    const bg = this.scene.add.rectangle(x, y, w, 36, fill)
      .setStrokeStyle(1, stroke).setInteractive({ useHandCursor: true }).setDepth(DEPTH)
    this.push(
      bg,
      this.scene.add.text(x, y, label, { fontSize: '14px', color }).setOrigin(0.5).setDepth(DEPTH),
    )
    bg.on('pointerover', () => bg.setFillStyle(hover))
    bg.on('pointerout',  () => bg.setFillStyle(fill))
    bg.on('pointerdown', onClick)
  }

  private build(): void {
    this.clearObjects()

    const title = this.mode === 'save' ? 'セーブ' : 'ロード'
    const { cx, cy } = this.buildFrame(MH, title)

    // Slot buttons
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
      this.push(bg)

      // Slot number (left)
      this.push(
        this.scene.add.text(cx - slotW / 2 + 14, sy - 10, `スロット ${i + 1}`, {
          fontSize: '12px', color: disabled ? '#555566' : '#7799ff', fontStyle: 'bold',
        }).setOrigin(0, 0.5).setDepth(DEPTH),
      )

      // Slot info (center-left)
      const info = meta ? this.formatMeta(meta) : '--- 空スロット ---'
      this.push(
        this.scene.add.text(cx - slotW / 2 + 14, sy + 10, info, {
          fontSize: '12px', color: disabled ? '#444455' : meta ? '#cccccc' : '#777788',
        }).setOrigin(0, 0.5).setDepth(DEPTH),
      )

      if (!disabled) {
        bg.setInteractive({ useHandCursor: true })
        bg.on('pointerover', () => bg.setFillStyle(fillHover))
        bg.on('pointerout',  () => bg.setFillStyle(fillNormal))
        bg.on('pointerdown', () => {
          // ⚠ **ロードはここで実行しない。**押し間違えると戻らない（PO 指示 2026-09-14）
          if (this.mode === 'save') { this.onSave(i); this.close() }
          else                     { this.pending = i; this.buildConfirm() }
        })
      }
    }

    // Cancel button
    this.addButton(
      cx, cy + MH / 2 - 30, 130, 'キャンセル',
      0x3a3a4a, 0x555566, 0x666677, '#bbbbcc',
      () => this.close(),
    )
  }

  /**
   * ロードの確認（PO 指示 2026-09-14）。
   *
   * ⚠ **「いま遊んでいる分が消える」ことを書く。**どの枠を読むかだけでは、
   *   **何が失われるかが分からない。**確認を出す理由はそこにある。
   */
  private buildConfirm(): void {
    this.clearObjects()

    const slot = this.pending
    if (slot === null) return

    const { cx, cy } = this.buildFrame(CONFIRM_MH, 'ロード')

    const meta = this.getSlotMeta(slot)
    this.push(
      this.scene.add.text(cx, cy - 28, `スロット ${slot + 1} を読み込みます`, {
        fontSize: '15px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(DEPTH),
      this.scene.add.text(cx, cy - 6, meta ? this.formatMeta(meta) : '', {
        fontSize: '12px', color: '#cccccc',
      }).setOrigin(0.5).setDepth(DEPTH),
      this.scene.add.text(cx, cy + 22, 'いま遊んでいる分は消えます', {
        fontSize: '13px', color: '#ffcc55',
      }).setOrigin(0.5).setDepth(DEPTH),
    )

    const by = cy + CONFIRM_MH / 2 - 30
    this.addButton(
      cx - 75, by, 130, '読み込む',
      0x2f5a2f, 0x3f7a3f, 0x44aa44, '#ddffdd',
      () => { this.close(); this.onLoad(slot) },
    )
    // ⚠ **やめるは閉じない。枠の一覧へ戻す**（押す枠を選び直せる）
    this.addButton(
      cx + 75, by, 130, 'やめる',
      0x3a3a4a, 0x555566, 0x666677, '#bbbbcc',
      () => { this.pending = null; this.build() },
    )
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
