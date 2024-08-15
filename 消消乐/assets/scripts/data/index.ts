import { AnyObject, GameInfoType } from '../interfaces'
import { deepCloneObj } from '../uitls'

const userStatus = {
    isAutoLogin: false,
    /** 跳过接口：游客不做接口校验 */
    skipApi: false,
}
const levelTextMap = {
    simple: '简单',
    normal: '普通',
    hard: '困难',
}

const actInfo = {
    config: {
        gameConfig: {
            selectTime: {
                simple: 180,
                normal: 120,
                hard: 60,
            },
            tipsTime: 5,
            propsConfig: {
                propsUp: {
                    count: 0,
                    maxRemove: 6,
                },
                propsLeft: {
                    count: 0,
                    maxRemove: 6,
                },
                propsBoom: {
                    count: 0,
                    maxRemove: 9,
                },
                propsBucket: {
                    count: 0,
                    maxRemove: 36,
                },
                propsShovel: {
                    count: 0,
                    maxRemove: 1,
                },
                propsLottery: {
                    count: 1,
                    maxRemove: 0,
                },
            },
            maxScore: 9999,
        },
    },
    isEnd: false,
    isNotStart: false,
}

const loginShareInfo = {
    login: {
        todayNum: 0,
        allDateNumMap: {},
        totalNum: 0,
    },
    share: {
        todayNum: 0,
        allDateNumMap: {},
        totalNum: 0,
    },
}

const gameInfo: GameInfoType = {
    gameId: '',
    propsInfo: {},
}

/** 获取游戏配置 */
function getGameConfig() {
    return deepCloneObj(actInfo.config.gameConfig)
}

function initGameInfo(info: GameInfoType) {
    Object.assign(gameInfo, info)
}

function getGameInfo() {
    return gameInfo
}

export {
    userStatus,
    levelTextMap,
    actInfo,
    getGameConfig,
    initGameInfo,
    loginShareInfo,
    getGameInfo,
}
