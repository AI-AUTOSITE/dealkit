# DealKit テストガイド

## 🚀 セットアップ

### 1. プロジェクトを解凍
```powershell
# ダウンロードしたZIPを解凍
# dealkit フォルダに移動
cd dealkit
```

### 2. 依存パッケージをインストール
```powershell
npm install
```

### 3. 開発サーバー起動
```powershell
npx expo start
```

### 4. アプリを開く

**オプション A: Expo Go（簡単）**
- スマホに「Expo Go」アプリをインストール
- QRコードをスキャン

**オプション B: 開発ビルド（全機能）**
```powershell
# iOSシミュレーター
npx expo start --ios

# Androidエミュレーター
npx expo start --android
```

> ⚠️ **注意**: In-App PurchaseとPush通知はExpo Goでは動作しません。開発ビルドが必要です。

---

## 📋 テストチェックリスト

### ✅ Phase 1: 基本画面

#### 1.1 アプリ起動
- [ ] アプリが正常に起動する
- [ ] スプラッシュ画面が表示される
- [ ] Dealsタブ（ホーム）が表示される

#### 1.2 タブナビゲーション
- [ ] Deals タブをタップ → Deals画面
- [ ] Payments タブをタップ → Payments画面
- [ ] Tools タブをタップ → Tools画面
- [ ] Settings タブをタップ → Settings画面

#### 1.3 ダークモード
- [ ] Settings → Dark Mode トグル ON
- [ ] 全画面がダークモードになる
- [ ] トグル OFF → ライトモードに戻る

---

### ✅ Phase 2: Deal管理

#### 2.1 Deal作成
1. Dealsタブで「+」ボタンをタップ
2. 以下を入力：
   - Brand Name: `Test Brand`
   - Campaign: `Summer Campaign`
   - Platform: `Instagram`を選択
   - Content Type: `Reel`を選択
   - Rate: `500`
   - Deadline: 任意の日付
3. 「Save Deal」をタップ

チェック：
- [ ] モーダルが開く
- [ ] 入力できる
- [ ] 保存後、リストに表示される

#### 2.2 Deal編集
1. 作成したDealをタップ
2. Rate を `750` に変更
3. 保存

チェック：
- [ ] 詳細画面が開く
- [ ] 編集できる
- [ ] 変更が保存される

#### 2.3 Deal削除
1. Dealをタップして詳細を開く
2. 下にスクロールして「Delete Deal」をタップ
3. 確認ダイアログで「Delete」

チェック：
- [ ] 確認ダイアログが出る
- [ ] 削除後、リストから消える

---

### ✅ Phase 3: Payment管理

#### 3.1 Payment作成
1. Paymentsタブで「+」ボタンをタップ
2. 以下を入力：
   - Brand Name: `Test Brand`
   - Amount: `500`
   - Invoice Date: 今日
   - Payment Terms: `Net-30`を選択
3. 保存

チェック：
- [ ] モーダルが開く
- [ ] Due Dateが自動計算される（30日後）
- [ ] 保存後、リストに表示される
- [ ] ステータスが「Pending」

#### 3.2 Mark as Paid
1. 作成したPaymentをタップ
2. 「Mark as Paid」ボタンをタップ
3. 確認

チェック：
- [ ] ステータスが「Paid」に変わる
- [ ] Paid日付が記録される

#### 3.3 Payment削除
1. Paymentをタップして詳細を開く
2. 「Delete Payment」をタップ

チェック：
- [ ] 確認ダイアログが出る
- [ ] 削除される

---

### ✅ Phase 4: AI Tools

#### 4.1 Rate Calculator
1. Tools → Rate Calculator
2. 以下を設定：
   - Platform: `Instagram`
   - Content Type: `Reel`
   - Followers: `50000`
   - Engagement Rate: `3.5`
   - Niche: `Fashion`
3. 「Calculate Rate」をタップ

チェック：
- [ ] 計算結果が表示される（Min - Max range）
- [ ] Breakdownが表示される
- [ ] 「Copy Rate」で値がコピーされる
- [ ] 残り使用回数が表示される（例：4 of 5 remaining）

#### 4.2 Email Assistant
1. Tools → Email Assistant
2. 以下を設定：
   - Category: `Negotiation`
   - Template: `Rate Negotiation`
   - Brand Name: `Nike`
   - Offered Rate: `300`
   - Your Rate: `500`
   - Tone: `Professional`
3. 「Generate Email」をタップ

チェック：
- [ ] Subject行が生成される
- [ ] Body（本文）が生成される
- [ ] 変数が置換されている（$300、$500など）
- [ ] 「Copy」ボタンで本文がコピーされる

#### 4.3 Contract Review
1. Tools → Contract Review
2. 以下のテスト契約文をペースト：

```
This agreement grants Brand perpetual, worldwide rights to use Creator's content. 
Payment will be made Net-90 after approval. 
Brand reserves the right to make unlimited revisions. 
Creator agrees to a 2-year exclusivity period.
All content becomes the property of Brand.
```

3. 「Analyze Contract」をタップ

チェック：
- [ ] スコアが表示される（おそらく低いスコア）
- [ ] 複数の問題が検出される：
  - Perpetual rights（永久利用権）
  - Net-90 payment（支払い条件）
  - Unlimited revisions（無制限修正）
  - 2-year exclusivity（長期独占）
  - Ownership transfer（所有権譲渡）
- [ ] 各問題をタップすると詳細と提案が見える

#### 4.4 Usage Calculator
1. Tools → Usage Calculator
2. 以下を設定：
   - Base Rate: `$500`
   - Usage: `Paid Social Ads` ON, `Website/Blog` ON
   - Duration: `6 months`
   - Territory: `Regional`
   - Exclusivity: `90 days`
3. 結果を確認

チェック：
- [ ] 推奨レートが計算される
- [ ] 内訳が表示される（各項目の追加料金）
- [ ] Base Rateを変更すると再計算される

---

### ✅ Phase 5: 使用制限テスト

#### 5.1 Free制限の確認
1. Rate Calculatorを5回使用
2. 6回目を試みる

チェック：
- [ ] 制限メッセージが表示される
- [ ] Premium画面への誘導がある

#### 5.2 使用回数リセット（月替わり）
- 使用回数は月ごとにリセットされます
- データベース内の`usage_tracking`テーブルで`month_year`カラムを確認

---

### ✅ Phase 6: Settings

#### 6.1 Profile編集
1. Settings → Profile Card をタップ
2. 以下を入力：
   - Display Name: `Your Name`
   - Platform: `Instagram`
   - Handle: `yourhandle`
   - Followers: `50000`
3. 保存

チェック：
- [ ] 保存される
- [ ] Settingsに戻ると名前が表示される

#### 6.2 Premium画面
1. Settings → Premium カードをタップ

チェック：
- [ ] 3つのプランが表示される（Monthly、Yearly、Lifetime）
- [ ] 機能一覧が表示される
- [ ] 開発モードでは「Development mode」バッジが出る

#### 6.3 Premium購入（開発モード）
1. Premium画面でYearlyをタップ
2. 「Success」アラートが出る
3. OKをタップ

チェック：
- [ ] Premium画面が「You're Premium!」に変わる
- [ ] Settingsに戻るとPremiumバッジが緑色
- [ ] AI Toolsの使用制限がなくなる（∞表示）

#### 6.4 Export/Import
1. Settings → Export Data

チェック：
- [ ] 非Premiumの場合、Premium画面に誘導される
- [ ] Premiumの場合、Share Sheetが開く

2. Settings → Import Data
- JSONファイルを選択してインポート

#### 6.5 How to Use
1. Settings → How to Use

チェック：
- [ ] 使い方ガイドが表示される
- [ ] 各セクションの手順が読める

---

### ✅ Phase 7: 通知（開発ビルドのみ）

> ⚠️ Expo Goでは通知テストはできません

#### 7.1 通知許可
1. Settings → Notifications トグル ON
2. 許可ダイアログで「Allow」

チェック：
- [ ] 通知許可が求められる
- [ ] トグルがONになる

#### 7.2 Payment リマインダー
1. 新しいPaymentを作成（Due Date: 3日後）
2. 通知がスケジュールされる

確認方法（開発ビルド）：
```javascript
// コンソールで確認
import * as Notifications from 'expo-notifications';
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log(scheduled);
```

---

### ✅ Phase 8: エッジケース

#### 8.1 空の状態
- [ ] Deals が0件の時、Empty Stateが表示される
- [ ] Payments が0件の時、Empty Stateが表示される

#### 8.2 長いテキスト
- [ ] 長いBrand名が正しく省略される
- [ ] 長いNotes が正しく表示される

#### 8.3 大きな数字
- [ ] Rate: `1000000` が正しくフォーマットされる（$1,000,000）
- [ ] Followers: `10000000` が正しく表示される

#### 8.4 オフライン
- [ ] 機内モードでもアプリが動作する
- [ ] データの保存・読み込みができる

---

## 🐛 よくある問題と解決法

### 「Module not found」エラー
```powershell
npm install
npx expo start --clear
```

### 「Database not initialized」エラー
```powershell
# キャッシュクリア
Remove-Item -Path ".expo" -Recurse -Force
npx expo start --clear
```

### スタイルが崩れる
- ダークモードを切り替えてみる
- アプリを再起動

### 通知が来ない
- Expo Goでは動作しません
- 開発ビルドが必要：
```powershell
eas build --profile development --platform ios
```

---

## 📊 テスト結果シート

| 機能 | 結果 | メモ |
|------|------|------|
| アプリ起動 | ⬜ | |
| タブナビゲーション | ⬜ | |
| ダークモード | ⬜ | |
| Deal 作成 | ⬜ | |
| Deal 編集 | ⬜ | |
| Deal 削除 | ⬜ | |
| Payment 作成 | ⬜ | |
| Payment Mark Paid | ⬜ | |
| Payment 削除 | ⬜ | |
| Rate Calculator | ⬜ | |
| Email Assistant | ⬜ | |
| Contract Review | ⬜ | |
| Usage Calculator | ⬜ | |
| Free制限 | ⬜ | |
| Profile 編集 | ⬜ | |
| Premium 購入 | ⬜ | |
| Export/Import | ⬜ | |
| How to Use | ⬜ | |
| 通知 | ⬜ | 開発ビルドのみ |
| オフライン動作 | ⬜ | |

**テスト完了日**: ___________
**テスト者**: ___________
**問題点**: ___________

---

## 🎉 テスト完了！

すべてのチェックが通れば、アプリは本番リリース準備完了です！

問題があれば、エラーメッセージと再現手順を記録してください。
