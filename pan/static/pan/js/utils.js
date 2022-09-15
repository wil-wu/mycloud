(function (global, factory) {
    global.custom = factory()

})(this, function () {
    'use strict'

    // 自定义toast
    function Toast($elem) {
        this.elem = $elem
        this.mdbToast = new mdb.Toast($elem.get(0))

        this.setConfig = function ({animation = true, autohide = true, delay = 2000}) {
            this.mdbToast._config.animation = animation
            this.mdbToast._config.autohide = autohide
            this.mdbToast._config.delay = delay
        }
        this.setIcon = function (icon) {
            this.elem.find('i').attr('class', icon)
        }
        this.setText = function (text) {
            this.elem.find('.toast-body').text(text)
        }
        this.getToast = function () {
            return this.mdbToast
        }
    }

    function Alert($elem) {
        this.elem = $elem
        this.option = {delay: 2000}

        this.setIcon = function (icon) {
            this.elem.find('i').attr('class', icon)
        }

        this.setText = function (text) {
            this.elem.find('.alert-content').text(text)
        }

        this.show = function () {
            this.elem.removeClass('hide').addClass('show').css('top', '100px')
            setTimeout(function () {
                this.hide()
            }.bind(this), this.option.delay)
        }

        this.hide = function () {
            this.elem.removeClass('show').addClass('hide').css('top', '-20%')
        }
    }

    // 自定义模态框
    function Modal($elem) {
        this.elem = $elem
        this.mdbModal = new mdb.Modal($elem.get(0))
        this.btn = $elem.find('.modal-btn').children().last()

        this.setTitle = function (title) {
            this.elem.find('.modal-title').text(title)
        }
        this.setBtnText = function (text) {
            this.btn.text(text)
        }
        this.setBtnType = function (type) {
            this.btn.attr('class', type)
        }
        this.getModal = function () {
            return this.mdbModal
        }
    }

    // 基础modal
    function BaseModal($elem) {
        this.elem = $elem
        this.mdbModal = new mdb.Modal($elem.get(0))
    }

    // 获取cookie
    function getCookie(name) {
        let cookieValue = null
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';')
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim()
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                    break
                }
            }
        }
        return cookieValue
    }

    // 获取query参数
    function getQueryParam(key) {
        let params = location.search.substring(1).split("&")
        let obj = {}
        params.forEach(value => {
            let item = value.split('=')
            obj[item[0]] = item[1]
        })
        return obj[key]
    }

    // 判断是否为移动端
    function isMobile() {
        return navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)
    }

    //复制
    function copyText(text, alert) {
        if (window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                alert.setIcon('fas fa-check-circle')
                alert.setText('复制成功')
            }, () => {
                alert.setIcon('fas fa-exclamation-circle')
                alert.setText('复制失败')
            }).finally(() => {
                alert.show()
            })
        } else {
            let textArea = document.createElement("textarea")
            textArea.value = text
            textArea.style.position = "fixed"
            textArea.style.top = "-50%"
            document.body.appendChild(textArea)
            textArea.select()
            textArea.setSelectionRange(0, textArea.selectionEnd)
            if (document.execCommand('copy')) {
                alert.setIcon('fas fa-check-circle')
                alert.setText('复制成功')
            } else {
                alert.setIcon('fas fa-exclamation-circle')
                alert.setText('复制失败')
            }
            alert.show()
            textArea.remove()
            window.getSelection().removeAllRanges()
        }
    }

    // 文件大小格式
    function fileSizeFormat(value) {
        if (value < 1024) {
            return value.toFixed(2) + 'B'
        } else if (value < 1048576) {
            return (value / 1024).toFixed(2) + 'KB'
        } else if (value < 1073741824) {
            return (value / 1024 / 1024).toFixed(2) + 'M'
        } else {
            return (value / 1024 / 1024 / 1024).toFixed(2) + 'G'
        }
    }

    // 人性化时间
    function humanizeTime(value) {
        let timedelta = Date.parse(value) / 1000 - Date.parse(new Date()) / 1000

        if (timedelta < 0) {
            return '已过期'
        } else if (timedelta < 3600) {
            return Math.floor(timedelta / 60) + '分钟后过期'
        } else if (timedelta < 86400) {
            return Math.floor(timedelta / 3600) + '小时后过期'
        } else {
            return Math.floor(timedelta / 86400) + '天' + Math.floor((timedelta % 86400) / 3600) + '小时后过期'
        }
    }

    // 初始验证信息
    function getInitial(inputs) {
        let validations = {}

        $.each(inputs, function (i, item) {
            let elem = $(item).siblings('.invalid-feedback')
            validations[item.name] = {elem: elem, initial: elem.text()}
        })
        return validations
    }

    // 还原验证信息
    function setInitial(validations, inputs, form) {
        $.each(validations, function (i, item) {
            item.elem.text(item.initial)
        })
        inputs.removeClass('is-invalid')
        form.addClass('was-validated')
    }

    // 密码验证
    function checkPassword(password, confirm) {
        if (password.val() !== confirm.val()) {
            password.siblings('.invalid-feedback').text('两次密码不一致')
            confirm.siblings('.invalid-feedback').text('两次密码不一致')
            password.addClass('is-invalid')
            confirm.addClass('is-invalid')
            return false
        }
        return true
    }

    function elEmpty(dom) {
        return `<div class="el-empty">
            <div class="el-empty__image">
                <svg viewBox="0 0 79 86" version="1.1" xmlns="http://www.w3.org/2000/svg"
                     xmlns:xlink="http://www.w3.org/1999/xlink">
                    <defs>
                        <linearGradient id="linearGradient-1-1" x1="38.8503086%" y1="0%" x2="61.1496914%" y2="100%">
                            <stop stop-color="#FCFCFD" offset="0%"></stop>
                            <stop stop-color="#EEEFF3" offset="100%"></stop>
                        </linearGradient>
                        <linearGradient id="linearGradient-2-1" x1="0%" y1="9.5%" x2="100%" y2="90.5%">
                            <stop stop-color="#FCFCFD" offset="0%"></stop>
                            <stop stop-color="#E9EBEF" offset="100%"></stop>
                        </linearGradient>
                        <rect id="path-3-1" x="0" y="0" width="17" height="36"></rect>
                    </defs>
                    <g id="Illustrations" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                        <g id="B-type" transform="translate(-1268.000000, -535.000000)">
                            <g id="Group-2" transform="translate(1268.000000, 535.000000)">
                                <path id="Oval-Copy-2"
                                      d="M39.5,86 C61.3152476,86 79,83.9106622 79,81.3333333 C79,78.7560045 57.3152476,78 35.5,78 C13.6847524,78 0,78.7560045 0,81.3333333 C0,83.9106622 17.6847524,86 39.5,86 Z"
                                      fill="#F7F8FC"></path>
                                <polygon id="Rectangle-Copy-14" fill="#E5E7E9"
                                         transform="translate(27.500000, 51.500000) scale(1, -1) translate(-27.500000, -51.500000) "
                                         points="13 58 53 58 42 45 2 45"></polygon>
                                <g id="Group-Copy"
                                   transform="translate(34.500000, 31.500000) scale(-1, 1) rotate(-25.000000) translate(-34.500000, -31.500000) translate(7.000000, 10.000000)">
                                    <polygon id="Rectangle-Copy-10" fill="#E5E7E9"
                                             transform="translate(11.500000, 5.000000) scale(1, -1) translate(-11.500000, -5.000000) "
                                             points="2.84078316e-14 3 18 3 23 7 5 7"></polygon>
                                    <polygon id="Rectangle-Copy-11" fill="#EDEEF2"
                                             points="-3.69149156e-15 7 38 7 38 43 -3.69149156e-15 43"></polygon>
                                    <rect id="Rectangle-Copy-12" fill="url(#linearGradient-1-1)"
                                          transform="translate(46.500000, 25.000000) scale(-1, 1) translate(-46.500000, -25.000000) "
                                          x="38" y="7" width="17" height="36"></rect>
                                    <polygon id="Rectangle-Copy-13" fill="#F8F9FB"
                                             transform="translate(39.500000, 3.500000) scale(-1, 1) translate(-39.500000, -3.500000) "
                                             points="24 7 41 7 55 -3.63806207e-12 38 -3.63806207e-12"></polygon>
                                </g>
                                <rect id="Rectangle-Copy-15" fill="url(#linearGradient-2-1)" x="13" y="45" width="40"
                                      height="36"></rect>
                                <g id="Rectangle-Copy-17" transform="translate(53.000000, 45.000000)">
                                    <mask id="mask-4-1" fill="white">
                                        <use xlink:href="#path-3-1"></use>
                                    </mask>
                                    <use id="Mask" fill="#E0E3E9"
                                         transform="translate(8.500000, 18.000000) scale(-1, 1) translate(-8.500000, -18.000000) "
                                         xlink:href="#path-3-1"></use>
                                    <polygon id="Rectangle-Copy" fill="#D5D7DE" mask="url(#mask-4-1)"
                                             transform="translate(12.000000, 9.000000) scale(-1, 1) translate(-12.000000, -9.000000) "
                                             points="7 0 24 0 20 18 -1.70530257e-13 16"></polygon>
                                </g>
                                <polygon id="Rectangle-Copy-18" fill="#F8F9FB"
                                         transform="translate(66.000000, 51.500000) scale(-1, 1) translate(-66.000000, -51.500000) "
                                         points="62 45 79 45 70 58 53 58"></polygon>
                            </g>
                        </g>
                    </g>
                </svg>
            </div>
            <div class="el-empty__description">${dom}</div>
        </div>`
    }

    return {
        Toast: Toast,
        Alert: Alert,
        Modal: Modal,
        elEmpty:elEmpty,
        isMobile:isMobile,
        copyText: copyText,
        BaseModal: BaseModal,
        getCookie: getCookie,
        getQueryParam: getQueryParam,
        fileSizeFormat: fileSizeFormat,
        humanizeTime: humanizeTime,
        getInitial: getInitial,
        setInitial: setInitial,
        checkPassword: checkPassword,
    }
})