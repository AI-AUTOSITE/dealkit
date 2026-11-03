# Phase 4：メディアキット作成

> **前提**：Phase 3 完了済み（`lib/pdf/` と `app_settings` を使う）。**新しいパッケージは追加しない。**
> **背景**：ストアのキーワードに "media kit" が入っているのに、アプリにその機能が無かった。ブランドへの売り込み（ピッチ）で使う、1枚の自己紹介PDFを作れるようにする。

---

## 4-1. 保存するデータ
`app_settings` の `media_kit`（JSON）に保存。初回はプロフィールから自動で埋める。
- `bio`（自己紹介。最大300文字）、`location`（任意）
- `platforms`：配列 `{ platform, handle, followers, engagementRate }`（最大6件。1件目はプロフィールの primary_platform・handle・followers・engagement_rate から）
- `niche`・`email`：プロフィールから
- `audience`（任意・自由入力）：`topCountries`, `ageRange`, `genderSplit`
- `rates`：配列 `{ label, price }`（例 "Instagram Reel" / 500）＋ `showRates`（OFF なら PDF には "Rates available on request"）
  - レート計算ツールの保存済み結果（rate_calculations）があれば "Use Rate Calculator results" で候補として取り込める（任意）
- `links`（任意）：配列 `{ label, url }`（例 Portfolio）※ PDF に文字として載せるだけ。アプリから外部にアクセスはしない
- `brands`：自動で出るブランドのうち非表示にしたもの（`excluded`）と、手動で追加したもの（`extra`）
- `showCredit`：PDF の下に小さな "Made with DealKit" を出すか（初期値 ON）

## 4-2. 画面 `app/(modals)/media-kit.tsx`
- 入口：Profile タブの Tools セクションの**先頭**に "Media Kit"
- セクション：Profile ／ Platforms（追加・削除）／ About ／ Audience ／ Rates ／ Brands I've Worked With ／ Links ／ Options
- 入力は自動保存（`lib/utils.ts` の `debounce` を使う）
- 画面下に固定ボタン："Preview" と "Share PDF"
- 名前・プラットフォーム1件が空なら、PDF を作る前にやさしく案内

## 4-3. Brands I've Worked With
- ステージが delivered / invoiced / paid のディールのブランド名を、重複なしで自動表示。各ブランドにトグル（初期値 ON）＋ 手動追加。
- 注意書き："Some contracts don't allow you to name the brand. Turn those off."

## 4-4. PDF のデザイン（英語・US Letter・**必ず1ページに収める**）
- ヘッダー：イニシャルの丸いアイコン（写真は今回なし）、名前、@handle、ニッチ、場所、連絡先メール
- 数字のハイライト：合計フォロワー（例 45.2K。`formatNumber` を利用）、平均エンゲージメント率、ブランドコラボ数
- Platforms（プラットフォーム別のフォロワー・エンゲージメント率）
- About（bio）、Audience
- Rates（または "Rates available on request"）。金額は選択中の通貨で
- Brands（チップ状に並べる。最大12個）
- Links
- フッター：`showCredit` が ON なら小さく "Made with DealKit"
- 雰囲気：インフルエンサーらしく洗練された見た目。余白多め・アクセント色 #7C3AED・カード風。テンプレートっぽくしない
- **中身が空のセクションは出さない**（空の見出しを残さない）
- 最大量（プラットフォーム6・ブランド12・bio 300文字）でも1ページに収まることを確認
- 共有時のファイル名：`MediaKit-{handle}.pdf`（handle が無ければ名前）

---

## やらないこと
- プロフィール写真（画像を選ぶパッケージが増えるため、今回は見送り）、複数のデザインテンプレート、Web公開

## 実機テストのチェックリストに必ず入れるもの
- プロフィールを入力済みなら、何も追加入力しなくても最低限のメディアキットが作れる
- 項目を最大まで入れても1ページに収まる
- ブランドのトグル OFF が PDF に反映される
- 機内モードでも作れる、全データ削除で消える、バックアップから戻る
