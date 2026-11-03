# Phase 2：通貨設定 ＋ 年間収入レポート（CSV）

> **前提**：Phase 1 完了済み（金額表示が `formatCurrency` / `getCurrencySymbol` に統一されている）。
> **新しいパッケージは追加しない**（CSV の書き出し・共有は `lib/backup.ts` と同じく expo-file-system/legacy と expo-sharing を使う）。

---

## 2-1. 通貨設定（Currency）

**方針**
- アプリ全体で1つの通貨を選べる。**金額の換算はしない**（記号と書式が変わるだけ）。為替レートは使わない（オフライン・外部通信なしのため）。
- 保存先は既存の `user_profile.default_currency` 列（すでにある。新しい列は作らない）。Phase 1 でバックアップ対象になっている。

**やること**
1. `constants/currencies.ts` に通貨リストを定義（あとから追加しやすい配列で）

   | code | name | symbol | locale |
   |---|---|---|---|
   | USD | US Dollar | $ | en-US |
   | GBP | British Pound | £ | en-GB |
   | EUR | Euro | € | en-IE |
   | CAD | Canadian Dollar | $ | en-CA |
   | AUD | Australian Dollar | $ | en-AU |
   | NZD | New Zealand Dollar | $ | en-NZ |

2. `lib/currency.tsx`：`CurrencyProvider` と `useCurrency()`（currency・symbol・setCurrency・format を返す）
   - React の外（`lib/notifications.ts` の通知文など）でも使えるように「現在の通貨」を返す関数も用意し、`formatCurrency` / `getCurrencySymbol` は通貨を省略した時にそれを使う。
   - `app/_layout.tsx` に Provider を追加（DB 初期化の後）。
3. 設定画面：Profile タブの Settings に「Currency」行（右側に現在の通貨）→ 選択画面（例：`app/(modals)/settings/currency.tsx`）。チェックマーク付きのリスト。
   - 説明文："Changing currency doesn't convert your existing amounts — it only changes how they're shown."
4. 選んだ通貨が即座に全画面に反映される（Deals の Pipeline 総額・Profile の月次収益チャート・Payments・各詳細画面・入力欄の記号・通知文）。
5. レート計算・使用権計算ツール：結果は選んだ通貨の記号で表示し、結果の近くに小さく注記 "Estimates are based on typical US market rates."（金額は換算しない）。

**完了条件**
- GBP にすると、全ての金額が £ で表示される。USD に戻すと元どおり。
- アプリを再起動しても選んだ通貨のまま。

---

## 2-2. ディールに「支払われた日（paid_at）」を記録する

**理由**：収入レポートでは「いつ支払われたか」が大事。今は Paid にした日が記録されていない（updated_at は他の編集でも変わってしまう）。

**やること**
- `deals` に `paid_at TEXT` 列を追加（既存パターンの ALTER TABLE + try/catch）。Deal 型に `paidAt?: string`、DB⇔TS の変換も追加。
- ステージを `paid` にした時（Kanban のドラッグ・詳細画面・その他すべての経路）に `paid_at` = 現在日時。`paid` から別のステージに戻したら `null`。
  - ステージ変更の処理が何か所にも分かれていたら、この機会に1つの関数にまとめる（計画で報告）。
- 既存の paid のディールは、1回だけ `paid_at = updated_at` で埋める。
- `app/(tabs)/profile.tsx` の月次収益チャートが月の判定に使っている日付を確認し、`paid_at`（無ければ updated_at）を使うように。
- バックアップ／復元に反映（CLAUDE.md ルール2）。

---

## 2-3. 年間収入レポート（Income Report）

**目的**：アメリカのクリエイターは1〜4月が確定申告シーズン。1年分の収入をまとめて、会計士に渡せる CSV を作れるようにする。

**画面**：`app/(modals)/income-report.tsx`
- 入口：Payments タブ（統計カードの近くに "{年} Income Report →" の小さなカード）と、Profile タブの Tools セクション。
- 年の選択：データがある年＋今年。**初期値は、今日が1〜4月なら前年、5月以降なら今年**（申告シーズン対策）。
- 表示：
  - 合計収入（大きく）と件数
  - 月別（1〜12月）：Profile タブの月次収益チャートと同じ見た目を再利用
  - ブランド別の合計（金額の多い順）。見出し "By Brand"、補足 "Handy for checking against 1099 forms."
  - 明細リスト（日付・ブランド・説明・金額）
  - 注記："For your records only — not tax advice."
- その年のデータが0件なら簡単なメッセージ（Phase 5 で共通の EmptyState に置き換える）。

**集計ルール（同じお金を二重に数えない）**
1. 請求書：既存の Payments 画面と同じ判定（`status === 'paid'`）
   - 金額 = `paidAmount` が 0 より大きければ `paidAmount`、そうでなければ `amount`
   - 日付 = `paidDate`（無ければ `updatedAt`）
2. ディール：`stage === 'paid'` で、**そのディールに紐づく paid の請求書が無いもの**だけ
   - 金額 = `value`、日付 = `paidAt`（無ければ `updatedAt`）
- この集計は画面と CSV で同じ関数を使う（例：`lib/reports/income.ts`）。

**CSV の書き出し（"Export CSV" ボタン）**
- ファイル名：`DealKit-Income-2026.csv`（年は選択中の年）
- 列：`Date, Brand, Description, Amount, Currency, Source`
  - Date は `YYYY-MM-DD`（端末のローカル日付）
  - Amount は数値のみ（記号・カンマなし、小数2桁。例 `1250.00`）
  - Source は `Invoice` または `Deal`
- カンマ・改行・ダブルクォートを含む値は正しくエスケープ（ダブルクォートで囲み、中の `"` は `""` に）。
- 先頭に UTF-8 BOM を付ける（Excel で開いても文字化けしない）。
- 保存・共有は `lib/backup.ts` と同じ方法（キャッシュに書き出して共有シート）。

**完了条件**
- 請求書あり・なしのディールが混ざっていても、二重計上がない。
- CSV を Excel / Google スプレッドシート / Numbers で開いて列が崩れない（ブランド名に `,` や `"` があっても）。

---

## やらないこと
- 為替換算、通貨ごとに別々の金額を持つこと（ディールごとの通貨など）、新しいパッケージの追加
