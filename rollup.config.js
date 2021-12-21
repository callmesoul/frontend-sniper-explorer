import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import typescript from 'rollup-plugin-typescript2'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'

export default {
  input: ['./src/sdk.ts'],
  output: {
    file: './dist/sdk.min.js',
    format: 'esm',
    name: 'SDK'
  },
  external: [],
  plugins: [
    json(),
    typescript(),
    commonjs(),
    builtins(),
    resolve({
      jsnext: true,
      main: true,
      brower: true
    }),
    globals()
  ]
}
