import { _decorator, Component, Node, director, Label } from 'cc'
import { userStatus } from './data'
import { autoLogin, checkLogin, storage, trackGA } from './uitls'
const { ccclass, property } = _decorator

@ccclass('Load')
export class Load extends Component {
    @property(Node)
    labelNode: Node

    onLoad() {
        const label = this.labelNode.getComponent(Label)
        const info = autoLogin()
        const isLogin = checkLogin()
        userStatus.isAutoLogin =
            isLogin && (!!info || !!storage.get('isAutoLogin'))
        console.log('isAutoLogin:', userStatus.isAutoLogin)

        if (userStatus.isAutoLogin) {
            storage.set('isAutoLogin', '1')
            trackGA('自动登录', '账号自动登录', '成功')
        }

        director.preloadScene(
            'main',
            (cur, total, item) => {
                let p = Math.round((cur / total) * 100)
                label.string = `起動中…${p}%`
            },
            () => {
                director.loadScene('main')
            }
        )
    }
    start() {}
}
