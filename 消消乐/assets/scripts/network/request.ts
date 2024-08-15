/*
 * @Author: IT-hollow
 * @Date: 2024-05-10 21:40:56
 * @LastEditors: hollow
 * @LastEditTime: 2024-05-22 22:32:28
 * @FilePath: \cocos-2d-template\assets\scripts\network\request.ts
 * @Description: 网络请求封装
 *
 * Copyright (c) 2024 by efun, All Rights Reserved.
 */
import { AnyObject, BaseRequestOptionsType } from '../interfaces'
import ajax from './ajax'
import fetchRequest from './fetch'
import jsonp from './jsonp'

class RequestAdapter {
    supportFetch = true

    constructor() {
        this.supportFetch = !!window.fetch
    }

    async get<T>(url: string, params?: AnyObject) {
        const method = 'GET'
        if (this.supportFetch) {
            const { data } = await fetchRequest<T>(url, {
                method,
                params,
            })
            return data
        } else {
            const { data } = await ajax<T>(url, {
                method,
                params,
            })

            return data
        }
    }

    async post<T>(url: string, body: AnyObject, opts?: BaseRequestOptionsType) {
        const method = 'POST'
        const headers = {
            'Content-Type': 'application/json;charset=utf-8',
        }
        const options = {
            method,
            headers,
            body,
        }

        if (opts) {
            Object.assign(options, opts)
        }

        if (this.supportFetch) {
            const { data } = await fetchRequest<T>(url, options)
            return data
        } else {
            const { data } = await ajax<T>(url, options)
            return data
        }
    }

    jsonp = jsonp
}

const request = new RequestAdapter()

export default request
