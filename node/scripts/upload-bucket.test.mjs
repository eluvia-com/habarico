import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ASSET_POOL_PREFIX,
  PRUNE_LIMIT,
  anonymousEtag,
  bucketConfig,
  bucketEndpoint,
  cacheControlFor,
  checkPrune,
  collectFiles,
  contentTypeFor,
  etagOf,
  planPrune,
  planUploads,
  publicObjectUrl,
  readArgs,
  shouldCompress,
  uploadPlan,
  withRetry,
} from "./upload-bucket.mjs";

test("a key is served as what it is", () => {
  assert.equal(
    contentTypeFor("main/1.2.0/index.html"),
    "text/html; charset=utf-8",
  );
  assert.equal(
    contentTypeFor("assets/css/styles.abc.css"),
    "text/css; charset=utf-8",
  );
  assert.equal(
    contentTypeFor("assets/js/main.abc.js"),
    "text/javascript; charset=utf-8",
  );
  assert.equal(
    contentTypeFor("versions.json"),
    "application/json; charset=utf-8",
  );
  assert.equal(
    contentTypeFor("main/1.2.0/sitemap.xml"),
    "application/xml; charset=utf-8",
  );
  assert.equal(
    contentTypeFor("main/1.2.0/openapi.yaml"),
    "text/yaml; charset=utf-8",
  );
  assert.equal(contentTypeFor("main/1.2.0/img/logo.svg"), "image/svg+xml");
  assert.equal(contentTypeFor("assets/images/x.abc.png"), "image/png");
  assert.equal(contentTypeFor("assets/fonts/x.abc.woff2"), "font/woff2");
});

test("a page carries the content type, cache policy and compression for its key", () => {
  const [page] = planUploads({ files: ["python/installation/index.html"] });

  assert.equal(page.key, "python/installation/index.html");
  assert.equal(page.contentType, "text/html; charset=utf-8");
  assert.equal(page.cacheControl, "public, no-cache");
  assert.equal(page.gzip, true);
});

test("only the content-hashed pool may be cached forever", () => {
  assert.equal(
    cacheControlFor("assets/js/main.abc.js"),
    "public, max-age=31536000, immutable",
  );
  // Not `no-store`: the object carries an ETag, so a revisit revalidates and gets a 304 instead of
  // the whole page, while a deploy still reaches the reader on their next request.
  assert.equal(cacheControlFor("main/1.2.0/index.html"), "public, no-cache");
  assert.equal(cacheControlFor("versions.json"), "public, no-cache");
});

test("what is already compressed is not compressed again", () => {
  assert.equal(shouldCompress("assets/js/main.abc.js"), true);
  assert.equal(shouldCompress("main/1.2.0/index.html"), true);
  assert.equal(shouldCompress("main/1.2.0/python/installation"), true);
  assert.equal(shouldCompress("assets/images/x.abc.png"), false);
  assert.equal(shouldCompress("assets/fonts/x.abc.woff2"), false);
  assert.equal(shouldCompress("main/1.2.0/img/favicon.ico"), false);
});

test("each file becomes exactly one object, keyed by its route", () => {
  // The ingress rewrites `/python/installation` and `/python/installation/` onto the `index.html`
  // key itself, so a page is stored once, under its own key, and nothing else.
  const plan = planUploads({
    files: ["python/installation/index.html", "404.html"],
  });

  assert.deepEqual(
    plan.map(({ key }) => key),
    ["python/installation/index.html", "404.html"],
  );
});

test("the main build stays at the root while the assets go into the shared pool", () => {
  const plan = planUploads({
    files: [
      "index.html",
      "python/installation/index.html",
      "assets/js/main.abc.js",
      "img/logo.svg",
    ],
  });

  assert.deepEqual(
    plan.map(({ key, file }) => [file, key]),
    [
      ["index.html", "index.html"],
      ["python/installation/index.html", "python/installation/index.html"],
      ["assets/js/main.abc.js", "assets/js/main.abc.js"],
      ["img/logo.svg", "img/logo.svg"],
    ],
  );
});

test("a build published under a prefix keeps its pages inside it", () => {
  // What the Storybook publish does (HAB-763): every page goes under the prefix, and with the
  // pool turned off its assets stay there too, because it addresses them relatively.
  const plan = planUploads({
    files: ["index.html", "assets/js/main.abc.js"],
    prefix: "6.7",
    assetPool: false,
  });

  assert.deepEqual(
    plan.map(({ key }) => key),
    ["6.7/index.html", "6.7/assets/js/main.abc.js"],
  );
});

test("the pool is a prefix of its own, outside every build", () => {
  assert.equal(ASSET_POOL_PREFIX, "assets");
});

test("a build that addresses its assets relatively keeps them inside its prefix", () => {
  // Storybook (HAB-763): `<prefix>/index.html` asks for `<prefix>/assets/…`, so hoisting those
  // objects into the shared pool would leave the series pointing at nothing.
  const plan = planUploads({
    files: ["index.html", "iframe.html", "assets/main.abc.js"],
    prefix: "6.7",
    assetPool: false,
  });

  assert.deepEqual(
    plan.map(({ key }) => key),
    ["6.7/index.html", "6.7/iframe.html", "6.7/assets/main.abc.js"],
  );
});

test("an asset kept inside a prefix is still immutable", () => {
  // The name is a content hash wherever the object sits; what changed is only where it sits.
  const [asset] = planUploads({
    files: ["assets/main.abc.js"],
    prefix: "6.7",
    assetPool: false,
  });

  assert.equal(asset.cacheControl, "public, max-age=31536000, immutable");
});

test("a flag does not swallow the option that follows it", () => {
  // `--no-asset-pool --prefix 6.7` has to upload under `6.7`, not under `--prefix`.
  assert.deepEqual(readArgs(["--no-asset-pool", "--prefix", "6.7"]), {
    "no-asset-pool": true,
    prefix: "6.7",
  });
  assert.deepEqual(readArgs(["--dir", "build", "--dry-run"]), {
    dir: "build",
    "dry-run": true,
  });
  assert.deepEqual(readArgs(["--prefix=node/6.7"]), { prefix: "node/6.7" });
  assert.deepEqual(
    readArgs([
      "--no-asset-pool",
      "--bucket-env",
      "STORYBOOK_BUCKET",
      "--dry-run",
    ]),
    {
      "no-asset-pool": true,
      "bucket-env": "STORYBOOK_BUCKET",
      "dry-run": true,
    },
  );
});

/** A bucket in memory: the same interface the S3 one implements, so the logic under test is real. */
function fakeBucket(initial = {}) {
  const objects = new Map(Object.entries(initial));
  const calls = { put: [], list: [], remove: [] };
  return {
    calls,
    objects,
    async head(key) {
      return objects.has(key) ? etagOf(objects.get(key)) : null;
    },
    async put(upload, body) {
      calls.put.push(upload.key);
      objects.set(upload.key, body);
    },
    async list(prefix) {
      calls.list.push(prefix);
      return [...objects.keys()].filter(
        (key) => !prefix || key.startsWith(`${prefix}/`),
      );
    },
    async remove(keys) {
      calls.remove.push(...keys);
      for (const key of keys) {
        objects.delete(key);
      }
    },
  };
}

function buildDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "habarico-upload-"));
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(dir, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return dir;
}

test("a page is sent once, under its own key", async () => {
  const dir = buildDir({ "python/installation/index.html": "<html>x</html>" });
  const store = fakeBucket();

  const stats = await uploadPlan({
    store,
    dir,
    uploads: planUploads({ files: collectFiles(dir) }),
  });

  assert.deepEqual(store.calls.put, ["python/installation/index.html"]);
  assert.equal(stats.uploaded, 1);
});

test("an object the bucket already holds byte for byte is not sent again", async () => {
  // The asset pool is append-only, so this is what a release actually costs: nearly everything in
  // it is already there.
  const dir = buildDir({ "assets/js/main.abc.js": "console.log(1)" });
  const uploads = planUploads({
    files: collectFiles(dir),
    prefix: "main/1.2.0",
  });
  const first = fakeBucket();
  await uploadPlan({ store: first, dir, uploads });

  const second = fakeBucket(Object.fromEntries(first.objects));
  const stats = await uploadPlan({ store: second, dir, uploads });

  assert.deepEqual(second.calls.put, []);
  assert.equal(stats.skipped, 1);
  assert.equal(stats.bytes, 0);
});

test("an object whose content changed is replaced", async () => {
  const dir = buildDir({ "index.html": "<html>new</html>" });
  const uploads = planUploads({
    files: collectFiles(dir),
    prefix: "main/1.2.0",
  });
  const store = fakeBucket({ "main/1.2.0/index.html": Buffer.from("stale") });

  const stats = await uploadPlan({ store, dir, uploads });

  assert.deepEqual(store.calls.put, ["main/1.2.0/index.html"]);
  assert.equal(stats.uploaded, 1);
});

test("what is stored is the compressed body", async () => {
  const dir = buildDir({ "index.html": "<html>".padEnd(500, "x") });
  const store = fakeBucket();

  await uploadPlan({
    store,
    dir,
    uploads: planUploads({ files: collectFiles(dir), prefix: "main/1.2.0" }),
  });

  const stored = store.objects.get("main/1.2.0/index.html");
  assert.equal(stored[0], 0x1f);
  assert.equal(stored[1], 0x8b);
  assert.ok(stored.length < 500);
});

test("the bucket endpoint is DigitalOcean unless something else is named", () => {
  assert.equal(
    bucketEndpoint({ STORYBOOK_BUCKET_REGION: "ams3" }),
    "https://ams3.digitaloceanspaces.com",
  );
  // Any S3 will do - which is how the routing in front of the bucket is verified before it exists.
  assert.equal(
    bucketEndpoint({
      STORYBOOK_BUCKET_REGION: "ams3",
      STORYBOOK_BUCKET_ENDPOINT: "http://localhost:9000",
    }),
    "http://localhost:9000",
  );
  // The endpoint follows the family it was asked for, not the one beside it.
  assert.equal(
    bucketEndpoint(
      { DOCS_BUCKET_REGION: "fra1", STORYBOOK_BUCKET_REGION: "ams3" },
      "DOCS_BUCKET",
    ),
    "https://fra1.digitaloceanspaces.com",
  );
});

const twoBuckets = {
  DOCS_BUCKET: "hab-docs",
  DOCS_BUCKET_REGION: "fra1",
  DOCS_BUCKET_KEY: "docs-key",
  DOCS_BUCKET_SECRET: "docs-secret",
  STORYBOOK_BUCKET: "hab-storybook",
  STORYBOOK_BUCKET_REGION: "ams3",
  STORYBOOK_BUCKET_KEY: "storybook-key",
  STORYBOOK_BUCKET_SECRET: "storybook-secret",
};

test("the bucket is the one the named family describes", () => {
  assert.deepEqual(bucketConfig(twoBuckets), {
    bucket: "hab-storybook",
    region: "ams3",
    accessKeyId: "storybook-key",
    secretAccessKey: "storybook-secret",
    endpoint: "https://ams3.digitaloceanspaces.com",
    forcePathStyle: false,
  });
  assert.equal(bucketConfig(twoBuckets, "DOCS_BUCKET").bucket, "hab-docs");
});

test("a family that is not set fails by its own name and never falls back to the docs bucket", () => {
  // This job runs in a project where DOCS_BUCKET* may be set for something else entirely. The one
  // outcome it must never have is the Storybook published over another bucket's contents.
  const docsOnly = Object.fromEntries(
    Object.entries(twoBuckets).filter(([name]) => name.startsWith("DOCS_")),
  );

  assert.throws(() => bucketConfig(docsOnly), {
    message: "[upload-bucket] STORYBOOK_BUCKET is not set",
  });
  assert.throws(
    () => bucketConfig({ ...docsOnly, STORYBOOK_BUCKET: "hab-storybook" }),
    { message: "[upload-bucket] STORYBOOK_BUCKET_REGION is not set" },
  );
});

test("a prune removes what the build no longer holds and never touches the pool", () => {
  // A page that was renamed or dropped is otherwise still served at its old address for ever -
  // the bucket is public and nothing else ever removes a key. The pool is append-only by design:
  // an older build still in a reader's cache may ask for an asset the new build no longer names.
  const uploads = planUploads({
    files: ["index.html", "python/intro/index.html", "assets/js/a.abc.js"],
  });

  const stale = planPrune({
    existing: [
      "index.html",
      "python/intro/index.html",
      "python/old/index.html",
      "md/python/old.md",
      "assets/js/a.abc.js",
      "assets/js/old.abc.js",
    ],
    uploads,
  });

  assert.deepEqual(stale, ["md/python/old.md", "python/old/index.html"]);
});

test("a prune under a prefix is confined to it", () => {
  // The Storybook keeps a build per series beside the root one; pruning `6.7/` must not reach
  // `6.8/` or the root. Inside the prefix the assets belong to that build alone (no pool), so a
  // stale one goes with the pages.
  const uploads = planUploads({
    files: ["index.html", "assets/new.abc.js"],
    prefix: "6.7",
    assetPool: false,
  });

  const stale = planPrune({
    existing: [
      "6.7/index.html",
      "6.7/assets/old.abc.js",
      "6.7/assets/new.abc.js",
      "index.html",
      "6.8/index.html",
    ],
    uploads,
    prefix: "6.7",
    assetPool: false,
  });

  assert.deepEqual(stale, ["6.7/assets/old.abc.js"]);
});

test("with pruning on, what the bucket holds beyond the build is removed after the upload", async () => {
  // A series prefix is the only thing here a prune could sensibly be pointed at: each release
  // overwrites its own `<series>/`, and the pool is shared, so it is left alone.
  const dir = buildDir({
    "index.html": "<html>new</html>",
    "a/index.html": "a",
    "b/index.html": "b",
    "c/index.html": "c",
  });
  const store = fakeBucket({
    "6.7/index.html": Buffer.from("old"),
    "6.7/a/index.html": Buffer.from("a"),
    "6.7/b/index.html": Buffer.from("b"),
    "6.7/c/index.html": Buffer.from("c"),
    "6.7/gone/index.html": Buffer.from("gone"),
    "assets/js/keep.abc.js": Buffer.from("pool"),
  });

  const stats = await uploadPlan({
    store,
    dir,
    uploads: planUploads({ files: collectFiles(dir), prefix: "6.7" }),
    prune: true,
    prefix: "6.7",
  });

  assert.deepEqual(store.calls.remove, ["6.7/gone/index.html"]);
  assert.equal(stats.deleted, 1);
  assert.ok(store.objects.has("6.7/index.html"));
  assert.ok(store.objects.has("assets/js/keep.abc.js"));
});

test("without pruning the bucket is neither listed nor emptied", async () => {
  const dir = buildDir({ "index.html": "<html>x</html>" });
  const store = fakeBucket({ "old/index.html": Buffer.from("stays") });

  const stats = await uploadPlan({
    store,
    dir,
    uploads: planUploads({ files: collectFiles(dir) }),
  });

  assert.deepEqual(store.calls.list, []);
  assert.deepEqual(store.calls.remove, []);
  assert.equal(stats.deleted, 0);
  assert.ok(store.objects.has("old/index.html"));
});

// --- the guard on pruning -----------------------------------------------------------------------

/** A build of `count` pages, as a plan and as what the bucket holds. */
function build(count, prefix = "") {
  const files = [
    "index.html",
    ...Array.from({ length: count - 1 }, (_, i) => `p${i}/index.html`),
  ];
  return planUploads({ files, prefix });
}

test("an empty plan is refused before anything is written or removed", async () => {
  // The failure this exists for: a wrong or empty --dir is a plan to delete what is published.
  const dir = buildDir({});
  const store = fakeBucket({
    "6.7/index.html": Buffer.from("build"),
    "6.7/p1/index.html": Buffer.from("page"),
  });

  await assert.rejects(
    uploadPlan({
      store,
      dir,
      uploads: planUploads({ files: collectFiles(dir), prefix: "6.7" }),
      prune: true,
      prefix: "6.7",
    }),
    /refusing to prune: the plan holds no 6\.7\/index\.html/,
  );
  assert.deepEqual(store.calls.put, []);
  assert.deepEqual(store.calls.remove, []);
  assert.ok(store.objects.has("6.7/p1/index.html"));
});

test("a prune that would remove more than the limit is refused, and says how to insist", () => {
  const uploads = build(60);
  const existing = build(100).map(({ key }) => key);
  const stale = planPrune({ existing, uploads });

  assert.equal(stale.length, 40);
  assert.equal(PRUNE_LIMIT, 0.3);
  assert.throws(
    () => checkPrune({ uploads, existing, stale }),
    /40 of 100 keys would be removed \(40%.*--allow-large-prune/,
  );
  assert.doesNotThrow(() =>
    checkPrune({ uploads, existing, stale, allowLargePrune: true }),
  );
});

test("a prune of the root runs into the series published beside it", () => {
  // The root must never be pruned: a series prefix is nothing the root build names, so a prune
  // there would take every series with it. The share limit is what stops that.
  const uploads = build(20);
  const existing = [
    ...build(20).map(({ key }) => key),
    ...build(20, "6.7").map(({ key }) => key),
    ...build(20, "6.8").map(({ key }) => key),
  ];
  const stale = planPrune({ existing, uploads });

  assert.equal(stale.length, 40);
  assert.throws(() => checkPrune({ uploads, existing, stale }), /40 of 60 keys/);
});

test("a publish that changes a few pages of its series is well under the limit", () => {
  const uploads = build(100, "6.8");
  const existing = [
    ...build(100, "6.8").map(({ key }) => key),
    "6.8/renamed/index.html",
  ];
  const stale = planPrune({ existing, uploads, prefix: "6.8" });

  assert.deepEqual(stale, ["6.8/renamed/index.html"]);
  assert.doesNotThrow(() =>
    checkPrune({ uploads, existing, stale, prefix: "6.8" }),
  );
});

test("an anonymous read is retried when the network answers, and not when the bucket does", async () => {
  let calls = 0;
  const flaky = async () => {
    calls += 1;
    if (calls < 3) {
      throw new Error("ECONNRESET");
    }
    return { status: 200 };
  };
  assert.equal((await withRetry(flaky)).status, 200);
  assert.equal(calls, 3);

  calls = 0;
  const denied = async () => {
    calls += 1;
    return { status: 403 };
  };
  assert.equal((await withRetry(denied)).status, 403);
  assert.equal(calls, 1);

  calls = 0;
  const down = async () => {
    calls += 1;
    throw new Error("ECONNRESET");
  };
  await assert.rejects(withRetry(down, 2), /ECONNRESET/);
  assert.equal(calls, 2);
});

test("the public address of an object follows the bucket's addressing style", () => {
  // Spaces addresses a bucket as a host; an S3 behind a custom endpoint (MinIO) as a path - the
  // same choice the SDK makes from `forcePathStyle`.
  assert.equal(
    publicObjectUrl(
      {
        bucket: "hab-docs",
        endpoint: "https://fra1.digitaloceanspaces.com",
        forcePathStyle: false,
      },
      "python/a b/index.html",
    ),
    "https://hab-docs.fra1.digitaloceanspaces.com/python/a%20b/index.html",
  );
  assert.equal(
    publicObjectUrl(
      {
        bucket: "hab-docs",
        endpoint: "http://localhost:9000",
        forcePathStyle: true,
      },
      "index.html",
    ),
    "http://localhost:9000/hab-docs/index.html",
  );
});

test("an object counts as already there only when anyone can read it with the same ETag", async () => {
  // The ingress reads the bucket without credentials, so "the bucket already holds it" has to mean
  // "publicly, with these bytes". An object that answers 403 to an anonymous request was written
  // without the public ACL by some other path, and is written again rather than skipped.
  const requests = [];
  const answer = (status, etag) => async (url, init) => {
    requests.push([url, init?.method]);
    return { status, headers: new Headers(etag ? { etag } : {}) };
  };

  assert.equal(
    await anonymousEtag("https://x/key", answer(200, '"abc"')),
    '"abc"',
  );
  assert.equal(await anonymousEtag("https://x/key", answer(403)), null);
  assert.equal(await anonymousEtag("https://x/key", answer(404)), null);
  await assert.rejects(anonymousEtag("https://x/key", answer(500)), /500/);
  assert.deepEqual(requests[0], ["https://x/key", "HEAD"]);
});
