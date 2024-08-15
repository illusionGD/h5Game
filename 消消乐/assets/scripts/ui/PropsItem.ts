import { _decorator, Component, Node, Label } from 'cc'

const { ccclass, property } = _decorator

@ccclass('PropsItem')
export class PropsItem extends Component {
    @property(String)
    type: string = ''

    /**设置道具数量 */
    setCount(num: number) {
        this.node
            .getChildByPath('num-bg/num')
            .getComponent(Label).string = `${num}`
    }

    light(isOpen: boolean) {
        this.node.getChildByName('Particle2D').active = !!isOpen
        this.node.getChildByName('props-box-light').active = !!isOpen
    }
}
