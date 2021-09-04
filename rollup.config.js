import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";
import typescript from 'rollup-plugin-typescript'
import pkg from './package.json'

export default {
  input: ["./src/sdk.ts"],
  output: {
    file: "./dist/sdk.min.js",
    format: "umd",
    name: "experience",
  },
  plugins: [resolve(), commonjs(), typescript(), babel(), json()],
  external: [],
};
