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
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: '#2d2d44',
      scene: [BootScene, GameScene],
      physics: { default: 'arcade' },
      render: {
        antialias: true,
        pixelArt: false,
      },
    })
  }

  getScene<T extends Phaser.Scene>(key: string): T {
    return this.game.scene.getScene(key) as T
  }
}
