import Phaser from 'phaser'

const TUTORIAL_KEY = 'shop_puzzle_tutorial_done'

const STEPS = [
  {
    title: 'ようこそ！',
    body: '左のパネルからアイテムを選んで\nグリッドに配置しましょう。\n\n[R]キーで回転できます。',
  },
  {
    title: '時間を進める',
    body: '右下の「▶ 進める」を押すと\n時間が高速で進み、お客さんが来ます。\n\n商品が売れたら補充しましょう。',
  },
  {
    title: 'クラフト',
    body: '「クラフト」ボタンから素材を使って\n商品を作ることができます。\n\nクラフト中は時間が止まります。',
  },
  {
    title: '仕入れ',
    body: '「仕入れ」ボタンから素材を購入できます。\n\n目標: 累計売上 ¥1,000,000 を達成しよう！',
  },
]

export class Tutorial {
  private container: Phaser.GameObjects.Container | null = null
  private stepIndex = 0

  constructor(private scene: Phaser.Scene) {}

  shouldShow(): boolean {
    try {
      return !localStorage.getItem(TUTORIAL_KEY)
    } catch {
      return true
    }
  }

  show(onDone: () => void): void {
    this.stepIndex = 0
    this.buildStep(onDone)
  }

  private buildStep(onDone: () => void): void {
    this.container?.destroy()
    const { width, height } = this.scene.scale
    const step = STEPS[this.stepIndex]

    const objs: Phaser.GameObjects.GameObject[] = []

    const backdrop = this.scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0, 0)
      .setInteractive()
    objs.push(backdrop)

    objs.push(
      this.scene.add.rectangle(width / 2, height / 2, 480, 280, 0x1a1a3a)
        .setStrokeStyle(2, 0x4a4a8a),
    )

    objs.push(
      this.scene.add.text(width / 2, height / 2 - 100, step.title, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    )

    objs.push(
      this.scene.add.text(width / 2, height / 2 - 20, step.body, {
        fontSize: '16px',
        color: '#cccccc',
        align: 'center',
      }).setOrigin(0.5),
    )

    const stepLabel = `${this.stepIndex + 1} / ${STEPS.length}`
    objs.push(
      this.scene.add.text(width / 2, height / 2 + 80, stepLabel, {
        fontSize: '13px',
        color: '#888888',
      }).setOrigin(0.5),
    )

    const isLast = this.stepIndex === STEPS.length - 1
    const btnText = isLast ? '始める！' : '次へ'
    const nextBtn = this.scene.add.text(width / 2, height / 2 + 110, btnText, {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#4a4a8a',
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    nextBtn.on('pointerdown', () => {
      if (isLast) {
        this.finish(onDone)
      } else {
        this.stepIndex++
        this.buildStep(onDone)
      }
    })
    objs.push(nextBtn)

    this.container = this.scene.add.container(0, 0, objs)
    this.container.setDepth(500)
  }

  private finish(onDone: () => void): void {
    this.container?.destroy()
    this.container = null
    try {
      localStorage.setItem(TUTORIAL_KEY, '1')
    } catch {
      // ignore
    }
    onDone()
  }
}
