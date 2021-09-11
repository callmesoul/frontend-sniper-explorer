import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import typescript from 'rollup-plugin-typescript'
import builtins from 'rollup-plugin-node-builtins'

export default {
  input: ['./src/sdk.ts'],
  output: {
    file: './dist/sdk.min.js',
    format: 'umd',
    name: 'SDK'
  },
  external: [],
  plugins: [json(), typescript(), commonjs(), builtins(), resolve()]
}
