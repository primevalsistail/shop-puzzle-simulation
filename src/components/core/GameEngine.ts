import Phaser from 'phaser'
import { BootScene } from '../../scenes/BootScene.js'
import { TitleScene } from '../../scenes/TitleScene.js'
import { GameScene } from '../../scenes/GameScene.js'
import { SCREEN_W, SCREEN_H } from '../../ui/layout.js'

const GAME_WIDTH = SCREEN_W
const GAME_HEIGHT = SCREEN_H

export class GameEngine {
  readonly game: Phaser.Game

  constructor() {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      backgroundColor: '#2d2d44',
      scene: [BootScene, TitleScene, GameScene],
      physics: { default: 'arcade' },
      // ⚠ **`pixelArt: true` をここに戻さないこと**（#10。2026-09-14）。
      //   あれは antialias=false ＋ roundPixels=true ＋ canvas の `image-rendering: pixelated` で、
      //   **1280×720 を CSS で引き伸ばしたときのにじみを、ドットを立てて隠していた。**
      //   内部座標を 1920×1080 にした（`layout.ts` の `SCREEN_W` / `SCREEN_H`）いま、
      //   **文字も線も焼く時点で細かいので、隠す必要がない。**滑らかに描くほうが読める。
      antialias: true,
      // ⚠ **`roundPixels` は明示的に false。**`pixelArt` が暗黙に true にしていた。
      //   **寸法は旧値の正確に 1.5倍**で、`16.5px` や `1.5px` のような端数を持つ（#10）。
      //   整数へ丸められると**その相似が崩れ、見た目が変わる。**
      roundPixels: false,
      // クラフトメニューの回数入力に HTML の <input> を使う（Phaser の DOM コンテナ）。
      // Scale.FIT でキャンバスが拡縮されても、この器が同じ変形を受けるので位置がずれない。
      //
      // ⚠ `parent` が無いと Phaser は DOM コンテナを**作らない**（CreateDOMContainer）。
      //   その場合 `scene.add.dom()` は例外を投げるので、この2つは必ず一組で指定する。
      parent: 'game',
      dom: { createContainer: true },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
      },
    })
  }

  getScene<T extends Phaser.Scene>(key: string): T {
    return this.game.scene.getScene(key) as T
  }
}
