declare global {
  interface Window {
    appMetaIdJs?: any
    appMetaIdJsV2?: any
  }
}

declare module '*.json' {
  const value: any
  export default value
}
