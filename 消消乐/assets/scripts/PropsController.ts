import { _decorator, Component, Node, Input, Game, Sprite, Color } from 'cc'
import { PropsItemType, PropsTypeEnum } from './interfaces'
import { PropsItem } from './ui/PropsItem'
import { GameManager } from './GameManager'
const { ccclass, property } = _decorator

@ccclass('PropsController')
export class PropsController extends Component {
    @property(Node)
    gameManagerNode: Node

    @property(Node)
    markListNode: Node

    @property([Node])
    propsNodeList: Node[] = []

    propsList: PropsItemType[] = []
    markPropsNodeList: Node[] = []

    onLoad() {
        this.propsNodeList.forEach((propsNode) => {
            propsNode.on(Input.EventType.TOUCH_START, () => {
                this.onPropsItemClick(
                    propsNode.name.split('-').pop() as PropsTypeEnum
                )
            })
        })
        this.markPropsNodeList = [...this.markListNode.children]
        this.markListNode.children.forEach((node) => {
            node.on(Input.EventType.TOUCH_START, () => {
                this.onPropsItemClick(
                    node.name.split('-').pop() as PropsTypeEnum
                )
            })
        })
    }

    onPropsItemClick(type: PropsTypeEnum) {
        if (this.gameManagerNode.getComponent(GameManager).isEnd()) {
            return
        }
        const gm = this.gameManagerNode.getComponent(GameManager)
        gm.startUsePropsStatus(type as PropsTypeEnum)

        const node = this.getPropsNode(type)
        this.propsNodeList.forEach((node) => {
            node.getComponent(PropsItem).light(false)
        })
        node.getComponent(PropsItem).light(true)
    }

    /** 初始化道具列表 */
    initPropsList(list: PropsItemType[]) {
        const typeList = [
            PropsTypeEnum.BOOM,
            PropsTypeEnum.LEFT,
            PropsTypeEnum.UP,
            PropsTypeEnum.SHOVEL,
            PropsTypeEnum.LOTTERY,
            PropsTypeEnum.BUCKET,
        ]
        typeList.forEach((type) => {
            const index = list.findIndex((item) => item.type === type)
            let props = {
                type,
                count: 0,
            }
            if (index < 0) {
                this.propsList.push(props)
                this.setPropsNum(type, 0)
            } else {
                this.propsList.push(list[index])
                this.setPropsNum(type, list[index].count)
            }
        })
    }

    /** 获取道具列表 */
    getPropsList() {
        return this.propsList
    }

    /** 设置道具数量 */
    setPropsNum(type: PropsTypeEnum, num: number, operate?: 'add' | 'reduce') {
        const { node, props } = this.getPropsItem(type)

        if (node) {
            const ns = node.getComponent(PropsItem)
            if (operate) {
                const rate = operate === 'add' ? 1 : -1
                props.count += rate * num
            } else {
                props.count = num
            }
            ns.setCount(props.count)
        }
    }

    /** 增加道具数量 */
    addPropsNum(type: PropsTypeEnum, num: number) {
        this.setPropsNum(type, num, 'add')
    }

    /** 减少道具数量 */
    reducePropsNum(type: PropsTypeEnum, num: number) {
        this.setPropsNum(type, num, 'reduce')
    }

    /** 获取道具对象 */
    getPropsItem(type: PropsTypeEnum) {
        return {
            props: this.getProps(type),
            node: this.getPropsNode(type),
        }
    }

    /** 获取道具节点 */
    getPropsNode(type: PropsTypeEnum) {
        return this.propsNodeList.find(
            (item) => item.name.split('-').pop() === type
        )
    }

    /** 获取mark道具节点 */
    getMarkNode(type: PropsTypeEnum) {
        return this.markPropsNodeList.find(
            (item) => item.name.split('-').pop() === type
        )
    }

    /** 获取道具 */
    getProps(type: PropsTypeEnum) {
        return this.propsList.find((item) => item.type == type)
    }

    /** 切换mark节点 */
    changeMarkNode(markNode: Node, propsNode: Node) {
        this.node.removeChild(propsNode)
        this.markListNode.removeChild(markNode)
        this.markListNode.addChild(propsNode)
        this.node.addChild(markNode)
    }

    /** 重置mark道具节点 */
    resetMarkNode() {
        for (let index = 0; index < this.markPropsNodeList.length; index++) {
            const node = this.markPropsNodeList[index]
            const type = node.name.split('-').pop() as PropsTypeEnum
            const propsNode = this.getPropsNode(type)
            this.changeMarkNode(propsNode, node)
        }
    }
}
