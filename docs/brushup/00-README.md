# DealKit v1.2.0 ブラッシュアップ — 使い方ガイド 📘

## 中身
| ファイル | 内容 | Development Build の作り直し |
|---|---|---|
| `CLAUDE.md`（dealkit 直下） | Claude Code が毎回自動で読むルール集 | — |
| `01-maintenance.md` | バグ修正・お掃除（旧DBデータの救出・全データ削除・バックアップ・金額表示の統一など） | 不要 |
| `02-currency-income-report.md` | 通貨設定 ＋ 年間収入レポート（CSV） | 不要 |
| `03-invoice-pdf.md` | 請求書PDF | **必要**（expo-print を追加） |
| `04-media-kit.md` | メディアキット作成 | 不要 |
| `05-welcome-empty-states.md` | ウェルカム画面 ＋ データ0件の画面 | 不要 |
| `06-colors-accessibility.md` | 色のズレ修正（ダークモード）＋ アクセシビリティ | 不要 |
| `07-release-v1.2.0.md` | バージョン更新・使い方ガイド更新・リリース準備 | — |

---

## 最初の準備（1回だけ）
1. ZIP を解凍して、`CLAUDE.md` と `docs` フォルダを **dealkit フォルダの直下** に置く

```
dealkit/
├── CLAUDE.md          ← ここ
├── docs/
│   └── brushup/
│       ├── 00-README.md
│       ├── 01-maintenance.md
│       └── …
├── app/
├── lib/
└── …
```

2. GitHub Desktop でこの2つをコミット（例：`Add brush-up docs`）→ Push origin

---

## 各フェーズの進め方（毎回同じ）

1. **GitHub Desktop で「No local changes（変更なし）」になっているか確認**
   → いつでも作業前に戻せる「保険」になります
2. VS Code のターミナルで dealkit フォルダを開いて `claude` を起動
   （PowerShell でも Git Bash でも同じ）
3. `Shift + Tab` を何回か押して、画面の下に **「⏸ plan mode on」** と出る状態にする
   → 計画だけ立てて、まだファイルを書き換えないモードです
4. こう送る（フェーズ番号だけ変える）：

```
docs/brushup/01-maintenance.md を読んで、その内容で作業してください
```

5. 日本語の作業計画が出てくるので確認 → 問題なければ承認
6. 作業が終わったら実機テスト：

```
npx expo start --dev-client
```

   Claude Code が最後に出す「実機テストのチェックリスト」を上から順に確認

7. 結果に応じて：
   - ✅ 問題なし → GitHub Desktop でコミット（メッセージは Claude Code の案を使う）→ Push origin
   - ⚠️ 問題あり → 症状をそのまま Claude Code に伝えて直してもらう
   - 🆘 どうにもならない → GitHub Desktop で **「Discard all changes」** すれば作業前の状態に戻ります

💡 CLAUDE.md がちゃんと読まれているか不安なときは、Claude Code で `/context` と送ると確認できます。

---

## ⚠️ 注意
- **フェーズは番号順に**。後ろのフェーズは前のフェーズの成果を使います。
- フェーズ1では「全データ削除」をテストします。本物のデータが入った端末でテストする前に、**必ず Profile → Export でバックアップ**を取っておいてください。
- フェーズ3の後は Development Build の作り直しが必要です（PowerShell / Git Bash 共通）：

```
eas build --profile development --platform ios
eas build --profile development --platform android
```

  できたビルドを実機にインストールしてから、いつもどおり `npx expo start --dev-client`

- リリースは最後に1回だけ（v1.2.0）。アメリカの確定申告シーズン（1月〜）に間に合うよう、**12月中のリリース**が目標です。
