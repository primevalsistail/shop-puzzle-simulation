import type Phaser from 'phaser'
import {
  MSG_WIN_L, MSG_WIN_W, MSG_WIN_H, MSG_WIN_CX, MSG_WIN_CY, MSG_WIN_PAD,
  MSG_SPEAKER_FONT_PX, MSG_SPEAKER_Y,
  MSG_TEXT_FONT_PX, MSG_TEXT_TOP, MSG_LINE_H,
  MSG_CHOICE_W, MSG_CHOICE_H, MSG_CHOICE_FONT_PX, MSG_CHOICE_CY, msgChoiceCx,
} from './layout.js'
import type { StoryChoice, StoryEventDef } from '../components/progress/StoryEvents.js'

/**
 * ⚠ **棚より上、達成／終了の幕（200）より下。**
 *   「行く場所」（`PlaceFrame` 90／中身 100）より上に置く —— 場所に居る間は時間が
 *   止まっているのでできごとは起きないが、重なり順を偶然に任せない。
 */
const DEPTH = 120

/**
 * 選択肢のあるできごとを出す窓（#24）。
 *
 * ⚠ **`PlaceFrame`（行く場所）にしない。**あれは**棚を消してから**出る器で、
 *   中央の領域がまるごと入れ替わる。**選択肢1つ出すために店の風景を消さない**
 *   （`MessageLog` の遡りを「行く場所」にしなかったのと同じ理由）。
 *
 * ⚠ **開いている間は時間と配置が止まる。判定は `GameScene.isShelfBlocked()` 1つだけ。**
 *   ここに止める仕掛けを持たせないこと。以前は同じ判定が7箇所に散らばって、
 *   **1箇所だけ強化メニューが抜けていた。**
 *
 * ⚠ **出口は選択肢だけ。**ESC でも外側を押しても閉じない —— 選ばせるために
 *   時間を止めているのに、選ばずに閉じられるなら止める意味が無い。
 *
 * ⚠ **文字はここで作らない。**話し手も本文も選択肢も `StoryEvents.ts`（Phaser を読まない）
 *   が持つ。ここで組み立てると `layout.test.ts` が実物の文字列を測れなくなる。
 */
export class MessageWindow {
  private objects: Phaser.GameObjects.GameObject[] = []
  private shown = false

  constructor(private scene: Phaser.Scene) {}

  /** 開いているか。**`GameScene.isShelfBlocked()` がこれを見る** */
  isShown(): boolean {
    return this.shown
  }

  /**
   * できごとを出す。**選ばれたら閉じてから `onChoice` を呼ぶ。**
   *
   * ⚠ **閉じてから呼ぶこと。**先に呼ぶと、結末が別の画面を開いたときに
   *   窓がその上に残る（`PlaceFrame.requestBack` → `close()` の順と同じ考え）。
   */
  show(def: StoryEventDef, onChoice: (choice: StoryChoice) => void): void {
    if (this.shown) return
    this.shown = true

    const bg = this.scene.add
      .rectangle(MSG_WIN_CX, MSG_WIN_CY, MSG_WIN_W, MSG_WIN_H, 0x141b2e, 0.97)
      .setStrokeStyle(2, 0x6a6aaa)
      // ⚠ **下の盤面を押させない。**判定は `isShelfBlocked()` が持つが、
      //   窓の下にある棚が「押せそうに見える」状態にはしない
      .setInteractive()
      .setDepth(DEPTH)
    this.objects.push(bg)

    // 話し手。⚠ **名前だけ**（絵は #21・#15 で後から入る）
    this.objects.push(
      this.scene.add.text(MSG_WIN_L + MSG_WIN_PAD, MSG_SPEAKER_Y, def.speaker, {
        fontSize: `${MSG_SPEAKER_FONT_PX}px`, color: '#00ffee', fontStyle: 'bold',
      }).setOrigin(0, 0).setDepth(DEPTH + 1),
    )

    // 本文。**1要素が1行**（自動で折り返さない）
    def.lines.forEach((line, i) => {
      this.objects.push(
        this.scene.add.text(MSG_WIN_L + MSG_WIN_PAD, MSG_TEXT_TOP + i * MSG_LINE_H, line, {
          fontSize: `${MSG_TEXT_FONT_PX}px`, color: '#ffffff',
        }).setOrigin(0, 0).setDepth(DEPTH + 1),
      )
    })

    def.choices.forEach((choice, i) => {
      const cx = msgChoiceCx(i, def.choices.length)
      const btn = this.scene.add
        .rectangle(cx, MSG_CHOICE_CY, MSG_CHOICE_W, MSG_CHOICE_H, 0x2a2a4a)
        .setStrokeStyle(1, 0x6666aa)
        .setInteractive({ useHandCursor: true })
        .setDepth(DEPTH + 1)
      const label = this.scene.add.text(cx, MSG_CHOICE_CY, choice.label, {
        fontSize: `${MSG_CHOICE_FONT_PX}px`, color: '#ccddff',
      }).setOrigin(0.5).setDepth(DEPTH + 2)
      btn.on('pointerover', () => btn.setFillStyle(0x4a4a7a))
      btn.on('pointerout', () => btn.setFillStyle(0x2a2a4a))
      btn.on('pointerdown', () => {
        this.close()
        onChoice(choice)
      })
      this.objects.push(btn, label)
    })
  }

  /** 片付ける。**選ばれたときだけ通る** */
  private close(): void {
    for (const obj of this.objects) obj.destroy()
    this.objects = []
    this.shown = false
  }
}
