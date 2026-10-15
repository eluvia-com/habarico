#!/usr/bin/env node
/**
 * Publishes the built Storybook into the bucket storybook.habarico.com is served from.
 *
 * The Storybook is not a Docker image: the build is objects in DigitalOcean Spaces and
 * ingress-nginx proxies to them (HAB-763). It is uploaded twice on a `node@X.Y.0` release - at the
 * root, which is what an unversioned link reaches, and under `<series>/`, which is what a
 * documentation page of that series links at. The preview of `next` goes under `next/`, which
 * only the test host serves.
 *
 * Three things about it are not obvious:
 *
 *   - **A page is one object.** A reader arrives at a URL with or without its trailing slash or
 *     `index.html`; the ingress rewrites the first two onto the third and returns that exact key,
 *     so only `…/index.html` is stored (hab-deploy, static-sites.yml). No per-URL copies.
 *   - **`/assets/` is outside every prefix** - but only where the build addresses it absolutely.
 *     Storybook does not, which is what `--no-asset-pool` is for: its assets stay inside the
 *     prefix they are served from instead of being hoisted into a shared, content-hashed pool.
 *   - **Objects are stored gzipped.** ingress-nginx has `use-gzip` off by default and there is no
 *     application server left to compress anything, so compression moves into the upload:
 *     `Content-Encoding: gzip` on everything that is not already compressed.
 *
 * Two things follow from the bucket being public and read without credentials:
 *
 *   - **A publish can also remove.** With `--prune`, every key under the prefix that the build no
 *     longer holds is deleted. The preview under `next/` takes it, so that the prefix stays one
 *     build; the root of this bucket must never be pruned: the series and the preview live beside
 *     the root build, and a prune of the root would take them with it. `checkPrune` refuses one
 *     that would remove the prefix rather than update it.
 *   - **"Already there" is checked the way the ingress reads.** An object is skipped only when an
 *     anonymous HEAD answers with the same ETag: an object that exists but is not publicly readable
 *     (written by another path, without the ACL) is written again, ACL and all, instead of being
 *     mistaken for published.
 *
 * This is a trimmed copy of the uploader the documentation site publishes with (`hab-docs`,
 * HAB-873): the two buckets are written the same way, and the pages moved out of this repository
 * while the Storybook stayed. Everything about the shape of a bucket is shared and belongs in step
 * - the planning, the guard on pruning, the retries, the content types. What is deliberately not
 * here is what only a documentation publish has: snapshots and the version manifest. The default
 * variable family below differs too.
 *
 * Usage:
 *   upload-bucket.mjs --dir storybook-static --no-asset-pool
 *   upload-bucket.mjs --dir storybook-static --no-asset-pool --prefix 6.8
 *
 * Every form takes `--dry-run`: it plans and reports, writes nothing, and needs no bucket at all.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

/** The pool of content-hashed files, shared by every build. */
export const ASSET_POOL_PREFIX = "assets";

/**
 * The share of the existing keys a prune may remove before it is refused. A publish changes a few
 * pages; a plan that would remove a third of what the prefix holds is an empty or wrong `--dir`,
 * and the bucket is the live site.
 */
export const PRUNE_LIMIT = 0.3;

/** What a content-hashed name buys: the object never changes, so it may be kept for a year. */
const IMMUTABLE = "public, max-age=31536000, immutable";

/** How many objects are in flight at once. Thousands of small PUTs, so the limit is latency. */
const CONCURRENCY = 32;

/** How often the SDK retries a request Spaces answered with a throttle or a 5xx. */
const SDK_MAX_ATTEMPTS = 5;

/** How often an anonymous read is retried when the network, not the bucket, answers. */
const READ_ATTEMPTS = 3;

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
  ".yml": "text/yaml; charset=utf-8",
  ".drawio": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

/** Formats that carry their own compression - gzipping them costs CPU and adds bytes. */
const ALREADY_COMPRESSED = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".mp4",
  ".webm",
  ".woff",
  ".woff2",
  ".gz",
  ".zip",
]);

/** Whether a path is one of the build's content-hashed assets - `assets/` as the build wrote it. */
const isAssetPath = (file) =>
  file === ASSET_POOL_PREFIX || file.startsWith(`${ASSET_POOL_PREFIX}/`);

export function contentTypeFor(key) {
  return (
    CONTENT_TYPES[path.posix.extname(key).toLowerCase()] ??
    "application/octet-stream"
  );
}

export function cacheControlFor(key) {
  // The pool is keyed by content, so an object never changes and may be kept for a year.
  if (isAssetPath(key)) {
    return IMMUTABLE;
  }
  // `no-cache` means "ask first", not "do not keep": the browser revalidates against the ETag and
  // a revisit costs a 304 rather than the page. A deploy still reaches the reader immediately,
  // which `no-store` also did - at the price of downloading everything every time.
  return "public, no-cache";
}

export function shouldCompress(key) {
  return !ALREADY_COMPRESSED.has(path.posix.extname(key).toLowerCase());
}

/**
 * `value` without the slashes around it - a key neither starts nor ends with one.
 *
 * A loop rather than `/^\/+|\/+$/`: that expression is flagged as backtracking-prone by static
 * analysis and the prefix comes from the command line. This is linear and says the same thing.
 */
function withoutSurroundingSlashes(value) {
  let start = 0;
  let end = value.length;
  while (start < end && value[start] === "/") {
    start += 1;
  }
  while (end > start && value[end - 1] === "/") {
    end -= 1;
  }
  return value.slice(start, end);
}

/**
 * What a build publishes: one entry per object, in the order the files were given.
 *
 * `prefix` is the key prefix every page is written under: empty for the site itself, which sits
 * at the root of the bucket, and a prefix of its own for anything published beside it.
 *
 * `assetPool` is what decides whether `assets/**` is hoisted out of the prefix into the shared
 * pool. It has to be off for a build that addresses its own assets **relatively**, as Storybook
 * does: hoisting them would leave `<prefix>/index.html` asking for `<prefix>/assets/…`, which
 * would no longer be there. Being inside the prefix costs a copy per series and changes nothing
 * else - the names are still content hashes, so those objects stay immutable.
 */
export function planUploads({ files, prefix = "", assetPool = true }) {
  const base = withoutSurroundingSlashes(prefix);
  const uploads = [];

  for (const file of files) {
    const isAsset = isAssetPath(file);

    let key;
    if (isAsset && assetPool) {
      key = file;
    } else {
      key = base ? `${base}/${file}` : file;
    }

    uploads.push({
      file,
      key,
      isAsset,
      contentType: contentTypeFor(file),
      // From what the build called the file, not from the key it ends up at: an asset kept inside
      // a prefix is still content-hashed, and still immutable.
      cacheControl: isAsset ? IMMUTABLE : cacheControlFor(key),
      gzip: shouldCompress(file),
    });
  }

  return uploads;
}

/**
 * What a publish removes: the keys the bucket holds under `prefix` that `uploads` does not name.
 *
 * `existing` is what the bucket listed under the prefix; anything outside it is left alone
 * regardless, because a listing of the root would name the other builds kept beside it. The
 * content-hashed pool is never pruned while it is in use (`assetPool`): its objects are shared by
 * builds and cached for a year, so an asset the current build stopped naming may still be asked
 * for by a page a reader has open.
 */
export function planPrune({
  existing,
  uploads,
  prefix = "",
  assetPool = true,
}) {
  const base = withoutSurroundingSlashes(prefix);
  const kept = new Set(uploads.map(({ key }) => key));

  return existing
    .filter((key) => !base || key.startsWith(`${base}/`))
    .filter((key) => !(assetPool && isAssetPath(key)))
    .filter((key) => !kept.has(key))
    .sort();
}

/**
 * Refuses a prune that would remove the build rather than update it: a plan with no `index.html`
 * at the prefix, or one that would remove more than `PRUNE_LIMIT` of the keys there. The share is
 * taken against the larger of what exists and what is planned, so a first publish into a bucket
 * holding another layout's leftovers is not caught on them.
 *
 * It is also what a `--prune` of the root runs into: the series prefixes sit beside the root build
 * and none of them is in the plan, so the share is over the limit and the publish stops. Insisting
 * takes `--allow-large-prune`, which is a decision, not a default.
 */
export function checkPrune({
  uploads,
  existing,
  stale,
  prefix = "",
  assetPool = true,
  allowLargePrune = false,
}) {
  const base = withoutSurroundingSlashes(prefix);
  const index = base ? `${base}/index.html` : "index.html";
  if (!uploads.some(({ key }) => key === index)) {
    throw new Error(
      `[upload-bucket] refusing to prune: the plan holds no ${index} - is --dir a build?`,
    );
  }

  // The same population the prune looks at: what the prefix holds, minus what a prune leaves
  // alone anyway, against what the plan writes there.
  const considered = existing
    .filter((key) => !base || key.startsWith(`${base}/`))
    .filter((key) => !(assetPool && isAssetPath(key))).length;
  const planned = uploads.filter(
    ({ key }) => !(assetPool && isAssetPath(key)),
  ).length;
  const population = Math.max(considered, planned);
  const share = population === 0 ? 0 : stale.length / population;

  if (share > PRUNE_LIMIT && !allowLargePrune) {
    throw new Error(
      `[upload-bucket] refusing to prune: ${stale.length} of ${population} keys would be removed (${Math.round(share * 100)}%, the limit is ${Math.round(PRUNE_LIMIT * 100)}%) - run with --allow-large-prune if the build really was restructured`,
    );
  }
}

/** Every file under `dir`, as POSIX paths relative to it, sorted. */
export function collectFiles(dir) {
  const files = [];

  const walk = (current, relative) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);
      const key = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(next, key);
      } else {
        files.push(key);
      }
    }
  };

  walk(dir, "");
  return files.sort();
}

/**
 * The ETag S3 gives a single-part upload: the MD5 of the stored bytes, in quotes. Comparing it
 * against the body about to be sent is what makes the pool cheap - it is append-only, so almost
 * everything in it is already there.
 */
export function etagOf(body) {
  // MD5 is not a choice: the ETag of a single-part S3 object *is* the MD5 of its body, and this
  // exists to compare against the one the bucket reports. Content addressing, not a security
  // primitive - nothing is authenticated or signed with it.
  // eslint-disable-next-line sonarjs/hashing -- see above
  return `"${createHash("md5").update(body).digest("hex")}"`;
}

async function inParallel(items, limit, worker) {
  const queue = [...items];
  const running = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length > 0) {
        await worker(queue.shift());
      }
    },
  );
  await Promise.all(running);
}

/**
 * The command line, as a plain object. A flag that carries no value (`--dry-run`,
 * `--no-asset-pool`) becomes `true` rather than swallowing whatever follows it - which is what
 * decides whether `--no-asset-pool --prefix 6.7` uploads under a prefix or under "--prefix".
 */
export function readArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }
    const [name, inline] = arg.slice(2).split("=");
    const next = argv[index + 1];
    if (inline !== undefined) {
      args[name] = inline;
    } else if (next === undefined || next.startsWith("--")) {
      args[name] = true;
    } else {
      args[name] = argv[++index];
    }
  }
  return args;
}

/**
 * The family of environment variables a bucket is described by: `<family>` is the bucket name,
 * `<family>_REGION`, `<family>_KEY` and `<family>_SECRET` say where it is and who may write to it,
 * and an optional `<family>_ENDPOINT` points at an S3 other than Spaces.
 *
 * The Storybook bucket is the default here, where the only thing published is the Storybook. This
 * is a constant rather than a remap of another family in the calling job's `variables:`: a
 * variable from the project or group settings takes precedence over one set in a job, so a remap
 * loses the moment that family exists in the project - and the Storybook would go over whatever
 * the other bucket holds. Naming the family does not depend on that order.
 */
export const DEFAULT_BUCKET_ENV = "STORYBOOK_BUCKET";

/**
 * Where the bucket is. DigitalOcean Spaces in every environment; `<family>_ENDPOINT` points it at
 * any other S3, which is how the routing in front of it can be tried out before it exists.
 */
export function bucketEndpoint(env, family = DEFAULT_BUCKET_ENV) {
  const region = env[`${family}_REGION`];
  return (
    env[`${family}_ENDPOINT`] ?? `https://${region}.digitaloceanspaces.com`
  );
}

/**
 * The bucket a family of variables describes, read from `env`.
 *
 * What is missing is reported under the name it was looked for: a job that asked for
 * `STORYBOOK_BUCKET` fails on `STORYBOOK_BUCKET_REGION is not set` and never falls back to the
 * docs bucket that may well be set beside it.
 */
export function bucketConfig(env, family = DEFAULT_BUCKET_ENV) {
  const required = (name) => {
    const value = env[name];
    if (!value) {
      throw new Error(`[upload-bucket] ${name} is not set`);
    }
    return value;
  };
  return {
    bucket: required(family),
    region: required(`${family}_REGION`),
    accessKeyId: required(`${family}_KEY`),
    secretAccessKey: required(`${family}_SECRET`),
    endpoint: bucketEndpoint(env, family),
    // Spaces ignores it, MinIO and friends need it.
    forcePathStyle: Boolean(env[`${family}_ENDPOINT`]),
  };
}

/**
 * The address anyone can read an object at - the one the ingress uses. Spaces addresses a bucket
 * as a host; an S3 behind a custom endpoint (MinIO) as a path, which is the same choice the SDK
 * makes from `forcePathStyle`.
 */
export function publicObjectUrl({ bucket, endpoint, forcePathStyle }, key) {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  if (forcePathStyle) {
    return `${endpoint}/${bucket}/${encodedKey}`;
  }
  const url = new URL(endpoint);
  url.hostname = `${bucket}.${url.hostname}`;
  return `${url.origin}/${encodedKey}`;
}

/**
 * Runs an anonymous read again when the network answers instead of the bucket - a reset connection,
 * a 5xx from the edge. A 4xx is the bucket's answer and is taken at face value.
 */
export async function withRetry(read, attempts = READ_ATTEMPTS) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await read();
      if (response.status < 500 || attempt === attempts) {
        return response;
      }
      lastError = new Error(`answered ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
  }
  throw lastError;
}

/**
 * The ETag an object answers an anonymous HEAD with, or `null` when there is nothing there for the
 * public to read - which for a bucket with listing disabled is a 403, and for the rest a 404. An
 * object that exists but is private is therefore written again, with its ACL, rather than skipped.
 * Anything else is an error of the bucket, not a state of the object.
 */
export async function anonymousEtag(url, fetchImpl = fetch) {
  const response = await withRetry(() => fetchImpl(url, { method: "HEAD" }));
  if (response.status === 403 || response.status === 404) {
    return null;
  }
  if (response.status !== 200) {
    throw new Error(`[upload-bucket] HEAD ${url} answered ${response.status}`);
  }
  return response.headers.get("etag") ?? null;
}

/** The client is built here so that the pure half of this file needs no AWS SDK to be tested. */
async function bucketClient(family) {
  const { S3Client } = await import("@aws-sdk/client-s3");
  const config = bucketConfig(process.env, family);
  return {
    bucket: config.bucket,
    config,
    client: new S3Client({
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      region: config.region,
      // Thousands of small requests against Spaces: a throttle or a 5xx on one of them is a
      // retry, not a failed publish.
      maxAttempts: SDK_MAX_ATTEMPTS,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
  };
}

/** The bucket, behind the four calls `uploadPlan` makes. */
async function spacesStore(family) {
  const bucket = await bucketClient(family);
  return {
    // Unsigned on purpose: the ingress reads without credentials, so that is the read that decides
    // whether an object is already published - see anonymousEtag.
    head: (key) => anonymousEtag(publicObjectUrl(bucket.config, key)),
    put: (upload, body) => putObject(bucket, upload, body),
    list: (prefix) => listKeys(bucket, prefix),
    remove: (keys) => deleteObjects(bucket, keys),
  };
}

/** Reports every object as new, lists nothing and writes nothing - `--dry-run`. */
function dryRunStore() {
  return {
    head: async () => null,
    put: async () => {},
    list: async () => [],
    remove: async () => {},
  };
}

/** Every key under `prefix` (all of them for an empty prefix), page by page. */
async function listKeys({ client, bucket }, prefix) {
  const { paginateListObjectsV2 } = await import("@aws-sdk/client-s3");
  const keys = [];
  const pages = paginateListObjectsV2(
    { client },
    { Bucket: bucket, ...(prefix && { Prefix: `${prefix}/` }) },
  );
  for await (const page of pages) {
    for (const object of page.Contents ?? []) {
      keys.push(object.Key);
    }
  }
  return keys;
}

/**
 * One DeleteObject per key rather than a DeleteObjects batch: a batch has to carry a body
 * checksum, and which checksum algorithms Spaces accepts has changed under the SDK before. A
 * prune removes a handful of keys, so the per-request cost is nothing.
 */
async function deleteObjects({ client, bucket }, keys) {
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  await inParallel(keys, CONCURRENCY, async (key) => {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  });
}

async function putObject({ client, bucket }, upload, body) {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: upload.key,
      Body: body,
      ContentType: upload.contentType,
      CacheControl: upload.cacheControl,
      ...(upload.gzip && { ContentEncoding: "gzip" }),
      // The ingress cannot sign a request, so the objects have to be readable without one.
      ACL: "public-read",
    }),
  );
}

/**
 * Uploads a plan, skipping what the bucket already holds byte for byte - and, with `prune`, removes
 * what it holds beyond the plan (`planPrune`). The removal comes last so that an upload that fails
 * half-way leaves the previous build whole; what the prune *would* remove is worked out and checked
 * first, so a plan that would empty the prefix is refused before a single object is written.
 *
 * `store` is the bucket behind four calls - `head`, `put`, `list` and `remove`. Naming it that way
 * is what lets this run against a bucket in memory in the tests, and against Spaces in CI, without
 * the logic knowing which.
 */
export async function uploadPlan({
  store,
  dir,
  uploads,
  prune = false,
  prefix = "",
  assetPool = true,
  allowLargePrune = false,
}) {
  const stats = { uploaded: 0, skipped: 0, deleted: 0, bytes: 0 };

  let stale = [];
  if (prune) {
    const existing = await store.list(withoutSurroundingSlashes(prefix));
    stale = planPrune({ existing, uploads, prefix, assetPool });
    checkPrune({ uploads, existing, stale, prefix, assetPool, allowLargePrune });
  }

  await inParallel(uploads, CONCURRENCY, async (upload) => {
    const raw = fs.readFileSync(path.join(dir, upload.file));
    const body = upload.gzip ? gzipSync(raw, { level: 9 }) : raw;

    if ((await store.head(upload.key)) === etagOf(body)) {
      stats.skipped += 1;
    } else {
      await store.put(upload, body);
      stats.uploaded += 1;
      stats.bytes += body.length;
    }
  });

  if (stale.length > 0) {
    await store.remove(stale);
  }
  stats.deleted = stale.length;

  return stats;
}

const USAGE =
  "usage: upload-bucket.mjs --dir <build> [--prefix <key prefix>] [--no-asset-pool] [--prune] [--allow-large-prune] [--bucket-env <family>] [--dry-run]";

async function main() {
  const args = readArgs(process.argv.slice(2));
  const dryRun = "dry-run" in args;

  const family = args["bucket-env"] ?? DEFAULT_BUCKET_ENV;
  if (typeof family !== "string" || family === "") {
    console.error(
      `${USAGE}\n--bucket-env needs the name of a variable family, e.g. STORYBOOK_BUCKET`,
    );
    process.exit(2);
  }

  if (!args.dir) {
    console.error(USAGE);
    process.exit(2);
  }

  const prefix = args.prefix ?? "";
  const assetPool = !("no-asset-pool" in args);
  const uploads = planUploads({
    files: collectFiles(args.dir),
    prefix,
    assetPool,
  });

  const store = dryRun ? dryRunStore() : await spacesStore(family);
  const stats = await uploadPlan({
    store,
    dir: args.dir,
    uploads,
    prune: "prune" in args,
    allowLargePrune: "allow-large-prune" in args,
    prefix,
    assetPool,
  });

  console.log(
    `[upload-bucket] ${args.prefix ?? "(root)"}: ${stats.uploaded} uploaded, ${stats.skipped} unchanged, ${stats.deleted} removed, ${Math.round(stats.bytes / 1024)} kB sent`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
