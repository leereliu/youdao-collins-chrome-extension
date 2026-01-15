/**
 * 全局类型定义
 */

// 导出解析器类型
export type {
  WordInfo,
  Meaning,
  MeaningExplain,
  MeaningExample,
  Synonyms,
  ExplainResponse,
  Choice,
  ChoiceResponse,
  NonCollinsExplain,
  NonCollinsExplainsResponse,
  MachineTranslationResponse,
  ResponseType,
  WordResponse,
} from "./parser"

// ============ 消息事件类型 ============

export const EVENTS = {
  SEARCH_WORD: "SEARCH_WORD",
  OPEN_NEW_TAB: "OPEN_NEW_TAB",
  ADD_WORD_SHANBAY: "ADD_WORD_SHANBAY",
  CLEAR_SHANBAY_TOKEN: "CLEAR_SHANBAY_TOKEN",
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

export interface MessageRequest {
  eventName: EventName
  data?: unknown
}

export interface ShanbayAddResponse {
  success: boolean
  msg?: string
}

// ============ 选项配置类型 ============

export type ActiveType = "ALWAYS" | "KEY_DOWN" | "DOUBLE_CLICK" | "NEVER"

export interface Options {
  activeType: ActiveType
  showNotebook: boolean
  tempDisabled: boolean
  showContainChinese?: boolean
}

export const ACTIVE_TYPES: Record<ActiveType, string> = {
  ALWAYS: "划词即翻译",
  KEY_DOWN: "按住(meta/ctrl)键 + 划词时翻译",
  DOUBLE_CLICK: "双击单词后翻译",
  NEVER: "禁用划词翻译",
}

export const DEFAULT_OPTIONS: Options = {
  activeType: "ALWAYS",
  showNotebook: true,
  tempDisabled: false,
  showContainChinese: false,
}

// ============ 扇贝 API 类型 ============

export interface ShanbayLookupResponse {
  id: string
  vocabulary_content: string
  definition: string
}

export interface ShanbayWordResponse {
  data: ShanbayLookupResponse[]
}
