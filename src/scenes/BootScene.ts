import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    // Unit 2以降でアセットをロードする
  }

  create(): void {
    this.scene.start('GameScene')
  }
}
