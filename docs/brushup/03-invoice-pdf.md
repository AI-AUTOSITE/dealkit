# Phase 3：請求書PDF

> **前提**：Phase 1・2 完了済み。
> このフェーズで `expo-print` を追加する → **Development Build の作り直しが必要**。`eas build` は私が実行するので、最後にコマンドを案内すること。

---

## 3-0. パッケージ追加
- `npx expo install expo-print`（`npm install` は使わない）
- PDF は端末内で作る。**外部URL（画像・Webフォント・CSS）は一切読み込まない**（機内モードでも動くこと・プライバシーのため）。

## 3-1. PDF の共通部品（Phase 4 のメディアキットでも使う）
`lib/pdf/` に作る：
- `escapeHtml()`：ユーザーが入力した文字（ブランド名・説明など）は、HTML に入れる前に必ずこれを通す（`& < > " '`）。
- `sharePdf({ html, fileName })`：`Print.printToFileAsync({ html, width: 612, height: 792 })`（US Letter）→ 分かりやすいファイル名に変更してキャッシュフォルダへ移動 → `Sharing.shareAsync`（mimeType `application/pdf`、iOS は UTI `com.adobe.pdf`）。
- `previewPdf(html)`：`Print.printAsync({ html })`（iOS ではプレビュー付きの印刷画面になる）。
- 共通の基本スタイル：システムフォント（`-apple-system, Roboto, Helvetica, Arial, sans-serif`）、アクセント色 #7C3AED、印刷向けの白背景（アプリのダークモードの影響を受けない）、余白は CSS で。
- ファイル名に使えない文字は置き換える。

## 3-2. 設定を保存するテーブル `app_settings`
- `app_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)`。value は JSON 文字列。
- `getSetting<T>(key, defaultValue)` / `setSetting(key, value)` を `lib/storage/database.ts` に追加。
- 今後の設定もここに増やせる形に（今回のキー：`invoice_settings`。Phase 4 で `media_kit`）。
- **`USER_DATA_TABLES` に追加**（バックアップ・復元・全削除の対象。CLAUDE.md ルール2）。

## 3-3. 請求書番号と発行日
- `invoices` に `invoice_number TEXT` と `issued_at TEXT` を追加（ALTER TABLE + try/catch）。Invoice 型・DB変換・バックアップにも反映。
- 番号の形式：`INV-2026-001`（年 + その年の連番3桁）。
- **最初に PDF を作った時に** 自動で採番し、発行日（issued_at）と一緒に保存（2回目以降は変わらない）。
- 請求書の詳細画面（`app/(modals)/payment/[id].tsx`）に番号を表示し、タップで編集できる（自分の番号ルールがある人向け）。

## 3-4. 差出人の設定（Invoice Settings）
`app_settings` の `invoice_settings` に保存。設定画面：`app/(modals)/settings/invoice-settings.tsx`（Profile の Settings からも開ける）

| 項目（画面の英語ラベル） | 初期値 | 補足 |
|---|---|---|
| Name or business name | プロフィールの display_name | 必須 |
| Email | プロフィールの email | |
| Address | 空 | 任意・複数行 |
| Payment instructions | 空 | 任意・複数行。placeholder: "PayPal: you@example.com / Venmo: @yourname" |
| Payment terms | "Net 30" | |
| Note | "Thank you for the collaboration!" | PDF の一番下に表示 |

- 初めて PDF を作る時に名前が未設定なら、先にこの画面を出す（保存したらそのまま PDF 作成へ進む）。

## 3-5. PDF の中身（英語・1ページ）
- 上部：`INVOICE`、請求書番号、Issue date、Due date
- From：名前、メール、住所
- Bill To：ブランド名（ブランド登録済みで email があればそれも）
- 明細表：Description ／ Amount
  - Description = 請求書の description（無ければ紐づくディールのタイトル）
  - 紐づくディールに deliverables があれば、説明の下に小さく表示
  - **明細は配列から描画する**（今は1行だけだが、将来の複数行に対応しやすく）
- 合計：Total。一部入金（0 < paidAmount < amount）なら Amount Paid と Balance Due も
- status が paid なら斜めの "PAID" スタンプ
- Payment terms、Payment instructions、Note
- 金額は選択中の通貨・常に小数2桁（`formatCurrency` の2桁オプション）
- 日付の表示形式：`Nov 3, 2026`
- 見た目：シンプルでプロっぽく。余白多め、アクセント色はヘッダーと合計まわりに控えめに

## 3-6. 請求書詳細画面のボタン
- "Share PDF"（メイン）と "Preview"（サブ）を追加。
- 共有シートを閉じた後、請求書の status が `draft` なら "Mark this invoice as Sent?" と確認 → Yes で `sent` に更新。

## 3-7. Phase 2 の CSV に請求書番号を追加
- 列を `Date, Brand, Description, Invoice #, Amount, Currency, Source` に（ディール由来の行は空欄）。

---

## やらないこと
- 複数行の明細の入力画面、ロゴ画像の添付、税金（Tax）欄の計算 ← 将来の候補として残す

## 実機テストのチェックリストに必ず入れるもの
- iPhone・Android それぞれで PDF 作成 → メールに添付 → パソコンで開いてレイアウトが崩れない
- ブランド名や説明に `&` `<` `"` や絵文字、長い文章が入っていても崩れない
- 一部入金の表示、支払い済みの PAID スタンプ
- 機内モードでも PDF が作れる
- 全データ削除で Invoice Settings も消える／バックアップから戻る
- 最後に Development Build の作り直しコマンドを案内（PowerShell・Git Bash 共通）
