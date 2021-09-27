"use strict";
/*
 * @Author: ohosanna
 * @Date: 2020-03-18 14:45:22
 * @Last Modified by: ohosanna
 * @Last Modified time: 2020-07-08 16:48:53
 */
Object.defineProperty(exports, "__esModule", { value: true });
require("./styles/popup.css");
var Popup = /** @class */ (function () {
    function Popup() {
        var popupEl = document.createElement('div');
        popupEl.setAttribute('id', 'showmoney-popup');
        document.body.appendChild(popupEl);
        this.popupWrapper = popupEl;
    }
    Popup.prototype.info = function (options) {
        this.show('info', options);
    };
    Popup.prototype.error = function (options) {
        this.show('error', options);
    };
    Popup.prototype.loading = function () {
        console.log(this.popupWrapper);
        this.show('info', { message: 'test' });
    };
    Popup.prototype.confirm = function (options) {
        var _this = this;
        if (!options.buttonAction) {
            options.buttonAction = function () {
                _this.close();
            };
        }
        this.show('confirm', options);
    };
    Popup.prototype.show = function (type, options) {
        if (type === void 0) { type = 'info'; }
        var popupDom = this.generatePopupContent(options);
        this.popupWrapper.appendChild(popupDom);
        this.popupWrapper.className = type + '-popup' + ' active';
    };
    Popup.prototype.close = function () {
        this.popupWrapper.className = '';
        this.popupWrapper.innerHTML = '';
    };
    Popup.prototype.generatePopupContent = function (options) {
        var _this = this;
        var box = document.createElement('div');
        box.className = 'sm-popup-box ' + (options.className ? options.className : '');
        // progress
        var progress = document.createElement('div');
        progress.className = 'sm-linear-progress';
        var bar1 = document.createElement('div');
        bar1.className = 'bar bar1';
        var bar2 = document.createElement('div');
        bar2.className = 'bar bar2';
        progress.appendChild(bar1);
        progress.appendChild(bar2);
        box.appendChild(progress);
        // header
        var popupHeader = document.createElement('header');
        popupHeader.className = 'sm-popup-header';
        var popupTitle = document.createElement('h2');
        popupTitle.className = 'sm-popup-title';
        if (options.title) {
            popupTitle.innerHTML = options.title;
            popupHeader.appendChild(popupTitle);
        }
        var closeBtn = document.createElement('button');
        closeBtn.className = 'sm-popup-close';
        closeBtn.onclick = function () { _this.close(); };
        if (options.showClose !== false) {
            popupHeader.appendChild(closeBtn);
        }
        // content
        var popupContent = document.createElement('div');
        popupContent.className = 'sm-popup-content';
        popupContent.innerHTML = options.message;
        // footer
        var popupFooter = document.createElement('footer');
        popupFooter.className = 'sm-popup-footer';
        if (options.buttonText) {
            var button = document.createElement('button');
            button.className = 'sm-popup-btn sm-popup-btn1';
            button.innerText = options.buttonText;
            if (options.buttonUrl) {
                var url_1 = options.buttonUrl;
                button.onclick = function () {
                    window.open(url_1, '_blank');
                };
            }
            if (options.buttonAction) {
                button.onclick = function () {
                    if (typeof options.buttonAction === 'function')
                        options.buttonAction();
                };
            }
            popupFooter.appendChild(button);
        }
        if (options.buttonText2) {
            var button2 = document.createElement('button');
            button2.className = 'sm-popup-btn sm-popup-btn2';
            button2.innerText = options.buttonText2;
            if (options.buttonUrl2) {
                var url_2 = options.buttonUrl2;
                button2.onclick = function () {
                    if (options.useCurrentWindow) {
                        window.open(url_2);
                    }
                    else {
                        window.open(url_2, '_blank');
                    }
                };
            }
            if (options.buttonAction2) {
                button2.onclick = function () {
                    if (typeof options.buttonAction2 === 'function')
                        options.buttonAction2();
                };
            }
            popupFooter.appendChild(button2);
        }
        box.appendChild(popupHeader);
        box.appendChild(popupContent);
        box.appendChild(popupFooter);
        return box;
    };
    return Popup;
}());
exports.default = new Popup();
//# sourceMappingURL=popup.js.map