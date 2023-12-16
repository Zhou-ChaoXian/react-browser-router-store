"use strict";

import {readFileSync} from "node:fs";
import {defineConfig} from "rollup";
import tenser from "@rollup/plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

export default () => {
  return defineConfig({
    input: {
      index: "./src/index.js"
    },
    output: [
      {
        dir: "./dist/cjs",
        format: "cjs",
        exports: "auto",
      },
      {
        dir: "./dist/cjs",
        format: "cjs",
        exports: "auto",
        entryFileNames: "[name].production.js",
        plugins: [tenser()],
      },
      {
        dir: "./dist/es",
        format: "es",
        entryFileNames: "[name].mjs",
        exports: "auto",
      },
      {
        dir: "./dist/es",
        format: "es",
        entryFileNames: "[name].production.mjs",
        exports: "auto",
        plugins: [tenser()],
      }
    ],
    external: [
      /node_modules/y,
      ...Object.keys(pkg["peerDependencies"])
    ],
    plugins: [commonjs(), nodeResolve()],
  });
}