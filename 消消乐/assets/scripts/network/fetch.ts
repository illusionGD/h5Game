/*
 * @Author: IT-hollow
 * @Date: 2024-05-10 22:14:01
 * @LastEditors: hollow
 * @LastEditTime: 2024-05-22 22:40:26
 * @FilePath: \cocos-2d-template\assets\scripts\network\fetch.ts
 * @Description: fetch请求封装
 *
 * Copyright (c) 2024 by efun, All Rights Reserved.
 */
import { BASE_REQUEST_OPTIONS } from '../data/constants'
import {
    BaseRequestOptionsType,
    ResponseResultType,
    ResponseType,
} from '../interfaces'
import { formatPostBody, isPlainObject, qsString } from '../uitls'

const inital = BASE_REQUEST_OPTIONS

export default async function fetchRequest<T>(
    url: string,
    config?: BaseRequestOptionsType
): Promise<ResponseResultType<T>> {
    if (typeof url !== 'string')
        throw new TypeError('url must be required and of string type')
    if (!isPlainObject(config)) config = {}

    config = Object.assign({}, inital, config)

    const { method, params, body, headers, cache, credentials, responseType } =
        config

    if (params != null) {
        const paramsStr = qsString(params)
        url += `${url.includes('?') ? '' : '?'}${paramsStr}`
    }

    config = {
        method: method.toUpperCase(),
        headers,
        credentials,
        cache,
    }

    if (/^(POST|PUT|PATCH)$/i.test(method) && body != null) {
        if (isPlainObject(body)) {
            config.body = formatPostBody(body, headers['Content-Type'])
        }
    }

    try {
        const req = await fetch(url, config)
        const { status, statusText } = req
        const result = {
            data: null,
            status,
            statusText,
            headers: {},
        }

        if (status >= 200 && status < 400) {
            switch (responseType.toUpperCase()) {
                case ResponseType.JSON:
                    result.data = await req.json()
                    break
                case ResponseType.TEXT:
                    result.data = await req.text()
                    break
                case ResponseType.BLOB:
                    result.data = await req.blob()
                    break
                case ResponseType.ARRAYBUFFER:
                    result.data = await req.arrayBuffer()
                    break
            }
        }
        return result
    } catch (error) {
        console.log('fetch请求错误:', error)
        return error
    }
}
