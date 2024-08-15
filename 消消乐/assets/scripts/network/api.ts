import { getGameInfo, levelTextMap, userStatus } from '../data'
import { baseParams, hostMap } from '../data/constants'
import {
    AnyObject,
    BaseResponseType,
    GameInfoType,
    LevelTypeEnum,
    RankItemType,
    ServerListType,
} from '../interfaces'
import {
    checkLogin,
    checkRoleInfo,
    cryptoAES,
    getUrlParams,
    getUserInfoFromCookie,
    roleInfo,
    setTrackerOtherFields,
    trackGA,
} from '../uitls'
import request from './request'
const urlPrefix = hostMap.EFE_ACTIVITY_HOST
// hostMap[window.location.port ? 'testHost' : 'EFE_ACTIVITY_HOST']

function handleParams(params) {
    if (!userStatus.isAutoLogin) {
        delete params.loginGameCode
    }

    return params
}
export function requestByGraphql<T>(params) {
    return request.post<T>(
        `${urlPrefix}graphql?language=${baseParams.language}`,
        params
    )
}

/**
 * @description: graphql获取活动起止时间
 */
export function getActInfoGraphql(): Promise<any> {
    const { crossdomain, from, ...filterParam } = baseParams
    const query = {
        ...filterParam,
    }

    handleParams(query)

    const data = {
        operationName: 'actInfo',
        query: `query actInfo($baseParams: BaseParamsDTO!){
            activityMsgConfig(query: $baseParams) {
                    activityMsg {
                        context
                    }
                    isEnd {
                        flag
                    }
                    isNotStart {
                        flag
                    }
                }
         
            }
            `,
        variables: {
            baseParams: query,
        },
    }

    return requestByGraphql(data)
}

export function getServerInfo() {
    const { gameCode, crossdomain } = baseParams
    return request.jsonp<{ code: string; ServerList: ServerListType[] }>(
        `${hostMap.GAME_HOST}gameServer_findAllServerByGameCodePC.shtml`,
        {
            params: {
                gameCode,
                crossdomain,
            },
        }
    )
}

export function getRoleInfo(serverCode: string) {
    const { userId } = getUserInfoFromCookie()
    const { gameCode, crossdomain } = baseParams
    return request.jsonp<{ code: string; list: any[] }>(
        `${hostMap.GAME_HOST}gameRole_findRole.shtml`,
        {
            params: {
                gameCode,
                crossdomain,
                uid: userId,
                serverCode,
            },
        }
    )
}

/**
 * 开始游戏接口
 * @param params
 */
export function startGameApi(params: { level: LevelTypeEnum }) {
    const userInfo = getUserInfoFromCookie()

    const newParams = {
        ...userInfo,
        ...baseParams,
        ...params,
        startTime: new Date().getTime(),
    }
    const info = roleInfo.get(userInfo.userId)
    if (info) {
        Object.assign(newParams, info)
    }
    handleParams(newParams)
    return request.get<BaseResponseType<GameInfoType>>(
        `${urlPrefix}happy-eliminating/startGame`,
        newParams
    )
}

export function getRankListApi(params: {
    page: number
    pageSize: number
    level: string
}) {
    const newParams = {
        ...baseParams,
        ...params,
    }
    if (checkLogin() && checkRoleInfo()) {
        const userInfo = getUserInfoFromCookie()

        Object.assign(newParams, {
            ...userInfo,
            ...roleInfo.get(userInfo.userId),
        })
    }
    handleParams(newParams)
    return request.get<
        BaseResponseType<{
            rankList: RankItemType[]
            userRank: RankItemType | null
        }>
    >(`${urlPrefix}happy-eliminating/getRankList`, newParams)
}

export function getDailyLoginAndShareTimes() {
    const { crossdomain, from, ...filterParam } = baseParams
    const { userId, loginSign, loginTimestamp } = getUserInfoFromCookie()
    const info = roleInfo.get(userId)
    const query = {
        ...filterParam,
        userId: Number(userId),
        loginSign,
        loginTimestamp,
        operation: 'login,share',
    }
    if (info) {
        const { roleId, serverCode } = info
        Object.assign(query, {
            roleId,
            serverCode,
        })
    }
    handleParams(query)

    const data = {
        operationName: 'actInfo',
        query: `query actInfo($baseParams: GetPropsByDailyOperationDTO!){
            dailyOperationInfo(query: $baseParams){
                login {
                  todayNum
                  allDateNumMap
                  totalNum
                  propsNumInfo{todayNum}
                }
                share{
                  todayNum
                  allDateNumMap
                  totalNum
                  propsNumInfo{todayNum}
                }
              }}
            `,
        variables: {
            baseParams: query,
        },
    }

    return requestByGraphql<any>(data)
}

/**每日登录|分享接口 */
export function getPropsByDailyOperation(params: {
    operation: 'login' | 'share'
    otherInfo?: AnyObject
}) {
    const userInfo = getUserInfoFromCookie()
    const newParams = {
        ...baseParams,
        ...userInfo,
        operation: params.operation,
    }
    const info = roleInfo.get(userInfo.userId)
    if (params.otherInfo) {
        Object.assign(newParams, {
            otherInfo: JSON.stringify(params.otherInfo),
        })
    }
    if (info) {
        Object.assign(newParams, info)
    }
    handleParams(newParams)
    return request.get<any>(
        `${urlPrefix}common/public/getPropsByDailyOperation`,
        newParams
    )
}

/**
 * 校验游戏接口
 * @param params
 * @param data
 */
export function checkGameApi(
    params: {
        gameId: string
        isGameOver?: boolean
        score?: number
    },
    data: any[]
) {
    const userInfo = getUserInfoFromCookie()
    const localRoleInfo = roleInfo.get(userInfo.userId) || {}
    const { isGameOver, gameId, score } = params
    const endTime = new Date().getTime()
    const str = cryptoAES(data, userInfo.userId)
    const source =
        getUrlParams()['utm_source'] || getUrlParams()['campaign_name'] || ''
    if (isGameOver) {
        const level = getGameInfo().level
        setTrackerOtherFields({
            int_value: score,
            string_value: level,
        })
        trackGA('游戏通关', '游戏通关', levelTextMap[level])
    }
    const newParams = {
        ...baseParams,
        ...userInfo,
        ...localRoleInfo,
        isGameOver: isGameOver || false,
        source,
        gameId,
        score,
        endTime,
        gameData: str,
    }
    handleParams(newParams)
    return request.post<
        BaseResponseType<{ lastScore: number; rewardInfoList: any[] } | null>
    >(`${urlPrefix}happy-eliminating/checkGame`, newParams, {
        headers: { 'Content-Type': 'application/json' },
    })
}

export function getCategoryManagerList(params: { pid: number }) {
    const { language, ...other } = baseParams
    const newParams = {
        ...other,
        ...params,
    }
    handleParams(newParams)
    return request.get<BaseResponseType<{ content: string }[]>>(
        `${urlPrefix}common/getCategoryManagerList`,
        newParams
    )
}
