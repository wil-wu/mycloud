window.addEventListener('DOMContentLoaded', function () {
    'use strict'

    let toast = new mdb.Toast(document.getElementById('toast'))

    let uuid = domutil.getURLParam('uuid')

    let infoEl = document.getElementById('info')
    let navEl = document.querySelector('.navbar')


    $.get(_urls.fileDetail(uuid), (file) => {
        file.icon = `#icon-${_iconfont[file.file_type]}`
        file.type = file.file_type.substring(1)

        // 设置文件信息
        infoEl.querySelector('.icon').firstElementChild.setAttribute('href', file.icon)
        infoEl.querySelector('p:nth-child(2)').append(file.file_name)
        infoEl.querySelector('p:nth-child(3)').append(file.type)
        infoEl.querySelector('p:nth-child(4)').append(custom.fileSizeFormat(file.file_size))
        infoEl.querySelector('p:nth-child(5)').append(file.create_time)

        // 导航栏事件绑定
        navEl.querySelectorAll('.nav-link').forEach((el) => {
            let callback
            switch (el.dataset.action) {
                case 'share':
                    callback = () => {
                        $.get(_urls.fileShare(uuid), () => {
                            toast.setIcon(_fontawsome.success).setText('已生成分享记录').show()
                        })
                    }
                    break
                case 'download':
                    callback = () => {
                        location.href = _urls.fileBinary(uuid)
                        toast.setIcon(_fontawsome.info).setText('正在下载请稍等').show()
                    }
                    break
                case 'info':
                    callback = () => {
                        infoEl.classList.toggle('visible')
                        infoEl.classList.toggle('invisible')
                    }
                    break
            }
            el.addEventListener('click', callback)
        })

        // 判断文件合法性
        for (const [key, formats] of Object.entries(_config.media)) {
            if (formats.has(file.type)) {
                if (file.file_size > _config.terms[key]) {
                    let permEl = document.getElementById('notPermission')
                    let btn = permEl.querySelector('button')

                    permEl.classList.remove('d-none')
                    btn.addEventListener('click', () => {
                        location.href = _urls.fileBinary(uuid)
                        toast.setIcon(_fontawsome.info).setText('正在下载请稍等').show()
                    })
                } else {
                    $.ajax(_urls.fileBinary(uuid), {
                        method: 'GET',
                        data: {blob: true},
                        xhrFields: {responseType: 'blob'},
                        beforeSend: () => {
                            toast.setIcon(_fontawsome.info).setText('正在加载资源').show()
                        },
                        success: (blob) => {
                            file.blobURL = URL.createObjectURL(blob)
                            switch (key) {
                                case 'video':
                                    videoPlayer(file)
                                    break
                                case 'audio':
                                    audioPlayer(file)
                                    break
                                case 'image':
                                    imagePlayer(file)
                                    break
                            }
                            toast.setIcon(_fontawsome.info).setText('加载完成').show()
                        }
                    })
                }
                return
            }
        }

        let suppEl = document.getElementById('notSupport')
        let btn = suppEl.querySelector('button')

        suppEl.classList.remove('d-none')
        btn.addEventListener('click', () => {
            location.href = _urls.fileBinary(uuid)
            toast.setIcon(_fontawsome.info).setText('正在下载请稍等').show()
        })
    })


    // 视频播放
    function videoPlayer(file) {
        let playerEl = document.getElementById('videoPlayer')
        playerEl.classList.remove('d-none')

        let player = videojs('videoPlayer', {
            loop: false,
            autoplay: false,
            controls: true,
            language: 'zh-CN',
            sources: [{
                src: file.blobURL,
                type: `video/${file.type}`
            }]
        })

        player.on('error', () => toast.setIcon(_fontawsome.warning).setText('加载失败').show())
    }


    // 音频播放
    function audioPlayer(file) {
        let playerEl = document.getElementById('audioPlayer')
        playerEl.classList.remove('d-none')

        let timer = playerEl.querySelector('#timer')
        let volume = playerEl.querySelector('#volume')
        let duration = playerEl.querySelector('#duration')
        let playBtn = playerEl.querySelector('#playBtn')
        let progressbar = playerEl.querySelector('#progressbar')

        let howl = new Howl({
            src: file.blobURL,
            volume: volume.value / 100,
            format: [file.type],
            onplay: () => requestAnimationFrame(step),
            onend: () => playBtn.className = 'fa-solid fa-play',
            onloaderror: () => toast.setIcon(_fontawsome.warning).setText('加载失败').show(),
            onplayerror: () => toast.setIcon(_fontawsome.warning).setText('播放失败').show(),
        })

        // 初始化绑定
        howl.once('load', () => {
            duration.textContent = timeFormat(howl.duration())

            playBtn.addEventListener('click', () => {
                howl.playing() ? howl.pause() : howl.play();

                playBtn.classList.toggle('fa-play')
                playBtn.classList.toggle('fa-pause')
            })

            volume.addEventListener('input', () => howl.volume(volume.value / 100))
        })

        // 时间格式
        function timeFormat(seconds) {
            let min = 0
            let sec
            if (seconds > 60) {
                min = Math.floor(seconds / 60)
                sec = Math.floor(seconds % 60)
            } else {
                sec = Math.floor(seconds)
            }
            if (sec < 10) {
                sec = '0' + sec
            }
            return min + ':' + sec
        }

        // 帧动画
        function step() {
            progressbar.style.setProperty('width', howl.seek() / howl.duration() * 100 + '%')
            timer.textContent = timeFormat(howl.seek())

            if (howl.playing()) requestAnimationFrame(step)
        }
    }


    // 图片显示
    function imagePlayer(file) {
        let imageEl = document.getElementById('image')
        imageEl.setAttribute('src', file.blobURL)
        imageEl.parentElement.classList.remove('d-none')
    }
})