/**
 * Background Service Worker
 * 处理消息通信和 API 调用
 */

import { EVENTS } from "./lib/types"
import { onMessage } from "./lib/message"
import { parse, type WordResponse } from "./lib/parser"
import { getWordURL, hasWord } from "./lib/storage"
import { lookUp, addWord, initNotificationListener, notify } from "./lib/shanbay"

// 初始化通知点击监听器
initNotificationListener()

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
  // 有道词典无法识别 `/` 和 `%`，需要转义
  let _word = word.replace(/\//g, "<&>")
  _word = _word.replace(/%/g, "<$>")
  
  const url = getWordURL(_word)
  
  try {
    const response = await fetch(url)
    const body = await response.text()
    const explain = await getWordExplain(body)
    sendRes(explain)
  } catch (error) {
    console.error("Failed to fetch word:", error)
    sendRes({ type: "error" })
  }
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
      url: "https://web.shanbay.com/web/account/login/",
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
