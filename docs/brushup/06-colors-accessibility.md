# Phase 6：色のズレ修正（ダークモード）＋ アクセシビリティ

> **前提**：Phase 1〜5 完了済み。**新しいパッケージは追加しない。**
> このフェーズはたくさんのファイルを触るので、**画面グループごとに区切って** 進めること：
> ① 共通UI部品（components/ui）→ ② タブ5画面 → ③ 追加・詳細モーダル → ④ ツール・設定画面
> グループごとに `npx tsc --noEmit` を通してから次へ。

---

## 6-1. 色の統一

**現状**
- 色の仕組みが2つ混ざっている：
  - `lib/theme.tsx` の `useTheme().colors`（ライト/ダーク対応）
  - `design-tokens/` の固定の色（例：`app/(tabs)/discover.tsx` の `colors.primary500`）→ **ダークモードに対応しない**
- 画面に直接書かれた色コード（`#xxxxxx`）が app/ と components/ に約42か所。

**やること**
- 見た目の色（文字・背景・枠線・アイコン）はすべて `useTheme().colors` に統一する。
- design-tokens から**色**を import している所は useTheme に置き換え（spacing・radius はそのままでOK）。
- 足りない色は `lib/theme.tsx` の lightColors と darkColors の**両方**に、意味が分かる名前で追加（例：`onPrimary`＝プライマリ色の上の文字色、`chartBar` など）。
- そのままでよいもの：`constants/stages.ts` のステージ色（ブランドの色）、PDF テンプレート（印刷用で常に白背景）。
  - ただし、ステージ色やステータス色の上の文字が読めるか確認する（例：黄色 #F59E0B の上の白文字は読みにくい → 濃い色の文字に）。
- 文字のコントラスト：本文は WCAG AA（4.5:1）を目安に。薄いグレー（textMuted）を大事な情報に使っていないか。
- StatusBar（時計などの文字色）がライト/ダークで正しく切り替わるか。

**完了条件**
- 検索で app/ と components/ に色コードの直書きが残っていない（上の例外を除く）。
- 私がライト・ダーク両方で見るべき画面の一覧をチェックリストに入れる。

---

## 6-2. アクセシビリティ（VoiceOver / TalkBack / 文字サイズ）

**現状**：`accessibilityLabel` / `accessibilityRole` が0か所（Phase 2〜5 で追加した画面を除く）。

**やること**
1. 共通部品から対応（Button・AnimatedPressable・Card・StatusBadge など）：accessibility 系の props を受け取って中に渡せるようにする。
2. タップできる要素すべてに `accessibilityRole="button"` と `accessibilityLabel`。特に**アイコンだけのボタン**（＋、×、戻る、★お気に入り、ゴミ箱、編集、共有）。
3. 状態を伝える：お気に入り・トグル・タブ・フィルター → `accessibilityState`（selected / checked）。
4. 入力欄：`accessibilityLabel`（画面のラベルと同じ文言）。
5. 文字サイズ：`components/ui/Text.tsx` に `maxFontSizeMultiplier`（目安 1.4）を設定し、一番大きい文字設定でもレイアウトが崩れないように。ダッシュボードの大きな数字やボタンは個別に確認。
6. タップ領域：44×44pt より小さいアイコンは `hitSlop` で広げる。
7. Kanban：ドラッグができない人のために、DealCard に `accessibilityActions`（"Move to next stage" / "Move to previous stage"）を追加。処理はドラッグの時と同じ関数を使う（Phase 2 の paid_at も正しく記録されること）。
8. 月次収益チャート（`app/(tabs)/profile.tsx`）：チャート全体に要約の `accessibilityLabel`（例 "Monthly earnings chart. Highest month: March, $2,400."。金額は選択中の通貨で）。
9. 動きを減らす：`lib/animations.tsx` で Reanimated の `useReducedMotion` を見て、ON ならアニメーションを省略（`useCountUp` は最初から最終値を表示）。
10. Toast：表示した文言が読み上げられるように（iOS：`AccessibilityInfo.announceForAccessibility`、Android：`accessibilityLiveRegion="polite"`）。
11. 飾りだけのアイコン・画像は読み上げ対象から外す。

**完了条件（実機テストのチェックリストに入れる）**
- iPhone の VoiceOver（設定 → アクセシビリティ → VoiceOver。「ショートカット」に登録するとサイドボタン3回押しで切り替えられて便利）で：ディール追加 → ステージ移動 → 請求書作成 → 支払い済み、が最後までできる。
- Android の TalkBack でも同じ流れができる。
- 文字サイズを最大にしても、主要画面が崩れない。

---

## やらないこと
- 画面レイアウトの作り直し、新しいテーマ（色の種類）の追加
