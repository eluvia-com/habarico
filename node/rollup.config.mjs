import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import dts from "rollup-plugin-dts";
import json from "@rollup/plugin-json";
import svgr from '@svgr/rollup';
// This is required to read package.json file when
// using Native ES modules in Node.js
// https://rollupjs.org/command-line-interface/#importing-package-json
import { createRequire } from "node:module";

const requireFile = createRequire(import.meta.url);
const packageJson = requireFile("./package.json");
const tsconfig = requireFile("./tsconfig.json");
import tsconfigPaths from "rollup-plugin-tsconfig-paths";
import esbuild from "rollup-plugin-esbuild";

const dtsPaths = Object.fromEntries(
  Object.entries(tsconfig.compilerOptions.paths).map(([key, values]) => [
    key,
    values.map((v) => v.replace(/^src\//, "lib/dts/")),
  ])
);

// react-grid-layout pulls in react-draggable, whose log() references
// `process.env.DRAGGABLE_DEBUG`. We bundle that dependency, so the reference
// ends up in our output. In a browser (e.g. a Vite dev server) `process` is
// undefined, which throws `ReferenceError: process is not defined` on drag/
// resize start. Consumers' bundlers replace `process.env.NODE_ENV` but not
// this vendor-specific flag, so we neutralize it here. The replacement is
// length-preserving to keep source maps valid.
const stripDraggableDebug = () => ({
  name: "strip-draggable-debug",
  transform(code, id) {
    if (!id.includes("react-draggable")) return null;
    if (!code.includes("process.env.DRAGGABLE_DEBUG")) return null;
    const replaced = code.replace(/process\.env\.DRAGGABLE_DEBUG/g, (match) =>
      "(false)".padEnd(match.length)
    );
    return {code: replaced, map: null};
  },
});

const external = (id) =>
  /^react($|\/)/.test(id) ||
  /^react-dom($|\/)/.test(id) ||
  /^@mui\//.test(id) ||
  /^@emotion\//.test(id);


const jsConfig = {
  input: "src/index.ts",
  watch: {
    buildDelay: 300,
  },
  output: [
    {
      file: packageJson.main,
      format: "cjs",
      exports: "named",
      sourcemap: true
    },
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: true
    }
  ],
  plugins: [
    svgr({
      svgo: false,
    }),
    peerDepsExternal(),
    tsconfigPaths({ tsconfig: "./tsconfig.json" }),
    resolve({
      browser: true,
      extensions: [".mjs", ".js", ".json", ".ts", ".tsx"],
      dedupe: ["react", "react-dom", "@emotion/react", "@emotion/styled"]
    }),
    commonjs(),
    stripDraggableDebug(),
    esbuild({ tsconfig: "tsconfig.json", target: "es2020", sourceMap: true }),
    postcss({
      extensions: [".css"]
    }),
    json()
  ],
  onwarn: function(warning, warn) {
    if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
      return;
    }
    if (warning.code === "THIS_IS_UNDEFINED" && warning.id?.includes("node_modules")) {
      return;
    }
    warn(warning);
  },
  external,
}

const dtsConfig = {
  input: "lib/dts/index.d.ts",
  output: [
    {
      file: packageJson.types,
      format: "es"
    }
  ],
  plugins: [dts({ tsconfig: "./tsconfig.json", compilerOptions: { paths: dtsPaths } })],
  external: [/\.css$/]
};

export default [
  jsConfig,
  dtsConfig,
];
