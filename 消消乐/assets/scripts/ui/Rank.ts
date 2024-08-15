import {
    _decorator,
    Component,
    Node,
    Prefab,
    instantiate,
    Label,
    Sprite,
    SpriteFrame,
} from 'cc'
import { LevelTypeEnum, RankItemType } from '../interfaces'
import { getRankListApi } from '../network/api'
import { checkResCode, getUserInfoFromCookie, roleInfo } from '../uitls'
const { ccclass, property } = _decorator

@ccclass('Rank')
export class Rank extends Component {
    @property(Prefab)
    rankItemPrefab: Prefab
    @property(Node)
    contentNode: Node
    @property(Node)
    userNode: Node
    @property(SpriteFrame)
    actSprite: SpriteFrame = null
    @property(SpriteFrame)
    normalSprite: SpriteFrame = null

    lastBtn: Node = null
    level: LevelTypeEnum = LevelTypeEnum.SIMPLE

    lock = false

    onEnable() {
        this.getRankList(null, this.level)
    }
    start() {}

    async getRankList(e, level: LevelTypeEnum) {
        this.level = level
        if (this.lock) {
            return
        }
        this.lock = true
        const { code, data } = await getRankListApi({
            page: 0,
            pageSize: 99,
            level: this.level,
        })
        this.lock = false
        this.changeBtnBg(level)
        if (checkResCode(code)) {
            const { rankList, userRank } = data
            this.contentNode.removeAllChildren()
            rankList.forEach((item) => {
                const rankItem = instantiate(this.rankItemPrefab)
                this.setRankItem(rankItem, item)
                this.contentNode.addChild(rankItem)
            })

            if (userRank) {
                this.userNode.active = true
                if (!userRank.name) {
                    const info = roleInfo.get(getUserInfoFromCookie().userId)
                    userRank.name = info ? info.roleName : ''
                }
                this.setRankItem(this.userNode, userRank)
            } else {
                this.userNode.active = false
            }
        }
    }

    setRankItem(
        rankItemNode: Node,
        { rate, name, index, score }: RankItemType
    ) {
        rankItemNode.getChildByName('index').getComponent(Label).string = `${
            index > 0 ? index : ''
        }`
        rankItemNode.getChildByPath('name/Label').getComponent(Label).string =
            name
        rankItemNode.getChildByPath('name/rate').getComponent(Label).string =
            rate
        rankItemNode.getChildByName('score').getComponent(Label).string = `${
            score || 0
        }`
    }

    changeBtnBg(level: LevelTypeEnum) {
        const target = this.node.getChildByPath(`btn-list/btn-rank-${level}`)
        if (!target) {
            return
        }
        if (this.lastBtn) {
            this.lastBtn.getComponent(Sprite).spriteFrame = this.normalSprite
        }

        target.getComponent(Sprite).spriteFrame = this.actSprite
        this.lastBtn = target
    }
    update(deltaTime: number) {}
}
