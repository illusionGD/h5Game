import { _decorator, Component, Node, director } from 'cc'
import {
    actInfo,
    getGameConfig,
    getGameInfo,
    initGameInfo,
    levelTextMap,
    loginShareInfo,
    userStatus,
} from './data'
import { LevelTypeEnum, PopTypeEnum } from './interfaces'
import {
    getActInfoGraphql,
    getCategoryManagerList,
    getDailyLoginAndShareTimes,
    getPropsByDailyOperation,
    startGameApi,
} from './network/api'
import { Pop } from './ui/Pop'
import {
    checkLogin,
    checkResCode,
    checkRoleInfo,
    formattedDate,
    getUserInfoFromCookie,
    toJSON,
    trackGA,
    webIframeCommunity,
} from './uitls'
const { ccclass, property } = _decorator

@ccclass('Main')
export class Main extends Component {
    popController: Pop

    lock = false

    onLoad() {
        const popNode = director.getScene().getChildByName('pop')
        this.popController = popNode.getComponent(Pop)
        // 先激活，触发onLoad
        popNode.active = true
        director.addPersistRootNode(popNode)
        // 再隐藏
        popNode.active = false
        director.preloadScene('play')
        getActInfoGraphql().then(({ data }) => {
            const { activityMsgConfig } = data
            if (activityMsgConfig) {
                const { activityMsg, isEnd, isNotStart } = activityMsgConfig
                actInfo.config = activityMsg.context
                    ? toJSON(activityMsg.context)
                    : {}
                actInfo.isEnd = isEnd.flag
                actInfo.isNotStart = isNotStart.flag
            }
        })
    }

    start() {
        const isLogin = checkLogin()
        if (!isLogin && !userStatus.skipApi) {
            this.popController.show(PopTypeEnum.LOGIN)
        }

        getCategoryManagerList({
            pid: 283,
        }).then(({ code, data }) => {
            if (checkResCode(code)) {
                // data[0].content
                webIframeCommunity('rulePop', data[0].content)
            }
        })

        if (isLogin) {
            // 每日登录|分享
            getDailyLoginAndShareTimes().then((res) => {
                if (res) {
                    const { login } = res.data.dailyOperationInfo
                    Object.assign(loginShareInfo, res.data.dailyOperationInfo)
                    const loginDays = login.allDateNumMap
                    const currentDate = formattedDate().split(' ')[0]
                    if (!loginDays[currentDate]) {
                        getPropsByDailyOperation({ operation: 'login' }).then(
                            ({ code }) => {
                                if (checkResCode(code)) {
                                    loginShareInfo.login.todayNum = 1
                                    loginShareInfo.login.allDateNumMap[
                                        currentDate
                                    ] = '1'
                                    loginShareInfo.login.totalNum =
                                        loginShareInfo.login.totalNum + 1
                                }
                            }
                        )
                    }
                }
            })
        }
    }

    onShow(e, type: PopTypeEnum) {
        this.popController.show(type)
    }

    async toPlay(e, level: LevelTypeEnum) {
        if (actInfo.isEnd || actInfo.isNotStart) {
            this.popController.tipsUp('イベント期間外です')
            return
        }

        if ((!checkLogin() || !checkRoleInfo()) && !userStatus.skipApi) {
            this.popController.show(PopTypeEnum.LOGIN)
            return
        }
        if (this.lock) {
            return
        }
        trackGA('关卡按钮', '点击', levelTextMap[level])
        const gameData = {
            gameId: '',
            propsInfo: {},
        }
        if (!userStatus.skipApi) {
            this.lock = true
            const { code, data, message } = await startGameApi({ level: level })
            if (!checkResCode(code)) {
                this.lock = false
                this.popController.tipsUp(message)
                return
            }
            Object.assign(gameData, data)
        } else {
            const propsInfo: any = {}
            const { propsConfig } = getGameConfig()
            Object.keys(propsConfig).map((key) => {
                propsInfo[key] = propsConfig[key].count
            })
            Object.assign(gameData, { propsInfo })
        }
        initGameInfo({ ...gameData, level })
        director.loadScene('play', () => {
            this.lock = false
        })
    }
}
