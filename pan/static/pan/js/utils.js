(function () {
    'use strict'

    // dom util
    window.domutil = {
        // 创建 HTML element
        createElement(type, props, children) {
            let el = document.createElement(type)
            let except = new Set(['style', 'class', 'dataset', 'text'])

            for (const attr of Object.keys(props)) {
                if (!except.has(attr)) {
                    el.setAttribute(attr, props[attr])
                }
            }

            if (props.text) {
                el.textContent = props.text
            }
            if (props.class) {
                if (Array.isArray(props.class)) {
                    el.className = props.class.join(' ')
                } else if (typeof props.class === 'string') {
                    el.className = props.class
                }
            }
            if (typeof props.dataset === 'object') {
                for (const [key, val] of Object.entries(props.dataset)) {
                    el.dataset[key] = val
                }
            }
            if (typeof props.style === 'object') {
                for (const [key, val] of Object.entries(props.style)) {
                    el.style[key] = val
                }
            }

            if (children) {
                el.append(...children)
            }

            return el
        },

        // 计算元素距离顶部的偏移量
        offsetTop(el) {
            let actualTop = el.offsetTop
            let node = el.offsetParent

            while (node) {
                actualTop += node.offsetTop
                node = node.offsetParent
            }
            return actualTop
        },

        // 获取前兄弟元素
        prevSiblings(el, selector) {
            let siblings = []
            let prev = el.previousElementSibling

            while (prev) {
                if (prev.matches(selector)) siblings.push(prev)
                prev = prev.previousElementSibling
            }
            return siblings
        },

        // 获取后兄弟元素
        nextSiblings(el, selector) {
            let siblings = []
            let next = el.nextElementSibling

            while (next) {
                if (next.matches(selector)) siblings.push(next)
                next = next.nextElementSibling
            }
            return siblings
        },

        // 移除所有子元素
        removeChildren(el) {
            while (el.firstChild) el.removeChild(el.firstChild)
        },

        // 序列化表单
        serializeForm(form) {
            let data = {}
            form.querySelectorAll('input, select, textarea').forEach(function (el) {
                if (el.type === 'checkbox') {
                    data[el.name] = el.checked
                    return
                }
                if (el.type === 'radio') {
                    if (!el.checked) return
                }
                data[el.name] = el.value
            })
            return data
        },

        // 获取cookie
        getCookie(name) {
            let cookieValue = null
            if (document.cookie) {
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
        },

        // 获取query参数
        getURLParam(key) {
            return new URLSearchParams(location.search).get(key)
        },

        isJqXHR(obj) {
            return typeof obj === 'object' && typeof obj.done === 'function'
        },

        isPromise(obj) {
            return typeof obj === 'object' && typeof obj.then === 'function' && typeof obj.catch === 'function'
        }
    }


    // 功能函数
    window.custom = {
        // 复制
        copyText(text, resolve, reject) {
            if (window.isSecureContext) {
                navigator.clipboard.writeText(text).then(resolve, reject)
            } else {
                let textArea = document.createElement("textarea")
                textArea.value = text
                textArea.style.position = "fixed"
                textArea.style.top = "-50%"
                document.body.appendChild(textArea)
                textArea.select()
                textArea.setSelectionRange(0, textArea.selectionEnd)

                if (document.execCommand('copy')) resolve()
                else reject()

                textArea.remove()
                window.getSelection().removeAllRanges()
            }
        },

        // 文件类型格式
        fileTypeFormatter(value) {
            switch (value) {
                case '':
                    return '未知'
                case null:
                    return '文件夹'
                default:
                    return value
            }
        },

        // 文件大小格式
        fileSizeFormat(value, fixed = 2) {
            if (value < 1024) {
                return value.toFixed(fixed) + 'B'
            } else if (value < 1048576) {
                return (value / 1024).toFixed(fixed) + 'KB'
            } else if (value < 1073741824) {
                return (value / 1024 / 1024).toFixed(fixed) + 'MB'
            } else {
                return (value / 1024 / 1024 / 1024).toFixed(fixed) + 'GB'
            }
        },

        // 人性化时间
        humanizeTime(value) {
            let timedelta = Date.parse(value) / 1000 - Date.parse(new Date().toLocaleString()) / 1000

            if (timedelta < 0) {
                return '已过期'
            } else if (timedelta < 3600) {
                return Math.floor(timedelta / 60) + '分钟后过期'
            } else if (timedelta < 86400) {
                return Math.floor(timedelta / 3600) + '小时后过期'
            } else {
                return Math.floor(timedelta / 86400) + '天' + Math.floor((timedelta % 86400) / 3600) + '小时后过期'
            }
        },

        // 初始验证信息
        getInitial(form) {
            let validations = {}

            form.querySelectorAll('input, textarea').forEach(function (item) {
                let el = domutil.nextSiblings(item, '.invalid-feedback').pop()
                if (el) validations[item.name] = {el: el, initial: el.textContent}
            })
            return validations
        },

        // 还原验证信息
        setInitial(form, validations) {
            for (const item of Object.values(validations)) {
                item.el.textContent = item.initial
            }
            form.querySelectorAll('input, textarea').forEach(function (el) {
                el.classList.remove('is-invalid')
            })
            form.classList.add('was-validated')
        },

        // 判断是否为移动端
        isMobile() {
            return navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)
        },
    }

    // html模板
    window.templates = {
        // 通知模板
        noticeTemplate(data) {
            let html = ''
            if (data.length === 0) {
                html += '<li><div class="dropdown-item text-muted text-center">无通知</div></li>'
            } else {
                for (const item of data) {
                    html += `<li><div class="dropdown-item">
                             <h6>${item.title}</h6>
                             <small class="text-wrap">${item.content}</small>
                             <div class="d-flex align-items-center text-muted small">
                             <div>— ${item.create_by}</div>
                             <div class="ms-auto">${item.create_time}</div></div>
                             </div></li>`
                }
            }
            return html
        },

        // 留言模板
        messageTemplate(data) {
            let html = ''
            if (data.length === 0) {
                html += '<li class="list-group-item text-center text-muted">无留言记录</li>'
            } else {
                for (const item of data) {
                    html += `<li class="list-group-item">
                             <p>${item.content}</p>
                             <small class="text-muted">${item.create_time}</small>
                             </li>`
                }
            }
            return html
        },

        // 申请模板
        applyTemplate(data) {
            let html = ''
            if (data.length === 0) {
                html += '<li class="list-group-item text-center text-muted">无申请记录</li>'
            } else {
                const badges = {
                    '0': {text: '未审批', color: 'badge-info'},
                    '1': {text: '通过', color: 'badge-success'},
                    '2': {text: '未通过', color: 'badge-warning'}
                }

                for (const item of data) {
                    let badge = badges[item.status]
                    html += `<li class="list-group-item">
                             <p>${item.content}</p>
                             <div class="d-flex justify-content-between align-items-center">
                             <small class="text-muted">${item.create_time}</small>
                             <div class="badge ${badge.color}">${badge.text}</div>
                             </div>
                             </li>`
                }
            }
            return html
        },

        // 加载模板
        loadingTemplate() {
            return `<div class="d-flex justify-content-center align-items-center text-primary">
                        <div class="spinner-border"></div><strong>正在加载...</strong>
                    </div>`
        },

        // 文件名格式模板
        fileNameFormatter(value, row) {
            row = row.file || row.origin || row
            return `<div class="refresh d-flex align-items-center">
                        <svg class="icon" aria-hidden="true">
                            <use xlink:href="#icon-${_iconfont[row.file_type]}"></use>
                        </svg>
                        <span class="ms-3">${value}</span>
                    </div>`
        },

        // 功能区模板
        storageFormatter() {
            return `<div class="d-flex flex-column flex-md-row align-items-center">
                        <a class="share" href="javascript:void(0)">
                            <i class="fa-solid fa-share-nodes"></i>
                        </a>
                        <a class="ms-md-3 dropdown-toggle hidden-arrow" href="javascript:void(0)"
                                data-mdb-toggle="dropdown">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </a>
                        <ul class="dropdown-menu">
                            <li>
                                <a class="download dropdown-item" href="javascript:void(0)">
                                    <i class="fa-solid fa-file-arrow-down me-2"></i>下载
                                </a>
                            </li>
                            <li>
                                <a class="move dropdown-item" href="javascript:void(0)">
                                    <i class="fa-solid fa-folder-open me-1"></i>移动
                                </a>
                            </li>
                            <li>
                                <a class="rename dropdown-item" href="javascript:void(0)">
                                    <i class="fa-solid fa-font me-2"></i>重命名
                                </a>
                            </li>
                            <li>
                                <a class="recycle dropdown-item" href="javascript:void(0)">
                                    <i class="fa-solid fa-trash me-2"></i>删除
                                </a>
                            </li>
                        </ul>
                    </div>`
        },

        // 功能区模板
        historyFormatter() {
            return `<div class="d-flex flex-column flex-md-row align-items-center">
                        <a class="copy" href="javascript:void(0)">
                            <i class="fa-solid fa-link"></i>
                        </a>
                        <a class="ms-md-3 dropdown-toggle hidden-arrow" href="javascript:void(0)"
                                data-mdb-toggle="dropdown">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </a>
                        <ul class="dropdown-menu">
                            <li>
                                <a class="setup dropdown-item" href="javascript:void(0)">
                                    <i class="fa-solid fa-gear me-2"></i>设置链接
                                </a>
                            </li>
                            <li>
                                <a class="remove dropdown-item" href="javascript:void(0)">
                                    <i class="fa-solid fa-trash me-2"></i>删除
                                </a>
                            </li>
                        </ul>
                    </div>`
        },

        // 功能区模板
        binFormatter() {
            return `<div class="d-flex flex-column flex-md-row align-items-center">
                        <a class="recover" href="javascript:void(0)">
                            <i class="fa-solid fa-rotate-right"></i>
                        </a>
                        <a class="remove ms-md-3" href="javascript:void(0)">
                            <i class="fa-solid fa-trash"></i>
                        </a>
                    </div>`
        },

        // 空状态模板
        elEmpty(html) {
            return `<div class="el-empty">
                    <div class="el-empty__image">
                    <svg viewBox="0 0 79 86" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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
                    <rect id="Rectangle-Copy-15" fill="url(#linearGradient-2-1)" x="13" y="45" width="40" height="36"></rect>
                    <g id="Rectangle-Copy-17" transform="translate(53.000000, 45.000000)">
                    <mask id="mask-4-1" fill="white"><use xlink:href="#path-3-1"></use></mask>
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
                    </g></g></g></svg></div>
                    <div class="el-empty__description">${html}</div>
                    </div>`
        }
    }


    // 扩展mdb组件功能

    // 通知
    mdb.Toast.Default.delay = 2000
    mdb.Toast.prototype.setIcon = function (icon) {
        this._element.querySelector('i').className = icon
        return this
    }
    mdb.Toast.prototype.setText = function (text) {
        this._element.querySelector('.toast-body').textContent = text
        return this
    }


    // 情态框
    mdb.Modal.prototype.setTitle = function (title) {
        this._element.querySelector('.modal-title').textContent = title
        return this
    }
    mdb.Modal.prototype.getBtn = function () {
        return this._element.querySelector('.modal-btn').lastElementChild
    }
    mdb.Modal.prototype.setBtnText = function (text) {
        this.getBtn().textContent = text
        return this
    }
    mdb.Modal.prototype.setBtnType = function (type) {
        this.getBtn().className = type
        return this
    }


    // 警告
    mdb.Alert.prototype.config = {delay: 2000, type: 'alert-warning'}
    mdb.Alert.prototype.setType = function (type) {
        if (this.config.type !== type) {
            this._element.classList.remove(this.config.type)
            this._element.classList.add(type)
            this.config.type = type
        }
        return this
    }
    mdb.Alert.prototype.setIcon = function (icon) {
        this._element.querySelector('i').className = icon
        return this
    }
    mdb.Alert.prototype.setText = function (text) {
        this._element.querySelector('div').textContent = text
        return this
    }
    mdb.Alert.prototype.show = function () {
        if (!this._element.classList.contains('show')) {
            this._element.classList.remove('hide')
            this._element.classList.add('show')
            this._element.style.setProperty('top', '15%')
            setTimeout(function () {
                this.hide()
            }.bind(this), this.config.delay)
        }
    }
    mdb.Alert.prototype.hide = function () {
        this._element.classList.remove('show')
        this._element.classList.add('hide')
        this._element.style.setProperty('top', '-50%')
    }


    // 下拉栏
    mdb.Dropdown.prototype.activate = function () {
        let items = Array.from(this._menu.children).map(el => el.firstElementChild)

        let divider = items.findIndex(el => el.classList.contains('dropdown-divider'))
        divider = divider !== -1 ? divider : items.length

        this.prevActive = null
        this.nextActive = null

        for (let i = 0; i < divider; i++) {
            if (items[i].classList.contains('active')) this.prevActive = items[i]

            items[i].addEventListener('click', () => {
                if (this.prevActive) this.prevActive.classList.remove('active')
                items[i].classList.add('active')
                this.prevActive = items[i]
            })
        }

        for (let i = divider + 1; i < items.length; i++) {
            if (items[i].classList.contains('active')) this.nextActive = items[i]

            items[i].addEventListener('click', () => {
                if (this.nextActive) this.nextActive.classList.remove('active')
                items[i].classList.add('active')
                this.nextActive = items[i]
            })
        }
        return this
    }

    mdb.Dropdown.prototype.getOrdering = function () {
        return this.nextActive.dataset.order + this.prevActive.dataset.sort
    }
    mdb.Dropdown.prototype.getType = function () {
        return this.prevActive.dataset.type
    }


    // 面包屑导航
    mdb.BreadCrumb = class Breadcrumb {
        constructor(selector, callback) {
            this._element = document.querySelector(selector)
            this._callback = callback
            this._handler = this._getHandler()
            this.init()
        }

        // 默认回调函数
        _getHandler() {
            let that = this
            return (evt) => {
                let el = evt.target.parentElement
                let classList = el.classList

                if (classList.contains('breadcrumb-item') && !classList.contains('active')) {
                    let span = domutil.createElement('span', {text: el.textContent})
                    el.classList.add('active')
                    el.replaceChild(span, el.firstElementChild)
                    while (el.nextElementSibling) el.parentElement.removeChild(el.nextElementSibling)
                    if (that._callback) that._callback(...Object.values(el.dataset))
                }
            }
        }

        // 初始化事件绑定
        init() {
            this._element.addEventListener('click', this._handler)
        }

        // 添加导航项
        append(name, data) {
            let span = domutil.createElement('span', {text: name})
            let newCrumb = domutil.createElement('li', {class: 'breadcrumb-item active'}, [span])
            let lastCrumb = this._element.lastElementChild

            if (lastCrumb) {
                let anchor = domutil.createElement('a', {href: 'javascript:void(0)', text: lastCrumb.textContent})
                lastCrumb.classList.remove('active')
                lastCrumb.replaceChild(anchor, lastCrumb.firstElementChild)
            }

            if (typeof data === 'object') {
                for (const [key, val] of Object.entries(data)) {
                    newCrumb.dataset[key] = val
                }
            }
            this._element.append(newCrumb)
        }

        // 获取导航项
        get(index) {
            index = index === -1 ? this._element.children.length - 1 : index
            return this._element.children[index]
        }

        // 移除
        dispose() {
            this._element.removeEventListener('click', this._handler)
            domutil.removeChildren(this._element)
        }
    }


    // 树形列表
    mdb.TreeList = class TreeList {
        constructor(selector, callback) {
            this._element = document.querySelector(selector)
            this._callback = callback
            this._active = null
            this.selected = undefined
            this._stack = [undefined]
            this._itemclass = 'list-group-item list-group-item-action px-3 border-0'
            this._backclass = 'fa-solid fa-chevron-left me-2'
            this._iconclass = 'fa-solid fa-folder me-2'
            this._clickHandler = this._getClickHandler()
            this._dblclickHandler = this._getDblclickHandler()
            this.init()
        }

        // 默认单击回调
        _getClickHandler() {
            let that = this
            return (evt) => {
                let el = evt.target

                if (el.tagName === 'I') el = el.parentElement
                if (!el.classList.contains('list-group-item') || el.classList.contains('active')) return

                if (that._active) that._active.classList.remove('active')
                that._active = el
                that.selected = el.dataset.back ? that._stack[that._stack.length - 2] : el.dataset.param
                el.classList.add('active')
            }
        }

        // 默认双击回调
        _getDblclickHandler() {
            let that = this
            return (evt) => {
                let el = evt.target

                if (el.tagName === 'I') el = el.parentElement
                if (!el.classList.contains('list-group-item')) return

                let param = el.dataset.param
                if (el.dataset.back) {
                    that._stack.pop()
                    param = that._stack[that._stack.length - 1]
                } else {
                    that._stack.push(param)
                }

                if (that._callback) {
                    let obj = that._callback(param)

                    if (domutil.isJqXHR(obj)) {
                        obj.done((data) => {
                            that.render(data)
                            that._active = null
                        })
                    } else if (domutil.isPromise(obj)) {
                        obj.then((data) => {
                            that.render(data)
                            that._active = null
                        })
                    } else {
                        that.render(obj)
                        that._active = null
                    }
                }
            }
        }

        // 初始化绑定
        init() {
            this._element.addEventListener('click', this._clickHandler)
            this._element.addEventListener('dblclick', this._dblclickHandler)
        }

        // 渲染列表项
        render(data) {
            domutil.removeChildren(this._element)
            // 非根目录下，增加返回上级选项
            if (this._stack.length > 1) {
                let icon = domutil.createElement('i', {class: this._backclass})
                let item = domutil.createElement('button', {
                    dataset: {back: true},
                    class: this._itemclass,
                    type: 'button',
                }, [icon, '返回上一级'])
                this._element.append(item)
            }

            for (const datum of data) {
                let icon = domutil.createElement('i', {class: this._iconclass})
                let item = domutil.createElement('button', {
                    dataset: {param: datum.value},
                    class: this._itemclass,
                    type: 'button',
                }, [icon, datum.text])
                this._element.append(item)
            }
        }

        // 移除
        dispose() {
            this._element.removeEventListener('click', this._clickHandler)
            this._element.removeEventListener('dblclick', this._dblclickHandler)
            domutil.removeChildren(this._element)
        }
    }


    // 扩展组件监听器
    for (const component of [mdb.Tab, mdb.Toast, mdb.Modal]) {
        component.prototype.on = function (type, handler, options = {}) {
            this._element.addEventListener(type, handler, options)
            return this
        }
        component.prototype.once = function (type, handler) {
            return this.on(type, handler, {once: true})
        }
        component.prototype.off = function (type, handler, options = {}) {
            this._element.removeEventListener(type, handler, options)
            return this
        }
    }

})()