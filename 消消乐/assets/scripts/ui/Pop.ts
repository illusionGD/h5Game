import { _decorator, Component, Node, Input, director, game, Label } from 'cc'
import { userStatus } from '../data'
import { PopTypeEnum, PostMsgTypeEnum } from '../interfaces'
import {
    getUserInfoFromCookie,
    roleInfo,
    trackGA,
    webIframeCommunity,
} from '../uitls'
const { ccclass } = _decorator

@ccclass('Pop')
export class Pop extends Component {
    typeList: PopTypeEnum[] = [
        PopTypeEnum.GAME_OVER,
        PopTypeEnum.RANK,
        PopTypeEnum.RULE,
        PopTypeEnum.SHARE,
        PopTypeEnum.GAME_RES,
        PopTypeEnum.TIPS,
        PopTypeEnum.LOGIN,
    ]

    onLoad() {
        this.node.on(Input.EventType.TOUCH_START, () => {
            this.close()
        })
        this.close()
    }

    start() {
        const { userId } = getUserInfoFromCookie()
        const node = this.node
            .getChildByName(PopTypeEnum.GAME_RES)
            .getChildByName('user-name')
        if (userId) {
            node.getComponent(Label).string = roleInfo.get(userId)!.roleName
        } else {
            node.active = false
        }
    }

    onShow(e, type?: PopTypeEnum) {
        this.show(type)
    }

    onClose(e) {
        this.close()
    }

    show(type?: PopTypeEnum) {
        if (type === PopTypeEnum.RULE) {
            webIframeCommunity('showRulePop')
            this.close()
            return
        }
        if (type === PopTypeEnum.SHARE) {
            trackGA('分享按钮', '点击', '分享按钮')
        }
        this.node.active = true
        this.typeList.forEach((item) => {
            this.close(item)
        })

        type && (this.node.getChildByName(type).active = true)
    }

    close(type?: PopTypeEnum) {
        if (type) {
            const node = this.node.getChildByName(type)
            if (node.active) {
                node.active = false
            }
        } else {
            this.node.active = false
        }
    }

    setGameScore(score: number) {
        this.node
            .getChildByName(PopTypeEnum.GAME_RES)
            .getChildByName('score')
            .getComponent(Label).string = `${score}`
    }

    setMaxScore(score: number) {
        this.node
            .getChildByName(PopTypeEnum.GAME_RES)
            .getChildByName('max-score-num')
            .getComponent(Label).string = `${score}`
    }

    setTotalGameScore(score: number) {
        this.node
            .getChildByName(PopTypeEnum.GAME_RES)
            .getChildByName('max-score')
            .getComponent(Label).string = `${score}`
    }

    gotoMain() {
        director.loadScene('main', () => {
            this.close()
        })
    }

    gotoLogin() {
        webIframeCommunity(PostMsgTypeEnum.LOGIN)
    }

    tipsUp(msg?: string) {
        this.show(PopTypeEnum.TIPS)
        this.node
            .getChildByName(PopTypeEnum.TIPS)
            .getChildByName('Label')
            .getComponent(Label).string = msg || ''
    }

    clickShare(e, type: string) {
        webIframeCommunity(PostMsgTypeEnum.THREE_SHARE, { shareType: type })
    }

    confirmNotLogin() {
        this.close()
        userStatus.skipApi = true
    }
}
