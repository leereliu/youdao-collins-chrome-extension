/**
 * Background Service Worker
 * 处理消息通信和 API 调用
 */

import { EVENTS } from "./lib/types"
import { onMessage } from "./lib/message"
import { parse, type WordResponse } from "./lib/parser"
import { getWordURL, hasWord, getOptions } from "./lib/storage"
import {
  lookUp,
  addWord,
  initNotificationListener,
  notify
} from "./lib/shanbay"

// 初始化通知点击监听器
initNotificationListener()

// ============ 文本类型判断 ============

/**
 * 判断是否应该使用 LLM 翻译
 * 规则: 超过3个单词或超过50个字符，且不是单个单词，则使用 LLM
 */
function shouldUseLLM(text: string): boolean {
  const trimmedText = text.trim()

  // 按空格、标点等分割单词
  const wordCount = trimmedText
    .split(/[\s\-,.!?;:()]+/)
    .filter((w) => w.length > 0).length

  // 单个单词 -> 有道
  if (wordCount === 1) {
    return false
  }

  // 2-3个单词，且总字符数不超过50 -> 有道（短语）
  if (wordCount <= 3 && trimmedText.length <= 50) {
    return false
  }

  // 其他情况（长文本）-> LLM
  return true
}

// ============ LLM 流式翻译处理 ============

interface StreamCallbacks {
  onChunk: (chunk: string) => void
  onComplete: () => void
  onError: (error: Error) => void
}

async function getLLMTranslationStream(
  text: string,
  apiKey: string,
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "Youdao-Collins-Translator",
          "HTTP-Referer": chrome.runtime.getURL(""),
        },
        body: JSON.stringify({
          model: "xiaomi/mimo-v2-flash:free",
          messages: [
            {
              role: "system",
              content:
                "你是一个翻译专家。请将以下文本翻译为中文，保持原意，语言要自然。只输出翻译结果。"
            },
            { role: "user", content: text }
          ],
          temperature: 0.3,
          stream: true // 启用流式输出
        })
      }
    )

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("No response body")
    }

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        callbacks.onComplete()
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmedLine = line.trim()

        // 跳过空行和 [DONE] 标记
        if (!trimmedLine || trimmedLine === "data: [DONE]") continue

        // 跳过不是 data: 开头的行
        if (!trimmedLine.startsWith("data: ")) continue

        try {
          const jsonStr = trimmedLine.slice(6)
          const data = JSON.parse(jsonStr)
          const content = data.choices?.[0]?.delta?.content

          // 只要 content 不是 undefined 或 null 就发送（包括空字符串）
          if (content !== undefined && content !== null && content !== "") {
            callbacks.onChunk(content)
          }
        } catch (e) {
          console.error("Failed to parse SSE data:", e)
        }
      }
    }
  } catch (error) {
    console.error("LLM streaming failed:", error)
    callbacks.onError(error as Error)
  }
}

// ============ 单词查询处理 ============

type ExplainResponseWithAdded = WordResponse & { added?: boolean }

async function getWordExplain(body: string): Promise<ExplainResponseWithAdded> {
  const explain = parse(body) as ExplainResponseWithAdded

  // 检查单词是否已添加到生词本
  if (
    explain &&
    explain.type === "explain" &&
    explain.response.wordInfo?.word
  ) {
    const word = explain.response.wordInfo.word
    const added = await hasWord(word)
    explain.added = added
  }

  return explain
}

async function getWords(
  word: string,
  sendRes: (response: ExplainResponseWithAdded) => void
): Promise<void> {
  // 先使用有道翻译（单词、短语、长文本都走有道）
  let _word = word.replace(/\//g, "<&>")
  _word = _word.replace(/%/g, "<$>")
  const url = getWordURL(_word)

  try {
    const response = await fetch(url)
    const body = await response.text()
    const explain = await getWordExplain(body)
    
    // 判断是否启用 AI 增强翻译
    if (shouldUseLLM(word)) {
      const options = await getOptions()
      const apiKey = options.aiApiKey?.trim()
      
      if (apiKey) {
        // 配置了 API Key，返回双重翻译
        let machineTranslation = ""
        
        if (explain.type === "machine_translation") {
          machineTranslation = explain.response.translation
        } else if (explain.type === "non_collins_explain") {
          machineTranslation = explain.response.explains
            .map((e) => e.explain)
            .join("；")
        }
        
        if (machineTranslation) {
          sendRes({
            type: "llm_translation",
            response: {
              machineTranslation,
              aiTranslation: "",
              isStreaming: true
            }
          })
          // 异步启动 AI 翻译
          startStreamingTranslation(word, apiKey)
          return
        }
      }
    }
    
    // 没有配置 API Key 或不是长文本，直接返回有道结果
    sendRes(explain)
  } catch (error) {
    console.error("Failed to fetch word:", error)
    sendRes({ type: "error" })
  }
}

// 启动流式翻译
function startStreamingTranslation(text: string, apiKey: string): void {
  getLLMTranslationStream(text, apiKey, {
    onChunk: (chunk: string) => {
      broadcastMessage({
        eventName: EVENTS.LLM_TRANSLATION_STREAM,
        data: {
          text,
          chunk,
          done: false
        }
      })
    },
    onComplete: () => {
      broadcastMessage({
        eventName: EVENTS.LLM_TRANSLATION_STREAM,
        data: {
          text,
          chunk: "",
          done: true
        }
      })
    },
    onError: (error: Error) => {
      console.error("LLM streaming error:", error)
      broadcastMessage({
        eventName: EVENTS.LLM_TRANSLATION_STREAM,
        data: {
          text,
          error: error.message,
          done: true
        }
      })
    }
  })
}

// 广播消息给所有标签页和扩展页面（popup, options）
function broadcastMessage(message: any) {
  // 1. 发送给所有标签页的 content scripts
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message, () => {
          // 忽略错误（某些标签页可能没有 content script）
          if (chrome.runtime.lastError) {
            // Silently ignore
          }
        })
      }
    })
  })

  // 2. 使用 runtime.sendMessage 广播给扩展内部页面（popup, options 等）
  chrome.runtime.sendMessage(message, () => {
    // 忽略错误（如果没有监听器或页面已关闭）
    if (chrome.runtime.lastError) {
      // Silently ignore
    }
  })
}

// ============ 扇贝生词本处理 ============

interface AddWordResponse {
  success: boolean
  msg?: string
}

async function addWordToShanbay(
  word: string,
  sendRes: (response: AddWordResponse) => void
): Promise<void> {
  try {
    // 获取扇贝单词 ID
    const response = await lookUp(word)
    const { id } = response

    // 添加单词
    await addWord(id)

    sendRes({ success: true })
  } catch (err: unknown) {
    const error = err as { msg?: string }

    if (error.msg === "单词没找到") {
      sendRes({ success: false, msg: "Shanbay: Word Not Found!" })
      return
    }

    // 显示系统通知（认证失败）
    notify({
      title: "扇贝认证失败",
      message: "点击此消息登录扇贝",
      url: "https://web.shanbay.com/web/account/login/"
    })

    sendRes({ success: false, msg: "Invalid Token!" })
  }
}

// ============ 新标签页打开 ============

function openNewTab(word: string): void {
  chrome.tabs.create({ url: getWordURL(word) })
}

// ============ 初始化消息监听 ============

function init(): void {
  onMessage<string, ExplainResponseWithAdded>(
    EVENTS.SEARCH_WORD,
    (data, sendRes) => {
      getWords(data, sendRes)
    }
  )

  onMessage<string, void>(EVENTS.OPEN_NEW_TAB, (data) => {
    openNewTab(data)
  })

  onMessage<string, AddWordResponse>(
    EVENTS.ADD_WORD_SHANBAY,
    (data, sendRes) => {
      addWordToShanbay(data, sendRes)
    }
  )

  onMessage(EVENTS.CLEAR_SHANBAY_TOKEN, () => {
    // 清除 token 的逻辑（如果需要）
  })
}

init()

export {}
