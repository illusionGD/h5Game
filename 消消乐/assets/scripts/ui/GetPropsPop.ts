import { _decorator, Component, Node, Sprite, SpriteFrame, Input } from 'cc'
import { PropsTypeEnum } from '../interfaces'
const { ccclass, property } = _decorator

@ccclass('GetPropsPop')
export class GetPropsPop extends Component {
    @property([SpriteFrame])
    propsImgList: SpriteFrame[] = []
    @property(Number)
    duration: number = 1

    onLoad() {
        this.node.on(Input.EventType.TOUCH_START, () => {
            this.close()
        })
    }

    popUp(type: PropsTypeEnum) {
        this.node.active = true
        this.node.getChildByName('Sprite').getComponent(Sprite).spriteFrame =
            this.propsImgList.find((item) => item.name === `pop-${type}`)
        setTimeout(() => {
            this.close()
        }, this.duration * 1000)
    }

    close() {
        this.node.active = false
    }
}
