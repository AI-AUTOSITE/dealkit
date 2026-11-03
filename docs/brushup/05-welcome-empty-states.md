# Phase 5：ウェルカム画面 ＋ データ0件の画面

> **前提**：Phase 1〜4 完了済み。**新しいパッケージは追加しない**（アイコンは @expo/vector-icons の Ionicons、アニメーションは既存の `lib/animations.tsx` / Reanimated）。

---

## 5-1. ウェルカム画面（初回起動のみ）

**表示する条件**
- AsyncStorage の `hasSeenWelcome` が無い **かつ** DB に deals・brands・invoices が1件も無い。
- 既存ユーザー（データあり）はアップデート後もフラグだけ立てて、表示しない。
- 判定が終わるまでスプラッシュ画面を出したままにして、画面がチラつかないように（expo-splash-screen）。

**構成**：`app/welcome.tsx`（横スワイプのページ ＋ 下にドット ＋ 右上に "Skip"）
1. **"Every brand deal, one place"**
   "From pitch to paid, track every collab in a simple pipeline."
   （訳：すべての案件をひとつの場所で ／ 提案から入金まで、シンプルなパイプラインで管理）
2. **"Get paid on time"**
   "Invoices, PDF export, and payment reminders — all built in."
   （訳：支払いを取りこぼさない ／ 請求書・PDF・支払いリマインダーが全部入り）
3. **"Your data stays on your phone"**
   "No account. No tracking. No ads. 100% free."
   （訳：データはあなたのスマホの中だけ ／ アカウント不要・追跡なし・広告なし・完全無料）
4. **"Which currency do you work in?"** ＋ 通貨リスト（Phase 2 の CURRENCIES）＋ "You can change this anytime in Settings."
   - ボタン："Add your first deal"（→ ディール追加画面）／ "Explore the app"（→ Deals タブ）

- どのボタン（Skip 含む）で抜けても `hasSeenWelcome = 'true'` を保存。
- 各ページは大きなアイコン（アクセント色の丸い背景）＋ 見出し ＋ 1文。文字サイズを大きくしても崩れない。
- 「視差効果を減らす／動きを減らす」設定が ON ならアニメーションを控えめに（Reanimated の `useReducedMotion`）。
- How to Use 画面（`app/(modals)/settings/how-to-use.tsx`）の一番下に "Show welcome screen again" を追加（もう一度見られる。私のテストにも使う）。

---

## 5-2. データ0件の画面（EmptyState）を統一

**共通部品**：`components/ui/EmptyState.tsx`
- props：`icon`（Ionicons の名前）、`title`、`message`、`primaryAction { label, onPress }`、`secondaryAction`（任意）、`compact`（Kanban の列など狭い場所用）
- テーマの色を使う。ふわっと表示（既存アニメーション）。
- `components/ui/index.ts` から export。

**置き換え・追加する場所と文言**（英語。カッコ内は参考訳）

| 場所 | タイトル | メッセージ | ボタン |
|---|---|---|---|
| Deals（0件） | No deals yet | Add your first brand deal and watch it move from pitch to paid. | Add Deal ／ サブ：Estimate your rate（→ レート計算） |
| Deals（フィルターで0件） | Nothing here | No deals match this filter. | Show all |
| Kanban の空の列 | （compact）No deals | — | — |
| Payments（0件） | No invoices yet | Create an invoice when a deal is done — we'll remind you before it's due. | Create Invoice |
| Payments「Due Soon」0件 | You're all caught up 🎉 | Nothing due in the next 3 days. | — |
| Messages（0件・種類ごとのフィルターで0件） | 種類に合った文言 | 例 Reminders: "Never miss a follow-up. Set a reminder for any deal." | 追加ボタン |
| Discover（ブランド0件） | No brands saved | Save brands you'd love to work with and keep notes on each one. | Add Brand |
| 検索結果0件 | No results for "{検索語}" | Try a different name or category. | — |
| ブランドのノート0件 | No notes yet | Jot down contacts, rates, and anything worth remembering. | Add Note |
| Income Report（その年0件） | No income recorded for {年} | Paid invoices and deals will show up here. | — |
| Media Kit の Brands（0件） | No brands yet | Brands from your delivered and paid deals will appear here. | — |

- 文言の中の条件（「Due Soon」の日数など）は、実際のコードの値に合わせる（今は3日以内）。
- 既存の空表示（4つのタブにある）は、すべてこの部品に置き換えて見た目を統一する。

---

## やらないこと
- サンプルデータの自動投入、チュートリアルの吹き出し（コーチマーク）

## 実機テストのチェックリストに必ず入れるもの
- How to Use の "Show welcome screen again" から、ウェルカム画面を最後まで操作（Skip・通貨選択・2つのボタン）
- データありの端末をアップデートしても、ウェルカム画面が勝手に出ないこと
- 全データ削除の後、各タブで新しい空表示が出ること（ライト・ダーク両方）
