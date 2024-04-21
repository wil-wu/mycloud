(function () {
    'use strict'

    window._domain = location.origin

    window._config = {
        profile: JSON.parse(localStorage.getItem('profile')),
        terms: JSON.parse(localStorage.getItem('terms')),
        media: {
            video: ['mp4', 'webm'],
            audio: ['mp3', 'wav', 'ogg', 'opus', 'aac', 'm4a', 'm4b'],
            image: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'],
            word: ['docx', 'doc'],
            pdf: ['pdf'],
        },
        'DATA_UPLOAD_MAX_NUMBER_FIELDS': 1000,
        'MAX_UPLOAD_FILE_SIZE': 268435456,
        'MAX_AVATAR_SIZE': 1048576,
        'BREAK_POINT': 992,
    }

    window._iconfont = new Proxy({
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
    }, {
        get(target, prop) {
            return prop in target ? target[prop] : 'file_default'
        }
    })

    window._fontawsome = {
        info: 'fa-solid fa-circle-info text-info',
        success: 'fa-solid fa-circle-check text-success',
        warning: 'fa-solid fa-circle-exclamation text-warning',
        danger: 'fa-solid fa-circle-exclamation text-danger',
    }

    window._urls = {
        storage: `${_domain}/api/file/storage`,
        files: `${_domain}/api/file/files`,
        folders: `${_domain}/api/file/folders`,
        fileRecycle: `${_domain}/api/file/recycle`,
        fileDetail: (uuid) => `${_domain}/api/file/${uuid}`,
        fileBinary: (uuid) => `${_domain}/api/file/${uuid}/binary`,
        fileShare: (uuid) => `${_domain}/api/file/${uuid}/share`,
        fileMove: (uuid) => `${_domain}/api/file/${uuid}/move`,
        share: `${_domain}/api/share`,
        shareRemove: `${_domain}/api/share/remove`,
        shareSecret: `${_domain}/api/share/secret`,
        shareDetail: (pk) => `${_domain}/api/share/${pk}`,
        bin: `${_domain}/api/recycle`,
        binRemove: `${_domain}/api/recycle/remove`,
        binRecover: `${_domain}/api/recycle/recover`,
        profile: `${_domain}/api/profile/partial`,
        user: `${_domain}/api/profile/user`,
        notice: `${_domain}/api/notice`,
        letter: `${_domain}/api/letter`,
        login: `${_domain}/login`,
        logout: `${_domain}/logout`,
        register: `${_domain}/register`,
        password: `${_domain}/password`,
        reset: `${_domain}/reset`,
        fileUpload: `${_domain}/file/upload`,
        folderUpload: `${_domain}/folder/upload`,
        fileDetailPath: (uuid) => `${_domain}/detail?uuid=${uuid}`,
        fileSharePath: (key) => `${_domain}/share?key=${key}`,
    }

    $.ajaxSetup({
        contentType: 'application/json; charset=UTF-8',
        beforeSend: (xhr, settings) => {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type)) {
                xhr.setRequestHeader('X-CSRFToken', domutil.getCookie('csrftoken'))
            }
        },
    })

})()