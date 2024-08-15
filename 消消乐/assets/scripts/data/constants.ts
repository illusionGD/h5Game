/*
 * @Author: IT-hollow
 * @Date: 2024-05-10 21:10:40
 * @LastEditors: hollow
 * @LastEditTime: 2024-08-06 11:05:27
 * @FilePath: \happyEliminatingTwo\assets\scripts\data\constants.ts
 * @Description: 常量文件
 *
 * Copyright (c) 2024 by efun, All Rights Reserved.
 */

import { BaseRequestOptionsType, ResponseType } from '../interfaces'

export const hostMap = {
    FTP_PATH: '/gwjp/',
    PLATFORM: 'jp',
    LANGUAGE: 'ja-JP',
    EFE_ACTIVITY_HOST: 'https://efe-activity.efunjp.com/',
    testHost: 'http://localhost:38101/',
    PF_HOST: 'https://pf.efunjp.com/',
    GAME_HOST: 'https://game.efunjp.com/',
    PF_WEB_HOST: 'https://m.efunjp.com/',
    LOGIN_HOST: 'https://login.efunjp.com/',
    LOGIN_WEB_PATH: 'https://m.efunjp.com/enter/login?from=',
    CDN_HOST: 'https://resjp-download.vsplay.com/res_jp',
    PLATFORM_GAME_CODE: 'efunjpplatform',
    gameCode: 'jpmsk',
    activityCode: 'happyEliminatingTwo',
}
export const baseParams = {
    language: hostMap.LANGUAGE,
    from: 'pc',
    platform: hostMap.PLATFORM,
    loginGameCode: hostMap.gameCode,
    gameCode: hostMap.gameCode,
    activityCode: hostMap.activityCode,
    crossdomain: 'true',
}

/**基本请求配置 */
export const BASE_REQUEST_OPTIONS: BaseRequestOptionsType = {
    method: 'GET',
    params: null,
    body: null,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    cache: 'no-cache',
    credentials: 'include',
    responseType: ResponseType.JSON,
    timeout: 60000,
}
/**timestamp数 */
export const TIMESTAMP_NUMBER = {
    /**秒 */
    second: 1000,
    /**分 */
    min: 60 * 1000,
    /**小时 */
    hour: 60 * 60 * 1000,
    /**天 */
    day: 24 * 60 * 60 * 1000,
    /**周 */
    week: 7 * 24 * 60 * 60 * 1000,
    /**月(30天) */
    month: 30 * 24 * 60 * 60 * 1000,
}
export const ROLE_INFO_KEY = 'roleInfo'
