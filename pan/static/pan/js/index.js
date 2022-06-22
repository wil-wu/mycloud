$(document).ready(function () {
    'use strict'

    let loginBlock = $('#loginBlock')
    let registerBlock = $('#registerBlock')

    let next = custom.getQueryParam('next')
    let toast = new custom.Toast($('#toast'))

    if (next) {
        $('html').animate({
            scrollTop: loginBlock.offset().top-48
        })
    }

    // 滑动
    $('#loginLink').click(function () {
        $('html').animate({
            scrollTop: loginBlock.offset().top-48
        })
    })

    $('#registerLink').click(function () {
        $('html').animate({
            scrollTop: registerBlock.offset().top
        })
    })

    /* 登录验证 */
    let $loginForm = $('#loginForm')
    let loginForm = $loginForm.get(0)

    // 记录初始验证信息
    let loginInputs = $loginForm.find('input')
    let loginValidations = custom.getInitial(loginInputs)

    // 验证
    $loginForm.find('#loginBtn').click(function () {
        if (!loginForm.checkValidity()) {
            custom.setInitial(loginValidations, loginInputs, $loginForm)
        } else {
            let formData = $loginForm.serialize()

            $.post(ctx + '/login', formData, function (res) {
                if (res.code === 200) {
                    $.each(res.data, function (key, value) {
                        localStorage.setItem(key, value)
                    })

                    $('html').animate({
                        scrollTop: $(document.body).offset().top,
                    }, {
                        start: function () {
                            toast.setText(res.msg)
                            toast.getToast().show()
                        },
                        done: function () {
                            setTimeout(function () {
                                if (next) {
                                    location.href = ctx + next
                                } else {
                                    location.replace(ctx)
                                }
                            }, 400)
                        }
                    })
                } else {
                    let errors = res.data.errors
                    $.each(errors, function (key) {
                        loginValidations[key].elem.text(errors[key][0])
                        $loginForm.find(`input[name=${key}]`).addClass('is-invalid')
                    })
                }
            })
            $loginForm.removeClass('was-validated')
        }
    })

    /* 注册验证 */
    let $registerForm = $('#registerForm')
    let registerForm = $registerForm.get(0)

    // 记录初始验证信息
    let registerInputs = $registerForm.find('input')
    let registerValidations = custom.getInitial(registerInputs)

    // 验证
    $registerForm.find('#registerBtn').click(function () {
        if (!registerForm.checkValidity()) {
            custom.setInitial(registerValidations, registerInputs, $registerForm)
        } else {
            if (!custom.checkPassword($('#registerPassword'), $('#confirmPassword'))) {
            } else {
                let formData = $registerForm.serialize()

                $.post(ctx + '/register', formData, function (res) {
                    if (res.code === 200) {
                        $('html').animate({
                            scrollTop: loginBlock.offset().top-48,
                        }, {
                            start: function () {
                                toast.setText(res.msg)
                                toast.getToast().show()
                            },
                        })
                    } else {
                        let errors = res.data.errors
                        $.each(errors, function (key) {
                            registerValidations[key].elem.text(errors[key][0])
                            $registerForm.find(`input[name=${key}]`).addClass('is-invalid')
                        })
                    }
                })
            }
            $registerForm.removeClass('was-validated')
        }
    })

    // enter绑定
    $.each($('form'), function (i, item) {
        let form = $(item)
        let btn = form.find('button')

        form.find('input').on('keypress', function (e) {
            if (e.which === 13) {
                btn.click()
            }
        })
    })

    // 接收分享文件
    let cloudBlock = $('#cloudBlock')
    let btnToggle = cloudBlock.find('#btnToggle')
    let inputToggle = cloudBlock.find('#inputToggle')
    let shareCard = cloudBlock.find('#shareCard')
    let btn = shareCard.find('.btn-info')

    btnToggle.find('#receiveBtn').click(function () {
        btnToggle.toggle('normal')
        inputToggle.toggle('normal', function () {
            inputToggle.find('#shareKey').val('')
        })
    })

    inputToggle.find('#closeIcon').click(function () {
        btnToggle.toggle('normal')
        inputToggle.toggle('normal', function () {
            inputToggle.find('#shareKey').val('')
        })
    })

    shareCard.find('.icon-link').click(function () {
        inputToggle.toggle('normal', function () {
            inputToggle.find('#shareKey').val('')
        })
        shareCard.toggle('normal', function () {
            btn.off('click')
        })
    })

    // 获取分享文件
    $('#shareKey').on('input', function () {
        if (this.value.length === 6) {
            $.post(ctx + '/share-get', {key: this.value}, function (res) {
                if (res.code === 200) {
                    let file = res.data.file
                    let share = res.data.share
                    shareCard.find('.file-title').text(file.name)
                    shareCard.find('#summary').text(share.summary)
                    shareCard.find('#expire').text(custom.humanizeTime(share.expire))
                    shareCard.find('#fileSize').text(custom.fileSizeFormat(file.size))
                    shareCard.toggle('normal', function () {
                        btn.click(function () {
                            toast.setIcon('fas fa-info-circle text-info')
                            toast.setText('正在打包请稍等')
                            toast.getToast().show()
                            location.href = ctx + '/download/' + file.uuid
                        })
                    })
                    inputToggle.toggle('normal')
                } else {
                    toast.setIcon('fas fa-exclamation-circle fa-lg text-warning')
                    toast.setText(res.msg)
                    toast.getToast().show()
                }
            })
        }
    })
})