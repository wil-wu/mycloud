window.addEventListener('DOMContentLoaded', function () {
    'use strict'

    let toast = new mdb.Toast(document.getElementById('toast'))
    let authCanvas = new mdb.Offcanvas(document.getElementById('authCanvas'))
    let loginTab = new mdb.Tab(document.getElementById('loginTab'))

    let authLink = document.getElementById('authLink')
    let navbar = document.getElementById('navbar')
    let forms = document.querySelectorAll('form')
    let avatar = navbar.querySelector('#avatar')
    let logout = navbar.querySelector('#logout')

    let $keyArea = $('#keyArea')
    let $shareCard = $('#shareCard')


    let next = domutil.getURLParam('next')
    if (next) authCanvas.show()

    let profile
    let expiry = localStorage.getItem('expiry')

    if (expiry && Date.now() < Number(expiry) * 1000) {
        profile = localStorage.getItem('profile')
    }

    let fnMap = {
        login: (data, btn) => {
            for (const [key, value] of Object.entries(data)) {
                localStorage.setItem(key, JSON.stringify(value))
            }
            if (next) location.href = _domain + next

            authCanvas.hide()
            btn.disabled = false
            avatar.src = data.profile.avatar
            authLink.style.setProperty('display', 'none')
            navbar.style.setProperty('display', 'flex')
        },
        register: (data, btn) => {
            btn.disabled = false
            loginTab.show()
        },
        reset: (data, btn) => {
            let age = 60
            let timer = setInterval(() => {
                if (age === 0) {
                    clearInterval(timer)
                    btn.textContent = '确认'
                    btn.disabled = false
                    return
                }
                btn.textContent = age
                age--
            }, 1000)
        }
    }


    // 是否登录
    if (profile) {
        profile = JSON.parse(profile)
        avatar.src = profile.avatar
        authLink.style.setProperty('display', 'none')
        navbar.style.setProperty('display', 'flex')
    } else {
        authLink.style.setProperty('display', 'block')
        navbar.style.setProperty('display', 'none')
    }


    // 登出
    logout.addEventListener('click', () => {
        $.get(_urls.logout, () => {
            authLink.style.setProperty('display', 'block')
            navbar.style.setProperty('display', 'none')

            localStorage.removeItem('profile')
            localStorage.removeItem('expiry')
            localStorage.removeItem('terms')
        })
    })


    // 表单绑定
    forms.forEach((form) => {
        let btn = form.querySelector('.btn-primary')
        let inputs = form.querySelectorAll('input')
        let validation = custom.getInitial(form)

        form.addEventListener('submit', (evt) => {
            evt.preventDefault()

            if (!form.checkValidity()) {
                custom.setInitial(form, validation)
            } else {
                form.classList.remove('was-validated')
                inputs.forEach((input) => {
                    input.classList.remove('is-invalid')
                })

                btn.disabled = true
                let url = _urls[form.dataset.url]
                let data = JSON.stringify(domutil.serializeForm(form))

                $.post(url, data, (res) => {
                    if (res.code === 200) {
                        fnMap[form.dataset.url](res.data, btn)
                        toast.setIcon(_fontawsome.success).setText(res.msg).show()
                    } else {
                        btn.disabled = false
                        for (const [key, value] of Object.entries(res.errors)) {
                            let el = form.querySelector(`input[name=${key}]`)
                            let div = domutil.nextSiblings(el, '.invalid-feedback').pop()
                            div.textContent = value.join(', ')
                            el.classList.add('is-invalid')
                        }
                    }
                })
            }
        })
    })


    // 获取分享文件
    $keyArea.find('#key').on('input', function () {
        if (this.value.length === 6) {
            $.get(_urls.shareSecret, {key: this.value}, (data, status, xhr) => {
                if (xhr.status === 200) {
                    this.value = ''
                    $keyArea.toggle('normal')
                    $shareCard.toggle('normal')
                    $shareCard.find('.file-name').text(data.file.file_name)
                    $shareCard.find('#summary').text(data.summary)
                    $shareCard.find('#expiry').text(custom.humanizeTime(data.expire_time))
                    $shareCard.find('#size').text(custom.fileSizeFormat(data.file.file_size))
                    $shareCard.find('.btn-warning').on('click', () => {
                        location.href = _urls.fileBinary(data.file.file_uuid)
                        toast.setIcon(_fontawsome.info).setText('正在打包请稍等').show()
                    })
                } else {
                    toast.setIcon(_fontawsome.warning).setText('文件已过期').show()
                }
            })
        }
    })

    $shareCard.find('.btn-close').on('click', () => {
        $shareCard.toggle('normal')
        $keyArea.toggle('normal')
        $shareCard.find('.btn-warning').off('click')
    })

})