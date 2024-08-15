import { _decorator, Component, Label, Node } from 'cc'
import { GameManager } from './GameManager'
const { ccclass, property } = _decorator

@ccclass('StepController')
export class StepController extends Component {
    @property({ type: Node, tooltip: '游戏管理节点' })
    gameManagerNode: Node

    @property(Label)
    stepLabel: Label

    private step = 0

    /** 增加步数*/
    add(num: number = 1) {
        this.set(Math.max(0, this.step + num))
    }

    /** 更改步数 */
    set(num: number) {
        this.step = num
        this.stepLabel.string = `${this.step}`
    }

    get() {
        return this.step
    }
}
