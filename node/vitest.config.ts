import {storybookTest} from '@storybook/addon-vitest/vitest-plugin';
import {playwright} from '@vitest/browser-playwright';
import {resolve} from 'path';
import {defineConfig} from 'vitest/config';

const isCI = !!process.env.CI;

export default defineConfig({
  // Shared by both projects below via `extends: true`.
  resolve: {
    alias: {
      '@admin': resolve(__dirname, 'src/admin'),
      '@schema': resolve(__dirname, 'src/schema'),
      '@typing': resolve(__dirname, 'src/types'),
      '@design': resolve(__dirname, 'src/design'),
      '@foundation': resolve(__dirname, 'src/foundation'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          // The library's own tests, and nothing else: `scripts/` holds plain Node tooling
          // (scripts/upload-bucket.mjs) tested with `node --test`, which vitest would collect
          // and then report as a file with no suite in it. `npm test` runs both runners.
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          globals: true,
          setupFiles: ['./src/test-setup.ts'],
          // In CI the runner is CPU-constrained (cgroup-limited cores) and the job gets
          // 2Gi, while the pool sizes itself from the *node's* core count - one worker
          // (jsdom + MUI) costs several hundred MB, so an uncapped pool would run the job
          // out of memory on any sizeable runner. Cap it and raise the timeouts to absorb
          // slow jsdom/MUI renders. Locally we keep the defaults for full speed.
          // `maxWorkers` has to be top-level: Vitest 4 removed `poolOptions` and only warns
          // about it, so the cap it used to hold silently stopped applying.
          ...(isCI && {
            pool: 'forks',
            maxWorkers: 2,
            testTimeout: 20000,
            hookTimeout: 20000,
          }),
          server: {
            deps: {
              // @mui/x-charts pulls in pure-ESM d3-* packages that vitest cannot load
              // from node_modules as-is — inline them so vitest transforms them first
              inline: [/@mui\/x-charts/, /^d3-/],
            },
          },
        },
      },
      {
        extends: true,
        plugins: [
          // Turns every story matched by the "stories" globs in .storybook/main.ts into
          // a test case: the story is rendered with the decorators from
          // .storybook/preview.ts applied, and its play function (if any) is run.
          // https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
          storybookTest({configDir: resolve(__dirname, '.storybook')}),
        ],
        // Guard against a mid-run dependency re-optimization: if Vite discovers a React
        // entry point late (the page-level stories under src/*/pages/** are the ones that
        // pull in whole screens), it re-optimizes and reloads the browser, leaving a second
        // copy of React behind — after which every hook call throws ("Invalid hook call" /
        // "Cannot read properties of null (reading 'useMemo')"). The stories still pass but
        // the unhandled errors fail the run. Pre-bundling these up front is what vitest
        // itself suggests when it detects the reload. Only ever bites on a cold cache, i.e.
        // in CI; it is cheap enough to keep as a permanent guard.
        optimizeDeps: {
          include: [
            'react',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'react-dom',
            'react-dom/client',
          ],
        },
        test: {
          name: 'storybook',
          // Reuse one browser page across story files instead of tearing down and
          // rebuilding the environment for each of the ~150 of them. That per-file setup
          // was costing ~1.3s locally and ~4s on a CI runner - 186s vs 8s of `setup` time
          // over the whole suite, and the difference between a 2-minute job and one that
          // ran out of wall clock. The trade is that stories are no longer isolated from
          // each other: anything a story leaves behind on `document` (portals, listeners,
          // router state) is still there for the next one. Acceptable while these are
          // render-only smoke tests; revisit if stories start growing `play` functions
          // that depend on a clean DOM.
          isolate: false,
          // Runs after the unit project (which keeps the default group 0) rather than
          // alongside it. Required: vitest refuses to start two projects that share a
          // groupOrder but disagree on `maxWorkers`, which they do under CI below. It is
          // also what we want anyway - jsdom workers and Chromium instances competing for
          // the same box is how `npm run test:all` ends up starved for memory.
          sequence: {groupOrder: 1},
          // Same reasoning as the unit project's cap, except each worker here is a whole
          // Chromium instance, so the memory ceiling binds far sooner. The timeouts go up
          // for the same reason they do there: the heaviest page stories render in ~2s
          // locally but have been measured at 25s on a loaded runner, past the 15s default.
          ...(isCI && {maxWorkers: 2, testTimeout: 40000, hookTimeout: 40000}),
          browser: {
            enabled: true,
            headless: true,
            // @storybook/addon-vitest turns this off by default. Keep it on: on a
            // red run the screenshot of the story that failed is what makes the
            // failure readable in CI (uploaded as a job artifact).
            screenshotFailures: true,
            provider: playwright({
              // CI containers get a 64MB /dev/shm, which is not enough for Chromium's
              // renderer — it dies mid-run. Point it at /tmp instead. Locally the
              // default is fine, so this stays off.
              ...(isCI && {launchOptions: {args: ['--disable-dev-shm-usage']}}),
            }),
            instances: [{browser: 'chromium'}],
          },
        },
      },
    ],
  },
});
