# Cycle 4 / Phase 2 — Application Design 実行計画

**作成**: 2026-09-06　**ステージ**: INCEPTION / Application Design
**方法**: [item-system.md §7](../design-log/item-system.md) の **Phase 2「各軸の定義を1行で書く」**

> **この計画で決めないこと**: **数値**（すべて Phase 3）／ どの島に何が並ぶか（Phase 3）／ 実アイテムの列挙（Phase 3）

## 標準成果物との対応

AI-DLC の Application Design が標準で要求する `components.md` / `component-methods.md` /
`services.md` / `component-dependency.md` は、Cycle 1 で生成済みでありコード構造は変わらない。
Cycle 4 の Application Design は **aidlc-state.md の方針どおり §7 Phase 2 を中身として回す**ため、
成果物を **軸の定義書1本**に差し替える。（コード構造への反映は Phase 3 = Code Generation で行う）

## 入力

- [x] [Phase 0 不変条件](../requirements/cycle4-phase0-invariants.md) — INV-1〜6 ／ 判定規律 PR-1〜3
- [x] [Phase 1 問いと軸](../requirements/cycle4-phase1-axes.md) — §4（軸 3+N 本）／ §5（申し送り）
- [x] [design-log/item-system.md](../design-log/item-system.md) — §2 確定15件 ／ §3 却下案 ／ §4 未確定 A/B/C/E
- [x] [worldbuilding/world.md](../worldbuilding/world.md) — 四島 ／ 店舟 ／ 縛り
- [x] [worldbuilding/characters.md](../worldbuilding/characters.md) — **客の類型4種（取引行動で分ける）** ／ 商人 ／ バレンの制約

## 手順

- [x] 1. 入力を読み込む
- [x] 2. **PR-3 に従い、アイテムより先に「書きたい規則」を列挙する**
      （語彙を先に発明すると PR-3 で中断になる。規則から必要な語彙を逆算する）
- [x] 3. 列挙した規則が参照する軸を集計し、**参照されない面の候補を落とす**
- [x] 4. §4-A 主種類の定義と値の草案を書く
- [x] 5. §4-B 面の本数 N と各面の語彙の草案を書く
- [x] 6. §4-C 条件言語の形の草案を書く（アイテム述語 ＋ 状態述語）
- [x] 7. 規則が参照しない属性（かたち・大きさ／表示／価格）の定義も1行で書く
- [x] 8. 草案を Phase 0 の INV-1〜6 ／ PR-1〜3 で検算する
- [x] 9. 草案 [cycle4-phase2-axes.md](../application-design/cycle4-phase2-axes.md) を作成
- [x] 10. 論点を [cycle4-phase2-questions.md](../application-design/cycle4-phase2-questions.md) に起こす
- [x] 11. ユーザー回答を受領し、矛盾・曖昧さを検査する（FQ0〜FQ5 の追加確認を実施）
- [x] 12. 回答を反映して草案を確定版に更新する
- [x] 13. item-system.md §2・§4 と aidlc-state.md を更新する
- [x] 14. audit.md に記録し、コミットする（Q4=A: ここで止まる。Phase 3 は別セッション）
