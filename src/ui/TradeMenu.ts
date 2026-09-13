import type { PlaceFrame } from './PlaceFrame.js'
import { TRADE_TITLE, TRADE_TABS } from './layout.js'

/**
 * 「取引」の中の1タブ。**枠（`PlaceFrame`）には触らない。**
 *
 * ⚠ **`enter` で作って `leave` で捨てる、の1組だけ。**片方だけ実装すると、
 *   タブを行き来するたびに `<input>` が増える／残る（工房で一度踏んだ事故）。
 */
export interface TradeTabPanel {
  enter(): void
  leave(): void
}

/**
 * 「取引」（#96）。**`商人のところ` と `改装` を1つにまとめた「行く場所」。**
 *
 * ⚠ **`PlaceFrame` の決まりをそのまま守る** —— **棚は覆うのではなく消す** ／
 *   **出口は店に戻る印（🏠）と ESC の1つだけ** ／ **タブごとに [×] を持たせない。**
 * ⚠ **見出しはボタンと同じ名（`取引`）。**同じ場所を2つの名で呼ばない（束M の
 *   `クラフト`→`工房` と同じ直し）。
 *
 * ⚠ **枠を持つのはここ1つ。**中のタブ（`PurchaseMenu` / `UpgradeMenu` / `DeliveryTab`）は
 *   中身を作るだけで、`frame.show()` も `frame.hide()` も呼ばない。
 *   呼ぶと**タブを切り替えただけで枠が作り直され、`<input>` が巻き添えになる。**
 */
export class TradeMenu {
  private isOpen = false
  private tab = 0

  constructor(
    private frame: PlaceFrame,
    /** ⚠ **`TRADE_TABS` と同じ並び**（商人 → 改装 → 納品） */
    private panels: readonly TradeTabPanel[],
    private onClose: () => void,
  ) {}

  isVisible(): boolean {
    return this.isOpen
  }

  /** @param tab どのタブで開くか。既定は `商人`（`TRADE_TABS` の先頭） */
  open(tab = 0): void {
    if (this.isOpen) {
      this.select(tab)
      return
    }
    this.isOpen = true
    this.tab = tab
    this.frame.show(TRADE_TITLE, () => this.close(), {
      labels: TRADE_TABS,
      active: tab,
      onSelect: i => this.select(i),
    })
    this.panels[this.tab].enter()
  }

  /**
   * タブを切り替える。
   *
   * ⚠ **出てから入る。**先に入れると、前のタブの `<input>` を捨てる前に
   *   次のタブが同じ場所へ置くことになり、**打てない箱が重なって残る。**
   * ⚠ **枠は作り直さない。**塗り替えるだけ（`setActiveTab`）。
   */
  private select(index: number): void {
    if (!this.isOpen || index === this.tab) return
    this.panels[this.tab].leave()
    this.tab = index
    this.frame.setActiveTab(index)
    this.panels[this.tab].enter()
  }

  /** 店に戻る。**店に戻る印（🏠）と ESC がここへ来る** */
  close(): void {
    if (!this.isOpen) return
    this.isOpen = false
    this.panels[this.tab].leave()
    this.frame.hide()
    this.onClose()
  }
}
