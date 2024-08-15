/*
 * @Author: IT-hollow
 * @Date: 2024-05-14 21:42:51
 * @LastEditors: hollow
 * @LastEditTime: 2024-05-22 22:32:46
 * @FilePath: \cocos-2d-template\assets\scripts\network\ajax.ts
 * @Description: xhr ajax请求封装
 *
 * Copyright (c) 2024 by efun, All Rights Reserved.
 */
import { BASE_REQUEST_OPTIONS } from '../data/constants'
import { BaseRequestOptionsType, ResponseResultType } from '../interfaces'
import { formatPostBody, qsString } from '../uitls'
const defaultOptions = BASE_REQUEST_OPTIONS

function ajax<T>(
    url: string,
    options: BaseRequestOptionsType
): Promise<ResponseResultType<T>> {
    const { method, params, body, headers } = Object.assign(
        {},
        defaultOptions,
        options
    )
    const xhr = new XMLHttpRequest()

    const paramStr = qsString(params)

    //启动并发送一个请求
    if (method.toLocaleLowerCase() === 'get') {
        xhr.open(
            'GET',
            `${url}${url.includes('?') ? '' : '?'}${paramStr}`,
            true
        )
        xhr.send(null)
    } else if (method.toLocaleLowerCase() === 'post') {
        xhr.open('post', url, true)
        for (const key in headers) {
            if (Object.prototype.hasOwnProperty.call(headers, key)) {
                xhr.setRequestHeader(key, headers[key])
            }
        }
        xhr.send(formatPostBody(body, headers['Content-Type']))
    }

    return new Promise((resolve, reject) => {
        const result = {
            data: null,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: {},
        }
        xhr.ontimeout = function () {
            result.status = xhr.status
            reject(result)
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) {
                return
            }
            const status = xhr.status
            const statusText = xhr.statusText
            result.status = status
            result.statusText = statusText

            if (status >= 200 && status < 400) {
                result.data = JSON.parse(xhr.response)
                resolve(result)
            } else {
                reject(result)
            }
        }
    })
}

export default ajax
