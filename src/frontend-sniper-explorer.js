import { record, Replayer } from 'rrweb'
class explorer{
    constructor() {
        this.config = {
            jsError: true,
            resourceError: true,
            ajaxError: true,
            consoleError: false, // console.error默认不处理
            scriptError: false, // 跨域js错误，默认不处理，因为没有任何信息
            vue: true,
            autoReport: true,
            filters: [], // 过滤器，命中的不上报
            levels: ['info', 'warning', 'error'],
            category: ['js', 'resource', 'ajax'],
            record:false,//是否录制
            submitUrl:''
        };
        this._window = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
        this.addEventListener = this._window.addEventListener || this._window.attachEvent;
        this._window.recordEvent=[];//录制事件
        this._window.eventBackUp=[];//录制时间备份
    }

    isFunction(what) {return typeof what === 'function';}

    /*开始监控*/
    start(options){
        if(options){
            for (let i in options) {
                this.config[i] = options[i];
            }
        }
        if (!this.config.scriptError) {
            this.config.filters.push(function () {return /^Script error\.?$/.test(arguments[0]);})
        }

        // 开始录制
        console.log('===========');
        console.log(this.config.record);
        console.log(options);
        if(this.config.record){
            debugger;
            this.startRecord();
        }

        // 处理过滤器

        if (this.config.jsError) {
            this.handleWindowError(this._window, this.config);
        }
        if (this.config.jsError) {
            // https://developer.mozilla.org/zh-CN/docs/Web/Events/unhandledrejection
            this.handleRejectPromise(this._window, this.config);
        }
        if (this.config.resourceError && addEventListener) {
            this.handleResourceError(this._window, this.config);
        }
        if (this.config.ajaxError) {
            this.handleAjaxError(this._window, this.config);
        }
        if (this.config.consoleError) {
            this.handleConsoleError(this._window, this.config);
        }
        if (this.config.vue) {
            this.handleVueError(this._window, this.config);
        }
    }


    startRecord(){
        record({
            emit:(event) =>{
                /*
                如果事件大于30时，先备份再清空，以防出现错误时，事件过少无法还原错误发生过程，此时可从备份取回部分录制事件
                */
                if(this._window.recordEvent.length>=100){
                    this._window.eventBackUp=JSON.parse(JSON.stringify(this._window.recordEvent));
                    this._window.recordEvent=[];
                }else{
                    this._window.recordEvent.push(event);
                }
                // 用任意方式存储 event
            },
        });
    }

    /*监听windows错误*/
    handleWindowError(_window, config) {
        let _oldWindowError = _window.onerror;
        _window.onerror = function (msg, url, line, col, error) {
            if (error && error.stack) {
                config.sendError({
                    title: msg,
                    msg: error.stack,
                    category: 'js',
                    level: 'error',
                    line: line,
                    col:col,
                });
            } else if (typeof msg === 'string') {
                config.sendError({
                    title: msg,
                    msg: JSON.stringify({
                        resourceUrl: url,
                        line: line,
                        col:col
                    }),
                    category: 'js',
                    level: 'error'
                });
            }
            if (_oldWindowError && isFunction(_oldWindowError)) {
                windowError && windowError.apply(window, arguments);
            }
        }

    }

    /*监听Promise Reject错误*/
    handleRejectPromise(_window, config) {
        _window.addEventListener('unhandledrejection', function (event) {
            if (event) {
                let reason = event.reason;
                config.sendError({
                    title: 'unhandledrejection',
                    msg: reason,
                    category: 'js',
                    level: 'error',
                });
            }
        }, true);
    };

    /*监听资源错误*/
    handleResourceError(_window, config) {
        _window.addEventListener('error', function (event) {
            if (event) {
                let target = event.target || event.srcElement;
                let isElementTarget = target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement;
                if (!isElementTarget) return; // js error不再处理

                let url = target.src || target.href;
                debugger;
                config.sendError({
                    title: target.nodeName,
                    msg: url,
                    category: 'resource',
                    level: 'error'
                });
            }
        }, true);
    };

    /*监听fetch请求错误*/
    _handleFetchError(_window, config) {
        if(!_window.fetch) return;
        let _oldFetch = _window.fetch;
        _window.fetch = function () {
            return _oldFetch.apply(this, arguments)
                .then(res => {
                    if (!res.ok) { // True if status is HTTP 2xx
                        if(res.url===config.submitUrl){
                            console.log('提交错误报错，请检查后台frontend-sniper-server是否运行正常');
                        }else{
                            config.sendError({
                                title: arguments[0],
                                msg: JSON.stringify(res),
                                category: 'fetch',
                                level: 'error'
                            });
                        }
                    }
                    return res;
                })
                .catch(error => {
                    config.sendError({
                        title: arguments[0],
                        msg: JSON.stringify({
                            message: error.message,
                            stack: error.stack
                        }),
                        category: 'fetch',
                        level: 'error'
                    });
                    throw error;
                })
        }
    };

    /*监听ajax请求错误*/
    handleAjaxError(_window, config) {
        var protocol = _window.location.protocol;
        if (protocol === 'file:') return;
        console.log('ajax');

        // 处理fetch
        this._handleFetchError(_window, config);

        // 处理XMLHttpRequest
        if (!_window.XMLHttpRequest) {
            return;
        }
        let xmlhttp = _window.XMLHttpRequest;

        let _oldSend = xmlhttp.prototype.send;

        let _handleEvent = function (event) {
            if (event && event.currentTarget && event.currentTarget.status !== 200) {
                if(event.target.responseURL===config.submitUrl){
                    console.log('提交错误报错，请检查后台frontend-sniper-server是否运行正常');
                }else{
                    config.sendError({
                        title: event.target.responseURL,
                        msg: JSON.stringify({
                            response: event.target.response,
                            responseURL:  event.target.responseURL,
                            status: event.target.status,
                            statusText: event.target.statusText
                        }),
                        category: 'ajax',
                        level: 'error'
                    });
                }

            }
        };

        xmlhttp.prototype.send = function () {
            if (this['addEventListener']) {
                this['addEventListener']('error', _handleEvent);
                this['addEventListener']('load', _handleEvent);
                this['addEventListener']('abort', _handleEvent);
            } else {
                var _oldStateChange = this['onreadystatechange'];
                this['onreadystatechange'] = function (event) {
                    if (this.readyState === 4) {
                        _handleEvent(event);
                    }
                    _oldStateChange && _oldStateChange.apply(this, arguments);
                };
            }
            return _oldSend.apply(this, arguments);
        }
    };

    /*监听Console 错误*/
    handleConsoleError(_window, config) {
        if (!_window.console || !_window.console.error) return;
        let _oldConsoleError = _window.console.error;
        _window.console.error = function () {
            config.sendError({
                title: 'consoleError',
                msg: JSON.stringify(arguments.join(',')),
                category: 'js',
                level: 'error'
            });
            _oldConsoleError && _oldConsoleError.apply(_window, arguments);
        };
    };

    handleVueError(_window, config) {
        var vue = _window.Vue;
        if (!vue || !vue.config) return; // 没有找到vue实例
        var _oldVueError = vue.config.errorHandler;

        Vue.config.errorHandler = function VueErrorHandler(error, vm, info) {
            var metaData = {};
            if (Object.prototype.toString.call(vm) === '[object Object]') {
                metaData.componentName = vm._isVue ? vm.$options.name || vm.$options._componentTag : vm.name;
                metaData.propsData = vm.$options.propsData;
            }
            config.sendError({
                title: 'vue Error',
                msg: metaData + info,
                category: 'js',
                level: 'error'
            });

            if (_oldVueError && isFunction(_oldVueError)) {
                _oldOnError.call(this, error, vm, info);
            }
        };
    };
}



export default new explorer();