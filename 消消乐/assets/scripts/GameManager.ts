import { _decorator, Component, Node, Game, Label, director } from 'cc'
import { GameController } from './GameController'
import {
    AnyObject,
    GameStatusEnum,
    LevelTypeEnum,
    PopTypeEnum,
    PostMsgTypeEnum,
    PropsItemType,
    PropsTypeEnum,
} from './interfaces'
import { PropsController } from './PropsController'
import { PropsItem } from './ui/PropsItem'
import { ScoreController } from './ui/Score'
import { StepController } from './StepController'
import { GetPropsPop } from './ui/GetPropsPop'
import { Pop } from './ui/Pop'
import { checkResCode, storage, trackGA, webIframeCommunity } from './uitls'
import { getGameConfig, getGameInfo, userStatus } from './data'
import { checkGameApi } from './network/api'
const { ccclass, property } = _decorator

@ccclass('GameManager')
export class GameManager extends Component {
    @property({ type: Node, tooltip: '游戏节点' })
    gameControllerNode: Node
    // @property({type:Node, tooltip: '倒计时节点'})
    // countDownNode: Node
    @property({ type: Node, tooltip: '道具列表节点' })
    propsControllerNode: Node
    @property({ type: Node, tooltip: '分数节点' })
    scoreNode: Node
    @property({ type: Node, tooltip: '步数节点' })
    stepNode: Node
    @property({ type: Node, tooltip: '使用道具蒙版节点' })
    markNode: Node
    @property({ type: Node, tooltip: '获取道具弹窗节点' })
    getPropsPopNode: Node

    private status: GameStatusEnum
    private curUseProps: PropsItemType = null
    private checkData: any[] = []

    countDownNum: number = 0

    countDownTimeout = null

    // countDown: CountDown
    propsController: PropsController
    gameController: GameController
    scoreController: ScoreController
    stepController: StepController
    getPropsPop: GetPropsPop
    popController: Pop
    checkDisNum = 6

    gameConfig: AnyObject = {}

    onLoad() {
        this.popController = director
            .getScene()
            .getChildByName('pop')
            .getComponent(Pop)
        this.propsController =
            this.propsControllerNode.getComponent(PropsController)
        this.gameController =
            this.gameControllerNode.getComponent(GameController)
        this.scoreController = this.scoreNode.getComponent(ScoreController)
        this.stepController = this.stepNode.getComponent(StepController)
        this.getPropsPop = this.getPropsPopNode.getComponent(GetPropsPop)
        this.gameConfig = getGameConfig()
        this.checkDisNum = this.gameConfig.checkDisNum
    }

    start() {
        this.testGame()
    }

    /** 初始化带有空格子的棋盘 */
    initEmptyChessBoard() {
        const normalMap = [
            '1,1;2,1;5,5;5,4',
            '1,5;2,3;4,5;4,4',
            '2,5;2,4;3,5;3,4',
        ]
        const chessBoard = Array.from(
            { length: this.gameController.boardHeight },
            () =>
                Array.from(
                    { length: this.gameController.boardWidth },
                    () => undefined
                )
        )
        if (normalMap) {
            const index = Math.floor(Math.random() * normalMap.length)
            normalMap[index].split(';').forEach((p) => {
                const [row, col] = p.split(',')
                chessBoard[Number(row)][Number(col)] = -2
            })
        }
        return chessBoard
    }

    /**测试游戏：单独测试游戏使用 */
    testGame() {
        userStatus.skipApi = true
        const { propsInfo, level } = getGameInfo()

        this.propsController.initPropsList([
            {
                type: PropsTypeEnum.BOOM,
                count: 10,
            },
            {
                type: PropsTypeEnum.LEFT,
                count: 10,
            },
            {
                type: PropsTypeEnum.UP,
                count: 10,
            },
            {
                type: PropsTypeEnum.BUCKET,
                count: 10,
            },
            {
                type: PropsTypeEnum.SHOVEL,
                count: 10,
            },
            {
                type: PropsTypeEnum.LOTTERY,
                count: 10,
            },
        ])
        const chessBoard =
            level === LevelTypeEnum.HARD ? this.initEmptyChessBoard() : null
        this.gameController.init(chessBoard, {
            isOpenStone: level === LevelTypeEnum.NORMAL,
            stoneNum: 6,
        })
        this.stepController.set(level === LevelTypeEnum.HARD ? 10 : 30)

        this.startGame()
    }

    retry() {
        director.loadScene('main')
    }

    /** 开始游戏 */
    startGame() {
        // clearInterval(this.countDownTimeout)
        this.markNode.active = false
        // this.countDown.reset()
        this.setGameStatus(GameStatusEnum.PLAYING)
    }

    /** 初始化步数 */
    initStep(num: number) {
        this.stepController.set(num)
    }

    /** 增加步数 */
    addStep(num: number) {
        this.stepController.add(num)
    }

    /** 获取步数 */
    getStep() {
        return this.stepController.get()
    }

    /** 抽取道具 */
    lotteryProps() {
        const index = Math.round(Math.random() * 4)
        const lotteryPropsList = [
            PropsTypeEnum.LEFT,
            PropsTypeEnum.UP,
            PropsTypeEnum.BOOM,
            PropsTypeEnum.BUCKET,
            PropsTypeEnum.SHOVEL,
        ]
        this.propsController.addPropsNum(lotteryPropsList[index], 1)
        this.getPropsPop.popUp(lotteryPropsList[index])
    }

    /** 开启使用道具状态 */
    startUsePropsStatus(type: PropsTypeEnum) {
        const propsList = this.propsController.getPropsList()
        this.curUseProps = propsList.find((item) => item.type === type)
        this.pause()
        this.propsController.resetMarkNode()
        this.propsController.changeMarkNode(
            this.propsController.getMarkNode(type),
            this.propsController.getPropsNode(type)
        )
        this.markNode.active = true
        // 切换道具说明
        const descList =
            this.markNode.getChildByName('props-desc-list').children
        descList.forEach((item) => {
            item.active = item.name.includes(type)
        })
        // this.propsControllerNode.active = false
    }

    /** 退出使用道具状态 */
    exitUsePropsStatus() {
        this.propsControllerNode.active = true
        this.propsController
            .getPropsNode(this.curUseProps.type)
            .getComponent(PropsItem)
            .light(false)
        this.propsController.resetMarkNode()
        this.curUseProps = null
        this.markNode.active = false
        // this.countDown.setPause(false)
        this.setGameStatus(GameStatusEnum.PLAYING)
    }

    addPropsCount(type: PropsTypeEnum, num: number = 1) {
        this.propsController.addPropsNum(type, num)
    }

    getPropsController() {
        return this.propsController
    }

    getPropsList() {
        return this.propsController.getPropsList()
    }

    /** 使用道具: 减少道具数量 */
    useProp(type: PropsTypeEnum) {
        this.propsController.reducePropsNum(type, 1)
    }

    /** 获取当前使用的道具 */
    getCurUseProp() {
        return this.curUseProps
    }

    /** 暂停 */
    pause() {
        this.setGameStatus(GameStatusEnum.PAUSE)
        // this.countDown.setPause(true)
    }

    /** 结束 */
    end() {
        this.setGameStatus(GameStatusEnum.END)
        this.postCheckData(true)
        const score = this.scoreController.get()
        this.popController.show(PopTypeEnum.GAME_OVER)
        this.popController.setGameScore(score)
        // 如果是没登录的游客，则取本地缓存
        if (userStatus.skipApi) {
            const key = getGameInfo().level + '-maxScore'
            const num = storage.get(key)
            if (!num) {
                this.popController.setMaxScore(score)
                storage.set(key, score)
                this.popController.setMaxScore(score)
            } else {
                const max = Math.max(Number(num), score)
                if (Number(num) < score) {
                    storage.set('maxScore', score)
                }
                this.popController.setMaxScore(max)
            }
            setTimeout(() => {
                this.popController.show(PopTypeEnum.GAME_RES)
            }, 1500)
        }
    }

    /**是否已经结束 */
    isEnd() {
        return this.status === GameStatusEnum.END
    }

    /**是否为暂停状态 */
    isPause() {
        return this.status === GameStatusEnum.PAUSE
    }

    /**是否为游玩状态 */
    isPlaying() {
        return this.status === GameStatusEnum.PLAYING
    }

    /** 获取游戏状态 */
    getGameStatus() {
        return this.status
    }

    /** 更改游戏状态 */
    setGameStatus(status: GameStatusEnum) {
        this.status = status
    }

    /** 获取当前游戏积分 */
    getGameScore() {
        return this.scoreController.get()
    }

    /** 更改游戏分数 */
    setScore(num: number) {
        this.scoreController.set(num)
    }

    /** 增加游戏分数 */
    addScore(num: number = 1) {
        this.scoreController.add(num)
    }

    /** 获取当前倒计时 */
    getCurrentCountDown() {
        // return this.countDown.curTime
        return 0
    }

    pushCheckData(data, isGameOver: boolean = false) {
        this.checkData.push(data)
        if (this.checkData.length >= this.checkDisNum) {
            this.postCheckData(isGameOver)
        }
    }

    /**
     * 提交校验数据
     * @param isGameOver 是否已经结束游戏
     */
    postCheckData(isGameOver: boolean = false) {
        console.log('🚀 ~ checkData:', JSON.stringify(this.checkData))
        const data = this.checkData.splice(0)
        if (userStatus.skipApi) {
            return
        }
        const gameInfo = getGameInfo()
        checkGameApi({ ...gameInfo, isGameOver }, data).then(
            ({ code, data, message }) => {
                if (!checkResCode(code)) {
                    this.popController.tipsUp(message)
                    this.setGameStatus(GameStatusEnum.END)
                    return
                }
                if (isGameOver) {
                    const { lastScore } = data
                    this.popController.show(PopTypeEnum.GAME_RES)
                    this.popController.setMaxScore(lastScore)
                }
            }
        )
    }
}
