import Phaser from 'phaser'
import {
  PLACE_L, PLACE_W, PLACE_H, PLACE_CX, PLACE_CY,
  CONTENT_L, CONTENT_R, TITLE_Y, TITLE_RULE_Y,
} from './layout.js'

/** 枠の深さ。**中身は `CONTENT_DEPTH` に載せる** */
const FRAME_DEPTH = 90
export const CONTENT_DEPTH = 100

/**
 * 「行く場所」の枠（#58）。
 *
 * 仕入れ・クラフト・改装は**ダイアログではなく場所**で、
 * 行くと**中央の領域がまるごと入れ替わり**、閉じると店に帰ってくる。
 *
 * ⚠ **棚に重ねない。**このゲームの判断は「棚を見て、何が足りないか考えて、足す」なので、
 *   棚を覆うことは判断の材料を隠している。だから枠は**棚を消してから**出る
 *   （`setShopVisible`）。
 *
 * ⚠ **出口はここ1つ。**「← 店に戻る」と ESC が同じ `onBack` を呼ぶ。
 *   場所ごとに [×] や「キャンセル」を持たせない（場所ごとに閉じ方が違って見える）。
 */
export class PlaceFrame {
  private objects: Phaser.GameObjects.GameObject[] = []
  /** いま居る場所の出口。**null なら店に居る** */
  private back: (() => void) | null = null

  constructor(
    private scene: Phaser.Scene,
    /** 売り場（盤面・その下地）の表示を切り替える */
    private setShopVisible: (visible: boolean) => void,
  ) {}

  /** 店を離れているか。**時間も配置も、これで止める** */
  isShown(): boolean {
    return this.back !== null
  }

  /**
   * その場所へ移る。
   *
   * **場所から場所へ直接移れる**（工房 → 商人のところ）。
   * すでにどこかに居るなら、**先にそこを出てから**移る
   * （ダイアログだった頃は仕入れとクラフトを同時に開けて重なっていた）。
   */
  show(title: string, onBack: () => void): void {
    this.requestBack()

    const bg = this.scene.add
      // ⚠ 全体背景（0x1a1a2e）と近い色にしないこと。**棚が消えただけに見える**
      .rectangle(PLACE_CX, PLACE_CY, PLACE_W, PLACE_H, 0x232338)
      .setStrokeStyle(2, 0x6a6aaa)
      .setInteractive()
      .setDepth(FRAME_DEPTH)

    const heading = this.scene.add.text(CONTENT_L, TITLE_Y, title, {
      fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(FRAME_DEPTH)

    const backBg = this.scene.add
      .rectangle(CONTENT_R - 60, TITLE_Y, 120, 30, 0x2a2a4a)
      .setStrokeStyle(1, 0x6666aa)
      .setInteractive({ useHandCursor: true })
      .setDepth(FRAME_DEPTH)
    const backLabel = this.scene.add.text(CONTENT_R - 60, TITLE_Y, '←  店に戻る', {
      fontSize: '14px', color: '#ccddff',
    }).setOrigin(0.5).setDepth(FRAME_DEPTH)
    backBg.on('pointerdown', () => this.requestBack())
    backBg.on('pointerover', () => backBg.setFillStyle(0x4a4a7a))
    backBg.on('pointerout', () => backBg.setFillStyle(0x2a2a4a))

    // 見出しと中身の区切り
    const rule = this.scene.add.graphics().setDepth(FRAME_DEPTH)
    rule.lineStyle(1, 0x3a3a5a, 0.9)
    rule.lineBetween(PLACE_L + 12, TITLE_RULE_Y, PLACE_L + PLACE_W - 12, TITLE_RULE_Y)

    this.objects = [bg, heading, backBg, backLabel, rule]
    this.back = onBack
    this.setShopVisible(false)
  }

  /**
   * 店に帰る。**居る場所に「閉じてよいか」を通してから**帰る
   * （場所の側は在庫や所持金の表示を戻す必要がある）。
   */
  requestBack(): void {
    const back = this.back
    if (!back) return
    this.back = null
    back()
  }

  /**
   * 枠を片付けて棚を戻す。**場所の `close()` から呼ばれる。**
   *
   * ⚠ ここから `onBack` を呼ばないこと。`requestBack` → `close()` → `hide()` と
   *   来るので、呼ぶと往復になる。
   */
  hide(): void {
    if (this.objects.length === 0 && this.back === null) return
    for (const obj of this.objects) obj.destroy()
    this.objects = []
    this.back = null
    this.setShopVisible(true)
  }
}
