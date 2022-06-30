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

    return {
        Toast: Toast,
        Alert: Alert,
        Modal: Modal,
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