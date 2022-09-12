$(document).ready(function () {
    'use strict'

    let toggleView = 'customView'
    let cloudTable = $('#cloudTable')
    let stackNav = [$('.breadcrumb-item:first')]

    let alert = new custom.Alert($('#alert'))
    let toast = new custom.Toast($('#toast'))
    let modal = new custom.Modal($('#modal'))
    let shareModal = new custom.BaseModal($('#shareModal'))
    let moveModal = new custom.BaseModal($('#moveModal'))

    shareModal.elem.on('hidden.mdb.modal', function () {
        shareModal.elem.find('#delta').data('customDelta', 7).text('7天')
    })
    moveModal.elem.on('hidden.mdb.modal', function () {
        moveModal.elem.find('.modal-body').empty()
    })

    cloudTable.bootstrapTable({
        url: ctx + '/api/cloud',
        classes: 'table table-hover',
        toolbar: '#toolbar',
        clickToSelect: true,
        showCustomView: true,
        loadingTemplate: table.loadingTemplate,
        customView: customView,
        formatNoMatches: function () {
            return '无云盘文件'
        },
        columns: [{
            checkbox: true,
        }, {
            field: 'file_name',
            title: '文件名称',
            formatter: table.fileNameFormatter,
        }, {
            field: 'file_type',
            title: '文件类型',
            formatter: table.fileTypeFormatter,
        }, {
            field: 'file_size',
            title: '文件大小',
            formatter: custom.fileSizeFormat,
        }, {
            field: 'create_time',
            title: '上传时间',
        }, {
            clickToSelect: false,
            formatter: actionsFormatter,
        }],
    })

    table.tableSearch(cloudTable)

    // 重置面包屑导航
    cloudTable.on('refresh-options.bs.table', function () {
        let dom = $('<ol class="breadcrumb mb-0"></ol>').append(stackNav[0].addClass('breadcrumb-active'))
        $('.breadcrumb').replaceWith(dom)
    })

    // 排序
    $('.sort').click(function () {
        let sortBy = this.dataset.customSort
        let folderUUID = stackNav[stackNav.length - 1].data('customUuid')
        $('#sortBy').text(this.textContent).data('customSort', sortBy)
        cloudTable.bootstrapTable('refresh', {
            query: {
                folderUUID: folderUUID === '' ? undefined : folderUUID,
                order: $('#sortOrder').data('customOrder'),
                sort: sortBy
            }
        })
    })

    // 升降序
    $('#sortOrder').click(function () {
        let elem = $(this)
        let folderUUID = stackNav[stackNav.length - 1].data('customUuid')
        elem.data('customOrder') === 'desc' ? elem.data('customOrder', 'asc') : elem.data('customOrder', 'desc')
        elem.children().first().toggleClass('fa-sort-down fa-sort-up')
        cloudTable.bootstrapTable('refresh', {
            query: {
                folderUUID: folderUUID === '' ? undefined : folderUUID,
                order: elem.data('customOrder'),
                sort: $('#sortBy').data('customSort')
            }
        })
    })

    // 切换视图
    $('#toggleViewBtn').click(function () {
        $(this).children().first().toggleClass('fa-grip-horizontal fa-table')
        cloudTable.bootstrapTable('toggleCustomView')
        cloudTable.bootstrapTable('uncheckAll')
        toggleView = toggleView === 'customView' ? 'tableView' : 'customView'
    })

    // 上传文件
    $('.upload').click(function () {
        this.nextElementSibling.click()
    })

    $('.uploadInput').each(function (i, elem) {
        let func = null

        switch (elem.dataset.customMethod) {
            case "uploadFile":
                func = fileUpload
                break
            case "uploadDir":
                func = folderUpload
                break
        }
        elem.addEventListener('change', func)
    })

    // 删除所选文件
    $('#trashBtn').click(function () {
        let checks = toggleView === 'customView' ? $('.fixed-table-custom-view input[type=checkbox]:checked') : cloudTable.bootstrapTable('getSelections')

        if (checks.length === 0) {
            toast.setIcon('fas fa-exclamation-circle fa-lg text-warning')
            toast.setText('没有选择任何文件')
            toast.getToast().show()
        } else {
            modal.setTitle('你确定删除所选文件吗')
            modal.setBtnType('btn btn-danger')

            function trash() {
                let folderUUID = stackNav[stackNav.length - 1].data('customUuid')
                let uuids = toggleView === 'customView' ? $.map(checks, function (item) {
                    return item.dataset.customUuid
                }) : checks.map(function (item) {
                    return item.file_uuid
                })

                table.alterCallback(ctx + '/trash', {
                    method: 'trash',
                    uuids: uuids
                }, toast, cloudTable, folderUUID === '' ? undefined : folderUUID)

                modal.getModal().hide()
            }

            modal.elem.one('show.mdb.modal', function () {
                modal.btn.on('click', trash)
            }).one('hide.mdb.modal', function () {
                modal.btn.off('click', trash)
            })

            modal.getModal().show()
        }
    })

    // 卡片视图初始化
    cloudTable.on('custom-view-post-body.bs.table', function () {
        operateBind()
        checkBind()
    })

    // 表格视图初始化
    cloudTable.on('post-body.bs.table', function () {
        operateBind()
    })

    cloudTable.on('dbl-click-cell.bs.table', function (e, field, value, row) {
        if (field === 'file_name') {
            if (row.file_cate === '1') {
                addCrumb(row.file_name, row.file_uuid)
                cloudTable.bootstrapTable('refresh', {query: {folderUUID: row.file_uuid}})
            } else {
                location.href = ctx + `/detail?uuid=${row.file_uuid}`
            }
        }
    })

    /**
     * 表格配置函数
     */
    function customView(data) {
        if (data.length === 0) {
            return $('#emptyTemplate').html()
        }
        let template = $('#cloudTemplate').html()
        let view = ''
        $.each(data, function (i, row) {
            let icon = table.icons[row.file_type]
            view += template
                .replace('%file_cate%', row.file_cate)
                .replace(/%file_uuid%/g, row.file_uuid)
                .replace(/%file_name%/g, row.file_name)
                .replace('%file_size%', custom.fileSizeFormat(row.file_size))
                .replace('%file_icon%', icon === undefined ? 'file_default' : icon)
        })
        return `<div class="row gx-3 gy-3 row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 mx-0">${view}</div>`
    }

    function actionsFormatter(value, row) {
        return `<div class="d-flex flex-column flex-md-row align-items-center">
                    <a class="icon-link custom-link" href="javascript:void(0)" data-custom-method="fileShare" 
                        data-custom-uuid="${row.file_uuid}">
                        <i class="fas fa-paper-plane"></i>
                    </a>
                    <a class="ms-md-3 icon-link dropdown-toggle hidden-arrow" href="javascript:void(0)"
                            data-mdb-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item custom-link icon-link" data-custom-method="fileDownload" 
                                data-custom-uuid="${row.file_uuid}" href="javascript:void(0)"><i class="fas fa-file-download me-2"></i>下载</a></li>
                        <li><a class="dropdown-item custom-link icon-link" data-custom-method="fileMove" 
                                data-custom-uuid="${row.file_uuid}" href="javascript:void(0)"><i class="fas fa-expand-arrows-alt me-2"></i>移动</a></li>
                        <li><a class="dropdown-item custom-link icon-link" data-custom-method="fileTrash" 
                                data-custom-uuid="${row.file_uuid}" href="javascript:void(0)"><i class="fas fa-trash me-2"></i>删除</a></li>
                    </ul>
                </div>`
    }

    /**
     *  辅助方法
     */

    // 文件操作绑定
    function operateBind() {
        $('.custom-link').each(function (i, elem) {
            let uuid = elem.dataset.customUuid
            let func = null

            switch (elem.dataset.customMethod) {
                case 'fileShare':
                    func = function () {
                        fileShare(uuid)
                    }
                    break
                case 'fileDownload':
                    func = function () {
                        fileDownload(uuid)
                    }
                    break
                case 'fileMove':
                    func = function () {
                        fileMove(uuid)
                    }
                    break
                case 'fileTrash':
                    func = function () {
                        fileTrash(uuid)
                    }
                    break
            }
            elem.addEventListener('click', func)
        })
    }

    // 选择行为绑定
    function checkBind() {
        let timer
        let duration = 500
        let click = true
        let multiple = false
        let cards = $('.custom-view')
        let isMobile = custom.isMobile()

        function checkIt() {
            let elem = $(this).find('input[type=checkbox]')
            elem.attr('checked', !elem.attr('checked'))
        }

        function jumpTo() {
            let elem = $(this)
            if (elem.data('customCate') === 1) {
                addCrumb(elem.data('customName'), elem.data('customUuid'))
                cloudTable.bootstrapTable('refresh', {query: {folderUUID: elem.data('customUuid')}})
            } else {
                location.href = ctx + `/detail?uuid=${elem.data('customUuid')}`
            }
        }

        if (!isMobile) {
            cards.click(function () {
                checkIt.call(this)
            }).dblclick(function () {
                jumpTo.call(this)
            })
        } else {
            cards.on('touchstart', function () {
                let checks = cards.find('input[type=checkbox]')

                if (multiple) {
                    checkIt.call(this)
                    if (cards.find('input[type=checkbox]:checked').length === 0) {
                        multiple = false
                        checks.addClass('d-none')
                    }
                } else {
                    timer = setTimeout(function () {
                        if (cards.find('input[type=checkbox]:checked').length === 0) {
                            multiple = true
                            click = false
                            checks.removeClass('d-none')
                        }
                        checkIt.call(this)
                    }.bind(this), duration)
                }
            }).on('touchend', function () {
                if (timer) {
                    clearTimeout(timer)
                }
                if (click) {
                    jumpTo.call(this)
                }
                if (!multiple) {
                    click = true
                }
            })
        }
    }

    // 重新渲染面包屑
    function renderCrumb(loc) {
        let uuid = loc.data('customUuid') === '' ? undefined : loc.data('customUuid')
        let index = stackNav.findIndex(function (elem) {
            return elem.data('customUuid') === loc.data('customUuid')
        })

        loc.addClass('breadcrumb-active')

        stackNav = stackNav.slice(0, index + 1).map(function (elem) {
            return elem.clone(true)
        })
        let breadcrumb = $('<ol class="breadcrumb mb-0"></ol>')
        for (let i = 0; i < stackNav.length; i++) {
            breadcrumb.append(stackNav[i])
        }
        $('.breadcrumb').replaceWith(breadcrumb)
        cloudTable.bootstrapTable('refresh', {query: {folderUUID: uuid}})
    }

    // 面包屑
    function addCrumb(text, uuid) {
        stackNav[stackNav.length - 1].removeClass('breadcrumb-active').click(function () {
            renderCrumb($(this))
        })
        let crumb = $(`<li class="breadcrumb-item breadcrumb-active" data-custom-uuid="${uuid}">${text}</li>`)
        stackNav.push(crumb)
        $('.breadcrumb').append(crumb)
    }

    // 渲染文件夹列表
    function renderFolder(container, group, folderUUID, stackFolder, exclude) {
        if (folderUUID === undefined) {
            $(`<li class="list-group-item list-group-item-choice">
                   <i class="fas fa-chevron-down me-2"></i>根目录
               </li>`
            ).click(function () {
                $(this).toggleClass('selected').siblings('.selected').removeClass('selected')
            }).appendTo(group)
        }
        $.get(ctx + '/api/folder', {format: 'json', folderUUID: folderUUID, exclude: exclude}, function (res) {
            res.forEach((value) => {
                $(`<li class="list-group-item list-group-item-choice" data-custom-uuid="${value.file_uuid}">
                       <i class="fas fa-folder me-2"></i>${value.file_name}
                   </li>`
                ).click(function () {
                    $(this).toggleClass('selected').siblings('.selected').removeClass('selected')
                }).dblclick(function () {
                    let dom = $(`<li class="list-group-item list-group-item-choice"><i class="fas fa-chevron-left me-2"></i>返回上一级</li>`)
                        .click(function () {
                            $(this).toggleClass('selected').siblings('.selected').removeClass('selected')
                        })
                        .dblclick(function () {
                            renderBack(container, group, stackFolder[stackFolder.length - 2], stackFolder, exclude)
                        })
                    stackFolder.push(this.dataset.customUuid)
                    group.empty()
                    group.append(dom)
                    renderFolder(container, group, this.dataset.customUuid, stackFolder, exclude)
                }).appendTo(group)
            })
        })
        container.append(group)
    }

    // 返回上级菜单
    function renderBack(container, group, folderUUID, stackFolder, exclude) {
        stackFolder.pop()
        group.empty()
        if (folderUUID) {
            let dom = $(`<li class="list-group-item list-group-item-choice"><i class="fas fa-chevron-left me-2"></i>返回上一级</li>`)
                .click(function () {
                    $(this).toggleClass('selected').siblings('.selected').removeClass('selected')
                })
                .dblclick(function () {
                    renderBack(container, group, stackFolder[stackFolder.length - 2], stackFolder, exclude)
                })
            group.append(dom)
        }
        renderFolder(container, group, folderUUID, stackFolder, exclude)
    }

    /**
     * 文件操作方法
     */
    function fileShare(uuid) {
        let $elem = shareModal.elem
        let $mask = $elem.find('.copy-mask')
        let $delta = $elem.find('#delta')
        let $deltas = $elem.find('.dropdown-item')
        let $summary = $elem.find('#summary')
        let $copyBtn = $elem.find('.btn-info')

        let isChange = false
        // 获取填充密匙
        $.post(ctx + '/share-create', {uuid: uuid}, function (res) {
            $elem.data('customId', res.data.id)
            $elem.find('#shareLink').text(ctx + '/share/' + res.data.signature)
            $elem.find('#shareKey').text(res.data.key)
        })

        $elem.one('show.mdb.modal', function () {
            $mask.on('click', function () {
                custom.copyText(this.previousElementSibling.textContent, alert)
            })
            $copyBtn.on('click', function () {
                custom.copyText('口令分享: ' + $elem.find('#shareKey').text() + '\n' +
                    '链接分享: ' + ctx + '/share/' + $elem.find('#shareLink').text(), alert)
            })
            $deltas.on('click', function () {
                isChange = true
                $delta.data('customDelta', this.dataset.customDelta).text(this.textContent)
            })
            $summary.on('change', function () {
                isChange = true
            })
        }).one('hide.mdb.modal', function () {
            $mask.off('click')
            $copyBtn.off('click')
            $deltas.off('click')
            $summary.off('change')
            if (isChange) {
                table.alterCallback(ctx + '/share-update', {
                    id: $elem.data('customId'),
                    delta: $delta.data('customDelta'),
                    summary: $summary.val()
                }, toast, cloudTable)
            }
        })
        shareModal.mdbModal.show()
    }

    function fileTrash(uuid) {
        let folderUUID = stackNav[stackNav.length - 1].data('customUuid')
        table.alterCallback(ctx + '/trash', {
            method: 'trash',
            uuids: [uuid]
        }, toast, cloudTable, folderUUID === '' ? undefined : folderUUID)
    }

    function fileDownload(uuid) {
        toast.setIcon('fas fa-info-circle text-info')
        toast.setText('正在打包请稍等')
        toast.getToast().show()
        location.href = ctx + `/download/${uuid}`
    }

    function fileMove(uuid) {
        let elem = moveModal.elem
        let container = elem.find('.modal-body')
        let btn = elem.find('.btn-primary')
        let group = $('<div class="list-group list-group-flush"></div>')
        let stackFolder = [undefined]

        renderFolder(container, group, stackFolder[stackFolder.length - 1], stackFolder, uuid)

        function moveFile() {
            let folderUUID = stackNav[stackNav.length - 1].data('customUuid')
            let dst = elem.find('.selected').data('customUuid')
            table.alterCallback(ctx + '/move', {
                src: uuid, dst: dst === undefined || '' ? stackFolder[stackFolder.length - 1] : dst
            }, toast, cloudTable, folderUUID === '' ? undefined : folderUUID)

            moveModal.mdbModal.hide()
        }

        elem.one('show.mdb.modal', function () {
            btn.on('click', moveFile)
        }).one('hide.mdb.modal', function () {
            btn.off('click', moveFile)
        })
        moveModal.mdbModal.show()
    }

    function fileUpload() {
        let size = this.files[0].size
        let use = size + _used

        if (use > _storage) {
            toast.setIcon('fas fa-exclamation-circle fa-lg text-warning')
            toast.setText('剩余空间不足')
            toast.getToast().show()
        } else if (size > MAX_UPLOAD_FILE_SIZE) {
            toast.setIcon('fas fa-exclamation-circle fa-lg text-warning')
            toast.setText(`单次上传不能超过${custom.fileSizeFormat(MAX_UPLOAD_FILE_SIZE)}`)
            toast.getToast().show()
        } else {
            let formData = new FormData()
            let uploadName = this.files[0].name
            let folderUUID = stackNav[stackNav.length - 1].data('customUuid')

            if (folderUUID === '') {
                folderUUID = undefined
            } else {
                formData.append("folderUUID", folderUUID)
            }
            formData.append("file", this.files[0])

            uploadCallback(uploadName, ctx + '/file-upload', formData, use, folderUUID)
        }
        this.value = ''
    }

    function folderUpload() {
        let size = 0
        let upload_nums = 0
        Array.from(this.files).forEach((value) => {
            size += value.size
            upload_nums += 2
        })
        let use = size + _used

        if (use > _storage) {
            toast.setIcon('fas fa-exclamation-circle fa-lg text-warning')
            toast.setText('剩余空间不足')
            toast.getToast().show()
        } else if (use > MAX_UPLOAD_FILE_SIZE) {
            toast.setIcon('fas fa-exclamation-circle fa-lg text-warning')
            toast.setText(`单次上传不能超过${custom.fileSizeFormat(MAX_UPLOAD_FILE_SIZE)}`)
            toast.getToast().show()
        } else if (upload_nums > DATA_UPLOAD_MAX_NUMBER_FIELDS) {
            toast.setIcon('fas fa-exclamation-circle fa-lg text-warning')
            toast.setText(`上传条目数超过${DATA_UPLOAD_MAX_NUMBER_FIELDS}限制`)
            toast.getToast().show()
        } else {
            let formData = new FormData()
            let uploadName = this.files[0].webkitRelativePath.split('/')[0]
            let folderUUID = stackNav[stackNav.length - 1].data('customUuid')

            if (folderUUID === '') {
                folderUUID = undefined
            } else {
                formData.append("folderUUID", folderUUID)
            }

            this.files.forEach((file) => {
                formData.append('files', file)
                formData.append('paths', file.webkitRelativePath)
            })

            uploadCallback(uploadName, ctx + '/folder-upload', formData, use, folderUUID)
        }
        this.value = ''
    }

    // 重名检查
    function uploadCallback(name, url, data, use, uuid) {
        $.getJSON(ctx + '/duplicated-check', {uploadName: name, folderUUID: uuid}, function (res) {
            if (res.code === 200) {
                _uploadBinary(url, data, use, uuid)
            } else {
                toast.setIcon('fas fa-exclamation-circle fa-lg text-warning')
                toast.setText(res.msg)
                toast.getToast().show()
            }
        })
    }

    //上传回调
    function _uploadBinary(url, data, use, uuid) {
        let $btn = $('#uploadBtn')
        let $uploadToast = $('#uploadToast')
        let progressbar = $uploadToast.find('.progress-bar')
        let cancelBtn = $uploadToast.find('.btn-close')
        $uploadToast.removeClass('hide').addClass('show')

        $.ajax({
            url: url,
            method: 'POST',
            data: data,
            contentType: false,
            processData: false,
            beforeSend: function () {
                $btn.prop('disabled', true)
                $(window).on('beforeunload', function () {
                    return ''
                })
            },
            complete: function () {
                $btn.prop('disabled', false)
                $(window).off('beforeunload')
            },
            xhr: function () {
                let xhr = new XMLHttpRequest()
                cancelBtn.click(function () {
                    modal.setTitle('你确定取消上传吗')
                    modal.setBtnType('btn btn-warning')

                    function cancelUpload() {
                        xhr.abort()
                        modal.getModal().hide()
                        $uploadToast.removeClass('show').addClass('hide')
                    }

                    modal.elem.one('show.mdb.modal', function () {
                        modal.btn.on('click', cancelUpload)
                    }).one('hide.mdb.modal', function () {
                        modal.btn.off('click', cancelUpload)
                    })

                    modal.getModal().show()
                })

                xhr.upload.addEventListener('progress', function (e) {
                    let rate = Math.floor(e.loaded / e.total * 100) + '%'
                    progressbar.css('width', rate).text(rate)
                    if (rate === '100%') {
                        $uploadToast.removeClass('show').addClass('hide')
                        toast.setIcon('fas fa-info-circle text-info')
                        toast.setText('正在同步文件结构，请稍等')
                        toast.getToast().show()
                    }
                })

                xhr.upload.addEventListener('abort', function () {
                    toast.setIcon('fas fa-exclamation-circle fa-lg text-warning')
                    toast.setText('上传已取消')
                    toast.getToast().show()
                })

                return xhr
            },
            success: function (res) {
                if (res.code === 200) {
                    $('#used').text(custom.fileSizeFormat(use))
                    toast.setIcon('fas fa-check-circle fa-lg text-success')
                    cloudTable.bootstrapTable('refresh', {query: {folderUUID: uuid}})
                    _used = use
                    localStorage.setItem('used', use)
                } else {
                    toast.setIcon('fas fa-exclamation-circle fa-lg text-warning')
                }
                toast.setText(res.msg)
                toast.getToast().show()
            }
        })
    }
})