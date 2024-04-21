window.addEventListener('DOMContentLoaded', function () {
    'use strict'

    // 必要组件和对象
    const storageTab = new mdb.Tab('#storageTab')
    const historyTab = new mdb.Tab('#historyTab')
    const binTab = new mdb.Tab('#binTab')
    const profileTab = new mdb.Tab('#profileTab')

    const alert = new mdb.Alert('#alert')
    const toast = new mdb.Toast('#toast')
    const modal = new mdb.Modal('#modal')

    const storageMenu = new mdb.Dropdown('#storageMenu').activate()
    const historyMenu = new mdb.Dropdown('#historyMenu').activate()
    const binMenu = new mdb.Dropdown('#binMenu').activate()

    const notice = new mdb.Dropdown('#notice')

    const sidebar = new mdb.Offcanvas('#sidebar')

    const $storageTable = $('#storageTable')
    const $historyTable = $('#historyTable')
    const $binTable = $('#binTable')

    const $profile = $('#profilePane')
    const $capacity = $('#capacity')
    const $search = $('#search')
    const $avatars = $('.avatar')

    const pageMap = new Proxy({
        '#storage': {tab: storageTab, title: '我的云盘'},
        '#history': {tab: historyTab, title: '传输历史'},
        '#bin': {tab: binTab, title: '回收站'},
        '#profile': {tab: profileTab, title: '个人信息'},
    }, {
        get(target, prop) {
            return prop in target ? target[prop] : target['#storage']
        }
    })

    const user = new Proxy(_config.profile.user, {
        set(target, prop, value) {
            target[prop] = value

            if (prop === 'username') $profile.find('#username').text(value)
            else if (prop === 'email') $profile.find('#email').text(value)
            return true
        }
    })

    const profile = new Proxy(_config.profile, {
        set(target, prop, value) {
            target[prop] = value

            if (prop === 'gender') $profile.find('#gender').text(profile.gender === '1' ? '男' : profile.gender === '0' ? '女' : '')
            else if (prop === 'avatar') $avatars.prop('src', value)
            return true
        }
    })

    const terms = new Proxy(_config.terms, {
        set(target, prop, value) {
            target[prop] = value

            if (prop === 'used') $capacity.children(':first').text(custom.fileSizeFormat(value))
            return true
        }
    })

    const pagination = {offset: 0, limit: 5, next: true}


    // 页面绑定
    storageTab.on('show.mdb.tab', initStorageTable)
        .on('hide.mdb.tab', () => destroyTable($storageTable))
        .on('click', () => location.hash = '#storage')

    historyTab.on('show.mdb.tab', initHistoryTable)
        .on('hide.mdb.tab', () => destroyTable($historyTable))
        .on('click', () => location.hash = '#history')

    binTab.on('show.mdb.tab', initBinTable)
        .on('hide.mdb.tab', () => destroyTable($binTable))
        .on('click', () => location.hash = '#bin')

    profileTab.on('show.mdb.tab', initProfile)
        .on('hide.mdb.tab', destroyProfile)
        .on('click', () => location.hash = '#profile')

    mappingPage()

    document.querySelector('#avatar').addEventListener('click', () => profileTab._element.click())

    // 侧边栏
    window.innerWidth >= _config.BREAK_POINT ? sidebar.show() : sidebar.hide()

    window.addEventListener('resize', () => window.innerWidth > _config.BREAK_POINT ? sidebar.show() : sidebar.hide())

    // 哈希路由监听
    window.addEventListener('hashchange', mappingPage)

    // 保存信息
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('profile', JSON.stringify(_config.profile))
        localStorage.setItem('terms', JSON.stringify(_config.terms))
    })

    // 通知
    notice._element.addEventListener('show.mdb.dropdown', () => {
        $.get(_urls.notice, pagination, (res) => {
            notice._menu.insertAdjacentHTML('beforeend', templates.noticeTemplate(res.results))
            if (!res.next) pagination.next = false
        })
    }, {once: true})

    notice._menu.addEventListener('scroll', function () {
        if (this.scrollTop + this.clientHeight >= this.scrollHeight && pagination.next) {
            pagination.offset += pagination.limit
            pagination.limit += pagination.limit

            $.get(_urls.notice, pagination, (res) => {
                notice._menu.insertAdjacentHTML('beforeend', templates.noticeTemplate(res.results))
                if (!res.next) pagination.next = false
            })
        }
    })

    // 设置用户信息
    $capacity.children(':first').text(custom.fileSizeFormat(terms.used))
    $capacity.children(':last').text(custom.fileSizeFormat(terms.storage))

    $avatars.prop('src', profile.avatar)
    $profile.find('#username').text(user.username)
    $profile.find('#gender').text(profile.gender === '1' ? '男' : profile.gender === '0' ? '女' : '')
    $profile.find('#role').text(profile.role)
    $profile.find('#email').text(user.email)
    $profile.find('#date_joined').text(user.date_joined)


    // 映射页面
    function mappingPage() {
        let page = pageMap[location.hash]
        document.title = page.title
        page.tab.show()
    }

    // 移除个人信息界面事件
    function destroyProfile() {
        $profile.find('.action').off('click')
    }

    // 销毁表格
    function destroyTable($table) {
        let options = $table.bootstrapTable('getOptions')
        if (options.breadcrumb) options.breadcrumb.dispose()
        $(options.toolbar).find('.action').off('click change')

        $search.addClass('d-none').off('submit')
        $search.children(':first').off('input')
        $table.bootstrapTable('destroy')
    }

    // 排序
    function sortData(data, ordering, type) {
        let desc = ordering.charAt(0) === '-'
        let prop = desc ? ordering.substring(1) : ordering

        if (type === 'date') data.sort((obj1, obj2) => Date.parse(obj1[prop]) - Date.parse(obj2[prop]))
        else if (type === 'int') data.sort((obj1, obj2) => obj1[prop] - obj2[prop])
        else if (type === 'string') data.sort((obj1, obj2) => obj1[prop].localeCompare(obj2[prop]))

        if (desc) data.reverse()
    }

    // 更改
    function alterHandler(url, method, data, callback) {
        $.ajax(url, {
            method: method,
            data: JSON.stringify(data),
            success: (res) => {
                if (res.code === 200) {
                    if (callback) callback(res.data)
                    toast.setIcon(_fontawsome.success)
                } else {
                    toast.setIcon(_fontawsome.warning)
                }
                toast.setText(res.msg).show()
            }
        })
    }


    // 初始化存储表格
    function initStorageTable() {
        const checkFn = getCheckFn()

        const breadcrumb = new mdb.BreadCrumb('#breadcrumb', (uuid) => {
            $storageTable.bootstrapTable('refresh', {
                url: _urls.storage,
                query: {parent: uuid, ordering: storageMenu.getOrdering()}
            })
        })
        breadcrumb.append('我的云盘')

        $storageTable.bootstrapTable({
            url: _urls.storage,
            classes: 'table table-hover',
            breadcrumb: breadcrumb,
            toolbar: '#storageToolbar',
            toolbarAlign: 'none',
            clickToSelect: true,
            loadingTemplate: templates.loadingTemplate,
            showCustomView: false,
            customViewDefaultView: true,
            customView: customView,
            onToggleCustomView: () => $storageTable.bootstrapTable('uncheckAll'),
            onCustomViewPostBody: customViewEvents,
            queryParams: (params) => {
                params.ordering = storageMenu.getOrdering()
                return params
            },
            formatNoMatches: () => '无云盘文件',
            columns: [{
                checkbox: true,
            }, {
                field: 'file_name',
                title: '文件名',
                formatter: templates.fileNameFormatter,
                events: {
                    'dblclick .refresh': (e, value, row) => refresh(row.file_uuid, row.file_type, row.file_name)
                }
            }, {
                field: 'file_type',
                title: '文件类型',
                formatter: custom.fileTypeFormatter,
            }, {
                field: 'file_size',
                title: '文件大小',
                formatter: custom.fileSizeFormat,
            }, {
                field: 'create_time',
                title: '上传时间',
            }, {
                title: '操作',
                clickToSelect: false,
                formatter: templates.storageFormatter,
                events: {
                    'click .share': (e, value, row) => fileShare(row.file_uuid),
                    'click .download': (e, value, row) => fileDownload(row.file_uuid),
                    'click .move': (e, value, row) => fileMove(row.file_uuid),
                    'click .rename': (e, value, row, index) => fileRename(row.file_uuid, row.file_name, index),
                    'click .recycle': (e, value, row) => fileRecycle([row.file_uuid]),
                },
            }],
        })

        // 搜索
        let $input = $search.children(':first')
        $search.removeClass('d-none').on("submit", function (e) {
            e.preventDefault()
            let val = $input.val().trim()
            if (val) {
                $storageTable.bootstrapTable('refresh', {
                    url: _urls.files,
                    query: {search: val, ordering: storageMenu.getOrdering()},
                })
            }
        })
        $input.on('input', function () {
            if (!this.value) {
                $storageTable.bootstrapTable('refresh', {
                    url: _urls.storage,
                    query: {parent: breadcrumb.get(-1).dataset.uuid, ordering: storageMenu.getOrdering()},
                })
            }
        }).next().text('在云盘中搜索')

        // 工具栏绑定
        $($storageTable.bootstrapTable('getOptions').toolbar).find('.action').each((i, el) => {
            let $el = $(el)
            let callback

            switch ($el.data('action')) {
                case 'fileUpload':
                    $el.on('change', fileUpload)
                    return
                case 'folderUpload':
                    $el.on('change', folderUpload)
                    return
                case 'upload':
                    callback = () => $el.next().click()
                    break
                case 'toggle':
                    callback = () => {
                        $el.children(':first').toggleClass('fa-table fa-grip')
                        $storageTable.bootstrapTable('toggleCustomView')
                    }
                    break
                case 'recycle':
                    callback = () => fileRecycle($storageTable.bootstrapTable('getSelections').map(item => item.file_uuid))
                    break
                case 'sort':
                    callback = () => {
                        let data = $storageTable.bootstrapTable('getData')
                        let ordering = storageMenu.getOrdering()
                        let type = storageMenu.getType()
                        sortData(data, ordering, type)
                        $storageTable.bootstrapTable('load', data)
                    }
                    break
            }
            $el.on('click', callback)
        })

        // 自定义视图
        function customView(data) {
            if (data.length === 0) {
                return templates.elEmpty(`<p>使用工具栏上传文件</p>`)
            }
            let template = document.querySelector('#cardTemplate').innerHTML
            let view = ''
            for (let index = 0; index < data.length; index++) {
                let row = data[index]
                view += template
                    .replace(/%index%/g, index)
                    .replace(/%uuid%/g, row.file_uuid)
                    .replace(/%name%/g, row.file_name)
                    .replace('%type%', row.file_type)
                    .replace('%size%', custom.fileSizeFormat(row.file_size))
                    .replace('%icon%', _iconfont[row.file_type])
            }
            return `<div id="card-container" class="row g-3 row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4">${view}</div>`
        }

        // 自定义视图事件
        function customViewEvents() {
            let cardContainer = document.querySelector('#card-container')
            if (!cardContainer) return

            cardContainer.addEventListener('click', (evt) => {
                let el = evt.target
                let action = el.dataset.action

                if (el.tagName === 'I') {
                    el = el.parentElement
                    action = el.dataset.action
                }
                if (!action || action === 'check') return

                let uuid = el.dataset.uuid

                switch (action) {
                    case 'share':
                        fileShare(uuid)
                        break
                    case 'download':
                        fileDownload(uuid)
                        break
                    case 'move':
                        fileMove(uuid)
                        break
                    case 'rename':
                        fileRename(uuid, el.dataset.name, el.dataset.index)
                        break
                    case 'recycle':
                        fileRecycle([uuid])
                        break
                }
            })

            checkFn(cardContainer)
        }

        // 卡片选中
        function getCheckFn() {
            const check = (el) => {
                let checkbox = el.parentElement.parentElement.querySelector('input[type=checkbox]')
                let checked = checkbox.checked
                checkbox.checked = !checked

                if (checked) $storageTable.bootstrapTable('uncheck', el.dataset.index)
                else $storageTable.bootstrapTable('check', el.dataset.index)
            }

            // 移动端判断
            if (!custom.isMobile()) {
                return (container) => {
                    container.addEventListener('click', (evt) => {
                        let el = evt.target

                        if (el.dataset.action !== 'check') return

                        check(el)
                    })
                    container.addEventListener('dblclick', (evt) => {
                        let el = evt.target

                        if (el.dataset.action !== 'check') return

                        refresh(el.dataset.uuid, el.dataset.type, el.dataset.name)
                    })
                }
            } else {
                return (container) => {
                    let timer
                    let duration = 500
                    let silent = true
                    let press = false
                    let multiple = false

                    container.addEventListener('touchstart', () => {
                        timer = setTimeout(() => press = true, duration)
                    })
                    container.addEventListener('touchmove', () => {
                        silent = false
                    })
                    container.addEventListener('touchend', (evt) => {
                        clearTimeout(timer)
                        let el = evt.target

                        if (el.dataset.action !== 'check') {
                            press = false
                            silent = true
                            return
                        }

                        if (!multiple && press && silent) {
                            let checks = container.querySelectorAll('input[type=checkbox]')
                            checks.forEach((el) => el.classList.remove('d-none'))
                            multiple = true
                            check(el)
                        } else if (multiple && silent) {
                            check(el)
                            let checks = container.querySelectorAll('input[type=checkbox]')
                            if (Array.from(checks).filter((el) => el.checked).length === 0) {
                                multiple = false
                                checks.forEach(el => el.classList.add('d-none'))
                            }
                        } else if (!press && silent) {
                            refresh(el.dataset.uuid, el.dataset.type, el.dataset.name)
                        }

                        press = false
                        silent = true
                    })
                }
            }
        }

        // 进入目录或文件详情
        function refresh(uuid, type, name) {
            if (String(type) === 'null') {
                $storageTable.bootstrapTable('refresh', {
                    url: _urls.storage,
                    query: {parent: uuid, ordering: storageMenu.getOrdering()}
                })
                breadcrumb.append(name, {uuid: uuid})
            } else {
                window.open(_urls.fileDetailPath(uuid), '_blank')
            }
        }

        // 文件移动
        function fileMove(uuid) {
            let moveModalEl = document.querySelector('#moveModal')
            let moveModal = new mdb.Modal(moveModalEl)
            let moveBtn = moveModalEl.querySelector('#moveBtn')

            getFolderData(undefined, uuid).done((data) => {
                let treeList = new mdb.TreeList('#folderList', getFolderData, uuid)
                treeList.render(data)

                const callback = () => {
                    $storageTable.bootstrapTable('remove', {field: 'file_uuid', values: [uuid]})
                    moveModal.hide()
                }

                const move = () => {
                    alterHandler(_urls.fileMove(uuid), 'POST', {dst_uuid: treeList.selected}, callback)
                }

                moveModal.once('show.mdb.modal', () => {
                    moveBtn.addEventListener('click', move)
                }).once('hidden.mdb.modal', () => {
                    moveBtn.removeEventListener('click', move)
                    treeList.dispose()
                    moveModal.dispose()
                }).show()
            })
        }

        // 获取文件夹数据
        function getFolderData(parent, exclude) {
            return $.ajax(_urls.folders, {
                data: {parent: parent, exclude: exclude},
                dataFilter: (rawData) => {
                    return JSON.stringify(JSON.parse(rawData).map((item) => {
                        return {text: item.file_name, value: item.file_uuid}
                    }))
                }
            })
        }

        // 文件回收
        function fileRecycle(uuids) {
            if (uuids.length === 0) {
                alert.setType('alert-warning').setIcon(_fontawsome.warning).setText('没有选中任何文件').show()
            } else {
                const callback = () => $storageTable.bootstrapTable('remove', {field: 'file_uuid', values: uuids})
                alterHandler(_urls.fileRecycle, 'POST', {uuids: uuids}, callback)
            }
        }

        // 文件下载
        function fileDownload(uuid) {
            toast.setIcon(_fontawsome.info).setText('正在打包请稍等').show()
            location.href = _urls.fileBinary(uuid)
        }

        // 文件重命名
        function fileRename(uuid, name, index) {
            let modalEl = document.querySelector('#filenameModal')
            let form = modalEl.querySelector('form')

            let validation = custom.getInitial(form)
            let modal = new mdb.Modal(modalEl)
            let parts = name.split('.')
            name = parts.length === 1 ? name : parts.slice(0, -1).join('.')

            const callback = (data) => {
                $storageTable.bootstrapTable('updateRow', {index: index, row: {'file_name': data.file_name}})
                modal.hide()
            }

            const submit = (evt) => {
                evt.preventDefault()
                if (!form.checkValidity()) {
                    custom.setInitial(form, validation)
                } else {
                    alterHandler(_urls.fileDetail(uuid), 'PATCH', domutil.serializeForm(form), callback)
                }
            }

            modal.once('show.mdb.modal', () => {
                form.addEventListener('submit', submit)
                form.querySelector('input[name=file_name]').value = name
            }).once('hidden.mdb.modal', () => {
                form.removeEventListener('submit', submit)
                modal.dispose()
            }).show()
        }

        // 文件分享
        function fileShare(uuid) {
            let modalEl = document.querySelector('#shareModal')
            let delta = modalEl.querySelector('#delta')
            let summary = modalEl.querySelector('#summary')
            let modal = new mdb.Modal(modalEl)

            let expiryChange = false
            let summaryChange = false

            // 获取填充密匙
            $.get(_urls.fileShare(uuid), (data) => {
                modalEl.querySelector('#shareKey').textContent = data.secret_key
                modalEl.querySelector('#shareLink').textContent = _urls.fileSharePath(data.signature)

                // 复制回调
                const resolve = () => alert.setType('alert-success').setIcon(_fontawsome.success).setText('复制成功').show()
                const reject = () => alert.setType('alert-warning').setIcon(_fontawsome.warning).setText('复制失败').show()

                // 功能函数
                const copyKey = () => custom.copyText(data.secret_key, resolve, reject)
                const copyLink = () => custom.copyText(_urls.fileSharePath(data.signature), resolve, reject)
                const copyAll = () => custom.copyText(`文件: ${data.file.file_name}\n口令分享: ${data.secret_key}\n链接分享: ${_urls.fileSharePath(data.signature)}`.trim(), resolve, reject)
                const changeSummary = () => summaryChange = true
                const changeExpiry = (el) => {
                    expiryChange = true
                    delta.dataset.delta = el.dataset.delta
                    delta.textContent = el.textContent
                }

                // 点击事件回调
                const callback = (evt) => {
                    let el = evt.target
                    let action = el.dataset.action

                    if (!action) return

                    switch (action) {
                        case 'copyKey':
                            copyKey()
                            break
                        case 'copyLink':
                            copyLink()
                            break
                        case 'copyAll':
                            copyAll()
                            break
                        case 'changeSummary':
                            changeSummary()
                            break
                        case 'changeExpiry':
                            changeExpiry(el)
                            break
                    }
                }

                // 绑定监听和卸载
                modal.once('show.mdb.modal', () => {
                    modalEl.addEventListener('click', callback)
                }).once('hidden.mdb.modal', () => {
                    modalEl.removeEventListener('click', callback)

                    if (expiryChange || summaryChange) {
                        alterHandler(_urls.shareDetail(data.pk), 'PATCH', {
                            delta: expiryChange ? Number(delta.dataset.delta) : undefined,
                            summary: summaryChange ? summary.value : undefined
                        })
                    }
                    modal.dispose()
                }).show()
            })
        }

        // 文件上传
        function fileUpload() {
            let file = this.files[0]
            let size = file.size
            let used = size + terms.used

            if (used > terms.storage) {
                toast.setIcon(_fontawsome.warning).setText('剩余空间不足').show()
            } else if (size > _config.MAX_UPLOAD_FILE_SIZE) {
                toast.setIcon(_fontawsome.warning).setText(`单次上传不能超过${custom.fileSizeFormat(_config.MAX_UPLOAD_FILE_SIZE)}`).show()
            } else {
                let formData = new FormData()
                let name = file.name
                let parent = breadcrumb.get(-1).dataset.uuid

                if (parent) formData.append('parent', parent)
                formData.append('file', file)

                uploadPreHandler(_urls.fileUpload, name, formData, used)
            }
            this.value = ''
        }

        // 文件夹上传
        function folderUpload() {
            let size = 0
            let upload_nums = 0
            for (const file of this.files) {
                size += file.size
                upload_nums += 2
            }
            let used = size + terms.used

            if (used > terms.storage) {
                toast.setIcon(_fontawsome.warning).setText('剩余空间不足').show()
            } else if (used > _config.MAX_UPLOAD_FILE_SIZE) {
                toast.setIcon(_fontawsome.warning).setText(`单次上传不能超过${custom.fileSizeFormat(_config.MAX_UPLOAD_FILE_SIZE)}`).show()
            } else if (upload_nums > _config.DATA_UPLOAD_MAX_NUMBER_FIELDS) {
                toast.setIcon(_fontawsome.warning).setText(`上传条目数超过${_config.DATA_UPLOAD_MAX_NUMBER_FIELDS}限制`).show()
            } else {
                let formData = new FormData()
                let name = this.files[0].webkitRelativePath.split('/')[0]
                let parent = breadcrumb.get(-1).dataset.uuid

                if (parent) formData.append('parent', parent)

                formData.append('name', name)
                for (const file of this.files) {
                    formData.append('files', file)
                    formData.append('paths', file.webkitRelativePath)
                }
                uploadPreHandler(_urls.folderUpload, name, formData, used)
            }
            this.value = ''
        }

        // 重名检查
        function uploadPreHandler(url, name, data, used) {
            let tableData = $storageTable.bootstrapTable('getData')
            let exist = tableData.filter((item) => item.file_name === name).length !== 0

            if (exist) toast.setIcon(_fontawsome.warning).setText('目标文件夹内存在同名文件').show()
            else uploadHandler(url, data, used)
        }

        //上传处理
        function uploadHandler(url, data, used) {
            let uploadBtn = document.querySelector('#uploadBtn')
            let uploadToastEl = document.querySelector('#uploadToast')
            let uploadToast = new mdb.Toast(uploadToastEl, {autohide: false})
            let cancelBtn = uploadToastEl.querySelector('.btn-close')
            let progressbar = uploadToastEl.querySelector('.progress-bar')

            let xhr = new XMLHttpRequest()

            xhr.upload.addEventListener('progress', (e) => {
                let rate = Math.floor(e.loaded / e.total * 100) + '%'

                progressbar.style.setProperty('width', rate)
                progressbar.textContent = rate
                if (rate === '100%') toast.setIcon(_fontawsome.info).setText('正在同步文件结构，请稍等').show()
            })

            uploadBtn.disabled = true
            uploadToast.once('hidden.mdb.toast', () => uploadToast.dispose()).show()
            cancelBtn.addEventListener('click', cancel)
            window.addEventListener('beforeunload', beforeLeave)

            function cancel() {
                modal.setTitle('你确定取消上传吗')
                    .setBtnType('btn btn-warning')
                    .once('show.mdb.modal', () => modal.getBtn().addEventListener('click', cancelUpload))
                    .once('hide.mdb.modal', () => modal.getBtn().removeEventListener('click', cancelUpload))
                    .show()

                function cancelUpload() {
                    xhr.abort()
                    modal.hide()
                    cancelBtn.removeEventListener('click', cancel)
                }
            }

            function beforeLeave(e) {
                e.preventDefault()
                e.returnValue = ''
            }

            $.ajax(url, {
                method: 'POST',
                data: data,
                contentType: false,
                processData: false,
                xhr: () => xhr,
                complete: () => {
                    if (uploadToast.isShown()) uploadToast.hide()
                    else uploadToast.once('shown.mdb.toast', () => uploadToast.hide())

                    uploadBtn.disabled = false
                    cancelBtn.removeEventListener('click', cancel)
                    window.removeEventListener('beforeunload', beforeLeave)
                },
                success: (data) => {
                    $storageTable.bootstrapTable('append', [data])
                    terms.used = used
                    toast.setIcon(_fontawsome.success).setText('上传成功').show()
                },
                error: () => toast.setIcon(_fontawsome.warning).setText('上传失败').show()
            })
        }
    }


    // 初始化历史记录表格
    function initHistoryTable() {
        $historyTable.bootstrapTable({
            url: _urls.share,
            dataField: 'results',
            totalField: 'count',
            sidePagination: 'server',
            classes: 'table table-hover',
            toolbar: '#historyToolbar',
            toolbarAlign: 'end',
            showCustomView: false,
            clickToSelect: true,
            pagination: true,
            pageSize: 8,
            paginationHAlign: 'end',
            paginationParts: ['pageList'],
            loadingTemplate: templates.loadingTemplate,
            queryParams: (params) => {
                params.ordering = historyMenu.getOrdering()
                return params
            },
            formatNoMatches: () => '无传输历史',
            columns: [{
                checkbox: true,
            }, {
                field: 'file.file_name',
                title: '文件名',
                formatter: templates.fileNameFormatter,
            }, {
                field: 'create_time',
                title: '创建时间',
            }, {
                field: 'expire_time',
                title: '过期时间',
                formatter: custom.humanizeTime,
            }, {
                title: '操作',
                clickToSelect: false,
                formatter: templates.historyFormatter,
                events: {
                    'click .copy': (e, value, row) => linkCopy(row),
                    'click .setup': (e, value, row, index) => shareSetup(row, index),
                    'click .remove': (e, value, row) => shareRemove([row.pk]),
                }
            }],
        })

        // 搜索
        let $input = $search.children(':first')
        $search.removeClass('d-none').on('submit', function (e) {
            e.preventDefault()
            let val = $input.val().trim()
            if (val) {
                $historyTable.bootstrapTable('refreshOptions', {
                    queryParams: (params) => {
                        params.search = val
                        params.ordering = historyMenu.getOrdering()
                        return params
                    }
                })
            }
        })
        $input.on('input', function () {
            if (!this.value) {
                $historyTable.bootstrapTable('refreshOptions', {
                    queryParams: (params) => {
                        params.ordering = historyMenu.getOrdering()
                        return params
                    }
                })
            }
        }).next().text('在传输历史中搜索')

        // 工具栏功能绑定
        $($historyTable.bootstrapTable('getOptions').toolbar).find('.action').each((i, el) => {
            let $el = $(el)
            let callback

            switch ($el.data('action')) {
                case 'remove':
                    callback = () => shareRemove($historyTable.bootstrapTable('getSelections').map(item => item.pk))
                    break
                case 'sort':
                    callback = () => $historyTable.bootstrapTable('refresh', {query: {ordering: historyMenu.getOrdering()}})
                    break
            }
            $el.on('click', callback)
        })

        // 复制链接
        function linkCopy(data) {
            let resolve = () => alert.setType('alert-success').setIcon(_fontawsome.success).setText('复制成功').show()
            let reject = () => alert.setType('alert-warning').setIcon(_fontawsome.warning).setText('复制失败').show()
            custom.copyText(`文件: ${data.file.file_name}\n口令分享: ${data.secret_key}\n链接分享: ${_urls.fileSharePath(data.signature)}`.trim(), resolve, reject)
        }

        // 分享删除
        function shareRemove(pks) {
            if (pks.length === 0) {
                alert.setType('alert-warning').setIcon(_fontawsome.warning).setText('没有选中任何记录').show()
            } else {
                modal.setTitle('你确定删除所选记录吗')
                    .setBtnType('btn btn-danger')
                    .once('show.mdb.modal', () => modal.getBtn().addEventListener('click', remove))
                    .once('hide.mdb.modal', () => modal.getBtn().removeEventListener('click', remove))
                    .show()

                function remove() {
                    const callback = () => $historyTable.bootstrapTable('remove', {field: 'pk', values: pks})
                    alterHandler(_urls.shareRemove, 'DELETE', {pks: pks}, callback)
                    modal.hide()
                }
            }
        }

        // 分享设置
        function shareSetup(data, index) {
            let modalEl = document.querySelector('#shareModal')
            let delta = modalEl.querySelector('#delta')
            let summary = modalEl.querySelector('#summary')
            let modal = new mdb.Modal(modalEl)

            let expiryChange = false
            let summaryChange = false

            modalEl.querySelector('#shareKey').textContent = data.secret_key
            modalEl.querySelector('#shareLink').textContent = _urls.fileSharePath(data.signature)
            summary.value = data.summary

            // 复制回调
            const resolve = () => alert.setType('alert-success').setIcon(_fontawsome.success).setText('复制成功').show()
            const reject = () => alert.setType('alert-warning').setIcon(_fontawsome.warning).setText('复制失败').show()

            // 功能函数
            const copyKey = () => custom.copyText(data.secret_key, resolve, reject)
            const copyLink = () => custom.copyText(_urls.fileSharePath(data.signature), resolve, reject)
            const copyAll = () => custom.copyText(`文件: ${data.file.file_name}\n口令分享: ${data.secret_key}\n链接分享: ${_urls.fileSharePath(data.signature)}`.trim(), resolve, reject)
            const changeSummary = () => summaryChange = true
            const changeExpiry = (el) => {
                expiryChange = true
                delta.dataset.delta = el.dataset.delta
                delta.textContent = el.textContent
            }

            // 点击事件回调
            const callback = (evt) => {
                let el = evt.target
                let action = el.dataset.action

                if (!action) return

                switch (action) {
                    case 'copyKey':
                        copyKey()
                        break
                    case 'copyLink':
                        copyLink()
                        break
                    case 'copyAll':
                        copyAll()
                        break
                    case 'changeSummary':
                        changeSummary()
                        break
                    case 'changeExpiry':
                        changeExpiry(el)
                        break
                }
            }

            // 绑定监听和卸载
            modal.once('show.mdb.modal', () => {
                modalEl.addEventListener('click', callback)
            }).once('hidden.mdb.modal', () => {
                modalEl.removeEventListener('click', callback)

                if (expiryChange || summaryChange) {
                    const callback = (data) => $historyTable.bootstrapTable('updateRow', {
                        index: index,
                        row: {
                            'expire_time': data.expire_time,
                            'summary': data.summary,
                        }
                    })
                    alterHandler(_urls.shareDetail(data.pk), 'PATCH', {
                        delta: expiryChange ? Number(delta.dataset.delta) : undefined,
                        summary: summaryChange ? summary.value : undefined
                    }, callback)
                }
                modal.dispose()
            }).show()
        }
    }


    // 初始化回收站表格
    function initBinTable() {
        $binTable.bootstrapTable({
            url: _urls.bin,
            dataField: 'results',
            totalField: 'count',
            sidePagination: 'server',
            classes: 'table table-hover',
            toolbar: '#binToolbar',
            toolbarAlign: 'end',
            showCustomView: false,
            clickToSelect: true,
            pagination: true,
            pageSize: 8,
            paginationHAlign: 'end',
            paginationParts: ['pageList'],
            loadingTemplate: templates.loadingTemplate,
            queryParams: (params) => {
                params.ordering = binMenu.getOrdering()
                return params
            },
            formatNoMatches: () => '无回收文件',
            columns: [{
                checkbox: true,
            }, {
                field: 'origin.file_name',
                title: '文件名',
                formatter: templates.fileNameFormatter,
            }, {
                field: 'origin.file_type',
                title: '文件类型',
                formatter: custom.fileTypeFormatter,
            }, {
                field: 'origin.file_size',
                title: '文件大小',
                formatter: custom.fileSizeFormat,
            }, {
                field: 'create_time',
                title: '删除时间',
            }, {
                title: '操作',
                clickToSelect: false,
                formatter: templates.binFormatter,
                events: {
                    'click .recover': (e, value, row) => fileRecover([row.pk]),
                    'click .remove': (e, value, row) => fileRemove([row.pk], row.origin.file_size),
                }
            }],
        })

        // 搜索
        let $input = $search.children(':first')
        $search.removeClass('d-none').on('submit', function (e) {
            e.preventDefault()
            let val = $input.val().trim()
            if (val) {
                $binTable.bootstrapTable('refreshOptions', {
                    queryParams: (params) => {
                        params.search = val
                        params.ordering = binMenu.getOrdering()
                        return params
                    }
                })
            }
        })
        $input.on('input', function () {
            if (!this.value) {
                $binTable.bootstrapTable('refreshOptions', {
                    queryParams: (params) => {
                        params.ordering = binMenu.getOrdering()
                        return params
                    }
                })
            }
        }).next().text('在回收站中搜索')

        // 工具栏功能绑定
        $($binTable.bootstrapTable('getOptions').toolbar).find('.action').each((i, el) => {
            let $el = $(el)
            let callback

            switch ($el.data('action')) {
                case 'recover':
                    callback = () => fileRecover($binTable.bootstrapTable('getSelections').map(item => item.pk))
                    break
                case 'remove':
                    callback = () => {
                        let data = $binTable.bootstrapTable('getSelections')
                        let pks = []
                        let size = 0
                        for (const item of data) {
                            pks.push(item.pk)
                            size += item.origin.file_size
                        }
                        fileRemove(pks, size)
                    }
                    break
                case 'sort':
                    callback = () => $binTable.bootstrapTable('refresh', {query: {ordering: binMenu.getOrdering()}})
                    break
            }
            $el.on('click', callback)
        })

        // 文件恢复
        function fileRecover(pks) {
            if (pks.length === 0) {
                alert.setType('alert-warning').setIcon(_fontawsome.warning).setText('没有选择任何文件').show()
            } else {
                const callback = () => $binTable.bootstrapTable('remove', {field: 'pk', values: pks})
                alterHandler(_urls.binRecover, 'POST', {pks: pks}, callback)
            }
        }

        // 文件彻底删除
        function fileRemove(pks, size) {
            if (pks.length === 0) {
                alert.setType('alert-warning').setIcon(_fontawsome.warning).setText('没有选择任何文件').show()
            } else {
                modal.setTitle('你确定永久删除所选文件吗')
                    .setBtnType('btn btn-danger')
                    .once('show.mdb.modal', () => modal.getBtn().addEventListener('click', remove))
                    .once('hide.mdb.modal', () => modal.getBtn().removeEventListener('click', remove))
                    .show()

                function remove() {
                    const callback = () => {
                        $binTable.bootstrapTable('remove', {field: 'pk', values: pks})
                        terms.used = terms.used - size
                    }
                    alterHandler(_urls.binRemove, 'DELETE', {pks: pks}, callback)
                    modal.hide()
                }
            }
        }
    }


    // 初始化个人信息页面
    function initProfile() {
        $search.addClass('d-none')

        // 功能绑定
        $profile.find('.action').each((i, el) => {
            let $el = $(el)
            let callback

            switch ($el.data('action')) {
                case 'avatar':
                    callback = alterAvatar
                    break
                case 'profile':
                    callback = alterProfile
                    break
                case 'record':
                    callback = showRecord
                    break
                case 'password':
                    callback = () => alterModal('passwordModal', _urls.password, 'POST')
                    break
                case 'letter':
                    callback = () => alterModal('letterModal', _urls.letter, 'POST')
                    break
            }
            $el.on('click', callback)
        })

        // 提交记录
        function showRecord() {
            let recordModalEl = document.querySelector('#recordModal')
            let recordModal = new mdb.Modal(recordModalEl)
            let messageGroup = recordModalEl.querySelector('#messagePane').firstElementChild
            let applyGroup = recordModalEl.querySelector('#applyPane').firstElementChild

            recordModal.once('show.mdb.modal', () => {
                $.get(_urls.letter, (data) => {
                    let messageData = data.filter((item) => item.action === '0')
                    let applyData = data.filter((item) => item.action === '1')

                    messageGroup.insertAdjacentHTML('beforeend', templates.messageTemplate(messageData))
                    applyGroup.insertAdjacentHTML('beforeend', templates.applyTemplate(applyData))
                })
            }).once('hidden.mdb.modal', () => {
                domutil.removeChildren(messageGroup)
                domutil.removeChildren(applyGroup)
                recordModal.dispose()
            }).show()
        }

        // 修改头像
        function alterAvatar() {
            let avatarModalEl = document.querySelector('#avatarModal')
            let avatarModal = new mdb.Modal(avatarModalEl)
            let avatarEl = avatarModalEl.querySelector('.avatar')
            let previewEl = avatarModalEl.querySelector('.preview')
            let $actions = $(avatarModalEl).find('.action')
            let avatar
            let cropper

            avatarModal.once('shown.mdb.modal', () => {
                cropper = new Cropper(avatarEl, {
                    preview: previewEl,
                    aspectRatio: 1,
                    autoCropArea: 0.5,
                    dragMode: 'move',
                    center: false,
                    highlight: false,
                    toggleDragModeOnDblclick: false,
                })

                $actions.each((i, el) => {
                    let $el = $(el)
                    let callback

                    switch ($el.data('action')) {
                        case 'rotateRight':
                            callback = () => cropper.rotate(45)
                            break
                        case 'rotateLeft':
                            callback = () => cropper.rotate(-45)
                            break
                        case 'zoomOut':
                            callback = () => cropper.zoom(0.1)
                            break
                        case 'zoomIn':
                            callback = () => cropper.zoom(-0.1)
                            break
                        case 'reset':
                            callback = () => cropper.reset()
                            break
                        case 'upload':
                            callback = () => $el.next().click()
                            break
                        case 'avatarUpload':
                            $el.on('change', function () {
                                let file = this.files[0]
                                let reader = new FileReader()

                                reader.onload = (e) => cropper.replace(e.target.result)
                                reader.readAsDataURL(file)

                                this.value = ''
                            })
                            return
                        case 'confirm':
                            callback = () => {
                                cropper.getCroppedCanvas().toBlob((blob) => {
                                    if (blob.size > _config.MAX_AVATAR_SIZE) {
                                        toast.setIcon(_fontawsome.warning)
                                            .setText(`上传图片不能大于${custom.fileSizeFormat(_config.MAX_AVATAR_SIZE)}`)
                                            .show()
                                    } else {
                                        let formData = new FormData()
                                        formData.append('avatar', blob, 'upload.png')
                                        $el.prop('disabled', true)

                                        $.ajax(_urls.profile, {
                                            method: 'PATCH',
                                            data: formData,
                                            processData: false,
                                            contentType: false,
                                            complete: () => $el.prop('disabled', false),
                                            success: (res) => {
                                                if (res.code === 200) {
                                                    cropper.replace(res.data.avatar)
                                                    profile.avatar = res.data.avatar
                                                    avatar = res.data.avatar
                                                    toast.setIcon(_fontawsome.success).setText('上传成功').show()
                                                }
                                            },
                                            error: () => toast.setIcon(_fontawsome.warning).setText('上传失败').show()
                                        })
                                    }
                                })
                            }
                            break
                    }
                    $el.on('click', callback)
                })
            }).once('hidden.mdb.modal', () => {
                $actions.off('click change')
                cropper.destroy()
                avatarModal.dispose()
                if (avatar) avatarEl.src = avatar
            }).show()
        }

        // 修改个人信息
        function alterProfile() {
            let modalEl = document.querySelector('#profileModal')
            let modal = new mdb.Modal(modalEl)
            let buttons = modalEl.querySelectorAll('.btn-light')

            function toggle() {
                let callback
                switch (this.dataset.target) {
                    case 'nameModal':
                        callback = (data) => user.username = data.username
                        break
                    case 'emailModal':
                        callback = (data) => user.email = data.email
                        break
                    case 'genderModal':
                        callback = (data) => profile.gender = data.gender
                        break
                }
                modal.hide()
                alterModal(this.dataset.target, _urls[this.dataset.url], 'PATCH', callback)
            }

            modal.once('show.mdb.modal', () => {
                buttons.forEach((btn) => btn.addEventListener('click', toggle))
            }).once('hidden.mdb.modal', () => {
                buttons.forEach((btn) => btn.removeEventListener('click', toggle))
                modal.dispose()
            }).show()
        }

        // 修改modal
        function alterModal(id, url, method, callback) {
            let modalEl = document.getElementById(id)
            let modal = new mdb.Modal(modalEl)
            let form = modalEl.querySelector('form')
            let btn = modalEl.querySelector('.btn-primary')
            let validations = custom.getInitial(form)

            function submit() {
                if (!form.checkValidity()) {
                    custom.setInitial(form, validations)
                } else {
                    alterHandler(url, method, form, btn, callback)
                }
            }

            modal.once('show.mdb.modal', () => {
                btn.addEventListener('click', submit)
            }).once('hidden.mdb.modal', () => {
                btn.removeEventListener('click', submit)
                modal.dispose()
            }).show()
        }

        // 验证和更改
        function alterHandler(url, method, form, btn, callback) {
            btn.disabled = true
            form.classList.remove('was-validated')
            form.querySelectorAll('input, textarea').forEach((el) => {
                el.classList.remove('is-invalid')
            })

            $.ajax(url, {
                method: method,
                data: JSON.stringify(domutil.serializeForm(form)),
                complete: () => btn.disabled = false,
                success: (res) => {
                    if (res.code === 200) {
                        if (callback) callback(res.data)
                        toast.setIcon(_fontawsome.success).setText(res.msg).show()
                    } else {
                        for (const [key, value] of Object.entries(res.errors)) {
                            let el = form.querySelector(`input[name=${key}]`) || form.querySelector(`textarea[name=${key}]`)
                            let div = domutil.nextSiblings(el, '.invalid-feedback').pop()
                            div.textContent = value.join(', ')
                            el.classList.add('is-invalid')
                        }
                    }
                },
                error: () => toast.setIcon(_fontawsome.warning).setText('失败').show()
            })
        }
    }

})