import resolve from '@rollup/plugin-node-resolve'
// import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'
import typescript from 'rollup-plugin-typescript'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import builtins from 'rollup-plugin-node-builtins'

export default {
  input: ['./src/sdk.ts'],
  output: {
    file: './dist/sdk.min.js',
    format: 'umd',
    name: 'SDK'
  },
  external: ['uuid', 'dotwallet-jssdk', 'axios', 'qs'],
  plugins: [
    resolve(),
    typescript(),
    babel(),
    json(),
    nodePolyfills(),
    builtins()
  ]
}
