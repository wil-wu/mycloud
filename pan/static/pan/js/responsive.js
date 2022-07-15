// 存储显示和侧边栏
$(document).ready(function () {
    'use strict'

    let sidebar = new mdb.Offcanvas($('#sidebar').get(0))
    let storage = $('#memory')
    let notice = $('#notice')
    let contents = notice.next()

    window.innerWidth >= BREAK_POINT ? sidebar.show() : sidebar.hide()

    $(window).on('resize', function () {
        window.innerWidth > BREAK_POINT ? sidebar.show() : sidebar.hide()
    })

    storage.find('#storage').text(custom.fileSizeFormat(_storage))
    storage.find('#used').text(custom.fileSizeFormat(_used))

    notice.on('show.mdb.dropdown', function () {
        $.get(ctx + '/api/notice', function (res) {
            let view = ''
            if (res.length === 0) {
                view = '<li><div class="dropdown-item text-muted text-center">无通知</div></li>'
            }
            res.forEach((item) => {
                view += `<li>
                             <div class="dropdown-item small">
                                 <div class="h6">${item.title}</div>
                                 <div class="d-flex align-items-center text-muted">
                                    <div>— ${item.create_by}</div>
                                    <div class="ms-auto">${item.create_time}</div>
                                 </div>
                                 <div>${item.content}</div>
                             </div>
                         </li>`
            })
            contents.html(view)
        })
    })
})