import { ErrorCategory, ErrorType, ErrorLevel } from '../emums'

export interface ExplorerOption {
  error: {
    [ErrorType]: boolean
  }
  isAutoReport: boolean
  filters: string[] // 过滤器，命中的不上报
  levels: ErrorLevel[]
  category: ErrorCategory[]
  record: boolean //是否录制
  [key: string]: any
}

export interface ErrorReportContent {
  pageTitle: string // 页面标题
  pageUrl: string // 页面URL
  timeStamp: number // 访问时间戳
  errorType: ErrorType // 大类
  errorLevel: ErrorLevel // 小类
  filename: string // 访问的文件名
  stack: string // 堆栈信息
  jsError?: {
    message: string
    column: number
    line: number
    selector: string
    useTime: number
    stack: string
  }
  promiseError?: {
    message: string
    column: number
    line: number
    selector: string
    useTime: number
    stack: string
  }
  resourceError?: {
    selector: string
    tagName: string
    useTime: number
  }
  httpError?: {
    eventType: string
    response: string
    responseURL: string
    status: string
    statusText: string
    useTime: number
    body: string
    headers: string
    method: string
    curl: string
  }
}
