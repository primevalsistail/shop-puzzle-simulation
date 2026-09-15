import type Phaser from 'phaser'
import { bgmPaths, type BgmKey } from './bgm.js'
import { isMusicOn, watchMusicOn } from './musicOn.js'

/** 替わり目にかける時間（bgm.md §3「1秒ほどかけて前の曲から次へ」） */
const FADE_MS = 1000

/** ⚠ **控えめに。**うしろで鳴るものなので、既定で大きいと毎回切られる */
const VOLUME = 0.5

/**
 * ⚠ **`BaseSound` には `volume` が無い。**音量を持つのは実装側の2つだけなので、
 *   **淡くする対象はこちらの型で持つ**（`game.sound.add()` が返すのはこのどちらか）。
 */
type Bgm = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound

type Fading = { sound: Bgm; from: number; to: number; elapsed: number; stopAtEnd: boolean }

/**
 * **BGM を鳴らす側**（#14）。**どの曲を鳴らすかは決めない**（それは `bgm.ts`）。
 *
 * ⚠ **場面をまたいで生き残る。**`TitleScene` → `OpeningScene` → `GameScene` と
 *   **移っても曲を切らない**ため、場面ではなく `Phaser.Game` にぶら下げる。
 * ⚠ **淡くする処理に場面の `tweens` を使わない。**場面が終わると
 *   **淡くしている途中で止まり、小さいまま鳴り続ける。**`game.events` の `step` で自分で進める。
 * ⚠ **読み込みは鳴らすときに1曲ずつ**（`BootScene` でまとめて読まない）。
 *   **8曲で 15MB あり、先に全部読むとタイトルが出るまで待たされる。**
 */
export class BgmPlayer {
  private current: Bgm | null = null
  private currentKey: BgmKey | null = null
  /** いま読み込み中の曲。**戻ってきたとき、まだそれが要るかを見る** */
  private loading: BgmKey | null = null
  private fades: Fading[] = []

  constructor(private game: Phaser.Game) {
    this.game.events.on('step', this.step, this)
    // ⚠ **設定で切られたら、その場で止める**（面は開いたままなので、閉じるのを待たない）
    watchMusicOn(on => { if (!on) this.stopAll() })
  }

  /**
   * **この曲に替える。**すでに同じ曲なら**何もしない**
   * （⚠ **毎フレーム呼ばれる。**呼ぶたびに鳴らし直すと頭に戻り続ける）。
   *
   * @param scene 読み込みに使う場面。**いま動いている場面を渡す**
   */
  play(key: BgmKey, scene: Phaser.Scene): void {
    if (!isMusicOn()) return
    if (this.currentKey === key) return
    if (this.loading === key) return

    if (this.game.cache.audio.exists(key)) {
      this.start(key)
      return
    }

    this.loading = key
    scene.load.audio(key, [...bgmPaths(key)])
    scene.load.once('complete', () => {
      if (this.loading !== key) return // 読んでいるあいだに別の曲へ移った
      this.loading = null
      // ⚠ **切られていたら鳴らさない**（読み込み中に設定が変わることがある）
      if (isMusicOn()) this.start(key)
    })
    scene.load.start()
  }

  /** 全部止める（設定で切ったとき・エンディングのあとなど） */
  stopAll(): void {
    this.fades = []
    if (this.current) {
      this.current.stop()
      this.current.destroy()
    }
    this.current = null
    this.currentKey = null
    this.loading = null
  }

  /** いま鳴っている曲（テストと画面から見るため） */
  playingKey(): BgmKey | null {
    return this.currentKey
  }

  private start(key: BgmKey): void {
    // 前の曲は淡くしながら止める
    if (this.current) {
      this.fades.push({ sound: this.current, from: this.current.volume, to: 0, elapsed: 0, stopAtEnd: true })
    }
    const next = this.game.sound.add(key, { loop: true, volume: 0 }) as Bgm
    next.play()
    this.fades.push({ sound: next, from: 0, to: VOLUME, elapsed: 0, stopAtEnd: false })
    this.current = next
    this.currentKey = key
  }

  private step(_time: number, delta: number): void {
    if (this.fades.length === 0) return
    const done: Fading[] = []
    for (const f of this.fades) {
      f.elapsed += delta
      const t = Math.min(1, f.elapsed / FADE_MS)
      f.sound.volume = f.from + (f.to - f.from) * t
      if (t >= 1) done.push(f)
    }
    if (done.length === 0) return
    this.fades = this.fades.filter(f => !done.includes(f))
    for (const f of done) {
      if (!f.stopAtEnd) continue
      f.sound.stop()
      f.sound.destroy()
    }
  }
}

/**
 * ⚠ **1つだけ作る。**場面ごとに作ると**曲が重なって鳴る。**
 * `GameEngine` ではなく最初に必要になった場面から取る（`BootScene` は素通りするだけ）。
 */
let instance: BgmPlayer | null = null

export function bgm(scene: Phaser.Scene): BgmPlayer {
  instance ??= new BgmPlayer(scene.game)
  return instance
}
