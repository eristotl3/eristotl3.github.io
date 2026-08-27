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

## Aegis のスクリーンショットを差し替える

`assets/aegis-markets.png`（2880×1558）と `assets/aegis-portfolio.png`（2874×1556）を表示しています。

枠は `index.html` の `style="--ratio: 幅 / 高さ"` で決まり、画像は `object-fit: cover` で
**上から切り取られます**。Markets 側は `2880 / 935` にして、表の下の空白を落としています。

差し替えるときは:

1. 撮る前に **監視銘柄と保有数がダミーであることを確認**する。実際の保有が公開されます
2. 新しい実寸を `sips -g pixelWidth -g pixelHeight assets/*.png` で調べる
3. `--ratio` を書き換える。中身が上寄りなら高さを小さくして、余白を切る

横 2100px 以上あれば高解像度画面でも粗は出ません。

## プロジェクトを追加する

`index.html` の `<article class="patch patch--work-a work">` から `</article>` までを丸ごと複製し、中身を書き換えます。

- 3件目以降は `patch--work-a` / `patch--work-b` の指定を外すと、自動で下の行に流れます。
- スクリーンショットを載せる場合は `assets/` に置き、`<img class="work__icon" ...>` を差し替えるか、`work__body` の下に `<img>` を足してください。Aegis の画面を撮るときは、監視銘柄をダミーに差し替えてから撮ること。

## 画面の構成

| 位置 | 中身 |
|---|---|
| 上部固定バー | 氏名とページ内リンク |
| 表題 | 氏名・一文・3×3 の継ぎ接ぎの印 |
| 私について ／ 要約 | 本文と、色面のパッチに置いた主要な実績 |
| 制作物 | Aegis（全幅・画面写真つき）と口座ノート |
| 実績・資格 ／ リンク | 年表と外部リンク |
| 下部固定バー | ハムスターが歩く床。本文はこの上に乗らない |

書体は3系統で使い分けています。見出し＝明朝（Shippori Mincho）、本文＝OS標準のゴシック、
数字と符号＝等幅（JetBrains Mono）。数字を等幅にしているのが、素人っぽさを消す一番効く部分です。

## 色を変える

`style.css` 先頭の `:root` と、その下の `@media (prefers-color-scheme: dark)` の2箇所。
ライトとダークは別々に定義してあるので、両方直す必要があります。

## ハムスター

**本文の上には乗りません。** 画面下端に高さ 42px の床（`.floor`）を固定し、`body` に同じ分の
`padding-bottom` を入れてあるので、本文が床の下に潜り込むことがありません。ハムスターはこの床の
上だけを歩き、右端は URL 表示の手前で折り返します。

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
