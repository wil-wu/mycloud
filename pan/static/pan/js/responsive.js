// 存储显示和侧边栏
$(document).ready(function () {
    'use strict'

    let sidebar = new mdb.Offcanvas($('#sidebar').get(0))
    let storage = $('#memory')
    let notice = $('#notice')
    let contents = notice.next()
    let pagination = { offset: 0, limit: 5 }

    window.innerWidth >= BREAK_POINT ? sidebar.show() : sidebar.hide()

    $(window).on('resize', function () {
        window.innerWidth > BREAK_POINT ? sidebar.show() : sidebar.hide()
    })

    storage.find('#storage').text(custom.fileSizeFormat(_storage))
    storage.find('#used').text(custom.fileSizeFormat(_used))

    function insertNotices(data) {
        let view = ''
        if (data.length === 0) {
            view = '<li><div class="dropdown-item text-muted text-center">无更多通知</div></li>'
        } else {
            data.forEach((item) => {
                view += `<li>
                         <div class="dropdown-item small">
                             <div class="h6">${item.title}</div>
                             <div class="d-flex align-items-center text-muted">
                                <div>— ${item.create_by}</div>
                                <div class="ms-auto">${item.create_time}</div>
                             </div>
                             <div class="text-wrap">${item.content}</div>
                         </div>
                     </li>`
            })
        }
        contents.append(view)
    }

    notice.one('show.mdb.dropdown', function () {
        $.get(ctx + '/api/notice', pagination, function (res) {
            insertNotices(res.results)
        })
    })

    contents.on('scroll', function () {
        if (this.scrollTop + this.clientHeight >= this.scrollHeight) {
            pagination.offset += pagination.limit
            pagination.limit += pagination.limit
            $.get(ctx + '/api/notice', pagination, function (res) {
                insertNotices(res.results)
                if (res.results.length === 0) {
                    contents.off('scroll')
                }
            })
        }
    })
})