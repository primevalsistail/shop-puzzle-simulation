/**
 * 選択肢のあるできごと（#24）。**データだけ**を置く。
 *
 * ⚠ **Phaser を読まないこと。**画面に出す文字はここで組み立てるので、
 *   読むと `layout.test.ts` が実物の文字列を測れなくなる（`layout.ts` の注記と同じ理由）。
 *
 * ## 1本足すには
 *
 * ⚠ **`STORY_EVENTS` に1件書くだけ。**発火（`StoryEventScheduler`）も `GameScene` も触らない。
 *   結末（`StoryOutcome`）に**いま無い語**が要るときだけ、語をここに足して
 *   `GameScene` にその実装を書く —— 型が網羅を見るので、書き忘れは `tsc` が落とす。
 *
 * ⚠ **ウィンドウを出すのは「選択肢があるとき」だけ**（#24 の既決）。
 *   読むだけの知らせは `MessageLog` へ。ウィンドウは時間を止めるので、
 *   選択を求めないのに出すと**配置パズルの手が止まる回数がそのまま増える。**
 */

/**
 * 選択肢を選んだときに起きること。**ここに挙がっている語だけがデータから起こせる。**
 *
 * ⚠ **品 ID も相手の名前も書かない**（#59 で `r.id === 'U1'` を解いたのと同じ理由）。
 *   ここにあるのは**語彙**であって、できごとの名指しではない。
 */
export type StoryOutcome = '行商人の積荷を見る'

export interface StoryChoice {
  readonly label: string
  /** 選んだあとに起きること。**省くと閉じるだけ** */
  readonly outcome?: StoryOutcome
}

/** いつ起きるか。**日ごとに1回だけ引く** */
export interface StoryTrigger {
  /** その日に起きる確率（0〜1）。**1日に起きるのは多くても1回** */
  readonly chancePerDay: number
  /** 起きうる時間帯（時。`fromHour` 以上 `untilHour` 未満） */
  readonly fromHour: number
  readonly untilHour: number
}

export interface StoryEventDef {
  readonly id: string
  /**
   * 誰が喋っているか。**名前だけ**（PO 判断 2026-09-14。絵は #21・#15 で後から入る）。
   *
   * ⚠ **絵が無いことを理由に構造を変えないこと。**ここに絵を差す欄が増えるだけで済む形にしてある。
   */
  readonly speaker: string
  /**
   * 本文。**1要素が1行。**
   *
   * ⚠ **自動で折り返さない。**折り返すと node のテストから幅を測れなくなるので、
   *   **1行ずつ枠に収まるか**を `layout.test.ts` が見る（収まらなければそこで落ちる）。
   */
  readonly lines: readonly string[]
  /** ⚠ **1つ以上。**選択肢が無いものはウィンドウではなく `MessageLog` へ */
  readonly choices: readonly StoryChoice[]
  readonly trigger: StoryTrigger
}

/**
 * 行商人バレンが船に寄る確率（#90）。
 *
 * ⚠ **仮置き（→ #61）。**「**来る日と来ない日が同じだけある**」以上の根拠は無い。
 *   実装は長らく「必ず毎日」だったので（#9 本文は「最大1日1回**程度**」）、
 *   **まず毎日でなくすこと**が #90 の中身で、値そのものは測って決める。
 *
 * ⚠ **下げるときは `PEDDLER_MARKUP`（1.5）と一緒に見ること。**
 *   行商人は「切らした素材を金で取り寄せる」救済（#34）なので、
 *   **来る日が減るほど1回あたりの重みが増す。**
 */
export const PEDDLER_VISIT_CHANCE = 0.5

/**
 * ⚠ **ここに足すだけでイベントが1本増える。**発火も `GameScene` も触らない。
 */
export const STORY_EVENTS: readonly StoryEventDef[] = [
  {
    id: 'peddler_visit',
    // ⚠ **「行く場所」のボタンと同じ名**（同じ相手を2つの名で呼ばない。束M）
    // ⚠ **見出し（`PEDDLER_TITLE`）と同じ語**（`layout.test.ts` が一致を見ている）
    speaker: '行商人',
    // ⚠ **言い回しは PO の領分（#79）。**既にある知らせの語をそのまま使っている
    lines: ['船に寄った'],
    choices: [
      { label: '見る', outcome: '行商人の積荷を見る' },
      { label: '断る' },
    ],
    trigger: {
      chancePerDay: PEDDLER_VISIT_CHANCE,
      // ⚠ **店を開けている間に来る。**時間を進めている最中に起こすのがこのできごとの形で、
      //   `作業`（6〜10時・20〜24時）は節目で止まるので、そこに置くと
      //   「進める → すぐ止まる」が続けて2回起きる
      fromHour: 10,
      untilHour: 20,
    },
  },
]
