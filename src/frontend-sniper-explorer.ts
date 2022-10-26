import { record, Replayer } from 'rrweb'
import { eventWithTime } from 'rrweb/typings/types'
import { ErrorCategory, ErrorLevel, ErrorType } from './emums'
import {
  ErrorReportContent,
  ExplorerOption
} from './types/frontend-sniper-explorer'

export class Explorer {
  baseUrl = ''
  config: ExplorerOption = {
    error: {
      [ErrorType.JsError]: true,
      [ErrorType.ResourceError]: true,
      [ErrorType.HttpError]: true,
      [ErrorType.ConsoleError]: true,
      [ErrorType.PromiseError]: true,
      [ErrorType.VueError]: true
    },
    isAutoReport: true,
    filters: [], // 过滤器，命中的不上报
    levels: [ErrorLevel.Info, ErrorLevel.Warning, ErrorLevel.Error],
    category: [ErrorCategory.Js, ErrorCategory.Resource, ErrorCategory.Ajax],
    record: true //是否录制
  }

  //录制事件
  recordEvent: eventWithTime[] = []
  //录制时间备份
  eventBackUp: eventWithTime[] = []
  lastEvent: Event | null = null

  constructor(baseUrl: string, option?: ExplorerOption) {
    if (!baseUrl) throw new Error('baseUrl不能为空')
    if (option) {
      for (let i in option) {
        this.config[i] = option[i]
      }
    }

    //  开始录制
    if (this.config.record) {
      this.startRecord()
    }

    // 开始监听各种事件错误
    for (let i in this.config.error) {
      // @ts-ignore
      if (this.config.error[i]) {
        const functionName = 'handle' + i.slice(0, 1).toUpperCase() + i.slice(1)
        // @ts-ignore
        this[functionName]()
      }
    }

    // 开始监听各种操作事件
    ;['click', 'touchstart', 'mousedown', 'keydown', 'mouseover'].forEach(
      (eventType) => {
        document.addEventListener(
          eventType,
          (event) => {
            this.lastEvent = event
          },
          {
            capture: true, // 是在捕获阶段还是冒泡阶段执行
            passive: true // 默认不阻止默认事件
          }
        )
      }
    )
  }

  get currentLastEvent() {
    return this.lastEvent ? { ...this.lastEvent } : null
  }

  isFunction(what: any) {
    return typeof what === 'function'
  }

  startRecord() {
    record({
      emit: (event) => {
        // 如果事件大于30时，先备份再清空，以防出现错误时，事件过少无法还原错误发生过程，此时可从备份取回部分录制事件
        if (this.recordEvent.length >= 100) {
          this.eventBackUp = JSON.parse(JSON.stringify(this.recordEvent))
          this.recordEvent = []
        } else {
          this.recordEvent.push(event)
        }
        // 用任意方式存储 event
      }
    })
  }

  /*监听windows错误*/
  handleWindowError() {
    window.addEventListener(
      'error',
      (event) => {
        let lastEvent = this.currentLastEvent
        const target = event.target || event.srcElement
        if (
          target instanceof HTMLScriptElement ||
          target instanceof HTMLLinkElement ||
          target instanceof HTMLImageElement
        ) {
          //资源加载错误
          // @ts-ignore
          if (this.config.error[ErrorType.ResourceError]) {
            this.sendError({
              pageTitle: window.document.title, //resource
              pageUrl: window.location.href, //resource
              errorType: ErrorType.ResourceError,
              errorLevel: ErrorLevel.Error,
              filename:
                target instanceof HTMLLinkElement ? target.href : target.src, //加载失败的资源
              timeStamp: new Date().getTime(), //时间
              stack: target.outerHTML,
              resourceError: {
                tagName: target.tagName, //标签名
                // @ts-ignore
                selector: this.getSelector(target.path || target), //选择器
                // @ts-ignore
                useTime: parseInt(target.timeStamp || 0)
              }
            })
          }
        } else {
          // @ts-ignore
          if (this.config.error[ErrorType.JsError]) {
            this.sendError({
              pageTitle: window.document.title, //resource
              pageUrl: window.location.href, //resource
              errorLevel: ErrorLevel.Error, //error
              errorType: ErrorType.JsError, //jsError
              filename: event.filename, //报错链接
              stack: this.getLines(event.error.stack), //错误堆栈
              timeStamp: new Date().getTime(),
              jsError: {
                message: event.message, //报错信息
                column: event.colno || 0,
                line: event.lineno || 0,
                selector: lastEvent
                  ? // @ts-ignore
                    this.getSelector(lastEvent.path || lastEvent.target)
                  : '', //CSS选择器
                useTime: parseInt(event.timeStamp.toString()),
                stack: JSON.stringify(event.error.stack)
              }
            })
          }
        }
      },
      true
    )
  }

  /*监听Promise Reject错误*/
  handlePromiseError() {
    window.addEventListener(
      'unhandledrejection',
      (event) => {
        if (event) {
          let lastEvent = this.currentLastEvent
          let message = ''
          let line = 0
          let column = 0
          let file = ''
          let stack = ''
          if (typeof event.reason === 'string') {
            message = event.reason
          } else if (typeof event.reason === 'object') {
            message = event.reason.message
          }
          let reason = event.reason
          if (typeof reason === 'object') {
            if (reason.stack) {
              var matchResult = reason.stack.match(/at\s+(.+):(\d+):(\d+)/)
              if (matchResult) {
                file = matchResult[1]
                line = matchResult[2]
                column = matchResult[3]
              }
              stack = this.getLines(reason.stack)
            }
          }
          this.sendError({
            pageTitle: window.document.title, //resource
            pageUrl: window.location.href, //resource
            errorLevel: ErrorLevel.Error, //jsError
            errorType: ErrorType.PromiseError, //unhandledrejection
            timeStamp: new Date().getTime(),
            filename: file,
            stack,
            promiseError: {
              message,
              line,
              column,
              useTime: parseInt(event.timeStamp.toString()),
              stack: JSON.stringify(reason.stack),
              selector: lastEvent
                ? // @ts-ignore
                  this.getSelector(lastEvent.path || lastEvent.target)
                : ''
            }
          })
        }
      },
      true
    )
  }

  /*监听 Js 错误*/
  handleJsError() {
    // @ts-ignore
    if (!this.config.error[ErrorType.ResourceError]) {
      this.handleWindowError()
    }
  }

  /*监听资源错误*/
  handleResourceError() {
    // @ts-ignore
    if (!this.config.error[ErrorType.JsError]) {
      this.handleWindowError()
    }
  }

  /*监听fetch请求错误*/
  _handleFetchError() {
    if (!window.fetch) return
    let _oldFetch = window.fetch
    const self = this
    window.fetch = function () {
      return (
        _oldFetch
          // @ts-ignore
          .apply(this, arguments)
          .then((res) => {
            if (!res.ok) {
              // True if status is HTTP 2xx
              if (res.url === self.baseUrl) {
                throw new Error(
                  '提交错误报错，请检查后台frontend-sniper-server是否运行正常'
                )
              } else {
                self.sendError({
                  // @ts-ignore
                  title: arguments[0],
                  category: 'fetch',
                  level: 'error'
                })
              }
            }
            return res
          })
          .catch((error) => {
            self.sendError({
              // @ts-ignore
              title: arguments[0],
              category: 'fetch',
              level: 'error'
            })
            throw error
          })
      )
    }
  }

  /*监听ajax请求错误*/
  handleHttpError() {
    console.log('handleHttpError')
    // 本地文件请求不上报
    // var protocol = window.location.protocol
    // if (protocol === 'file:') return

    // 处理fetch
    this._handleFetchError()

    // 处理XMLHttpRequest
    if (!window.XMLHttpRequest) {
      return
    }
    let xmlhttp = window.XMLHttpRequest

    let _oldSend = xmlhttp.prototype.send

    // 存储请求方法
    var originalXMLHttpRequest_open = XMLHttpRequest.prototype.open
    // @ts-ignore
    xmlhttp.prototype.method = ''
    xmlhttp.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null | undefined,
      password?: string | null | undefined
    ) {
      // @ts-ignore
      xmlhttp.prototype.method = method.toUpperCase()
      originalXMLHttpRequest_open.call(
        this,
        method,
        url,
        async,
        username,
        password
      )
    }

    // 存储自定义header
    var originalXMLHttpRequest_setRequestHeader =
      XMLHttpRequest.prototype.setRequestHeader
    // @ts-ignore
    xmlhttp.prototype.headers = []
    xmlhttp.prototype.setRequestHeader = function (header, value) {
      // @ts-ignore
      xmlhttp.prototype.headers.push({
        [header]: value
      })
      originalXMLHttpRequest_setRequestHeader.call(this, header, value)
    }

    let _handleEvent = (body: string) => {
      return (event: any) => {
        console.log(event)
        debugger
        if (
          event &&
          event.currentTarget &&
          event.currentTarget.status !== 200
        ) {
          if (event.target.responseURL === this.baseUrl) {
            throw new Error(
              '提交错误报错，请检查后台frontend-sniper-server是否运行正常'
            )
          } else {
            let curl =
              'curl  ' +
              event.target.responseURL +
              ` -X ${event.target.__proto__.method} -H "Connection:keep-alive"` +
              ' -H "Accept:*/*"'
            for (let item of event.target.__proto__.headers) {
              for (let i in item) {
                curl += ` -H "${i}:${item[i]}"`
              }
            }
            if (body) {
              curl += ` -D \'${body}\'`
            }
            console.log(curl)
            this.sendError({
              pageTitle: window.document.title, //resource
              pageUrl: window.location.href, //resource
              errorType: ErrorType.HttpError,
              errorLevel: ErrorLevel.Error,
              filename: event.target.responseURL,
              stack: this.getLines(curl),
              timeStamp: new Date().getTime(),
              httpError: {
                eventType: event.type,
                response: event.target.responseText,
                responseURL: event.target.responseURL,
                status: event.target.status,
                statusText: event.target.statusText,
                useTime: parseInt(event.timeStamp.toString()),
                body,
                headers: JSON.stringify(event.target.__proto__.headers),
                method: event.target.__proto__.method,
                curl
              }
            })
          }
        }
      }
    }

    xmlhttp.prototype.send = function (body: string) {
      if (this['addEventListener']) {
        this['addEventListener']('error', _handleEvent(body))
        this['addEventListener']('load', _handleEvent(body))
        this['addEventListener']('abort', _handleEvent(body))
      } else {
        var _oldStateChange = this['onreadystatechange']
        this['onreadystatechange'] = function (event) {
          if (this.readyState === 4) {
            _handleEvent(body)(event)
          }
          // @ts-ignore
          _oldStateChange && _oldStateChange.apply(this, arguments)
        }
      }
      // @ts-ignore
      return _oldSend.apply(this, arguments)
    }
  }

  /*监听Console 错误*/
  handleConsoleError() {
    // if (!_window.console || !_window.console.error) return
    // let _oldConsoleError = _window.console.error
    // _window.console.error = function () {
    //   config.sendError({
    //     title: 'consoleError',
    //     msg: JSON.stringify(arguments.join(',')),
    //     category: 'js',
    //     level: 'error'
    //   })
    //   _oldConsoleError && _oldConsoleError.apply(_window, arguments)
    // }
  }

  handleVueError() {
    var vue = (window as any).Vue
    if (!vue || !vue.config) return // 没有找到vue实例
    var _oldVueError = vue.config.errorHandler

    // Vue.config.errorHandler = function VueErrorHandler(error, vm, info) {
    //   var metaData = {}
    //   if (Object.prototype.toString.call(vm) === '[object Object]') {
    //     metaData.componentName = vm._isVue
    //       ? vm.$options.name || vm.$options._componentTag
    //       : vm.name
    //     metaData.propsData = vm.$options.propsData
    //   }
    //   config.sendError({
    //     title: 'vue Error',
    //     msg: metaData + info,
    //     category: 'js',
    //     level: 'error'
    //   })

    //   if (_oldVueError && isFunction(_oldVueError)) {
    //     _oldOnError.call(this, error, vm, info)
    //   }
    // }
  }

  sendError(params: ErrorReportContent) {}

  getSelectors(path: any[]) {
    // 反转 + 过滤 + 映射 + 拼接
    return path
      .reverse()
      .filter((element) => {
        return element !== document && element !== window
      })
      .map((element) => {
        console.log('element', element.nodeName)
        let selector = ''
        if (element.id) {
          return `${element.nodeName.toLowerCase()}#${element.id}`
        } else if (element.className && typeof element.className === 'string') {
          return `${element.nodeName.toLowerCase()}.${element.className}`
        } else {
          selector = element.nodeName.toLowerCase()
        }
        return selector
      })
      .join(' ')
  }

  getSelector(pathsOrTarget: any) {
    if (Array.isArray(pathsOrTarget)) {
      return this.getSelectors(pathsOrTarget)
    } else {
      let path = []
      while (pathsOrTarget) {
        path.push(pathsOrTarget)
        pathsOrTarget = pathsOrTarget.parentNode
      }
      return this.getSelectors(path)
    }
  }

  getLines(stack: any) {
    return stack
      .split('\n')
      .slice(1)
      .map((item: any) => item.replace(/^\s+at\s+/g, ''))
      .join('^')
  }
}
