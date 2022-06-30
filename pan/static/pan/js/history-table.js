$(document).ready(function () {
    'use strict'

    let historyTable = $('#historyTable')

    let alert = new custom.Alert($('#alert'))
    let toast = new custom.Toast($('#toast'))
    let modal = new custom.Modal($('#modal'))
    let baseModal = new custom.BaseModal($('#shareModal'))

    baseModal.elem.on('hidden.mdb.modal', function () {
        baseModal.elem.find('#delta').text('请选择')
    })

    historyTable.bootstrapTable({
        url: ctx + '/api/history',
        dataField: 'results',
        totalField: 'count',
        sidePagination: 'server',
        classes: 'table table-hover',
        toolbar: '#toolbar',
        clickToSelect: true,
        pagination: true,
        pageSize: 8,
        paginationHAlign: 'end',
        paginationParts: ['pageList'],
        queryParamsType: 'limit',
        loadingTemplate: table.loadingTemplate,
        formatNoMatches: function () {
            return '无传输历史';
        },
        columns: [{
            checkbox: true,
        }, {
            field: 'user_file',
            title: '文件名称',
            formatter: table.fileNameFormatter,
        }, {
            field: 'create_time',
            title: '创建时间',
        }, {
            field: 'expire_time',
            title: '过期时间',
            formatter: custom.humanizeTime,
        }, {
            clickToSelect: false,
            formatter: actionsFormatter,
        }],
    });

    table.tableSort(historyTable)
    table.tableOrder(historyTable)
    table.tableSearch(historyTable)

    $('#delBtn').click(function () {
        let checks = historyTable.bootstrapTable('getSelections')

        if (checks.length === 0) {
            toast.setIcon('fas fa-exclamation-circle fa-lg text-warning')
            toast.setText('没有选择任何记录')
            toast.getToast().show()
        } else {
            modal.setTitle("你确定删除所选记录吗")
            modal.setBtnType("btn btn-danger")

            function del() {
                let ids = checks.map(function (item) {
                    return item.id
                })
                table.alterCallback(ctx + '/share-delete', {ids: ids}, toast, historyTable)
                modal.getModal().hide()
            }

            modal.elem.one('show.mdb.modal', function () {
                modal.btn.on('click', del)
            }).one('hide.mdb.modal', function () {
                modal.btn.off('click', del)
            })
            modal.getModal().show()
        }
    })

    historyTable.on('post-body.bs.table', function () {
        $('.custom-link').each(function (i, elem) {
            let id = elem.dataset.customId
            let index = elem.dataset.customIndex
            let func = null

            switch (elem.dataset.customMethod) {
                case "copy":
                    func = function () {
                        linkCopy(index)
                    }
                    break
                case "setting":
                    func = function () {
                        shareSetting(index)
                    }
                    break
                case "del":
                    func = function () {
                        shareDel(id)
                    }
                    break
            }
            elem.addEventListener('click', func)
        })
    })

    /**
     * 表格配置函数
     */
    function actionsFormatter(value, row, index) {
        return `<div class="d-flex flex-column flex-md-row align-items-center">
                    <a class="icon-link custom-link" href="javascript:void(0)" data-custom-id="${row.id}" 
                       data-custom-index="${index}" data-custom-method="copy">
                        <i class="fas fa-link"></i>
                    </a>
                    <a class="ms-md-3 icon-link dropdown-toggle hidden-arrow" href="javascript:void(0)"
                            data-mdb-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item custom-link icon-link" data-custom-method="setting" 
                                data-custom-index="${index}" data-custom-id="${row.id}" 
                                href="javascript:void(0)"><i class="fas fa-cog me-2"></i>设置链接</a></li>
                        <li><a class="dropdown-item custom-link icon-link" data-custom-method="del" 
                                data-custom-index="${index}" data-custom-id="${row.id}" 
                                href="javascript:void(0)"><i class="fas fa-trash me-2"></i>删除</a></li>
                    </ul>
                </div>`
    }

    /**
     * 文件分享操作
     */
    function linkCopy(index) {
        let data = historyTable.bootstrapTable('getData', {includeHiddenRows: true})[index]
        custom.copyText('文件: ' + data.user_file +
            ' 口令分享: ' + data.secret_key + '\n' +
            ' 链接分享: ' + ctx + '/share/' + data.signature, alert)
    }

    function shareDel(id) {
        modal.setTitle("你确定删除该记录吗")
        modal.setBtnType("btn btn-danger")

        function del() {
            table.alterCallback(ctx + '/share-delete', {ids: [id]}, toast, historyTable)
            modal.getModal().hide()
        }

        modal.elem.one('show.mdb.modal', function () {
            modal.btn.on('click', del)
        }).one('hide.mdb.modal', function () {
            modal.btn.off('click', del)
        })
        modal.getModal().show()
    }

    function shareSetting(index) {
        let $elem = baseModal.elem
        let $mask = $elem.find('.copy-mask')
        let $delta = $elem.find('#delta')
        let $deltas = $elem.find('.dropdown-item')
        let $summary = $elem.find('#summary')
        let $copyBtn = $elem.find('.btn-info')

        let data = historyTable.bootstrapTable('getData', {includeHiddenRows: true})[index]
        let deltaChange = false
        let summaryChange = false

        // 获取填充密匙
        $elem.find('#shareLink').text(ctx + '/share/' + data.signature)
        $elem.find('#shareKey').text(data.secret_key)

        $elem.one('show.mdb.modal', function () {
            $mask.on('click', function () {
                custom.copyText(this.previousElementSibling.textContent, alert)
            })
            $copyBtn.on('click', function () {
                custom.copyText('文件: ' + data.user_file + '\n' +
                                     '口令分享: ' + data.secret_key + '\n' +
                                     '链接分享: ' + ctx + '/share/' + data.signature, alert)
            })
            $deltas.on('click', function () {
                deltaChange = true
                $delta.data('customDelta', this.dataset.customDelta).text(this.textContent)
            })
            $summary.on('change', function () {
                summaryChange = true
            })
        }).one('hide.mdb.modal', function () {
            $mask.off('click')
            $copyBtn.off('click')
            $deltas.off('click')
            $summary.off('change')
            if (deltaChange || summaryChange) {
                table.alterCallback(ctx + '/share-update', {
                    id: data.id,
                    delta: deltaChange ? $delta.data('customDelta') : undefined,
                    summary: summaryChange ? $summary.val() : undefined
                }, toast, historyTable)
            }
        })
        baseModal.mdbModal.show()
    }
})