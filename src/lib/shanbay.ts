/**
 * 扇贝 API 模块
 * 封装扇贝生词本相关 API 调用
 */

import type { ShanbayLookupResponse } from "./types"

// ============ API 配置 ============

const SHANBAY_API = {
  lookUp: {
    method: "GET" as const,
    url: "https://apiv3.shanbay.com/abc/words/senses?vocabulary_content={word}",
  },
  addWord: {
    method: "POST" as const,
    url: "https://apiv3.shanbay.com/news/words",
  },
}

// ============ 通知工具 ============

interface NotifyOptions {
  title?: string
  message?: string
  url?: string
}

// 存储待处理的通知点击回调
const pendingNotifications = new Map<string, string>()

/**
 * 初始化通知点击监听器（只在 background 中调用一次）
 */
export function initNotificationListener(): void {
  chrome.notifications.onClicked.addListener((notifyID) => {
    const url = pendingNotifications.get(notifyID)
    chrome.notifications.clear(notifyID)
    if (url) {
      chrome.tabs.create({ url })
      pendingNotifications.delete(notifyID)
    }
  })

  // 通知关闭时清理
  chrome.notifications.onClosed.addListener((notifyID) => {
    pendingNotifications.delete(notifyID)
  })
}

/**
 * 获取图标 URL（从 manifest 获取正确的带 hash 的路径）
 */
function getIconUrl(): string {
  try {
    const manifest = chrome.runtime.getManifest()
    const icon48 = manifest.icons?.["48"]
    if (icon48) {
      return chrome.runtime.getURL(icon48)
    }
  } catch {
    // 忽略错误
  }
  return chrome.runtime.getURL("icon48.png")
}

/**
 * 显示 Chrome 通知
 */
export function notify(
  opt: NotifyOptions = {
    title: "人丑多读书",
    message: "少壮不努力，老大背单词",
    url: "https://www.shanbay.com/",
  }
): void {
  const options: chrome.notifications.NotificationOptions = {
    type: "basic",
    title: opt.title || "人丑多读书",
    message: opt.message || "少壮不努力，老大背单词",
    iconUrl: getIconUrl(),
  }

  const noteID = Math.random().toString(36)

  // 存储 URL 供点击时使用
  if (opt.url) {
    pendingNotifications.set(noteID, opt.url)
  }

  chrome.notifications.create(noteID, options)
}

// ============ 请求工具 ============

interface RequestOptions extends RequestInit {
  type?: "json" | "buffer"
}

/**
 * 封装的 fetch 请求
 */
async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const fetchOptions: RequestInit = {
    ...options,
    credentials: "include",
  }

  const res = await fetch(url, fetchOptions)

  if (res.ok) {
    if (options.type === "buffer") {
      return res.arrayBuffer() as Promise<T>
    }
    return res.json() as Promise<T>
  }

  // 处理 401/400 错误 - 认证失败
  if (res.status === 400 || res.status === 401) {
    notify({
      title: "扇贝认证失败",
      message: "点击此消息登录",
      url: "https://web.shanbay.com/web/account/login/",
    })
    throw { msg: "Invalid Token!", status: res.status }
  }

  const error = await res.json().catch(() => res.text())
  throw error
}

// ============ API 方法 ============

/**
 * 查询单词信息
 */
export async function lookUp(word: string): Promise<ShanbayLookupResponse> {
  const url = SHANBAY_API.lookUp.url.replace("{word}", encodeURIComponent(word))
  
  const response = await request<ShanbayLookupResponse | { data: ShanbayLookupResponse[] }>(url, {
    method: SHANBAY_API.lookUp.method,
  })
  
  // 扇贝 API 直接返回对象 { id, content, ... }
  if ('id' in response) {
    return response as ShanbayLookupResponse
  }
  
  // 兼容数组包装格式 { data: [{ id, ... }] }
  if ('data' in response && Array.isArray(response.data) && response.data.length > 0) {
    return response.data[0]
  }
  
  throw { msg: "单词没找到" }
}

/**
 * 添加单词到生词本
 */
export async function addWord(wordID: string): Promise<void> {
  await request(SHANBAY_API.addWord.url, {
    method: SHANBAY_API.addWord.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vocab_id: wordID,
      business_id: 2,
      paragraph_id: "1",
      sentence_id: "A1",
      source_content: "",
      article_id: "ca",
      source_name: "",
      summary: "",
    }),
  })
}
