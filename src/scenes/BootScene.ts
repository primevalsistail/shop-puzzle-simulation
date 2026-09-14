import Phaser from 'phaser'
import { FACE_KEYS, SHOPKEEPER_KEY, facePath, shopkeeperPath } from '../ui/faces.js'

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
  }

  create(): void {
    this.scene.start('TitleScene')
  }
}
