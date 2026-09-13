import Phaser from 'phaser'
import {
  PLACE_L, PLACE_W, PLACE_H, PLACE_CX, PLACE_CY,
  CONTENT_L, CONTENT_R, TITLE_Y, TITLE_RULE_Y,
  TITLE_FONT_PX, BACK_BTN_W, TAB_W, TAB_H, TAB_FONT_PX, tabCx,
} from './layout.js'

/** 枠の深さ。**中身は `CONTENT_DEPTH` に載せる** */
const FRAME_DEPTH = 90
export const CONTENT_DEPTH = 100

/**
 * 場所の中の切り替え（#96 の「取引」）。**枠が持つ。**
 *
 * ⚠ **中身の側に持たせないこと。**タブは見出しの行に並ぶので、
 *   中身が作り直されるたびに消えたり増えたりする（`<input>` と同じ事故）。
 */
export interface FrameTabs {
  readonly labels: readonly string[]
  /** 開いたときに選ばれているタブ */
  readonly active: number
  readonly onSelect: (index: number) => void
}

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
 * ⚠ **出口はここ1つ。**店に戻る印（🏠）と ESC が同じ `onBack` を呼ぶ。
 *   場所ごとに [×] や「キャンセル」を持たせない（場所ごとに閉じ方が違って見える）。
 */
export class PlaceFrame {
  private objects: Phaser.GameObjects.GameObject[] = []
  /** いま居る場所の出口。**null なら店に居る** */
  private back: (() => void) | null = null
  /** タブの部品。**`objects` にも入っているので、片付けは `hide()` がまとめてやる** */
  private tabBgs: Phaser.GameObjects.Rectangle[] = []
  private tabLabels: Phaser.GameObjects.Text[] = []
  private activeTab = 0

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
  show(title: string, onBack: () => void, tabs?: FrameTabs): void {
    this.requestBack()

    const bg = this.scene.add
      // ⚠ 全体背景（0x1a1a2e）と近い色にしないこと。**棚が消えただけに見える**
      .rectangle(PLACE_CX, PLACE_CY, PLACE_W, PLACE_H, 0x232338)
      .setStrokeStyle(2, 0x6a6aaa)
      .setInteractive()
      .setDepth(FRAME_DEPTH)

    const heading = this.scene.add.text(CONTENT_L, TITLE_Y, title, {
      fontSize: `${TITLE_FONT_PX}px`, color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(FRAME_DEPTH)

    const backBg = this.scene.add
      .rectangle(CONTENT_R - BACK_BTN_W / 2, TITLE_Y, BACK_BTN_W, 30, 0x2a2a4a)
      .setStrokeStyle(1, 0x6666aa)
      .setInteractive({ useHandCursor: true })
      .setDepth(FRAME_DEPTH)
    // ⚠ **字は入れない**（PO 指示 2026-09-13）。**家の印だけ。**
    //   出口は ESC と合わせて1つで、**どの場所でも同じ位置・同じ印**にする
    const backLabel = this.scene.add.text(CONTENT_R - BACK_BTN_W / 2, TITLE_Y, '🏠', {
      fontSize: '18px',
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
    if (tabs) this.buildTabs(tabs)
    this.setShopVisible(false)
  }

  /**
   * 見出しの行にタブを並べる。**見出し（左）と店に戻る印（右）のあいだ。**
   *
   * ⚠ **押しても作り直さない。**`setActiveTab` が色だけ塗り替える。
   *   作り直すと、中身が載せている `<input>` まで巻き添えで作り直される。
   */
  private buildTabs(tabs: FrameTabs): void {
    this.activeTab = tabs.active
    tabs.labels.forEach((label, i) => {
      const cx = tabCx(i, tabs.labels.length)
      const bg = this.scene.add.rectangle(cx, TITLE_Y, TAB_W, TAB_H, 0x2a2a4a)
        .setStrokeStyle(1, 0x6666aa)
        .setInteractive({ useHandCursor: true })
        .setDepth(FRAME_DEPTH)
      const text = this.scene.add.text(cx, TITLE_Y, label, {
        fontSize: `${TAB_FONT_PX}px`, color: '#ccddff',
      }).setOrigin(0.5).setDepth(FRAME_DEPTH)
      bg.on('pointerdown', () => tabs.onSelect(i))
      this.tabBgs.push(bg)
      this.tabLabels.push(text)
      this.objects.push(bg, text)
    })
    this.paintTabs()
  }

  /** いま選ばれているタブを塗り替える。**部品は作り直さない** */
  setActiveTab(index: number): void {
    this.activeTab = index
    this.paintTabs()
  }

  private paintTabs(): void {
    this.tabBgs.forEach((bg, i) => {
      const on = i === this.activeTab
      bg.setFillStyle(on ? 0x4a4a7a : 0x2a2a4a)
      bg.setStrokeStyle(on ? 2 : 1, on ? 0xffdd88 : 0x6666aa)
      this.tabLabels[i].setColor(on ? '#ffffff' : '#99aacc')
    })
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
    this.tabBgs = []
    this.tabLabels = []
    this.back = null
    this.setShopVisible(true)
  }
}
