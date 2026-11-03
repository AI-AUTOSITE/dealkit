# Phase 1：バグ修正・お掃除（土台を固める）

> **目的**：見た目は変えずに、データまわりの不具合と古いコードを片付ける。この後の通貨設定・PDFなどの土台にする。
> 進め方は CLAUDE.md の「作業の進め方」に従うこと（まず日本語で計画 → 私の承認後に実装）。
> **新しいパッケージは追加しない。SDK・ライブラリのアップデートもしない。**

---

## 1-1. 旧DB（dealkit.db）に取り残されたデータの救出【最優先】

**現状**
- v1.1.0 までは、プロフィール（`app/(tabs)/profile.tsx`、`app/(modals)/settings/profile.tsx`）と、契約書レビュー・使用権計算ツールの履歴が **旧DB `dealkit.db`**（`lib/database.ts`）に保存されていた。
- v1.1.1 で新DB `dealkit_v2.db` に切り替えたが、**データ移行をしていない**。そのため、アップデートした既存ユーザーはプロフィールなどが空に見えている可能性がある。

**やること**
- 起動時（新DBの初期化の後）に **1回だけ** 動く移行処理を作る（例：`lib/storage/migrate-legacy.ts`）。
- 旧DBファイルがあるかを **ファイルの存在で確認してから** 開く。`openDatabaseAsync` はファイルが無いと空のDBを新しく作ってしまうので、先に開かないこと。
- 対象テーブル：`user_profile`、`contract_reviews`、`usage_calculations`。旧DBに `rate_calculations`・`email_drafts` のデータがあればそれも対象。
  - 確定する前に git 履歴（例：`git show 65b2717:"app/(modals)/contract-review.tsx"`）で「v1.1.0 で旧DBに書き込んでいた画面」を確認し、計画で報告すること。
- コピーのルール：
  - `user_profile`：新DB側が空（または名前などが未入力）の時だけコピー。新DB側に入力済みなら上書きしない。
  - 履歴テーブル：新DBに同じ id が無い行だけコピー。
  - 列は旧DBと新DBの CREATE TABLE を比較して対応付ける（新DBに無い列は捨てる）。
- 終わったら AsyncStorage に `legacyDbMigrated = 'true'` を保存し、次回からは動かさない。
- 失敗してもアプリは普通に起動すること（try/catch。ユーザーにはエラーを見せない。ログは `__DEV__` のみ）。
- 旧DBファイル自体はこのリリースでは削除しない（「全データ削除」の時だけ消す → 1-2）。

**完了条件**
- 旧DBが無い端末：何も起きない。旧DBファイルも作られない。
- 旧DBにプロフィールがある端末：起動後にプロフィールが表示される。2回目以降の起動では移行処理が動かない。

---

## 1-2. 「全データ削除」で本当に全部消えるようにする【プライバシー上重要】

**現状（`lib/backup.ts` の `clearAllData`）**
- 新DBで消しているのは deals / brands / invoices / messages / brand_notes だけ。
  → **`user_profile` と ツール履歴4テーブル（usage_calculations, contract_reviews, rate_calculations, email_drafts）が残ってしまう。**
- **予約済みのリマインダー通知がキャンセルされない** → 消したはずの請求書やリマインダーの通知が後から届く。
- 旧DBは `openDatabaseAsync('dealkit.db')` で開いてから DELETE しているので、旧DBが無い端末では空のファイルを作ってしまう。

**やること**
- ユーザーデータのテーブル一覧を **1か所の定数**（例：`USER_DATA_TABLES`）にまとめ、「全削除」「バックアップ」「復元」の3つで共有する（テーブルを増やした時の入れ忘れ防止）。
- 全削除では：
  - 新DBのユーザーデータを全テーブル削除（brand_notes など子テーブルを先に）
  - `Notifications.cancelAllScheduledNotificationsAsync()` で予約通知を全キャンセル
  - 旧DBファイルが **存在する場合だけ** ファイルごと削除（開いている接続は閉じてから）
  - アプリの設定（AsyncStorage の themeMode・notificationsEnabled など）は残す
- 確認ダイアログの英語文言を、実際に消える内容と一致させる。例：
  "This will permanently delete all deals, brands, invoices, notes, reminders, your profile, and tool history from this device. This can't be undone."
- 削除後、どのタブを開いても古いデータが見えないこと（画面の再読み込み）。

**完了条件**
- 全削除 → アプリ再起動 → プロフィールも各ツールの履歴も空。予約中の通知が0件。

---

## 1-3. バックアップ／復元に「プロフィール」と「ツール履歴」を追加

**現状**
- バックアップ（`BACKUP_VERSION = 2`）に入っているのは deals / brands / invoices / messages / brandNotes だけ。機種変更で復元しても、プロフィールとツール履歴は戻らない。

**やること**
- `BACKUP_VERSION` を 3 にして、`userProfile` と ツール履歴4テーブルを追加（1-2 の共通定数を使う）。
- 復元は今までどおりトランザクション内で。**古い形式（version 1・2）のファイルも読み込める**こと（無いキーはスキップ）。
- 復元したリマインダーの通知：
  - 他の端末の `notification_id` は意味がないので使わない
  - 未来の日時のリマインダーは、通知がONなら予約し直す
  - 今の復元処理がこのあたりをどう扱っているか先に確認し、計画で報告すること

**完了条件**
- エクスポート → 全削除 → インポートで、プロフィール・ツール履歴・リマインダー通知まで元に戻る。
- v1.1.1 で作ったバックアップファイルも読み込める。

---

## 1-4. 使われていないファイルの削除

削除の前に、**本当にどこからも使われていないか検索で確認**し、一覧を計画で提示すること（import だけでなく `router.push` の文字列、Stack.Screen の登録、typed routes も確認）。

**削除候補**
- `lib/database.ts`（旧DB。1-1 の移行処理はこのファイルに頼らず expo-sqlite を直接使って書く）
- `lib/export-import.ts`（どこからも import されていない。旧DBを使っている）
- `app/(modals)/deal-detail.tsx`・`app/(modals)/invoice-detail.tsx`（実際に使われているのは `deal/[id].tsx` と `payment/[id].tsx`）＋ `app/(modals)/_layout.tsx` の登録
- Expo テンプレートの残り：`app/modal.tsx`（＋ `app/_layout.tsx` の登録）、`components/EditScreenInfo.tsx`、`components/Themed.tsx`、`components/StyledText.tsx`、`constants/Colors.ts`
  - `app/+not-found.tsx` が Themed を使っているので、アプリの共通 Text と useTheme に書き換える
- 他に未使用のファイルを見つけたら、候補として報告するだけにする（勝手に消さない）

**完了条件**
- `npx tsc --noEmit` のエラーが増えていない。全画面が今までどおり開ける。

---

## 1-5. 金額表示を1つの関数にまとめる（次の通貨設定の準備）

**現状**
- `lib/utils.ts` に `formatCurrency(amount, currency = 'USD')` があるのに：
  - `app/(tabs)/payments.tsx`・`app/(modals)/deal/[id].tsx`・`app/(modals)/payment/[id].tsx` は独自に `Intl.NumberFormat` を書いている
  - `app/(tabs)/messages.tsx`・`components/pipeline/StageColumn.tsx`・`lib/notifications.ts` は `` `$${...}` `` で `$` を直書き
  - `components/wallet/StatCard.tsx` は `prefix = '$'`、`app/(modals)/usage-calculator.tsx` は `<Text>$</Text>` を直書き
- `formatCurrency` は小数を必ず0桁にしているので、$1,250.50 が $1,251 と表示されてしまう。

**やること**
- `formatCurrency` を拡張：
  - 小数：初期値は「整数なら小数なし、端数があればセントまで（2桁）」。オプションで「常に2桁」も選べる（請求書PDF・CSV用）。浮動小数の誤差対策として、セント単位に丸めてから判定する。
  - 通貨記号だけを返す `getCurrencySymbol()` も用意（入力欄の頭に付ける記号用）。
- 上のすべての箇所を `formatCurrency` / `getCurrencySymbol` 経由にして、アプリ全体から `$` の直書きを無くす。
- 今は USD のままなので、見た目は（端数のある金額がセントまで出ること以外）変わらないこと。

**完了条件**
- 検索で `$` の直書き（`'$'`、`>$<`、`` `$${ `` など）がコメント以外に残っていない。

---

## 1-6. DBのインデックス追加（データが増えても速く）

- 今あるインデックスは `brand_notes(brand_id)` だけ。
- `lib/storage/database.ts` の実際のクエリ（WHERE / ORDER BY）を見て、必要な列にだけ追加（例：deals の stage・updated_at、invoices の status・due_date・deal_id、messages の type など）。
- `CREATE INDEX IF NOT EXISTS` を使う（何度実行しても安全）。

---

## 1-7. 小さなお掃除

- `console.log` / `console.warn`（約14か所）→ `__DEV__` の時だけ出す小さな logger（例：`lib/logger.ts`）に置き換え。catch 内の `console.error` も同様。
- `generateId()` の `substr(2, 9)`（非推奨）→ `slice(2, 11)`（結果は同じ）。
- 日本語のコードコメント（`types/deal.ts` など）を英語に。

---

## 1-8. Android 16 の画面端・キーボードのチェック

- Expo SDK 54 は Android 16 で edge-to-edge（画面の端まで描画）が強制される。全画面で、下部のボタン（モーダルの保存ボタンなど）・FAB・タブバーが Android のナビゲーションバー／ジェスチャーバーに被らないか確認し、`useSafeAreaInsets` などで修正。
- すべての入力画面で：
  - キーボードで入力欄や保存ボタンが隠れない
  - 空いている所をタップ、またはスクロールでキーボードを閉じられる（`keyboardShouldPersistTaps="handled"`・`keyboardDismissMode` など）
- コードで確認できる範囲で対応し、私が実機で見るべき画面をチェックリストに入れる。

---

## 1-9. 依存関係の健康診断（報告のみ）

- `npx expo-doctor` を実行して、結果を日本語で要約。**修正やアップデートはしない**（必要なら次の相談材料にする）。

---

## やらないこと
- 見た目のデザイン変更、新機能の追加、SDK のアップデート、新しいパッケージの追加

## 実機テストのチェックリストに必ず入れるもの
- エクスポート → 全データ削除 → インポートの一連の流れ（プロフィール・ツール履歴・リマインダーが戻るか）
- 全データ削除の後、予約していたリマインダー通知が届かないこと
- 端数のある金額（例 1250.50）と整数の金額の表示
- Android で下部ボタンがナビゲーションバーに被っていないか
