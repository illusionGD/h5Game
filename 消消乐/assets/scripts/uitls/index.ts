import { ROLE_INFO_KEY, TIMESTAMP_NUMBER } from '../data/constants'
import { AnyObject, RoleInfoType } from '../interfaces'
import { getRoleInfo, getServerInfo } from '../network/api'
import CryptoJS from 'crypto-js'
export const storage = {
    get: <T>(key): T => {
        const str = localStorage.getItem(key)
        return typeof str === 'string' ? toJSON(str) : null
    },
    set: (key, val) => {
        localStorage.setItem(key, JSON.stringify(val))
    },
}

export function toJSON(str: string) {
    try {
        return JSON.parse(str)
    } catch (error) {}
}

export const roleInfo = {
    get: (userId: string | number) => {
        return storage.get<RoleInfoType | null>(`${userId}-${ROLE_INFO_KEY}`)
    },
    set: (userId: string | number, val) => {
        storage.set(`${userId}-${ROLE_INFO_KEY}`, val)
    },
    del: (userId: string | number) => {
        storage.set(`${userId}-${ROLE_INFO_KEY}`, '')
    },
}
/**
 * 校验是否为纯粹的对象
 * @param obj
 */
export function isPlainObject(obj) {
    let proto, Ctor
    if (!obj || typeof obj !== 'object') return false
    proto = Object.getPrototypeOf(obj)
    if (!proto) return true
    Ctor = proto.hasOwnProperty('constructor') && proto.constructor
    return typeof Ctor === 'function' && Ctor === Object
}
/**是否为无效值 */
export function isInvalidVal(val: any) {
    return [NaN, undefined, null, 'null', 'undefined', 'NaN'].indexOf(val) >= 0
}

/**
 * 将对象转成参数
 * @param obj 对象
 * @param isEncode 是否encode
 * @returns a=1&b=2...
 */
export function qsString(obj: any, isEncode: boolean = true) {
    if (obj instanceof Object) {
        let str = ''
        Object.keys(obj).forEach((key, index) => {
            str += `${index ? '&' : ''}${key}=${
                isEncode ? encodeURIComponent(obj[key]) : obj[key]
            }`
        })
        return str
    } else if (typeof obj === 'string') {
        return obj
    } else if (typeof obj === 'number') {
        return `${obj}`
    } else {
        return ''
    }
}

/**获取cookie */
export function getCookie(name: string) {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) === ' ') c = c.substring(1, c.length)
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
}

/**
 * 设置cookie
 * @param key
 * @param val
 * @param time 过期时间：默认一天
 * @param domain 域名
 */
export function setCookie(
    key: string,
    val: string,
    time: number = TIMESTAMP_NUMBER.day,
    domain?: string
) {
    const date = new Date()

    date.setTime(date.getTime() + time)

    const expires = '; expires=' + date.toUTCString()

    let cookieString = `${key}=${val || ''}${expires}; path=/`

    if (domain) {
        cookieString += `; domain=${domain}`
    }

    document.cookie = cookieString
}

/**
 * 删除cookie
 * @param name
 */
export function delCookie(name: string) {
    setCookie(name, '', -0)
}

/**解析url参数并转成对象 */
export function parseUrlParams(url: string): Record<string, string | string[]> {
    const urlObj = new URL(url)
    const params = new URLSearchParams(urlObj.search)
    const result: Record<string, string | string[]> = {}

    params.forEach((value, key) => {
        if (result[key]) {
            if (Array.isArray(result[key])) {
                ;(result[key] as string[]).push(value)
            } else {
                result[key] = [result[key] as string, value]
            }
        } else {
            result[key] = value
        }
    })

    return result
}

/**
 * 格式化post请求的body
 * @param body
 * @param contentType
 */
export function formatPostBody(
    body: XMLHttpRequestBodyInit,
    contentType: string
) {
    if (contentType.includes('urlencoded')) return qsString(body)
    if (contentType.includes('json'))
        return typeof body === 'string' ? body : JSON.stringify(body)
}

/**web通讯 */
export function webIframeCommunity(type: string, data?: any) {
    const e = {
        type,
        data: data,
    }
    console.log('🚀 ~ e:', e)
    window.top.postMessage(e, window.location.href)
}
/**
 * 获取用户信息cookie
 */
export function getUserInfoFromCookie() {
    const userId = getCookie('efunUserid')
    const mySign = getCookie('mySign')
    const timestamp = getCookie('timestamp')
    return {
        userId,
        loginSign: mySign,
        loginTimestamp: timestamp,
    }
}

/**校验角色信息 */
export function checkRoleInfo() {
    const { userId } = getUserInfoFromCookie()
    return !!roleInfo.get(userId)
}

export function logout() {
    delUserInfoCookie()
    webIframeCommunity('reload', {})
}

/**删除用户信心cookie */
export function delUserInfoCookie() {
    delCookie('efunUserid')
    delCookie('mySign')
    delCookie('timestamp')
    window.localStorage.setItem(ROLE_INFO_KEY, null)
}

export function getUrlParams(): AnyObject {
    const params = {}
    const queryString = location.href.split('?')[1]

    // 如果没有参数，返回空对象
    if (!queryString) {
        return params
    }

    // 将参数字符串按 "&" 分割成数组
    const keyValuePairs = queryString.split('&')

    // 遍历数组，将每个键值对解析成对象的属性和值
    keyValuePairs.forEach(function (keyValuePair) {
        const pair = keyValuePair.split('=')
        const key = decodeURIComponent(pair[0])
        const value = decodeURIComponent(pair[1] || '')
        // 如果对象中已存在相同的键，则将值转换为数组
        if (params[key]) {
            if (Array.isArray(params[key])) {
                params[key].push(value)
            } else {
                params[key] = [params[key], value]
            }
        } else {
            params[key] = value
        }
    })

    return params
}
/**ga埋点 */
export function trackGA(type: string, action: string, label?: string) {
    webIframeCommunity('trackGA', {
        type,
        action,
        label,
    })
}
export function setTrackerOtherFields(params: {
    int_value?: number
    double_value?: number
    string_value?: string
}) {
    webIframeCommunity('setTrackerOtherFields', params)
}
/**更新登录信息，从url上 */
export function autoLogin() {
    const params = getUrlParams()

    // 使用 pushState 更新 URL
    webIframeCommunity('pushState', {})
    // 没有传信息
    if (
        !params ||
        !['uid', 'sign', 'timestamp', 'serverCode', 'roleId'].every((key) => {
            return !!params[key]
        })
    ) {
        return null
    }

    const { uid, sign, timestamp, serverCode, roleId } = params
    const serverName = params.serverName || ''
    const roleName = params.roleName || ''

    const info = {
        efunUserid: uid,
        userId: uid,
        mySign: sign,
        timestamp,
    }

    Object.keys(info).forEach((key) => [setCookie(key, info[key])])

    if (!serverName) {
        getServerInfo().then(({ code, ServerList }) => {
            if (code === '200') {
                const list = ServerList
                const serverInfo = list.find(
                    (item) => item.ServerCode === serverCode
                )
                if (serverInfo) {
                    const localInfo = roleInfo.get(uid)
                    Object.assign(localInfo, {
                        serverName: serverInfo.ServerName,
                    })
                    roleInfo.set(uid, localInfo)
                }
            }
        })
    }

    if (!roleName) {
        getRoleInfo(serverCode).then(({ code, list }) => {
            if (code === '200') {
                const roleList = list as RoleInfoType[]
                const role = roleList.find((item) => item.roleid === roleId)
                if (role) {
                    const localInfo = roleInfo.get(uid)
                    Object.assign(localInfo, {
                        roleName: role.name,
                    })
                    roleInfo.set(uid, localInfo)
                }
            }
        })
    }

    roleInfo.set(uid, {
        serverCode,
        roleId,
        serverName,
        roleName,
    })

    return info
}

/**校验登录信息 */
export function checkLogin() {
    const { userId, loginSign, loginTimestamp } = getUserInfoFromCookie()
    const login = userId && loginSign && loginTimestamp
    return !!login
}

export function cryptoAES(data: any, key: string) {
    const str = typeof data === 'string' ? data : JSON.stringify(data)
    const ciphertext = CryptoJS.AES.encrypt(str, key).toString()

    return ciphertext
}

export function deepCloneObj(obj: AnyObject) {
    return JSON.parse(JSON.stringify(obj))
}

export function checkResCode(code: string) {
    // @ts-ignore
    return ['1000', 'e1000'].includes(code)
}
// 小于10的数字补零
function addZero(num) {
    return num < 10 ? '0' + num : num
}
export function formattedDate(date?: Date) {
    const cur = date || new Date()
    // 获取年、月、日、小时、分钟、秒
    const year = cur.getFullYear()
    const month = addZero(cur.getMonth() + 1) // 月份是从 0 开始的，所以要加 1
    const day = addZero(cur.getDate())
    const hours = addZero(cur.getHours())
    const minutes = addZero(cur.getMinutes())
    const seconds = addZero(cur.getSeconds())

    // 拼接成 yyyy-MM-dd hh:mm:ss 格式
    const formattedDate =
        year +
        '-' +
        month +
        '-' +
        day +
        ' ' +
        hours +
        ':' +
        minutes +
        ':' +
        seconds
    return formattedDate
}

export function chessBoardPosDeduplication(posList: number[][]) {
    const temp = []
    posList.forEach((item) => {
        const [row, col] = item
        temp.push(`${row},${col}`)
    })
    const arr = Array.from(new Set(temp))

    return arr.map((str) => str.split(',').map((p) => Number(p)))
}
