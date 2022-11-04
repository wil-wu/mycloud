$(document).ready(function () {
    'use strict'

    let uuid = custom.getQueryParam('uuid')
    let toast = new custom.Toast($('#toast'))
    let info = $('#info')
    let file

    $.get(_urls.apiFile, {uuid: uuid}, function (res) {
        if (res.length !== 0) {
            file = res[0]
            file.type = file.file_type.substring(1)
            setInfo()

            for (const [key, formats] of Object.entries(_config.media)) {
                if (formats.indexOf(file.type) !== -1) {
                    if (file.file_size > _config.preview[key]) {
                        $('#notPermission').removeClass('d-none').find('.btn-info').click(function () {
                            location.href = _urls.fileBlob(uuid)
                        })
                    } else {
                        $.ajax(_urls.fileBlob(uuid), {
                            method: 'GET',
                            data: {blob: true},
                            xhrFields: {responseType: 'blob'},
                            beforeSend: function () {
                                toast.setText('正在加载资源')
                                toast.setIcon('fas fa-info-circle text-info')
                                toast.getToast().show()
                            },
                            success: function (blob) {
                                file.blobURL = URL.createObjectURL(blob)
                                switch (key) {
                                    case "video":
                                        videoPlayer()
                                        break
                                    case "audio":
                                        info.find('#tip').text('暂不支持拖动音频播放进度条')
                                        audioPlayer()
                                        break
                                    case "image":
                                        imageDisplay()
                                        break
                                }
                                toast.setText('加载完成')
                                toast.setIcon('fas fa-info-circle text-info')
                                toast.getToast().show()
                            }
                        })
                    }
                    return
                }
            }
            $('#notSupport').removeClass('d-none').find('.btn-info').click(function () {
                location.href = _urls.fileBlob(uuid)
            })
        }
    })

    // 视频播放
    function videoPlayer() {
        $('#videoPlayer').show()

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

        player.on('error', function () {
            toast.setText('加载失败')
            toast.setIcon('fas fa-exclamation-circle text-danger')
            toast.getToast().show()
        })
    }

    // 音频播放
    function audioPlayer() {
        let elem = $('#audioPlayer').removeClass('d-none')
        let timer = elem.find('#timer span:nth-child(1)')
        let play = elem.find('#play')
        let progress = elem.find('#progress')

        let howl = new Howl({
            src: file.blobURL,
            volume: 0.3,
            format: [file.type],
            onplay: function () {
                requestAnimationFrame(step)
            },
            onend: function () {
                play.attr('class', 'fas fa-pause')
            },
            onloaderror: function () {
                toast.setText('加载失败')
                toast.setIcon('fas fa-exclamation-circle text-danger')
                toast.getToast().show()
            },
            onplayerror: function () {
                toast.setText('播放失败')
                toast.setIcon('fas fa-exclamation-circle text-danger')
                toast.getToast().show()
            }
        })

        // 初始化绑定
        howl.once('load', function () {
            elem.find('#timer span:nth-child(2)').text(timeFormat(howl.duration()))

            play.on('click', function () {
                $(this).toggleClass('fa-play fa-pause')
                howl.playing() ? howl.pause() : howl.play();
            })

            elem.find('#volume').on('input', function () {
                let value = this.value
                let icon = elem.find('#icon')
                if (value === '0') {
                    icon.attr('class', 'fas fa-volume-off')
                } else if (value > 0 && value <= 80) {
                    icon.attr('class', 'fas fa-volume-down')
                } else {
                    icon.attr('class', 'fas fa-volume-up')
                }
                howl.volume(this.value / 100)
            })
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
            return min + ":" + sec
        }

        // 帧动画
        function step() {
            progress.css('width', howl.seek() / howl.duration() * 100 + '%')
            timer.text(timeFormat(howl.seek()))
            if (howl.playing()) {
                requestAnimationFrame(step)
            }
        }
    }

    // 图片
    function imageDisplay() {
        $('#image').attr('src', file.blobURL).parent().removeClass('d-none')
    }

    // 设置文件信息
    function setInfo() {
        info.find('p:nth-child(1)').append(file.file_name)
        info.find('p:nth-child(2)').append(file.type)
        info.find('p:nth-child(3)').append(custom.fileSizeFormat(file.file_size))
        info.find('p:nth-child(4)').append(file.create_time)
    }
})