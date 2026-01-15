/**
 * 消息通信模块
 * 封装 Chrome Extension 消息传递 API
 */

import { EVENTS, type EventName, type WordResponse, type ShanbayAddResponse } from "./types"

// ============ 消息监听器 (Background/Service Worker) ============

type MessageHandler<T = unknown, R = unknown> = (
  data: T,
  sendResponse: (response: R) => void
) => void

/**
 * 在 Service Worker 中监听消息事件
 */
export function onMessage<T = unknown, R = unknown>(
  eventName: EventName,
  handler: MessageHandler<T, R>
): void {
  chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    const { eventName: e, data } = req

    if (e !== eventName) {
      return false
    }

    handler(data as T, sendResponse)

    // 返回 true 表示异步响应
    return true
  })
}

// ============ 消息发送器 (Content Script / Popup) ============

/**
 * 向 Service Worker 发送消息
 */
export function sendMessage<T = unknown, R = unknown>(
  eventName: EventName,
  data?: T
): Promise<R> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        eventName,
        data,
      },
      (res: R) => {
        resolve(res)
      }
    )
  })
}

// ============ 便捷方法 ============

/**
 * 在有道词典中打开单词链接
 */
export function openLink(word: string): void {
  sendMessage(EVENTS.OPEN_NEW_TAB, word)
}

/**
 * 搜索单词
 */
export async function searchWord(word: string): Promise<WordResponse> {
  const res = await sendMessage<string, WordResponse>(EVENTS.SEARCH_WORD, word)
  return res
}

/**
 * 添加单词到扇贝生词本
 */
export async function addNotebookWord(word: string): Promise<ShanbayAddResponse> {
  return sendMessage<string, ShanbayAddResponse>(EVENTS.ADD_WORD_SHANBAY, word)
}

/**
 * 清除扇贝登录 Token
 */
export async function clearShanbayToken(): Promise<void> {
  return sendMessage(EVENTS.CLEAR_SHANBAY_TOKEN)
}
