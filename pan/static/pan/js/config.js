(function (global, factory) {
    const domain = 'http://127.0.0.1:8000'

    global._config = factory(global.mdb)
    global._domain = domain
    global._urls = {
        apiCloud: `${domain}/api/cloud`,
        apiHistory: `${domain}/api/history`,
        apiBin: `${domain}/api/bin`,
        apiFile: `${domain}/api/file`,
        apiFolder: `${domain}/api/folder`,
        apiNotice: `${domain}/api/notice`,
        login: `${domain}/login`,
        register: `${domain}/register`,
        reset: `${domain}/reset-password`,
        fileUpload: `${domain}/file-upload`,
        fileCreate: `${domain}/file-create`,
        fileDelete: `${domain}/file-delete`,
        fileTrash: `${domain}/file-trash`,
        fileMove: `${domain}/file-move`,
        folderUpload: `${domain}/folder-upload`,
        dupCheck: `${domain}/duplicated-check`,
        shareGet: `${domain}/share-get`,
        shareCreate: `${domain}/share-create`,
        shareUpdate: `${domain}/share-update`,
        shareDelete: `${domain}/share-delete`,
        avatar: `${domain}/alter-avatar`,
        password: `${domain}/alter-password`,
        info: `${domain}/alter-info`,
        msgApprove: `${domain}/msg-appr`,
        profile: `${domain}/profile`,
        fileBlob: function (uuid) {
            return `${domain}/file-blob/${uuid}`
        },
        detail: function (uuid) {
            return `${domain}/detail?uuid=${uuid}`
        },
        share: function (signature) {
            return `${domain}/share/${signature}`
        },
    }

})(this, function (mdb) {
    'use strict'

    mdb.Toast.Default.delay = 2000

    const media = {
        video: ['mp4', 'webm'],
        audio: ['mp3', 'wav', 'ogg', 'opus', 'aac', 'm4a', 'm4b'],
        image: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif']
    }

    const DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

    const MAX_UPLOAD_FILE_SIZE = 251658240

    const MAX_AVATAR_SIZE = 3145728

    const BREAK_POINT = 992

    const storage = Number(localStorage.getItem('storage'))

    const used = Number(localStorage.getItem('used'))

    const preview = {
        video: Number(localStorage.getItem('video')),
        audio: Number(localStorage.getItem('audio')),
        image: Number(localStorage.getItem('image'))
    }

    return {
        media,
        storage,
        used,
        preview,
        DATA_UPLOAD_MAX_NUMBER_FIELDS,
        MAX_UPLOAD_FILE_SIZE,
        MAX_AVATAR_SIZE,
        BREAK_POINT,
    }
})