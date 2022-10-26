export enum ErrorType {
  JsError = 'jsError',
  ResourceError = 'resourceError',
  HttpError = 'httpError',
  ConsoleError = 'consoleError',
  VueError = 'vueError',
  PromiseError = 'promiseError'
}

export enum ErrorCategory {
  Js = 'js',
  Resource = 'resource',
  Ajax = 'ajax'
}

export enum ErrorLevel {
  Info = 'info',
  Warning = 'warning',
  Error = 'error'
}
