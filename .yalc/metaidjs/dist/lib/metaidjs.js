"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaIdJs = void 0;
var popup_1 = require("./popup");
var postmessage_client_1 = require("./postmessage-client");
var generateRandomId = function () {
    return (Math.floor(Math.random() * 100000000000000000)).toString();
};
var hasClass = function (el, cls) {
    return el.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
};
var addClass = function (el, cls) {
    if (!hasClass(el, cls))
        el.className += " " + cls;
};
var MetaIdJs = /** @class */ (function () {
    function MetaIdJs(options) {
        var _this = this;
        this.postMessage = new postmessage_client_1.default(window);
        this.mainFrameEl = null;
        this.accessToken = '';
        this.isInjectMainFrame = false;
        this.isLoaded = false;
        this._handlers = {};
        this.onError = function (res) {
            popup_1.default.error({
                message: res.data.message
            });
        };
        this.handleCreateNodeSuccess = function (res) {
            var _a, _b;
            popup_1.default.close();
            (_b = (_a = _this.mainFrameEl) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.setAttribute('style', 'display: none;');
            var payload = res.payload;
            var callback = _this._handlers[payload.handlerId].callback;
            if (callback) {
                callback(payload);
            }
        };
        this.handleCreateNodeError = function (res) {
            var payload = res.payload;
            popup_1.default.close();
            popup_1.default.error({
                message: payload.data && payload.data.message ? payload.data.message : res
            });
        };
        this.handleConfirmCreateNode = function (res) {
            var _a, _b;
            // console.log("confirm", res);
            popup_1.default.close();
            (_b = (_a = _this.mainFrameEl) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.removeAttribute('style');
        };
        this.handleCloseCreateNode = function (res) {
            var _a, _b;
            popup_1.default.close();
            (_b = (_a = _this.mainFrameEl) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.setAttribute('style', 'display: none;');
            var payload = res.payload;
            var callback = _this._handlers[payload.handlerId].onCancel;
            if (callback) {
                delete payload.handlerId;
                callback(payload);
            }
        };
        this.handleCallback = function (res) {
            var payload = res.payload;
            var callback = _this._handlers[payload.handlerId].callback;
            if (callback) {
                delete payload.handlerId;
                callback(payload);
            }
        };
        this.handleSdkLoaded = function () {
            _this.isLoaded = true;
            if (typeof _this.onLoaded === 'function') {
                _this.onLoaded();
            }
        };
        this.handleCommonError = function (res) {
            console.log('error', res);
            var payload = res.payload;
            popup_1.default.close();
            if (payload.code === 202) {
                popup_1.default.confirm({
                    message: 'User authentication expired.',
                    showClose: false,
                    buttonText: 'Cancel',
                    buttonText2: 'Login',
                    buttonUrl2: _this.SHOWMONEY_URL + "/userLogin?response_type=code&client_id=" + _this.oauthSettings.clientId + "&redirect_uri=" + _this.oauthSettings.redirectUri + "&scope=app&from=" + _this.oauthSettings.redirectUri
                });
            }
            else {
                _this.onError(payload);
            }
        };
        this.handleLoading = function () {
            _this.showLoadingPopup();
        };
        this.handleNotEnoughMoney = function (res) {
            var payload = res.payload;
            var message = payload.data.message;
            popup_1.default.close();
            popup_1.default.confirm({
                message: message ? message : 'Not enough money',
                showClose: false,
                buttonText: 'Cancel',
                buttonText2: 'Top up BSV',
                buttonUrl2: _this.SHOWMONEY_URL,
                buttonAction: function () {
                    popup_1.default.close();
                    if (window.handleNotEnoughMoney) {
                        window.handleNotEnoughMoney(payload);
                    }
                    // const callback = this._handlers[payload.handlerId].callback
                    // if (callback) {
                    //   callback(payload)
                    // }
                }
            });
        };
        this.SHOWMONEY_URL = options.baseUri || "https://www.showmoney.app";
        this.onLoaded = options.onLoaded;
        if (typeof options.onError === 'function') {
            this.onError = options.onError;
        }
        this.oauthSettings = __assign(__assign({}, options.oauthSettings), { clientSecret: '', scope: 'app', responseType: 'code' });
        this.init();
    }
    /**
     * injectMainFrame  注入主框架
     */
    MetaIdJs.prototype.injectMainFrame = function () {
        var _this = this;
        var mainFrame = document.createElement('iframe');
        var mainFrameWrapper = document.createElement('div');
        mainFrame.setAttribute('id', 'showmoney-main-frame');
        mainFrame.setAttribute('src', this.SHOWMONEY_URL + '/iframe');
        mainFrameWrapper.setAttribute('id', 'mainframewrapper');
        mainFrameWrapper.setAttribute('style', 'display: none;');
        mainFrameWrapper.appendChild(mainFrame);
        document.body.appendChild(mainFrameWrapper);
        // 报告 main-frame 载入完成
        mainFrame.onload = function () {
            if (mainFrame.contentWindow) {
                _this.mainFrameEl = mainFrame;
                // 无法把postmessage实例保留，会报跨域错误
                window.mainFrameMessage = new postmessage_client_1.default(mainFrame.contentWindow);
                window.mainFrameMessage.send('send-options', _this.oauthSettings);
                // window.mainFrameMessage = mainFrameMessage
                _this.isInjectMainFrame = true;
                // console.log('mainFrame loaded')
            }
        };
    };
    MetaIdJs.prototype.initHandle = function () {
        var functionObj = [
            "swapreqswapargs",
            "estimateSwapToken2Amount",
            "estimateSwapToken1Amount",
            "isSupportedFt",
            "swapft",
            "getBalance",
            "nftBuy",
            "nftCancel",
            "nftSell",
            "genesisNFT",
            "issueNFT",
        ];
        var _loop_1 = function (item) {
            this_1[item] = function (params) {
                var defParams = params;
                if (params.callback) {
                    var handlerId = generateRandomId();
                    this._handlers[handlerId] = {};
                    this._handlers[handlerId].callback = params.callback;
                    defParams.handlerId = handlerId;
                }
                delete defParams.callback;
                window.mainFrameMessage.send(item, defParams);
            };
        };
        var this_1 = this;
        for (var _i = 0, functionObj_1 = functionObj; _i < functionObj_1.length; _i++) {
            var item = functionObj_1[_i];
            _loop_1(item);
        }
    };
    /**
     * getUserInfo
     */
    MetaIdJs.prototype.getUserInfo = function (params) {
        var defParams = params;
        if (params.callback) {
            var handlerId = generateRandomId();
            this._handlers[handlerId] = {};
            this._handlers[handlerId].callback = params.callback;
            defParams.handlerId = handlerId;
        }
        delete defParams.callback;
        window.mainFrameMessage.send('get-user-info', defParams);
    };
    /**
     * signMessage
     */
    MetaIdJs.prototype.signMessage = function (params) {
        var defParams = params;
        if (params.callback) {
            var handlerId = generateRandomId();
            this._handlers[handlerId] = {};
            this._handlers[handlerId].callback = params.callback;
            defParams.handlerId = handlerId;
        }
        delete defParams.callback;
        window.mainFrameMessage.send('sign-messgae', defParams);
    };
    /**
     * eciesEncryptData
     */
    MetaIdJs.prototype.eciesEncryptData = function (params) {
        var defParams = params;
        if (params.callback) {
            var handlerId = generateRandomId();
            this._handlers[handlerId] = {};
            this._handlers[handlerId].callback = params.callback;
            defParams.handlerId = handlerId;
        }
        delete defParams.callback;
        window.mainFrameMessage.send('ecies-encrypt-data', defParams);
    };
    MetaIdJs.prototype.eciesDecryptData = function (params) {
        var defParams = params;
        if (params.callback) {
            var handlerId = generateRandomId();
            this._handlers[handlerId] = {};
            this._handlers[handlerId].callback = params.callback;
            defParams.handlerId = handlerId;
        }
        delete defParams.callback;
        window.mainFrameMessage.send('ecies-decrypt-data', defParams);
    };
    /**
     * ecdhEncryptData
     */
    MetaIdJs.prototype.ecdhEncryptData = function (params) {
        var defParams = params;
        if (params.callback) {
            var handlerId = generateRandomId();
            this._handlers[handlerId] = {};
            this._handlers[handlerId].callback = params.callback;
            defParams.handlerId = handlerId;
        }
        delete defParams.callback;
        window.mainFrameMessage.send('ecdh-encrypt-data', defParams);
    };
    MetaIdJs.prototype.ecdhDecryptData = function (params) {
        var defParams = params;
        if (params.callback) {
            var handlerId = generateRandomId();
            this._handlers[handlerId] = {};
            this._handlers[handlerId].callback = params.callback;
            defParams.handlerId = handlerId;
        }
        delete defParams.callback;
        window.mainFrameMessage.send('ecdh-decrypt-data', defParams);
    };
    MetaIdJs.prototype.getFTList = function (params) {
        var defParams = params;
        if (params.callback) {
            var handlerId = generateRandomId();
            this._handlers[handlerId] = {};
            this._handlers[handlerId].callback = params.callback;
            defParams.handlerId = handlerId;
        }
        delete defParams.callback;
        window.mainFrameMessage.send('get-ftlist', defParams);
    };
    // 版本兼容
    MetaIdJs.prototype.addProtocolNode = function (params) {
        this.sendMetaDataTx(params);
    };
    /**
     * createProtocolNode
     */
    MetaIdJs.prototype.sendMetaDataTx = function (params) {
        if (!params.checkOnly) {
            this.showLoadingPopup();
        }
        if (params.callback || params.onCancel) {
            var handlerId = generateRandomId();
            this._handlers[handlerId] = {};
            if (params.callback) {
                this._handlers[handlerId]['callback'] = params.callback;
            }
            if (params.onCancel) {
                this._handlers[handlerId]['onCancel'] = params.onCancel;
            }
            params = __assign(__assign({}, params), { handlerId: handlerId });
            delete params.callback;
            delete params.onCancel;
        }
        if (this.isInjectMainFrame) {
            window.mainFrameMessage.send('create-node', params);
            // console.log(this._handlers)
        }
        else {
            throw new Error('showmoney frame 未加载');
        }
    };
    MetaIdJs.prototype.payToAddress = function (params) {
        var defParams = params;
        if (params.callback) {
            var handlerId = generateRandomId();
            this._handlers[handlerId] = {};
            this._handlers[handlerId].callback = params.callback;
            defParams.handlerId = handlerId;
        }
        delete defParams.callback;
        window.mainFrameMessage.send('pay-to-address', defParams);
    };
    MetaIdJs.prototype.showLoadingPopup = function () {
        var popupEl = document.getElementById('showmoney-popup');
        if (!popupEl)
            return;
        popup_1.default.info({
            message: 'Processing data...',
            showClose: false
        });
        addClass(popupEl, 'loading');
    };
    MetaIdJs.prototype.handleErrorNotLoggedIn = function (resolve) {
        var message = resolve.payload;
        popup_1.default.close();
        popup_1.default.info(message.popup);
    };
    MetaIdJs.prototype.init = function () {
        this.injectMainFrame();
        // 监听信息
        this.postMessage.start();
        this.initHandle();
        this.postMessage.subscribe('sdk-loaded', this.handleSdkLoaded);
        this.postMessage.subscribe('error.not-logged-in', this.handleErrorNotLoggedIn);
        this.postMessage.subscribe('loading', this.handleLoading);
        this.postMessage.subscribe('success.create-node', this.handleCreateNodeSuccess);
        this.postMessage.subscribe('confirm.create-node', this.handleConfirmCreateNode);
        this.postMessage.subscribe('close.create-node', this.handleCloseCreateNode);
        this.postMessage.subscribe('error.create-node', this.handleCreateNodeError);
        this.postMessage.subscribe('error.not-enough-money', this.handleNotEnoughMoney);
        this.postMessage.subscribe('receive-callback', this.handleCallback);
        this.postMessage.subscribe('error.common', this.handleCommonError);
    };
    return MetaIdJs;
}());
exports.MetaIdJs = MetaIdJs;
//# sourceMappingURL=metaidjs.js.map