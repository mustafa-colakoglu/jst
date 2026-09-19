const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {
  compile,
  render,
  renderFile,
  renderReact,
  __express,
} = require("../dist");

test("code blocks, loops, locals and escaped/raw output", async () => {
  const source = '<?jst for (const item of items) { ?><p><?jst= item ?></p><?jst } ?><?jst- trusted ?>';
  const page = compile(source);
  assert.equal(await page({ items: ["<a>", "&"], trusted: "<hr>" }), "<p>&lt;a&gt;</p><p>&amp;</p><hr>");
  assert.equal(await page({ items: ["B"], trusted: "" }), "<p>B</p>");
});

test("delimiter inside strings, comments, regex and template literals", async () => {
  const source = `<?jst
    const a = "?>";
    const b = /\\?>/.test("?>");
    const c = \`value: \${"?>"}\`;
    if (true) /\\?>/.test("?>");
    /* ?> */
    print(a + b + c);
  ?>`;
  assert.equal(await render(source), "?>truevalue: ?>");
});

test("async code, file includes and legacy require", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "jst-test-"));
  try {
    await fs.writeFile(path.join(directory, "partial.jst"), "[<?jst= name ?>]");
    await fs.writeFile(path.join(directory, "page.jst"), '<?jst print(await include("./partial.jst", {name: "A&B"})); await require("./partial.jst", {name: "C"}); ?>');
    assert.equal(await renderFile(path.join(directory, "page.jst")), "[A&amp;B][C]");
    await fs.writeFile(path.join(directory, "cycle.jst"), '<?jst await require("./cycle.jst"); ?>');
    await assert.rejects(renderFile(path.join(directory, "cycle.jst")), /Circular template include/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("JavaScript syntax and unclosed template tags fail explicitly", async () => {
  assert.throws(() => compile("<?jst const = ?>"), SyntaxError);
  assert.throws(() => compile("hello <?jst print(1)"), /Unclosed <\?jst block at line 1/);
  assert.throws(() => compile("<?jst= ?>"), /Empty output expression/);
});

test("parallel renders do not share output or locals", async () => {
  const page = compile('<?jst await Promise.resolve(); print(value); ?>');
  assert.deepEqual(await Promise.all([page({ value: "one" }), page({ value: "two" })]), ["one", "two"]);
});

test("existing JST samples still render", async () => {
  assert.match(await renderFile("src/www/index.jst"), /<title>test page<\/title>/);
  assert.equal((await renderFile("src/www/loops.jst")).match(/<br \/>/g)?.length, 10);
  assert.match(await renderFile("src/www/partial.jst"), /test data/);
  assert.equal(await renderFile("src/www/get.jst", { GET: { name: "Ada" } }), "Ada");
  const mysql = { query: async () => [[{ name: "Ada" }]] };
  assert.match(await renderFile("src/www/mysql.jst", { mysql }), /Ada/);
  for (const name of await fs.readdir("src/www")) {
    if (name.endsWith(".jst")) compile(await fs.readFile(path.join("src/www", name), "utf8"));
  }
});

test("Express adapter uses callback with rendered HTML", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "jst-express-"));
  try {
    const filename = path.join(directory, "view.jst");
    await fs.writeFile(filename, "<h1><?jst= title ?></h1>");
    const result = await new Promise((resolve, reject) => __express(filename, { title: "A&B" }, (error, html) => error ? reject(error) : resolve(html)));
    assert.equal(result, "<h1>A&amp;B</h1>");
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("React elements render as static or hydratable HTML", async () => {
  const React = require("react");
  const element = React.createElement("strong", null, "A&B");
  assert.equal(renderReact(element), "<strong>A&amp;B</strong>");
  assert.equal(await render("<?jst- renderReact(element) ?>", { element }), "<strong>A&amp;B</strong>");
  assert.equal(renderReact(element, { hydrate: true }), "<strong>A&amp;B</strong>");
});
