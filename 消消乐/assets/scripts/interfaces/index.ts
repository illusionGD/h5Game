export interface BaseRequestOptionsType {
    method?: string
    params?: AnyObject | null
    body?: any
    headers?: AnyObject | null
    cache?: RequestCache
    credentials?: RequestCredentials
    responseType?: ResponseType
    timeout?: number
}

export interface BaseResponseType<T> {
    code: string
    data?: T
    message?: string
}

export interface ResponseResultType<T> {
    data: T
    status: number
    headers: AnyObject
    statusText: string
}

export enum ResponseType {
    JSON = 'JSON',
    TEXT = 'TEXT',
    BLOB = 'BLOB',
    ARRAYBUFFER = 'ARRAYBUFFER',
}

export enum GameStatusEnum {
    STOP = 'stop',
    PAUSE = 'pause',
    PLAYING = 'playing',
    END = 'end',
}

export enum PropsTypeEnum {
    UP = 'up',
    LEFT = 'left',
    BUCKET = 'bucket',
    SHOVEL = 'shovel',
    LOTTERY = 'lottery',
    BOOM = 'boom',
}

export interface PropsItemType {
    type: PropsTypeEnum
    count: number
}

export enum PostMsgTypeEnum {
    Load = 'gameLoaded',
    START = 'start',
    END = 'end',
    PROPS = 'props',
    LOGIN = 'gotoLogin',
    THREE_SHARE = 'threeShare',
}

export enum PopTypeEnum {
    GAME_OVER = 'game-over',
    GAME_RES = 'game-res',
    RANK = 'rank',
    RULE = 'rule',
    SHARE = 'share',
    TIPS = 'tips',
    LOGIN = 'login',
}

export interface CheckDataType {
    chessBoard: number[][] | null
    operation: number[][]
    props: string
    removeNum: number
    isDead: boolean
    propsInfo: { [key: string]: number }
}
export type Partial<T> = {
    [K in keyof T]?: T[K]
}
export interface AnyObject {
    [key: string]: any
}

export interface RoleInfoType {
    uid: string
    serverCode: string
    level: number
    roleid: string
    name: string
    power: string
}

export interface ServerListType {
    ServerCode: string
    ServerName: string
    gameCode: string
    isCom: number
    serverPrefix: string
    GameDomain: string
    info: string
    status: number
}

export interface RankItemType {
    name: string
    score: number
    index: number
    rate: string
}
export enum LevelTypeEnum {
    SIMPLE = 'simple',
    NORMAL = 'normal',
    HARD = 'hard',
}

export interface GameInfoType {
    gameId: string
    propsInfo: {
        [key: string]: number
    }
    level?: string
}

export interface RoleInfoType {
    roleId: string
    roleName: string
    serverCode: string
    serverName: string
}
