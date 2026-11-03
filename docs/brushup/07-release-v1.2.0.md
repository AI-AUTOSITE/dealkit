# Phase 7：v1.2.0 リリース準備

> **前提**：Phase 1〜6 が完了し、実機テスト済み。

---

## 7-1. バージョン更新（4か所）
- `app.json`：`expo.version` 1.1.1 → **1.2.0**、`expo.ios.buildNumber` "7" → **"8"**、`expo.android.versionCode` 7 → **8**
- `app/(tabs)/profile.tsx`：`APP_VERSION` → **'1.2.0'**

## 7-2. How to Use 画面（`app/(modals)/settings/how-to-use.tsx`）
- `GUIDE_SECTIONS` に新機能を追加：Invoice PDF ／ Media Kit ／ Income Report ／ Currency
- 既存の説明で古くなった所があれば直す

## 7-3. プライバシーポリシー・利用規約（`settings/privacy.tsx`・`settings/terms.tsx`）
- 新機能もすべて端末内で処理されることを追記：PDF と CSV は端末内で作られ、共有するかどうか・誰に送るかはユーザーが決める。開発者はデータを受け取らない。
- 「Last updated」の日付は、`date` コマンドなどで**実際の今日の日付**を確認して更新（推測しない）。

## 7-4. 最終チェック
- `npx tsc --noEmit`（Phase 1 開始時よりエラーが増えていない）
- `npx expo-doctor`（結果を報告するだけ）
- `console.log`・`TODO`・テスト用のコードが残っていないか
- `docs/brushup/` の各フェーズの内容と実装を見比べて、やり残しがあれば一覧で報告
- 追加したテーブル・列（app_settings、deals.paid_at、invoices.invoice_number / issued_at など）が、バックアップ・復元・全削除の3つに入っているか最終確認

## 7-5. ストア用テキストの下書き
`docs/brushup/release-notes-v1.2.0.md` に作成：
- App Store / Google Play の「What's New」（英語。Google Play は500文字以内）
- 説明文（Description）に新機能を足す案（英語）
- それぞれに**日本語訳**を付ける（私が内容を確認するため）

## 7-6. 私が実行するコマンドを案内（あなたは実行しない）
```
eas build --profile production --platform all
eas submit --platform ios
eas submit --platform android
```
