# 1分の1の人生 — 短縮URL版（GitHub連携 + Cloudflare Pages）

人生を Cloudflare KV に保存し、`https://あなたのドメイン/l/ab12cd34` のような短いURLで共有します。
共有URLを開くと、その人の人生が（編集不可で）遊べます。ページ内の「自分の人生をつくる」から、誰でも自分の人生を作れます。
Xに貼ったときのプレビューには、その人生のタイトルが出ます。

## リポジトリの構成

```
public/index.html             画面
functions/api/lives.js        POST /api/lives        人生を保存してIDを返す
functions/api/lives/[id].js   GET  /api/lives/:id    保存された人生を返す
functions/l/[id].js           GET  /l/:id            画面を返し、タイトルをプレビュー用タグに埋め込む
functions/_lib/life.js        入力の検証・ID生成
wrangler.toml.example         （使いません。CLIでデプロイしたい人向けの参考）
```

`functions` フォルダは、リポジトリの一番上の階層に置いてください。
今までリポジトリの直下にあった `index.html` は、`public/index.html` に置き換えます（直下の古い `index.html` は削除）。

## 設定手順（Cloudflareのダッシュボード）

### 1. GitHubに反映する
上の構成にして、commit → push します。

### 2. ビルド設定を変える
Workers & Pages → 対象のPagesプロジェクト → 設定 → ビルド

- フレームワーク プリセット: なし
- ビルド コマンド: 空のまま
- ビルド出力ディレクトリ: `public`

### 3. KVを作る
Workers & Pages → KV → 「Create a namespace」で、名前を `LIVES` にして作成します。

### 4. KVをプロジェクトに紐づける
対象のPagesプロジェクト → 設定 → バインディング → 追加 → KV namespace

- 変数名: `LIVES`（この名前のとおりに入力）
- KV namespace: 手順3で作った `LIVES`

本番（Production）に設定します。プレビュー環境でも試すなら、Previewにも同じ設定を入れてください。

### 5. 再デプロイする
バインディングは次のデプロイから効きます。デプロイタブで最新のデプロイを「再試行」するか、空のcommitを push してください。

## 動作確認

```
curl -s -X POST https://あなたのドメイン/api/lives \
  -H 'content-type: application/json' \
  -d '{"title":"テスト","ending":"おわり","events":[{"age":0,"t":"誕生","q":"生まれた","br":false}]}'
```
`{"id":"..."}` が返れば成功です。`https://あなたのドメイン/l/<id>` を開いて確認してください。
`KV binding "LIVES" is not configured` と返るときは、手順4と5が反映されていません。

## 仕様と注意

- 同じ内容の人生は、同じIDが返ります（連打や再共有でデータが増えません）。
- 保存できるのは最大15個の出来事・各文字数に上限あり・全体60KBまでです。想定外の項目は保存時に捨てます。
- 同じサイトからの保存のみ許可しています。
- KVは世界中に反映されるまで最大1分ほどかかることがあります。作った直後に別の地域から開くと、一瞬「見つかりませんでした」になる場合があります。
- 人生は公開データです。URLを知っている人は誰でも読めます。削除機能はまだありません（必要ならダッシュボードのKVから `l:<id>` を消してください）。
- 荒らし対策として、Cloudflareのダッシュボードで `POST /api/lives` にレート制限ルール（例: 1分あたり10回）を付けるのがおすすめです。
- 保存APIが使えない環境（ファイルを直接開いた場合など）では、従来どおり内容入りの長いURLで共有します。

