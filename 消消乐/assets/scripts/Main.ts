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
    }

    start() {}

    onShow(e, type: PopTypeEnum) {
        this.popController.show(type)
    }

    async toPlay(e, level: LevelTypeEnum) {
        initGameInfo({
            gameId: '',
            level,
            propsInfo: {},
        })
        director.loadScene('play', () => {
            this.lock = false
        })
    }
}
