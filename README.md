# eristotl3.github.io

岩田真幸のポートフォリオ。素の HTML / CSS / JavaScript のみで、ビルド工程も依存パッケージもありません。

## 構成

| ファイル | 中身 |
|---|---|
| `index.html` | 本文すべて。文言を直すのはここ |
| `style.css` | 配色・レイアウト。色は先頭の `:root` にまとまっている |
| `main.js` | 縫合アニメーションとハムスター |
| `assets/` | 画像 |

## 公開する

リポジトリ名を **`eristotl3.github.io`** にすると `https://eristotl3.github.io` で公開されます。

```bash
git init && git add -A && git commit -m "portfolio"
git branch -M main
git remote add origin https://github.com/eristotl3/eristotl3.github.io.git
git push -u origin main
```

その後 GitHub の Settings → Pages で Source を `main` / `/ (root)` に設定します。反映まで1〜2分。

## プロジェクトを追加する

`index.html` の `<article class="patch patch--work-a work">` から `</article>` までを丸ごと複製し、中身を書き換えます。

- 3件目以降は `patch--work-a` / `patch--work-b` の指定を外すと、自動で下の行に流れます。
- スクリーンショットを載せる場合は `assets/` に置き、`<img class="work__icon" ...>` を差し替えるか、`work__body` の下に `<img>` を足してください。Aegis の画面を撮るときは、監視銘柄をダミーに差し替えてから撮ること。

## 色を変える

`style.css` 先頭の `:root` と、その下の `@media (prefers-color-scheme: dark)` の2箇所。
ライトとダークは別々に定義してあるので、両方直す必要があります。

## ハムスター

`main.js` のドット絵は文字列の配列（`TORSO` / `FEET`）で、1文字が1ドットです。
`PALETTE` の記号と色が対応しています。歩く速さは `STRIDE_MS` と `STRIDE_PX`。

読んでいる間は止まる、という規律で書いてあります:

- スクロール中だけ歩く
- 止まると毛づくろい → しばらくして就寝
- クリックで起きる
- OS の「視差効果を減らす」設定が有効なら一切動かない

## 手元で確認する

```bash
python3 -m http.server 8000
```
