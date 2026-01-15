export {}

// Plasmo Messaging Handler 示例
// 在 background/messages/ 目录下创建具体的消息处理器

// 监听扩展安装或更新
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("扩展已安装")
    // 初始化默认设置
    chrome.storage.sync.set({
      translateMode: "modifier",
      modifierKey: "ctrl",
      enableShanbay: false
    })
  } else if (details.reason === "update") {
    console.log("扩展已更新到版本:", chrome.runtime.getManifest().version)
  }
})

// 监听来自 content script 或 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "QUERY_WORD") {
    // TODO: 实现查询逻辑
    handleQueryWord(message.word)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }))
    return true // 异步响应
  }

  if (message.type === "ADD_TO_SHANBAY") {
    // TODO: 实现添加到扇贝生词本
    handleAddToShanbay(message.word)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }))
    return true
  }
})

/**
 * 查询单词（从有道词典获取柯林斯释义）
 */
async function handleQueryWord(word: string): Promise<{ data?: unknown; error?: string }> {
  try {
    const url = `http://dict.youdao.com/w/eng/${encodeURIComponent(word)}`
    const response = await fetch(url)
    const html = await response.text()
    
    // TODO: 使用 cheerio 解析页面
    // 这里返回原始 HTML，后续实现解析逻辑
    return { data: { word, html } }
  } catch (error) {
    console.error("查询单词失败:", error)
    return { error: "查询失败，请稍后重试" }
  }
}

/**
 * 添加单词到扇贝生词本
 */
async function handleAddToShanbay(word: string): Promise<{ success?: boolean; error?: string }> {
  try {
    // TODO: 实现扇贝 API 调用
    console.log("添加到扇贝:", word)
    return { success: true }
  } catch (error) {
    console.error("添加到扇贝失败:", error)
    return { error: "添加失败，请检查是否已登录扇贝" }
  }
}
