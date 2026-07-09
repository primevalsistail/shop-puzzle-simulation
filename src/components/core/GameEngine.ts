import Phaser from 'phaser'
import { BootScene } from '../../scenes/BootScene.js'
import { GameScene } from '../../scenes/GameScene.js'

const GAME_WIDTH = 1280
const GAME_HEIGHT = 720

export class GameEngine {
  readonly game: Phaser.Game

  constructor() {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      backgroundColor: '#2d2d44',
      scene: [BootScene, GameScene],
      physics: { default: 'arcade' },
      // pixelArt: true は antialias=false + roundPixels=true に加え
      // canvas に image-rendering: pixelated CSS を付与する。
      // Scale.FIT でキャンバスが CSS 拡大される際のにじみを防ぐ唯一確実な方法。
      pixelArt: true,
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
