$(document).ready(function () {
    'use strict'

    let toast = new custom.Toast($('#toast'))

    // cropper配置
    let avatar = $('#avatar').get(0)
    let cropBoxData
    let canvasData
    let cropper
    let cropOptions = {
        aspectRatio: 1,
        autoCropArea: 0.5,
        dragMode: "move",
        center: false,
        highlight: false,
        toggleDragModeOnDblclick: false,
        preview: ".preview",
        ready: function () {
            cropper.setCropBoxData(cropBoxData).setCanvasData(canvasData)
        },
    }

    // cropper初始化
    $("#avatarModal").on('shown.bs.modal', function () {
        cropper = new Cropper(avatar, cropOptions)
    }).on('hidden.bs.modal', function () {
        cropBoxData = cropper.getCropBoxData()
        canvasData = cropper.getCanvasData()
        cropper.destroy()
    })

    // 图片上传
    $('#CropUpload').click(function () {
        $('#uploadInput').click()
    })

    $("#uploadInput").on('change', function () {
        let file = this.files[0]
        if (file.size > MAX_AVATAR_SIZE) {
            toast.setIcon('fas fa-exclamation-circle fa-lg text-danger')
            toast.setText(`上传图片不能大于${custom.fileSizeFormat(MAX_AVATAR_SIZE)}`)
            toast.getToast().show()
        } else {
            let reader = new FileReader()
            reader.onload = function (e) {
                cropper.replace(e.target.result)
            }
            reader.readAsDataURL(file)
        }
        this.value = ''
    })

    // 图片编辑
    $('#CropRotateRight').click(function () {
        cropper.rotate(45)
    })
    $('#CropRotateLeft').click(function () {
        cropper.rotate(-45)
    })
    $('#CropZoomIn').click(function () {
        cropper.zoom(0.1)
    })
    $('#CropZoomOut').click(function () {
        cropper.zoom(-0.1)
    })
    $('#CropReset').click(function () {
        cropper.reset()
    })

    // 图片上传
    $('#CropConfirm').click(function () {
        cropper.getCroppedCanvas().toBlob((blob) => {
            let formData = new FormData()
            let $btn = $(this)
            formData.append('avatar', blob, 'upload.png')

            $.ajax({
                url: ctx + '/alter-avatar',
                method: "POST",
                data: formData,
                processData: false,
                contentType: false,
                beforeSend: function () {
                    $btn.prop('disabled', true)
                },
                complete: function () {
                    setTimeout(function () {
                        $btn.prop('disabled', false)
                    }, 400)
                },
                success: function (res) {
                    if (res.code === 200) {
                        toast.setIcon('fas fa-check-circle fa-lg text-success')
                        setTimeout(function () {
                            location.replace(ctx + '/profile')
                        }, 400)
                    } else {
                        toast.setIcon('fas fa-exclamation-circle fa-lg text-danger')
                    }
                    toast.setText(res.msg)
                    toast.getToast().show()
                }
            })
        })
    })

    // 修改回调
    function alterCallback(url, formData, $btn, message) {
        $.ajax({
            url: url,
            method: 'POST',
            data: formData,
            beforeSend: function () {
                $btn.prop('disabled', true)
            },
            complete: function () {
                setTimeout(function () {
                    $btn.prop('disabled', false)
                }, 1000)
            },
            success: function (res) {
                if (res.code === 200) {
                    toast.setIcon('fas fa-check-circle fa-lg text-success')
                    toast.setText(res.msg)
                    toast.getToast().show()
                    setTimeout(function () {
                        location.replace(ctx + '/profile')
                    }, 1000)
                } else {
                    if (message) {
                        toast.setIcon('fas fa-exclamation-circle fa-lg text-danger')
                        toast.setText(res.msg)
                        toast.getToast().show()
                    } else {
                        let errors = res.data.errors
                        $.each(errors, function (key) {
                            passwordValidations[key].elem.text(errors[key][0])
                            $passwordForm.find(`input[name=${key}]`).addClass('is-invalid')
                        })
                    }
                }
            }
        })
    }


    // 修改密码
    let $passwordForm = $('#passwordForm')
    let passwordForm = $passwordForm.get(0)

    let passwordInputs = $passwordForm.find('input')
    let passwordValidations = custom.getInitial(passwordInputs)

    $passwordForm.find('#passwordBtn').click(function () {
        if (!passwordForm.checkValidity()) {
            custom.setInitial(passwordValidations, passwordInputs, $passwordForm)
        } else {
            if (!custom.checkPassword($('#newPassword'), $('#confirmPassword'))) {
            } else {
                let formData = $passwordForm.serialize()
                alterCallback(ctx + '/alter-password', formData, $(this))
            }
        }
    })

    // 修改信息
    let $infoForm = $('#infoForm')
    let infoForm = $infoForm.get(0)

    let infoInputs = $infoForm.find('input')
    let infoValidations = custom.getInitial(infoInputs)

    $infoForm.find('#infoBtn').click(function () {
        if (!infoForm.checkValidity()) {
            custom.setInitial(infoValidations, infoInputs, $infoForm)
        } else {
            let formData = $infoForm.serialize()
            alterCallback(ctx + '/alter-info', formData, $(this))
        }
    })

    // 申请会员
    let $applyForm = $('#applyForm')
    let applyForm = $applyForm.get(0)

    $applyForm.find('#applyBtn').click(function () {
        if (applyForm.checkValidity()) {
            let formData = $applyForm.serialize()
            alterCallback(ctx + '/msg-appr', formData, $(this), true)
        }
    })

    // 用户留言
    let $messageForm = $('#messageForm')
    let messageForm = $messageForm.get(0)

    $messageForm.find('#messageBtn').click(function () {
        if (messageForm.checkValidity()) {
            let formData = $messageForm.serialize()
            alterCallback(ctx + '/msg-appr', formData, $(this), true)
        }
    })
})