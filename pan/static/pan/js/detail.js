window.addEventListener('DOMContentLoaded', function () {
    'use strict'

    const toast = new mdb.Toast('#toast')
    const uuid = domutil.getURLParam('uuid')

    // 获取文件信息，加载预览
    $.get(_urls.fileDetail(uuid), (file) => {
        file.icon = `#icon-${_iconfont[file.file_type]}`
        file.type = file.file_type.substring(1)

        let infoEl = document.querySelector('#info')
        let navEl = document.querySelector('.navbar')

        const share = () => {
            $.get(_urls.fileShare(uuid), () => {
                toast.setIcon(_fontawsome.success).setText('已生成分享记录').show()
            })
        }
        const download = () => {
            location.href = _urls.fileBinary(uuid)
            toast.setIcon(_fontawsome.info).setText('正在下载请稍等').show()
        }

        const info = () => {
            infoEl.classList.toggle('visible')
            infoEl.classList.toggle('invisible')
        }

        // 设置文件信息
        infoEl.querySelector('use').setAttribute('href', file.icon)
        infoEl.querySelector('p:nth-child(2)').textContent = `文件名：${file.file_name}`
        infoEl.querySelector('p:nth-child(3)').textContent = `文件类型：${file.type}`
        infoEl.querySelector('p:nth-child(4)').textContent = `文件大小：${custom.fileSizeFormat(file.file_size)}`
        infoEl.querySelector('p:nth-child(5)').textContent = `上传时间：${file.create_time}`

        // 导航栏事件绑定
        navEl.addEventListener('click', (evt) => {
            let action = evt.target.dataset.action
            if (!action) return

            switch (action) {
                case 'share':
                    share()
                    break
                case 'download':
                    download()
                    break
                case 'info':
                    info()
                    break
            }
        })

        // 文件预览条件限制检查
        let supportTypes = Object.values(_config.media).reduce((prev, curr) => prev.concat(curr))

        let isOverSize = file.file_size > _config.terms.preview
        let isNotSupport = !supportTypes.includes(file.type)

        if (isOverSize || isNotSupport) {
            let el = document.querySelector('#deniedTip')
            let p = el.querySelector('p')
            let anchor = el.querySelector('a')

            if (isOverSize) {
                p.textContent = '文件大小超过限制不支持在线预览'
            } else if (isNotSupport) {
                p.textContent = '暂不支持此类文件预览'
            }

            el.classList.remove('d-none')
            anchor.href = _urls.fileBinary(uuid)
            return
        }

        // 匹配指定类型的预览器
        for (const [type, suffixes] of Object.entries(_config.media)) {
            if (suffixes.includes(file.type)) {
                $.ajax(_urls.fileBinary(uuid), {
                    method: 'GET',
                    data: {blob: true},
                    xhrFields: {responseType: 'blob'},
                    beforeSend: () => {
                        toast.setIcon(_fontawsome.info).setText('正在加载资源').show()
                    },
                    success: (blob) => {
                        file.blobURL = URL.createObjectURL(blob)
                        switch (type) {
                            case 'video':
                                videoPlayer(file)
                                break
                            case 'audio':
                                audioPlayer(file)
                                break
                            case 'image':
                                imageViewer(file)
                                break
                            case 'word':
                                wordViewer(blob)
                                break
                            case 'pdf':
                                pdfViewer(blob)
                                break
                        }
                    }
                })
                break
            }
        }
    })


    // 视频播放
    function videoPlayer(file) {
        let playerEl = document.querySelector('#videoPlayer')
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

        player.on('ready', () => toast.setIcon(_fontawsome.info).setText('加载完成').show())
        player.on('error', () => toast.setIcon(_fontawsome.warning).setText('加载失败').show())
    }


    // 音频播放
    function audioPlayer(file) {
        let playerEl = document.querySelector('#audioPlayer')
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
            onload: () => {
                duration.textContent = timeFormat(howl.duration())

                playBtn.addEventListener('click', () => {
                    howl.playing() ? howl.pause() : howl.play();

                    playBtn.classList.toggle('fa-play')
                    playBtn.classList.toggle('fa-pause')
                })

                volume.addEventListener('input', () => howl.volume(volume.value / 100))

                toast.setIcon(_fontawsome.info).setText('加载完成').show()
            }
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
    function imageViewer(file) {
        let imageEl = document.querySelector('#image')
        imageEl.setAttribute('src', file.blobURL)
        imageEl.parentElement.classList.remove('d-none')

        new Viewer(imageEl)
        toast.setIcon(_fontawsome.info).setText('加载完成').show()
    }


    // word文档预览
    function wordViewer(blob) {
        let viewer = document.querySelector('#officeViewer')
        viewer.classList.remove('d-none')

        docx.renderAsync(blob, viewer).then(() => {
            toast.setIcon(_fontawsome.info).setText('加载完成').show()
        }).catch((reason) => {
            console.error(reason)
            toast.setIcon(_fontawsome.warning).setText('加载失败').show()
        })
    }


    // pdf文档预览
    function pdfViewer(blob) {
        let viewer = document.querySelector('#officeViewer')
        viewer.classList.remove('d-none')

        blob.arrayBuffer().then((buffer) => {
            pdfjsLib.getDocument({data: buffer}).promise.then((pdf) => {
                for (let page = 1; page < pdf.numPages + 1; page++) {
                    pdf.getPage(page).then((page) => {
                        let scale = 1.5
                        let viewport = page.getViewport({scale: scale})

                        let canvas = document.createElement('canvas')
                        let context = canvas.getContext('2d')
                        canvas.height = viewport.height
                        canvas.width = viewport.width

                        let renderContext = {
                            canvasContext: context,
                            viewport: viewport,
                        }

                        page.render(renderContext)
                        viewer.append(canvas)
                    })
                }
                toast.setIcon(_fontawsome.info).setText('加载完成').show()
            }).catch((reason) => {
                console.error(reason)
                toast.setIcon(_fontawsome.warning).setText('加载失败').show()
            })
        })
    }
})