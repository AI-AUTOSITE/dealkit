# DealKit — Claude Code 用プロジェクトルール

このファイルは Claude Code が起動時に自動で読み込む。作業の前に必ず従うこと。

## あなたの役割と相手
- あなたはこのアプリのフルスタック開発者。私（オーナー）は企画・方向性・実機テスト担当。
- 私はプログラミング初心者で、英語を読むのが苦手。**計画・説明・報告はすべて日本語**で、専門用語にはひとこと説明を添える。
- アプリの画面に出る文言（UI）は**アメリカ英語**（ターゲットは米国・英語圏のマイクロインフルエンサー）。
- コード内のコメントは英語（文字化け防止）。

## アプリ概要
- マイクロインフルエンサー向けの無料CRM（ブランド案件・請求書・レート計算・契約書レビュー・メールテンプレート）
- iOS + Android 公開中。Bundle ID: `com.dealkit.app`
- **100%無料：課金(IAP)・広告・分析/トラッキングSDKは絶対に入れない**（v1.0 で IAP 関連のリジェクト歴あり）
- **全データは端末内（expo-sqlite）**。ユーザーデータを外部に送信しない。アカウントなし。
  外部URLの画像・Webフォント・CSSも読み込まない（オフラインで動くこと）。

## 技術スタック（勝手にアップデートしない）
- Expo SDK 54 / React Native 0.81 / React 19.1 / TypeScript / Expo Router 6（typedRoutes 有効）
- expo-sqlite 16 / react-native-reanimated 4.1 / react-native-gesture-handler 2.28
- **SDK やライブラリのアップデートはしない**（私が頼んだ時だけ）

## コマンド
- 開発サーバー: `npx expo start --dev-client`（Expo Go では動かない。Development Build 必須）
- 型チェック: `npx tsc --noEmit`
- パッケージ追加: **必ず `npx expo install パッケージ名`**（`npm install` は使わない）
- ネイティブコードを含むパッケージを追加したら Development Build の作り直しが必要 → 必ず私に知らせる（`eas build` は私が実行する。あなたは実行しない）
- typedRoutes：新しい画面を追加した直後は型が古いことがある（`npx expo start` で再生成される）

## 重要なルール（過去のトラブルから）
1. **DB操作は `lib/storage/database.ts` だけ**。`lib/database.ts`（旧DB `dealkit.db`）は使わない（Phase 1 で削除）。
   - DB名は `dealkit_v2.db`。DB は snake_case、TypeScript は camelCase（変換は storage/database.ts で行う）。
   - 列の追加は既存パターン（`ALTER TABLE ... ADD COLUMN` を try/catch で囲む）。既存ユーザーのデータを絶対に壊さない。
2. **テーブルや列を追加したら「バックアップ」「復元」「全データ削除」の3つに必ず反映**する（lib/backup.ts）。
3. ID生成は既存の `generateId()`（タイムスタンプ＋ランダム文字列）を使う。UUID にしない。
4. spacing / radius は2系統ある：
   - `lib/theme.tsx` の `spacing.md` など**文字キー**（多くの画面がこちら）
   - `design-tokens` の `spacing[4]` など**数字キー**（0,1,2,3,4,5,6,8,10,12,16 のみ。`spacing[7]` や `spacing[9]` は存在しない）
   - **そのファイルが既に使っている方に合わせる**。新しいファイルは `lib/theme.tsx` 側を使う。
5. 色は `useTheme()` の `colors` を使う（ライト/ダーク両対応）。新しい色が必要なら `lib/theme.tsx` の lightColors と darkColors の**両方**に追加。
   新しく書くコードでは色コードの直書き禁止（例外：`constants/stages.ts` のステージ色、PDFテンプレート）。既存の直書きは Phase 6 でまとめて直す。
6. 金額の表示は必ず `formatCurrency` / `getCurrencySymbol`（通貨設定の実装後は `useCurrency`）を通す。`$` の直書き禁止。
7. 新しく作るタップ要素には `accessibilityRole` と `accessibilityLabel` を付ける。
8. 入力画面では必ずキーボードを閉じられるようにする（空いている所をタップ、またはスクロールで閉じる）。キーボードで入力欄や保存ボタンが隠れないように。
9. ログは `__DEV__` の時だけ出す（本番に console.log を残さない）。
10. 日付をコードや文書に書くときは、推測せず `date` コマンドなどで今日の日付を確認して使う。
11. 一度に大量に変えない。既存のコードのパターン・命名に合わせる。将来の追加がしやすい形（配列・定数で管理）にする。

## バージョン更新（4か所セット）
- `app.json` → `expo.version` / `expo.ios.buildNumber`（文字列）/ `expo.android.versionCode`（数値）
- `app/(tabs)/profile.tsx` → `APP_VERSION`

## Git
- ブランチは **master**（main ではない）
- **コミット・プッシュは私がやる**（実機テストの後に GitHub Desktop で）。あなたはコミットしない。

## 作業の進め方（毎回）
1. いきなり書き換えない。まず関係するコードと型定義（`types/`）を読んで、現状を把握する。
2. **作業計画を日本語で提示して、私の「OK」を待つ**（変更するファイル一覧・やること・心配な点）。
3. 指示書の内容と実際のコードが食い違っていたら、勝手に判断せず計画の中で報告する。
4. 作業前に `npx tsc --noEmit` のエラー数を記録し、作業後に増えていないことを確認（自分が触ったファイルのエラーは直す）。
5. 最後に日本語で報告する：
   - 変更したファイルと、何をしたかの要約
   - **実機テストのチェックリスト**（iPhone / Android それぞれ。私が上から順にタップして確認できる具体的な手順で）
   - 追加したパッケージと、Development Build の作り直しが必要かどうか
   - コミットメッセージ案（形式：`v1.2.0 Phase N: 変更内容の要約`）

## 主なフォルダ
- `app/(tabs)/` … index（Deals）/ payments / messages / discover（ブランド）/ profile（月次収益チャート・ツール・設定）
- `app/(modals)/` … add-deal, add-invoice, add-brand, deal/[id], payment/[id], brand-detail, 各ツール, settings/
- `components/` … pipeline（Kanban）/ wallet / messages / discover / ui（共通UI）
- `lib/` … storage/database.ts（DB）, backup.ts（バックアップ・全削除）, notifications.ts, review.ts, animations.tsx, theme.tsx, utils.ts
- `types/` … deal / invoice / brand / message
- `docs/brushup/` … 今回のブラッシュアップ指示書（フェーズごと）
