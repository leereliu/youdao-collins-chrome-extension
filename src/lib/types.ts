/**
 * 划词翻译模式
 */
export type TranslateMode = "instant" | "modifier" | "doubleClick" | "disabled"

/**
 * 修饰键类型
 */
export type ModifierKey = "ctrl" | "meta"

/**
 * 用户设置
 */
export interface UserOptions {
  translateMode: TranslateMode
  modifierKey: ModifierKey
  enableShanbay: boolean
}

/**
 * 默认设置
 */
export const DEFAULT_OPTIONS: UserOptions = {
  translateMode: "modifier",
  modifierKey: "ctrl",
  enableShanbay: false
}

/**
 * 单词定义
 */
export interface WordDefinition {
  /** 词性 */
  pos: string
  /** 释义 */
  meaning: string
  /** 例句 */
  examples?: string[]
}

/**
 * 柯林斯释义
 */
export interface CollinsDefinition {
  /** 英文解释 */
  explanation: string
  /** 例句 */
  examples?: string[]
  /** 星级 (1-5) */
  star?: number
}

/**
 * 查询结果
 */
export interface QueryResult {
  /** 查询的单词 */
  word: string
  /** 音标 */
  phonetic?: string
  /** 发音 URL */
  audioUrl?: string
  /** 基础释义 */
  definitions?: WordDefinition[]
  /** 柯林斯释义 */
  collins?: CollinsDefinition[]
  /** 错误信息 */
  error?: string
}

/**
 * 消息类型
 */
export type MessageType = "QUERY_WORD" | "ADD_TO_SHANBAY" | "GET_OPTIONS"

/**
 * 消息格式
 */
export interface Message {
  type: MessageType
  [key: string]: unknown
}

/**
 * 扇贝生词本 API 响应
 */
export interface ShanbayResponse {
  status_code: number
  msg: string
  data?: unknown
}
