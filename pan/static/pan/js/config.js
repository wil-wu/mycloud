const ctx = 'http://127.0.0.1:8000'

// const csrftoken = custom.getCookie('csrftoken')

const _media = {
    video: ['.mp4'],
    audio: ['.mp3', '.wav'],
    image: ['.jpg', '.png', '.svg', '.gif']
}

const DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

const MAX_UPLOAD_FILE_SIZE = 251658240

const MAX_AVATAR_SIZE = 3145728

const BREAK_POINT = 992

mdb.Toast.Default.delay = 2000

// $.ajaxSetup({
//     beforeSend: function (xhr) {
//         xhr.setRequestHeader('X-CSRFToken', csrftoken)
//     }
// })

let _storage = Number(localStorage.getItem('storage'))
let _used = Number(localStorage.getItem('used'))

let _preview = {
    video: Number(localStorage.getItem('video')),
    audio: Number(localStorage.getItem('audio')),
    image: Number(localStorage.getItem('image'))
}