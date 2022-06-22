(function (global, factory) {
    global.table = factory()

})(this, function () {
    'use strict'

    let icons = {
        '.docx': 'file_word',
        '.doc': 'file_word',
        '.xlsx': 'file_excel',
        '.ppt': 'file_ppt',
        '.txt': 'file_txt',
        '.pdf': 'file_pdf',
        '.mp4': 'file_video',
        '.rar': 'file_rar',
        '.zip': 'file_rar',
        '.png': 'file_img',
        '.jpg': 'file_img',
        '.svg': 'file_img',
        '.wav': 'file_audio',
        '.mp3': 'file_audio',
        'null': 'dir',
        '': 'file_default',
    }

    function loadingTemplate() {
        return '<div class="d-flex justify-content-center align-items-center text-primary"><div class="spinner-border"></div><strong>正在加载...</strong></div>'
    }

    function fileNameFormatter(value, row) {
        return `<div class="d-flex align-items-center">
                    <svg class="icon" aria-hidden="true">
                        <use xlink:href="#icon-${icons[row.file_type] === undefined ? 'file_default' : icons[row.file_type]}"></use>
                    </svg>
                    <span class="ms-3">${value}</span>
                </div>`
    }

    function fileTypeFormatter(value) {
        if (value === null) {
            return '文件夹'
        } else if (value === '') {
            return '未知'
        } else {
            return value
        }
    }

    // 排序
    function tableSort(table) {
        $('.sort').click(function () {
            let sortBy = this.dataset.customSort
            $('#sortBy').text(this.textContent).data('customSort', sortBy)
            table.bootstrapTable('refresh', {
                query: {
                    sort: sortBy,
                    order: $('#sortOrder').data('customOrder')
                }
            })
        })
    }

    // 升降序
    function tableOrder(table) {
        $('#sortOrder').click(function () {
            let elem = $(this)
            elem.data('customOrder') === 'desc' ? elem.data('customOrder', 'asc') : elem.data('customOrder', 'desc')
            elem.children().first().toggleClass('fa-sort-down fa-sort-up')
            table.bootstrapTable('refresh', {
                query: {
                    sort: $('#sortBy').data('customSort'),
                    order: elem.data('customOrder')
                }
            })
        })
    }

    // 搜索
    function tableSearch(table) {
        let $elem = $('.search')
        let $icon = $elem.next()

        function search() {
            let that = this
            if (this.value.length !== 0) {
                table.bootstrapTable('refreshOptions', {
                    queryParams: function (params) {
                        params.search = that.value
                        return params
                    }
                })
            }
        }

        $elem.on('keypress', function (e) {
            if (e.which === 13) {
                search.call(this)
            }
        }).on('input', function () {
            if (this.value.length === 0) {
                table.bootstrapTable('refresh')
            }
        })

        $icon.click(function () {
            search.call(this.previousElementSibling)
        })
    }

    // 修改回调
    function alterCallback(url, data, toast, table, folderUUID) {
        return $.post(url, JSON.stringify(data), function (res) {
            if (res.code === 200) {
                toast.setIcon('fas fa-check-circle fa-lg text-success')
                table.bootstrapTable('refresh', {query: {folderUUID: folderUUID}})
            } else {
                toast.setIcon('fas fa-exclamation-circle fa-lg text-danger')
            }
            toast.setText(res.msg)
            toast.getToast().show()
        })
    }

    return {
        icons: icons,
        loadingTemplate: loadingTemplate,
        fileNameFormatter: fileNameFormatter,
        fileTypeFormatter: fileTypeFormatter,
        tableSort: tableSort,
        tableOrder: tableOrder,
        tableSearch: tableSearch,
        alterCallback: alterCallback,
    }
})