import { _decorator, Component, Node, Label } from 'cc'
import { GameManager } from '../GameManager'
import { GameStatusEnum } from '../interfaces'
const { ccclass, property } = _decorator

@ccclass('CountDown')
export class CountDown extends Component {
    @property(Node)
    gameManagerNode: Node
    @property(Label)
    countDownLabel: Label

    gameManager: GameManager

    totalTime: number = 30
    curTime: number = 0
    timer = null
    isPause = false

    onLoad() {
        this.gameManager = this.gameManagerNode.getComponent(GameManager)
    }

    init(totalTime: number) {
        this.totalTime = totalTime
        this.setCountDownText(this.totalTime)
    }

    reset() {
        clearInterval(this.timer)
        this.curTime = this.totalTime
        this.timer = setInterval(() => {
            if (this.isPause) {
                return
            }
            this.curTime--
            this.setCountDownText(this.curTime)
            if (this.curTime <= 0) {
                this.end()
                this.gameManager.setGameStatus(GameStatusEnum.END)
            }
        }, 1000)
    }

    setCountDownText(totalTime: number) {
        this.countDownLabel.string = `${totalTime}`
    }

    setPause(pause: boolean) {
        this.isPause = pause
    }

    stop() {
        this.isPause = false
        clearInterval(this.timer)
    }

    end() {
        this.gameManager.end()
    }
}
