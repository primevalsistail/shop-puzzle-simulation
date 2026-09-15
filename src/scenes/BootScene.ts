import Phaser from 'phaser'
import { CUSTOMER_ART, CUSTOMER_ART_READY, FACE_KEYS, SHOPKEEPER_KEY, facePath, shopkeeperPath } from '../ui/faces.js'
import { ICON_KEYS, iconPath } from '../ui/icons.js'
import { se } from '../audio/SePlayer.js'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  /**
   * 絵を読み込む（#15・#21）。
   *
   * ⚠ **`GameScene` で読み込まない。**場面が始まったあとに読むと、**最初の何フレームか絵が無い。**
   * ⚠ **テレナも今のうちに読む。**出番ははじまりの場面だけだが、**置き場が同じ**なので、
   *   ここだけ1枚外すと「なぜこれだけ別なのか」が分からなくなる。
   */
  preload(): void {
    for (const key of FACE_KEYS) this.load.image(key, facePath(key))
    this.load.image(SHOPKEEPER_KEY, shopkeeperPath())
    // ⚠ **来店客の絵は揃ってから読む**（`faces.ts` の `CUSTOMER_ART_READY`）。
    //   **無い絵を読ませると 404 が並ぶ**ので、旗が立つまでは読み込まない
    if (CUSTOMER_ART_READY) {
      for (const art of CUSTOMER_ART) this.load.image(art.key, art.path)
    }
    // ボタンの絵（#69）。⚠ **ここで読む。**場面が始まってから読むと、
    //   **最初の何フレームかボタンの中が空になる**（顔絵と同じ理由）
    for (const key of ICON_KEYS) this.load.image(key, iconPath(key))
    // 効果音（#124）。⚠ **12音まとめてここで読む。**
    //   **押した瞬間に読み始めると、その1回目が鳴らない。**
    //   ⚠ **BGM は1曲ずつ遅らせて読んでいる**が、**あちらは8曲で 15MB、こちらは12音で 0.4MB**
    se(this).preload(this)
  }

  create(): void {
    this.scene.start('TitleScene')
  }
}
