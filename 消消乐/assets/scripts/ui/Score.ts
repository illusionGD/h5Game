import { _decorator, Component, Node, Label } from 'cc'
const { ccclass, property } = _decorator

@ccclass('ScoreController')
export class ScoreController extends Component {
    @property(Label)
    scoreLabel: Label

    private score = 0

    /** 增加游戏分数 */
    add(num: number = 1) {
        this.set(Math.max(0, this.score + num))
    }

    /** 更改游戏分数 */
    set(num: number) {
        this.score = num
        this.scoreLabel.string = `${this.score}`
    }

    get() {
        return this.score
    }
}
