# JST

JST, içinde JavaScript çalıştırılabilen bir Node.js template engine'dir. Kendisi sunucu başlatmaz.

## Kurulum

Yayımlanmış paketi kurmak için:

```sh
npm install @mini2/jst
```

Bu depodan yerel tarball üretmek için `npm install`, ardından `npm pack` çalıştırın. Oluşan dosya `mini2-jst-1.0.0.tgz` biçimindedir ve `npm install ./mini2-jst-1.0.0.tgz` ile kurulabilir. Node.js 18 veya üstü gerekir.

## Sözdizimi

```jst
<?jst const title = "Merhaba"; ?>
<h1><?jst= title ?></h1>
<?jst for (const item of items) { ?>
  <p><?jst= item ?></p>
<?jst } ?>
<?jst- trustedHtml ?>
```

| Biçim | Anlamı |
| --- | --- |
| `<?jst ... ?>` | JavaScript çalıştırır. `await` kullanılabilir. |
| `<?jst= ifade ?>` | İfadeyi HTML karakterlerini kaçırarak yazdırır. |
| `<?jst- ifade ?>` | İfadeyi ham HTML olarak yazdırır. |
| `print(değer)` | Eski şablonlarla uyumlu ham çıktı üretir. |
| `printEscaped(değer)` | HTML karakterlerini kaçırarak çıktı üretir. |

Şablon içindeki JavaScript, Node.js'in `vm` modülünde çalışır. `vm` güvenlik sınırı değildir; yalnızca güvendiğiniz şablonları çalıştırın. JSX sözdizimi `.jst` dosyası içinde derlenmez; React öğelerini uygulama kodunda oluşturup şablona geçirin.

## Kullanım

```js
const { render, renderFile, compile } = require("@mini2/jst");

const html = await render("<h1><?jst= title ?></h1>", { title: "A&B" });
// <h1>A&amp;B</h1>

const page = compile("<p><?jst= name ?></p>");
await page({ name: "Ada" });
await page({ name: "Deniz" });

await renderFile("./views/home.jst", { title: "Ana sayfa" });
```

`render` ve `renderFile` her zaman `Promise<string>` döndürür. Şablon değişkenleri ikinci argümandaki nesneden gelir. Eski HTTP değişkenleri uygulama tarafından açıkça verilebilir: `renderFile("view.jst", { GET: req.query, POST: req.body, HEADERS: req.headers })`.

Veritabanı bağlantısı da uygulamanın sorumluluğundadır. Örneğin mevcut `src/www/mysql.jst` örneğini `renderFile("src/www/mysql.jst", { mysql: dbClient })` ile kullanabilirsiniz.

### Parçalar ve modüller

`include` yolu, onu çağıran `.jst` dosyasına göre çözülür ve HTML döndürür:

```jst
<?jst print(await include("./card.jst", { name: "Ada" })); ?>
```

Eski `await require("./card.jst", { name: "Ada" })` kullanımı da parçayı doğrudan çıktıya ekler. Diğer `require(...)` çağrıları, dosyanın konumuna göre normal Node.js modüllerini yükler. Döngüsel parça çağrıları hata verir.

### Express ile

Express uygulaması paketi isteğe bağlı olarak kendi sunucusuna bağlayabilir:

```js
const express = require("express");
const { __express } = require("@mini2/jst");
const app = express();

app.engine("jst", __express);
app.set("views", "./views");
app.set("view engine", "jst");
app.get("/", (req, res) => res.render("home", { title: "Ana sayfa" }));
app.listen(3000);
```

### React ile

React desteği için ayrıca `react` ve `react-dom` kurun:

```sh
npm install react react-dom
```

```js
const React = require("react");
const { renderFile } = require("@mini2/jst");
const card = React.createElement("strong", null, "Merhaba");
const html = await renderFile("./views/page.jst", { card });
```

`page.jst`:

```jst
<main><?jst- renderReact(card) ?></main>
```

`renderReact(element)` statik HTML üretir. Etkileşimli bir React ağacı için `renderReact(element, { hydrate: true })` kullanın ve istemci kodunda aynı ağacı `hydrateRoot` ile bağlayın. React sunucu render işleminin sınırlamaları için [React belgelerine](https://react.dev/reference/react-dom/server) bakın.

## Geliştirme

```sh
npm test
npm pack --dry-run
```

Paket yalnızca derlenmiş `dist` dosyalarını yayımlar. TypeScript tür tanımları paketle birlikte gelir.

## Yayınlama

`@mini2` kapsamına yayınlama yetkisi olan npm hesabıyla giriş yaptıktan sonra:

```sh
npm whoami
npm run release:check
npm run release
```

`release:check`, yayınlanacak dosyaları ve yaşam döngüsü betiklerini gerçek yayın yapmadan kontrol eder. `release`, paketi npm kayıt defterine herkese açık olarak yayımlar. Her gerçek yayından önce `prepublishOnly` testleri çalıştırır; `prepack` derlenmiş dosyaları hazırlar. Aynı sürüm tekrar yayımlanamaz.

Sonraki sürüm için değişikliğin türüne göre `npm run bump:patch`, `npm run bump:minor` veya `npm run bump:major` çalıştırın; ardından `npm run release:check` ve `npm run release` kullanın. Bu komutlar `package.json` ile `package-lock.json` sürümünü birlikte günceller; otomatik Git commit'i veya etiketi oluşturmaz.
