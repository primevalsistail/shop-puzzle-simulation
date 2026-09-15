import type Phaser from 'phaser'
import { SE_KEYS, SeThrottle, sePath, type SeKey } from './se.js'
import { isSeOn, seGain, watchSe } from './seSettings.js'

/**
 * **効果音を鳴らす側**（#124）。**どこで鳴らすかは決めない**（それは呼ぶ側）。
 *
 * ⚠ **BGM と作りが違うところが3つある。**
 *
 * 1. **場面をまたいで生き残らなくてよい。**効果音は**いま見ている画面のもの**で、
 *    **場面を移ったら鳴り止んでよい。**それでも**1つだけ作る**のは、
 *    **`SePlayer` を2つ作ると間引きの記録が2つに割れる**から。
 * 2. **12音まとめて先に読む。**⚠ **BGM は1曲ずつ遅らせて読んでいる**が、
 *    **あちらは8曲で 15MB。効果音は12音で 0.4MB** しかない。
 *    **押した瞬間に読み始めると、その1回目が鳴らない。**
 * 3. **淡くしない。**一瞬で終わる音なので**替わり目が無い。**
 */
export class SePlayer {
  private ready = false
  private loading = false
  private throttle = new SeThrottle()

  constructor(private game: Phaser.Game) {
    // ⚠ **切ったとき、鳴っている途中の音は止めない。**
    //   **一瞬で終わる**ので、止めると**切った操作そのものの音**が不自然に切れる。
    //   （BGM は鳴り続けるので `stopAll()` が要る。こちらは要らない）
    watchSe(() => { /* 音量は鳴らすたびに読むので、ここですることは無い */ })
  }

  /**
   * **12音を読み込む。**⚠ **`BootScene` から1度だけ呼ぶ。**
   * **鳴らす場面ごとに呼ぶと、そのたびに読み込みが走る。**
   */
  preload(scene: Phaser.Scene): void {
    if (this.ready || this.loading) return
    this.loading = true
    for (const key of SE_KEYS) {
      if (this.game.cache.audio.exists(key)) continue
      scene.load.audio(key, sePath(key))
    }
    scene.load.once('complete', () => { this.loading = false; this.ready = true })
    scene.load.start()
  }

  /**
   * **鳴らす。**⚠ **切ってあれば何もしない。****間引かれたときも何もしない。**
   *
   * ⚠ **読み込みが終わっていなければ黙って捨てる。**
   *   **待たせて後から鳴らさない** —— **押した音が遅れて鳴るほうが不自然。**
   */
  play(key: SeKey): void {
    if (!isSeOn()) return
    if (!this.game.cache.audio.exists(key)) return
    if (!this.throttle.allow(key, this.game.getTime())) return
    this.game.sound.play(key, { volume: seGain() })
  }

  /** ⚠ **場面が替わったら呼ぶ。**間引きの記録を持ち越さない */
  resetThrottle(): void {
    this.throttle.reset()
  }
}

/**
 * ⚠ **1つだけ作る。**場面ごとに作ると**間引きの記録が割れ、同じ音が重なって鳴る。**
 * （`bgm()` と同じ形にしてある）
 */
let instance: SePlayer | null = null

export function se(scene: Phaser.Scene): SePlayer {
  instance ??= new SePlayer(scene.game)
  return instance
}

/** **鳴らす近道。**⚠ **呼ぶ側はこれだけ使う**（`se(scene).play(...)` と同じ） */
export function playSe(scene: Phaser.Scene, key: SeKey): void {
  se(scene).play(key)
}
