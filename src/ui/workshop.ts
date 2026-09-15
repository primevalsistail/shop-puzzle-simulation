/**
 * 工房の文字（**Phaser を読まない**）。
 *
 * ⚠ **`ConfirmDialog` は文字を作らない。**本文はここが持ち、寸法は `layout.ts` が持つ
 *   （`ui/delivery.ts` ／ `ShelfPresets.ts` と同じ形）。**向こうで組み立てると
 *   `layout.test.ts` が実物を測れない。**
 */

/**
 * `作る` を押したとき、**営業時間を削るぶんがあるときだけ**出す確認の本文
 * （#109。PO コメント「ダイアログ」／ 質問票 Question 2 = A）。
 *
 * ⚠ **2行に分ける。**1行にすると**いちばん長い品名と最大の回数**で面
 *   （`CONFIRM_TEXT_MAX_W`）を超える。
 * ⚠ **「損する」とは書かない。**削るかどうかは選べることで、罰ではない（#98 と同じ扱い）。
 *   **数だけを出して、止めどきは人が決める。**
 * ⚠ **加工にかかる総分数は出さない。**それは `時間` の列が出している ——
 *   **同じ数を1つの画面に2回出さない**（`deliveryShortLabel` の注記と同じ）。
 */
export function craftBusinessConfirmLines(
  itemName: string, times: number, businessMinutes: number,
): readonly string[] {
  return [
    `${itemName} ×${times}`,
    `店を開けている時間が ${businessMinutes}分 減ります`,
  ]
}
