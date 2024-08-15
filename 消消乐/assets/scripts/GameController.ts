import {
    _decorator,
    Component,
    Node,
    Prefab,
    Vec2,
    NodePool,
    SpriteFrame,
    instantiate,
    Sprite,
    UITransform,
    Input,
    EventTouch,
    v3,
    v2,
    Vec3,
    tween,
    Animation,
    AudioSource,
} from 'cc'
import { GameManager } from './GameManager'
import { CheckDataType, PropsTypeEnum } from './interfaces'
import { PropsItem } from './ui/PropsItem'
import { chessBoardPosDeduplication, isInvalidVal } from './uitls'
const { ccclass, property } = _decorator
interface PieceType {
    type: string
    poolName: string
    index: number
    node: Node
}

@ccclass('GameController')
export class GameController extends Component {
    @property(Node)
    public gameManagerNode: Node

    @property(Node)
    public bgNode: Node

    @property(Prefab)
    public bgPrefab: Prefab = null

    @property([SpriteFrame])
    public pieceSpriteList = []

    @property(SpriteFrame)
    public stoneImg: SpriteFrame

    /**棋子种类数量 */
    @property(Number)
    public pieceTypeCount = 6

    /**棋子预设 */
    @property(Prefab)
    public piecePrefab: Prefab = null

    /**爆炸资源 */
    @property(Prefab)
    public bom: Prefab

    /** 石头数 */
    @property(Number)
    public stoneNum: number = 6

    /**棋盘宽度（列数） */
    @property(Number)
    public boardWidth: number = 6

    /**棋盘高度（行数） */
    @property(Number)
    public boardHeight: number = 6

    /**棋子宽 */
    @property(Number)
    public width: number = 0
    /**棋子高 */
    @property(Number)
    public height: number = 0

    /**棋子交互的速度 */
    @property(Number)
    public changeSpeed: number = 0.2

    audios: { [key: string]: AudioSource } = {}

    isCreatorStone = false

    /** 当前校验信息 */
    private curCheckData: CheckDataType = {
        chessBoard: [],
        operation: [],
        props: '',
        removeNum: 0,
        isDead: false,
        propsInfo: {},
    }

    /**棋盘元素之间X间距 */
    spacingX: number = 0
    /**棋盘元素之间Y间距 */
    spacingY: number = 0

    /**棋盘 */
    chessBoard: PieceType[][] = []

    /**交换之前下标 */
    swapBeforeIndex: number[] = null

    /**交换之后的下标 */
    swapAfterIndex: number[] = null

    /**鼠标开始按下的坐标 */
    startTouchPos: Vec2 = null

    /**是否交换中 */
    isSwap = false

    /**棋子对象池 */
    chessPiecesPool: { [key: string]: NodePool } = {}

    /**boom对象池 */
    boomPool: NodePool = null

    /** 消除步数 */
    removeStep = 0

    /** 提示棋子 */
    tipsPiece: PieceType = null

    /**消除的中心棋子坐标 */
    centerPosList = []

    tipsTimeout = null

    gmController: GameManager

    emptyColList = []

    stoneType = 'stone'
    emptyType = 'empty'

    onLoad(): void {
        this.node.getComponents(AudioSource).forEach((item) => {
            this.audios[item.clip.name] = item
        })
    }

    start() {
        this.node.on(Input.EventType.TOUCH_START, this.onBoardTouchStart, this)
        this.node.on(Input.EventType.TOUCH_MOVE, this.onBoardTouchMove, this)
        this.node.on(Input.EventType.TOUCH_END, this.useProp, this)
    }

    init(
        chessBoardData?: number[][],
        config?: { isOpenStone?: boolean; stoneNum?: number }
    ) {
        if (config) {
            this.isCreatorStone = !!config.isOpenStone
            this.stoneNum = config.stoneNum || 0
        }
        this.gmController = this.gameManagerNode.getComponent(GameManager)
        this.spacingX =
            (this.node.getComponent(UITransform).width -
                this.width * this.boardWidth) /
            (this.boardWidth - 1)

        this.spacingY =
            (this.node.getComponent(UITransform).height -
                this.height * this.boardHeight) /
            (this.boardHeight - 1)
        // 初始化棋子对象池
        for (let index = 0; index < this.pieceTypeCount; index++) {
            const name = this.getPiecePoolName(index)
            this.chessPiecesPool[name] = new NodePool(name)
        }

        // 初始化爆炸效果对象池
        this.boomPool = new NodePool('boomPool')
        this.generateBoard(chessBoardData)

        this.startTips()
    }

    onBoardTouchStart(event: EventTouch) {
        this.cancelTips()
        if (!this.gmController.isPlaying() || this.isSwap) {
            return
        }
        // 获取鼠标按下的位置
        this.startTouchPos = event.getUILocation()
        // 根据鼠标按下的位置找到对应的棋子
        this.swapBeforeIndex = this.getPieceAtPosition(this.startTouchPos)

        if (this.canNotMove(this.swapBeforeIndex[0], this.swapBeforeIndex[1])) {
            this.swapBeforeIndex = null
            return
        }
        if (!this.swapBeforeIndex) return
    }

    async onBoardTouchMove(event: EventTouch) {
        if (
            !this.swapBeforeIndex ||
            this.isSwap ||
            !this.gmController.isPlaying()
        ) {
            return
        }
        this.cancelTips()

        const target = this.getSwappingPieces(event)

        if (!target) {
            return
        }
        // 校验是否为石头
        if (this.canNotMove(target[0], target[1])) {
            return
        }
        this.gmController.addStep(-1)
        this.swapAfterIndex = target
        this.updateCheckData({
            chessBoard: this.getChessIndex(),
            operation: [this.swapBeforeIndex, this.swapAfterIndex],
        })
        const isSwap = await this.swapPiece(this.swapBeforeIndex, target)
        // 如果相同名称的棋子，则交换回去
        if (isSwap) {
            this.swapPiece(this.swapBeforeIndex, this.swapAfterIndex)
        } else {
            const isMatch = await this.checkAndRemoveMatchesAt([
                this.swapBeforeIndex,
                this.swapAfterIndex,
            ])
            if (!isMatch)
                this.swapPiece(this.swapBeforeIndex, this.swapAfterIndex)
        }
        this.swapBeforeIndex = null
        this.swapAfterIndex = null
    }

    /** 开始提示 */
    startTips() {
        clearTimeout(this.tipsTimeout)
        this.tipsTimeout = setTimeout(() => {
            if (this.tipsPiece) {
                this.tipsPiece.node.getChildByName('light').active = true
            }
        }, 5000)
    }
    /** 取消提示 */
    cancelTips() {
        if (this.tipsPiece) {
            this.tipsPiece.node.getChildByName('light').active = false
        }
    }

    /** 更新校验数据 */
    updateCheckData(data: Partial<CheckDataType>) {
        const propsInfo = {}
        this.gmController.getPropsList().forEach(({ type, count }) => {
            propsInfo[type] = count
        })
        this.curCheckData.propsInfo = propsInfo
        Object.assign(this.curCheckData, data)
    }

    /** 上传校验数据 */
    uploadCheckData() {
        const checkData = JSON.parse(JSON.stringify(this.curCheckData))
        this.gmController.pushCheckData(checkData)
        this.curCheckData = {
            chessBoard: [],
            operation: [],
            props: '',
            removeNum: 0,
            isDead: false,
            propsInfo: {},
        }
    }

    /**使用道具 */
    async useProp(event: EventTouch) {
        if (this.isSwap || !this.gmController.isPause()) {
            return
        }

        const temp = []
        // 获取鼠标按下的位置
        this.startTouchPos = event.getUILocation()
        // 根据鼠标按下的位置找到对应的棋子
        const [x, y] = this.getPieceAtPosition(this.startTouchPos)
        // 判断是否没有点击到图标
        if (isInvalidVal(x) || isInvalidVal(y)) {
            return
        }
        const { type, count } = this.gmController.getCurUseProp()

        if (!count) {
            this.gmController.exitUsePropsStatus()
            return
        }
        this.cancelTips()

        this.gmController.useProp(type)
        const removePiece = (row: number, col: number) => {
            if (this.isEmpty(this.chessBoard[row][col])) {
                return
            }
            temp.push([row, col])
        }

        if (type === PropsTypeEnum.LEFT) {
            const row = x
            for (let index = 0; index < this.boardWidth; index++) {
                removePiece(row, index)
            }
        } else if (type === PropsTypeEnum.UP) {
            const col = y
            for (let index = 0; index < this.boardHeight; index++) {
                removePiece(index, col)
            }
        } else if (type === PropsTypeEnum.SHOVEL) {
            removePiece(x, y)
        } else if (type === PropsTypeEnum.BOOM) {
            const row = x
            const col = y
            removePiece(row, col)
            removePiece(row - 1, col)
            removePiece(row + 1, col)
            removePiece(row, col - 1)
            removePiece(row, col + 1)
            removePiece(row - 1, col - 1)
            removePiece(row - 1, col + 1)
            removePiece(row + 1, col - 1)
            removePiece(row + 1, col + 1)
        } else if (type === PropsTypeEnum.BUCKET) {
            this.traverseChessBoard((row, col) => {
                removePiece(row, col)
                return true
            })
        } else if (type === PropsTypeEnum.LOTTERY) {
            this.gmController.lotteryProps()
        }
        this.gmController.exitUsePropsStatus()
        if (temp.length) {
            this.updateCheckData({
                chessBoard: this.getChessIndex(),
                props: type,
                operation: [[x, y]],
            })
            await this.removeMatches(temp)
            this.downAndFillChess()
        } else {
            this.updateCheckData({
                chessBoard: this.getChessIndex(),
                props: type,
                operation: [],
                removeNum: 0,
            })
            this.uploadCheckData()
        }

        if (type !== PropsTypeEnum.LOTTERY) {
            ;(this.audios['btn_specialitem'] as AudioSource).play()
        }
    }

    /**
     * 检查消除，十字消除法
     * @param {[number,number][]} pos  // 检查坐标
     */
    async checkAndRemoveMatchesAt(pos: number[][]): Promise<boolean> {
        const matches = []
        const removePos = []
        // 校验
        for (let [row, col] of pos) {
            // 横向匹配
            let cols = this.checkMatch(row, col, true)
            // 纵向匹配
            let rows = this.checkMatch(row, col, false)
            matches.push(...cols, ...rows)

            const len = cols.length + rows.length
            if (len > 3) {
                this.centerPosList.push({
                    pos: [row, col],
                    chess: this.chessBoard[row][col],
                    cols,
                    rows,
                })
            }

            if (len >= 3) {
                removePos.push([row, col])
            }
        }

        if (matches.length < 1) return false

        const justMatches = matches.filter((item) =>
            this.isWithinBounds(item, this.boardWidth, this.boardHeight)
        )
        this.justPropsAdd(justMatches)

        // 消除
        await this.removeMatches(matches)

        await this.downAndFillChess()
        return true
    }

    /**加载爆炸特效 */
    async playBom(row: number, col: number) {
        return new Promise((resolve, reject) => {
            const [x, y] = this.getPiecePosition(row, col)
            const bom = this.boomPool.get() || instantiate(this.bom)
            bom.setPosition(x, y)
            this.node.addChild(bom)
            const _component = bom.getComponent(Animation)
            _component.on(Animation.EventType.FINISHED, () => {
                this.boomPool.put(bom)
                resolve(true)
            })
            _component.play()
        })
    }

    /**
     * 消除棋子
     * @param matches
     */
    async removeMatches(
        matches: [number, number][],
        isPlayBoom: boolean = true
    ) {
        const boomList = []
        this.centerPosList.length = 0

        let score = 0
        for (let [row, col] of matches) {
            if (
                this.isWithinBounds(
                    [row, col],
                    this.boardWidth,
                    this.boardHeight
                )
            ) {
                const chess = this.chessBoard[row][col]
                if (chess) {
                    if (!this.isStone(row, col)) {
                        this.chessPiecesPool[chess.poolName].put(chess.node)
                    } else {
                        this.node.removeChild(chess.node)
                    }
                    if (isPlayBoom) {
                        boomList.push(this.playBom(row, col))
                    }
                    this.chessBoard[row][col] = null
                    score++
                }
            }
        }

        if (!this.gmController.isEnd()) {
            this.gmController.addScore(score)
            this.updateCheckData({
                removeNum: score,
            })
            this.uploadCheckData()
        }
        this.swapBeforeIndex = null
        this.swapAfterIndex = null
        ;(this.audios['btn_eliminate'] as AudioSource).play()
        await Promise.all(boomList)
    }

    /**下降和填充棋子 */
    async downAndFillChess() {
        this.isSwap = true
        const moveList = []
        let isStatic = false

        // const dList = await this.movePiecesDown()
        // // // 左右偏移
        // const oList = await this.movePiecesLR()
        // moveList.push(...dList)
        // moveList.push(...oList)
        // for (let index = 0; index < 18; index++) {
        //     const dList = await this.movePiecesDown()
        //     const oList = await this.movePiecesLR()
        //     console.log('🚀 ~ dList:', dList)
        //     console.log('🚀 ~ oList:', oList)
        // }
        // do {
        //     const dList = await this.movePiecesDown()
        //     const oList = await this.movePiecesLR()
        //     isStatic = dList.length === 0 && oList.length === 0
        // } while (!isStatic)

        // // if (moveList.length) {
        // //     await this.movePiecesDown()
        // // }
        // // const fillList = await this.refillAndCheck()
        // return (this.isSwap = false)
        const [downList, fillList] = await Promise.all([
            this.movePiecesDown(),
            this.refillAndCheck(),
        ])
        this.updateCheckData({
            chessBoard: this.getChessIndex(),
        })
        const movedPos = chessBoardPosDeduplication([...downList, ...fillList])
        if (movedPos.length > 0) {
            this.removeStep++
            // 校验有变动的棋子
            await this.checkAndRemoveMatchesAt(movedPos)
        }
        // 如果是连续消除，回到第一次时表示已经结束，判断是否为死局
        if (this.removeStep === 1) {
            if (this.gmController.getStep() <= 0) {
                this.gmController.end()
            }
            if (this.checkDead()) {
                this.updateCheckData({
                    isDead: true,
                })
                this.uploadCheckData()
                this.gmController.end()
            } else {
                this.startTips()
            }
        }
        this.removeStep--
        this.isSwap = false
    }

    /** 左右偏移棋子 */
    async movePiecesLR() {
        const offsetPos = []
        console.log(this.getChessIndex())

        const getEmptyColPos = (curRow: number, col: number) => {
            for (let row = curRow; row >= 0; row--) {
                const piece = this.chessBoard[row][col]
                if (piece && this.isEmpty(piece)) {
                    return [row, col]
                }
            }
            return null
        }
        const isContinuousEmpty = (row, col) => {
            return [
                [row, col - 1],
                [row, col + 1],
            ].every((p: [number, number]) => {
                if (!this.chessBoard[p[0]][p[1]]) {
                    return false
                }
                if (this.isWithinBounds(p, this.boardWidth, this.boardHeight)) {
                    return this.isEmpty(p)
                }
                return false
            })
        }
        const moveOperate = (
            row: number,
            col: number,
            moveRow: number,
            moveCol: number
        ) => {
            const piece = this.chessBoard[row][col]
            this.chessBoard[row][col] = null
            this.chessBoard[moveRow][moveCol] = piece
            offsetPos.push([moveRow, moveCol], [row, col])
            console.log('🚀 ~ this.chessBoard:', this.getChessIndex())
            this.downAnimation(
                piece.node,
                this.getPiecePosition(moveRow, moveCol)
            )
        }

        // 移动斜角
        const moveDiagonal = (
            row: number,
            col: number,
            downRow: number,
            empty: boolean = true
        ) => {
            const leftDownPiece = this.chessBoard[downRow][col - 1]
            const rightDownPiece = this.chessBoard[downRow][col + 1]
            const lEmpty = empty
                ? this.isEmpty(this.chessBoard[row][col - 1])
                : !this.isEmpty(this.chessBoard[row][col - 1])
            const REmpty = empty
                ? this.isEmpty(this.chessBoard[row][col - 1])
                : !this.isEmpty(this.chessBoard[row][col - 1])
            if (lEmpty && !leftDownPiece) {
                moveOperate(row, col, downRow, col - 1)
                return true
            } else if (REmpty && !rightDownPiece) {
                moveOperate(row, col, downRow, col + 1)
                return true
            }

            return false
        }

        for (let col = this.boardWidth - 1; col >= 0; col--) {
            for (let row = this.boardHeight - 1; row >= 0; row--) {
                const piece = this.chessBoard[row][col]

                if (!piece || this.isEmpty(piece)) {
                    continue
                }
                const downRow = row + 1
                const upRow = row - 1
                // 空棋子下边的棋子
                if (
                    upRow >= 0 &&
                    this.chessBoard[upRow][col] &&
                    this.isEmpty(this.chessBoard[upRow][col])
                ) {
                    if (downRow < this.boardHeight) {
                        // 斜角
                        const isMove = moveDiagonal(row, col, downRow)
                        if (!isMove) {
                            // 左右
                            moveDiagonal(row, col, row, false)
                        }
                    }
                }

                // 空棋子旁边的棋子
                if (
                    downRow < this.boardHeight &&
                    (this.emptyColList.includes(col - 1) ||
                        this.emptyColList.includes(col + 1))
                ) {
                    moveDiagonal(row, col, downRow)
                }
            }
        }

        return offsetPos
    }
    /** 向下移动一整列 */
    moveColDown(startRow: number, col: number) {
        const movedPos = []
        const downList = []
        let headIndex = startRow
        for (let row = startRow; row >= 0; row--) {
            // 收集要校验的坐标：填充&移动的坐标都是要校验的
            if (row <= 0) {
                break
            }

            const upPiece = this.chessBoard[row - 1][col]

            if (!upPiece) {
                continue
            }

            const empty = this.isEmpty(upPiece)
            // 如果上一个是空格子
            if (empty) {
                // 头部指针指向该行的上一行，也就是空格子上一格
                headIndex = row - 2
                // 如果超过边界则结束
                if (headIndex < 0) {
                    break
                }
                row = headIndex

                try {
                    // 头部指针向上移，找到需要填充的位置
                    while (headIndex >= 0 && this.chessBoard[headIndex][col]) {
                        headIndex--
                        row = headIndex
                    }
                } catch (error) {
                    console.log('🚀 ~ headIndex:', headIndex)
                    console.log('🚀 ~ col:', col)
                    console.log(this.getChessIndex())
                }
                continue
            }

            if (upPiece && !empty) {
                movedPos.push([headIndex, col], [row - 1, col])
                // 交换
                this.chessBoard[headIndex][col] = upPiece
                this.chessBoard[row - 1][col] = null

                // 加入下落动画队列
                downList.push(
                    this.downAnimation(
                        upPiece.node,
                        this.getPiecePosition(headIndex, col)
                    )
                )

                // 头部指针上移
                headIndex--
            }
        }

        return {
            movedPos,
            downList,
        }
    }

    /**
     * 向下移动棋子
     */
    async movePiecesDown() {
        const movedPos = []
        const downList = []

        // 遍历每一列，收集全部要下移的棋子
        for (let col = this.boardWidth - 1; col >= 0; col--) {
            for (let row = this.boardHeight - 1; row >= 0; row--) {
                const piece = this.chessBoard[row][col]
                // 第一次遇到需要填充的格子
                if (!piece) {
                    // 上面的全部下移
                    const downRes = this.moveColDown(row, col)
                    movedPos.push(...downRes.movedPos)
                    downList.push(...downRes.downList)
                    continue
                }
            }
        }

        // 下移
        await Promise.all(downList)

        return movedPos
    }

    async refillAndCheck() {
        const movedPos = []
        const downList = []
        // 遍历每一列，填充空缺的棋子并下移
        for (let row = 0; row < this.chessBoard.length; row++) {
            for (let col = 0; col < this.chessBoard[row].length; col++) {
                if (this.chessBoard[row][col] === null) {
                    this.chessBoard[row][col] = this.generatePiece(
                        -(row + 1),
                        col
                    )
                    movedPos.push([row, col])
                    downList.push(
                        this.downAnimation(
                            this.chessBoard[row][col].node,
                            this.getPiecePosition(row, col)
                        )
                    )
                }
            }
        }
        // for (let col = this.boardWidth - 1; col >= 0; col--) {
        //     let hadEmpty = false
        //     let nullCount = 0
        //     for (let row = this.boardHeight - 1; row >= 0; row--) {
        //         const piece = this.chessBoard[row][col]
        //         if (!piece) {
        //             nullCount++
        //         } else {
        //             if (this.isEmpty(piece)) {
        //                 hadEmpty = true
        //             }
        //         }
        //         // 第一次遇到需要填充的格子
        //         if (piece) {
        //             // 上面的全部下移
        //             // moveDown(row, col)
        //             continue
        //         }
        //     }

        //     // 如果该列有空棋子，则生成到旁边
        //     if(hadEmpty) {

        //     }
        // }
        await Promise.all(downList)
        return movedPos
    }

    justPropsAdd(matches: [number, number][]) {
        const isPropsUp = matches.every((pos) => {
            const [_row, _col] = pos
            return _col === matches[0][1]
        })

        const isPropsLeft = matches.every((pos) => {
            const [_row, _col] = pos
            return _row === matches[0][0]
        })

        // 增加道具逻辑
        this.centerPosList.find(({ pos, cols, rows }) => {
            const rowArr = rows
            const colArr = cols

            if (isPropsUp) {
                this.gmController.addPropsCount(PropsTypeEnum.UP)
            } else if (isPropsLeft) {
                this.gmController.addPropsCount(PropsTypeEnum.LEFT)
            } else {
                if (rowArr.length === 3 && colArr.length === 3) {
                    this.gmController.addPropsCount(PropsTypeEnum.BOOM)
                } else if (
                    (rowArr.length > 3 && colArr.length > 3) ||
                    (rowArr.length > 3 && colArr.length === 3) ||
                    (rowArr.length === 3 && colArr.length > 3)
                ) {
                    this.gmController.addPropsCount(PropsTypeEnum.BUCKET)
                }
            }
        })
    }

    downAnimation(node: Node, [x, y]: number[]) {
        // 锁住不然动画过程中操作会出现异常
        return new Promise((resolve, reject) => {
            tween(node)
                .to(0.2, { position: new Vec3(x, y) })
                .call(() => {
                    resolve(true)
                })
                .start()
        })
    }

    /**交换棋子 */
    async swapPiece([row1, col1]: number[], [row2, col2]: number[]) {
        if (!this.chessBoard[row1][col1] || !this.chessBoard[row2][col2]) return
        // this.audios['swap'].play()
        this.isSwap = true
        const temp = this.chessBoard[row1][col1]
        this.chessBoard[row1][col1] = this.chessBoard[row2][col2]
        this.chessBoard[row2][col2] = temp
        await this.swapAnimation(
            this.chessBoard[row1][col1].node,
            this.chessBoard[row2][col2].node
        )

        this.isSwap = false
        return (
            this.chessBoard[row1][col1].type ===
            this.chessBoard[row2][col2].type
        )
    }

    /**交换动画 */
    async swapAnimation(a: Node, b: Node) {
        if (!a || !b) return
        const aPos = new Vec3(a.position.x, a.position.y)
        const bPos = new Vec3(b.position.x, b.position.y)

        const swapAPromise = new Promise((resolve) => {
            tween(a)
                .to(this.changeSpeed, { position: bPos })
                .call(() => {
                    resolve(true)
                })
                .start()
        })

        const swapBPromise = new Promise((resolve) => {
            tween(b)
                .to(this.changeSpeed, { position: aPos })
                .call(() => {
                    resolve(true)
                })
                .start()
        })

        return Promise.all([swapAPromise, swapBPromise])
    }

    /** 判断死局 */
    checkDead() {
        let isDead = true
        const hadProps = this.gmController
            .getPropsList()
            .find((item) => item.count > 0)
        const tempChangeChess = ([row1, col1, row2, col2]) => {
            const temp = this.chessBoard[row2][col2]
            this.chessBoard[row2][col2] = this.chessBoard[row1][col1]
            this.chessBoard[row1][col1] = temp
        }
        const just = ([row1, col1, row2, col2]) => {
            if (this.canNotMove(row1, col1) || this.canNotMove(row2, col2)) {
                return false
            }
            tempChangeChess([row1, col1, row2, col2])
            const rows = this.checkMatch(row2, col2)
            const cols = this.checkMatch(row2, col2, false)
            // 位置还原
            tempChangeChess([row1, col1, row2, col2])
            if (rows.length >= 3 || cols.length >= 3) {
                this.cancelTips()
                this.tipsPiece = this.chessBoard[row1][col1]
                this.startTips()
                isDead = false
                return true
            }
            return false
        }

        // 遍历每个棋子，每个棋子上下左右方向做三消校验
        this.traverseChessBoard((row, col, piece) => {
            let _row = row
            let _col = col
            // 向上移动判断
            _row = row - 1
            if (_row >= 0) {
                const res = just([row, col, _row, col])
                if (res) {
                    return false
                }
            }

            // 向下移动判断
            _row = row + 1
            if (_row < this.boardHeight) {
                const res = just([row, col, _row, col])
                if (res) {
                    return false
                }
            }

            // 向左移动判断
            _col = col - 1
            if (_col > 0) {
                const res = just([row, col, row, _col])
                if (res) {
                    return false
                }
            }

            // 向右移动判断
            _col = col + 1
            if (_col < this.boardWidth) {
                const res = just([row, col, row, _col])
                if (res) {
                    return false
                }
            }

            return true
        })
        // 棋盘死局，取消提示
        if (isDead) {
            this.cancelTips()
            this.tipsPiece = null
            const propsController = this.gmController.getPropsController()
            this.gmController.getPropsList().forEach((item) => {
                if (item.count) {
                    propsController
                        .getPropsItem(item.type)
                        .node.getComponent(PropsItem)
                        .light(true)
                }
            })
        }

        // 是否还有道具
        if (hadProps) {
            isDead = false
        }

        return isDead
    }

    /**获取需要交换的棋子下标 */
    getSwappingPieces(event: EventTouch): number[] | null {
        if (
            !this.startTouchPos ||
            !event ||
            !this.swapBeforeIndex ||
            this.isSwap
        ) {
            return null
        }

        let target = null
        const [row, col] = this.swapBeforeIndex
        const threshold = 50 // 移动阈值
        const { x: startX, y: startY } = this.startTouchPos
        const { x: moveX, y: moveY } = event.getUILocation()
        const diffX = moveX - startX
        const diffY = moveY - startY

        // 判断左右
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > threshold) {
                target = [row, col + 1]
            } else if (diffX < -threshold) {
                target = [row, col - 1]
            }
        } else {
            if (diffY > threshold) {
                target = [row - 1, col]
            } else if (diffY < -threshold) {
                target = [row + 1, col]
            }
        }

        // 边界判断
        if (!this.isWithinBounds(target, this.boardWidth, this.boardHeight)) {
            return null
        }

        return target
    }

    /**检查目标位置是否在棋盘边界内 */
    isWithinBounds(target, boardWidth, boardHeight) {
        return (
            target &&
            target[0] >= 0 &&
            target[0] < boardHeight &&
            target[1] >= 0 &&
            target[1] < boardWidth
        )
    }

    /**获取当前棋盘节点横轴坐标 */
    getPieceAtPosition(pos: Vec2 | null): number[] {
        // 获取当前棋盘节点
        const uiTransform = this.node.getComponent(UITransform)

        if (!uiTransform) return

        // 将点击坐标转换到当前棋盘坐标系
        const { x, y } = uiTransform.convertToNodeSpaceAR(v3(pos.x, pos.y))
        let vec2 = []

        // 遍历棋盘 查在改点击坐标下的棋子：通过获取棋子的包围盒去判断
        this.traverseChessBoard((row, col, piece) => {
            const box = piece?.node?.getComponent(UITransform).getBoundingBox()
            if (box?.contains(v2(x, y))) {
                vec2 = [row, col]
                return false
            }
            return true
        })
        return vec2
    }

    /**遍历棋盘 */
    traverseChessBoard(
        callback: (row: number, col: number, node?: PieceType) => boolean
    ) {
        for (let row = 0; row < this.chessBoard.length; row++) {
            for (let col = 0; col < this.chessBoard[row].length; col++) {
                const res = callback(row, col, this.chessBoard[row][col])
                if (!res) {
                    return res
                }
            }
        }
    }

    /**
     * 创建棋盘
     * @param preSet 预设：数字数组
     */
    generateBoard(preSet?: number[][]) {
        if (this.chessBoard.length) {
            this.traverseChessBoard((row, col, piece) => {
                this.chessPiecesPool[piece.poolName].put(piece.node)
                return true
            })
        }
        this.chessBoard = Array.from({ length: this.boardHeight }, () =>
            Array.from({ length: this.boardWidth }, () => null)
        )
        const matches = []

        const createPiece = (i, j, index) => {
            // -2表示该各种为空
            if (this.isEmpty(index)) {
                this.emptyColList.push(j)

                return {
                    node: null,
                    poolName: null,
                    index: -2,
                    type: this.emptyType,
                }
            }

            const piece = this.generatePiece(i, j, index)

            const _bg = instantiate(this.bgPrefab)
            _bg.setPosition(piece.node.getPosition())

            this.bgNode.addChild(_bg)
            this.chessBoard[i][j] = piece

            // 横向匹配
            let cols = this.checkMatch(i, j, true)
            // 纵向匹配
            let rows = this.checkMatch(i, j, false)
            matches.push(...cols, ...rows)
            // 如果初始化的时候，有可以消除的，则重新生成棋子
            if (matches.length) {
                matches.splice(0)
                this.node.removeChild(piece.node)
                const newPiece = createPiece(
                    i,
                    j,
                    (piece.index + 1) % this.pieceTypeCount
                )

                return newPiece
            } else {
                return piece
            }
        }

        for (let i = 0; i < this.boardHeight; i++) {
            for (let j = 0; j < this.boardWidth; j++) {
                const index = preSet
                    ? preSet[i][j]
                    : Math.floor(Math.random() * this.pieceTypeCount)

                this.chessBoard[i][j] = createPiece(i, j, index)
            }
        }

        this.isCreatorStone && this.randStone()
        if (this.checkDead()) {
            this.generateBoard()
        }
    }

    /** 随机创建石头 */
    randStone() {
        const pList = []
        const randomP = () => {
            const row = Math.floor(Math.random() * this.boardWidth)
            const col = Math.floor(Math.random() * this.boardHeight)
            // 不为空&已经是石头的情况要重新生成
            if (
                this.isEmpty(this.chessBoard[row][col]) ||
                pList.find(([x, y]) => x === row && y === col)
            ) {
                return randomP()
            }
            const res = [row, col]
            pList.push(res)
            return res
        }

        for (let index = 0; index < this.stoneNum; index++) {
            randomP()
        }

        pList.forEach(([row, col]) => {
            this.chessBoard[row][col].type = this.stoneType
            this.chessBoard[row][col].index = -1
            this.chessBoard[row][col].node.name = this.stoneType
            this.chessBoard[row][col].node
                .getChildByName('icon')
                .getComponent(Sprite).spriteFrame = this.stoneImg
            this.chessBoard[row][col].poolName = null
        })
    }

    /** 是否为空格子 */
    isEmpty(piece: number | PieceType | [number, number]) {
        if (piece === null || piece === undefined) {
            return false
        }
        if (typeof piece === 'number') {
            return piece === -2
        } else if (piece instanceof Array) {
            const [row, col] = piece
            return this.chessBoard[row][col].index === -2
        } else {
            return piece.index === -2
        }
    }
    /** 校验是否为石头 */
    isStone(row: number, col: number) {
        return this.chessBoard[row][col].type === this.stoneType
    }

    /** 是否能移动 */
    canNotMove(row: number, col: number) {
        if (!this.chessBoard[row][col]) {
            return true
        }
        return this.isStone(row, col) || this.isEmpty(this.chessBoard[row][col])
    }
    /**
     * 检查单个棋子
     * @param {number} row  行
     * @param {number} col  列
     * @param {boolean} horizontal  平行
     */
    checkMatch(row: number, col: number, horizontal = true): number[][] {
        const piece = this.chessBoard[row][col]
        if (!piece || this.canNotMove(row, col)) {
            return []
        }
        const matches = [[row, col]]
        const current = piece.type
        let i = 1
        if (horizontal) {
            // 往左遍历
            while (
                col - i >= 0 &&
                this.chessBoard[row][col - i] &&
                this.chessBoard[row][col - i].type === current
            ) {
                matches.push([row, col - i])
                i++
            }
            i = 1

            // 往右遍历
            while (
                col + i < this.chessBoard[row].length &&
                this.chessBoard[row][col + i] &&
                this.chessBoard[row][col + i].type === current
            ) {
                matches.push([row, col + i])
                i++
            }
        } else {
            // 往上
            while (
                row - i >= 0 &&
                this.chessBoard[row - i][col] &&
                this.chessBoard[row - i][col].type === current
            ) {
                matches.push([row - i, col])
                i++
            }
            i = 1
            // 往下
            while (
                row + i < this.chessBoard.length &&
                this.chessBoard[row + i][col] &&
                this.chessBoard[row + i][col].type === current
            ) {
                matches.push([row + i, col])
                i++
            }
        }
        return matches.length >= 3 ? matches : []
    }

    /**
     * 根据i和j创建棋子
     */
    generatePiece(i: number, j: number, index?: number) {
        const pieceObj = this.getRandomChessPiece(index)
        const { node } = pieceObj
        const [x, y] = this.getPiecePosition(i, j)
        node.setPosition(x, y)
        this.node.addChild(node)

        return pieceObj
    }

    /**
     * 获取随机棋子
     */
    getRandomChessPiece(index?: number) {
        const randomIndex =
            index !== undefined
                ? index
                : Math.floor(Math.random() * this.pieceTypeCount)

        // 从对象池中取，如果对象池没有，则新new一个预制体实例
        const piece =
            this.chessPiecesPool[this.getPiecePoolName(randomIndex)].get() ||
            instantiate(this.piecePrefab)
        piece.getChildByName('icon').getComponent(Sprite).spriteFrame =
            this.pieceSpriteList[randomIndex]

        return {
            type: `piece-${randomIndex}`,
            poolName: this.getPiecePoolName(randomIndex),
            index: randomIndex,
            node: piece,
        }
    }

    /**
     * 获取棋子坐标
     */
    getPiecePosition(i: number, j: number): number[] {
        const { width, height } = this.node.getComponent(UITransform)
        const x = -(width - this.width) / 2 + j * (this.width + this.spacingX)
        const y = (height - this.height) / 2 - i * (this.height + this.spacingY)

        return [x, y]
    }

    /** 获取棋子对象池名字 */
    getPiecePoolName(index: number) {
        return `piece-${index}`
    }

    /** 获取棋盘index */
    getChessIndex() {
        const chessData = Array.from({ length: this.boardHeight }, () =>
            Array.from({ length: this.boardWidth }, () => null)
        )
        this.traverseChessBoard((row, col, piece) => {
            chessData[row][col] = piece ? piece.index : null
            return true
        })

        return chessData
    }
}
