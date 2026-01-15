/**
 * Content Script - 划词翻译
 * 监听用户选词并显示翻译弹窗
 */

import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useState, useRef } from "react"
import { searchWord, openLink, addNotebookWord } from "../lib/message"
import { getOptions } from "../lib/storage"
import type { WordResponse, Options, ActiveType } from "../lib/types"
import { WordDetail } from "../components/WordDetail"

// Plasmo Content Script 配置
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
}

// 使用 inline 样式
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
    .plasmo-csui-container {
      z-index: 2147483647 !important;
    }
  `
  return style
}

// ============ 常量 ============

const WIDTH = 400
const MAX_HEIGHT = 300
const PADDING = 10

// ============ 工具函数 ============

function getViewportSize() {
  return {
    width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
  }
}

function getLayoutPosition(rect: DOMRect) {
  const { width: viewportWidth, height: viewportHeight } = getViewportSize()

  let left = rect.left
  let top = rect.bottom + 8

  // 右边界检测
  if (left + WIDTH > viewportWidth - PADDING) {
    left = viewportWidth - WIDTH - PADDING
  }

  // 左边界检测
  if (left < PADDING) {
    left = PADDING
  }

  // 下边界检测 - 如果超出则显示在上方
  if (rect.bottom + MAX_HEIGHT > viewportHeight) {
    top = rect.top - MAX_HEIGHT - 8
    if (top < PADDING) {
      top = PADDING
    }
  }

  return { top, left }
}

// 检测文本是否包含中文
function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text)
}

// ============ 弹窗容器组件 ============

interface PopupContainerProps {
  position: { top: number; left: number }
  children: React.ReactNode
}

function PopupContainer({ position, children }: PopupContainerProps) {
  const containerStyle: React.CSSProperties = {
    position: "fixed",
    left: position.left,
    top: position.top,
    zIndex: 2147483647,
    padding: 8,
    border: "1px solid #D4D4D5",
    backgroundColor: "#fff",
    boxSizing: "border-box",
    width: WIDTH,
    maxHeight: MAX_HEIGHT,
    overflow: "auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    lineHeight: 1.5,
    color: "#333",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  }

  return (
    <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  )
}

// ============ 主组件 ============

function TranslatorOverlay() {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [result, setResult] = useState<WordResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentWord, setCurrentWord] = useState("")
  const [options, setOptionsState] = useState<Options | null>(null)
  const [searchHistory, setSearchHistory] = useState<
    Array<{ word: string; result: WordResponse }>
  >([])
  const [loadingWord, setLoadingWord] = useState<string | null>(null)
  const lastWordRef = useRef("")
  const justOpenedRef = useRef(false)
  const currentWordRef = useRef("")

  // 同步 currentWord 到 ref
  useEffect(() => {
    currentWordRef.current = currentWord
  }, [currentWord])

  // 加载选项 + 监听流式翻译消息
  useEffect(() => {
    getOptions().then(setOptionsState)

    const handleMessage = (message: {
      eventName?: string
      type?: string
      tempDisabled?: boolean
      data?: { text: string; chunk: string; done: boolean; error?: string }
    }) => {
      // 处理选项更新
      if (message.type === "ycce" && typeof message.tempDisabled === "boolean") {
        setOptionsState((prev) =>
          prev ? { ...prev, tempDisabled: message.tempDisabled! } : prev
        )
        return
      }

      // 处理流式翻译
      if (message.eventName === "LLM_TRANSLATION_STREAM" && message.data) {
        const { text, chunk, done, error } = message.data

        // 只处理当前正在翻译的文本（不区分大小写）
        if (
          !currentWordRef.current ||
          text.toLowerCase() !== currentWordRef.current.toLowerCase()
        ) {
          return
        }

        if (error) {
          console.error("Streaming error:", error)
          return
        }

        if (done) {
          // 流式完成
          setResult((prev) => {
            if (prev?.type === "llm_translation") {
              return {
                ...prev,
                response: {
                  ...prev.response,
                  isStreaming: false
                }
              }
            }
            return prev
          })
        } else {
          // 实时更新 AI 翻译
          setResult((prev) => {
            if (prev?.type === "llm_translation") {
              return {
                ...prev,
                response: {
                  ...prev.response,
                  aiTranslation: prev.response.aiTranslation + chunk
                }
              }
            }
            return prev
          })
        }
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])

  // 搜索单词
  const search = async (word: string, skipHistory = false) => {
    if (!word || word === lastWordRef.current) return
    lastWordRef.current = word

    // 立即更新 currentWord 和清空 result，避免显示旧内容
    setCurrentWord(word)
    setResult(null)
    setLoadingWord(word)

    try {
      const response = await searchWord(word)
      if (word === lastWordRef.current) {
        // 更新结果
        setResult(response)
        
        // 添加到历史记录（跳过返回操作）
        if (!skipHistory) {
          setSearchHistory((prev) => [...prev, { word, result: response }])
        }
      }
    } catch {
      if (word === lastWordRef.current) {
        setResult({ type: "error" })
      }
    } finally {
      if (word === lastWordRef.current) {
        setLoadingWord(null) // 清除加载状态
      }
    }
  }

  // 返回上一个搜索
  const handleBack = () => {
    if (searchHistory.length <= 1) return

    // 移除当前记录
    const newHistory = searchHistory.slice(0, -1)
    const previous = newHistory[newHistory.length - 1]

    setSearchHistory(newHistory)
    setCurrentWord(previous.word)
    setResult(previous.result)
    lastWordRef.current = previous.word
  }

  // 处理添加单词到扇贝
  const handleAddWord = async (word: string) => {
    return addNotebookWord(word)
  }

  // 处理打开有道词典
  const handleOpenLink = (word: string) => {
    openLink(word)
  }

  // 处理选词
  useEffect(() => {
    const shouldTranslate = (e: MouseEvent): boolean => {
      if (!options || options.tempDisabled) return false

      const activeType = options.activeType as ActiveType

      switch (activeType) {
        case "NEVER":
          return false
        case "KEY_DOWN":
          return e.metaKey || e.ctrlKey
        case "DOUBLE_CLICK":
          return false
        case "ALWAYS":
        default:
          return true
      }
    }

    const handleMouseUp = async (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("[data-yc-popup]")) {
        return
      }

      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()

      if (!selectedText || selectedText.length > 500) {
        return
      }

      // 如果设置不显示中文翻译，且文本包含中文，则不翻译
      if (!options?.showContainChinese && hasChinese(selectedText)) {
        return
      }

      if (!shouldTranslate(e)) {
        return
      }

      const rect = selection?.getRangeAt(0).getBoundingClientRect()
      if (rect) {
        const pos = getLayoutPosition(rect)
        setPosition(pos)
      }

      justOpenedRef.current = true
      setVisible(true)
      setSearchHistory([]) // 重置历史记录
      search(selectedText.toLowerCase())

      setTimeout(() => {
        justOpenedRef.current = false
      }, 100)
    }

    const handleDoubleClick = async (e: MouseEvent) => {
      if (!options || options.tempDisabled) return
      if (options.activeType !== "DOUBLE_CLICK") return

      const target = e.target as HTMLElement
      if (target.closest("[data-yc-popup]")) {
        return
      }

      setTimeout(() => {
        const selection = window.getSelection()
        const selectedText = selection?.toString().trim()

        if (!selectedText || selectedText.length > 500) {
          return
        }

        // 如果设置不显示中文翻译，且文本包含中文，则不翻译
        if (!options?.showContainChinese && hasChinese(selectedText)) {
          return
        }

        const rect = selection?.getRangeAt(0).getBoundingClientRect()
        if (rect) {
          const pos = getLayoutPosition(rect)
          setPosition(pos)
        }

        justOpenedRef.current = true
        setVisible(true)
        search(selectedText.toLowerCase())

        setTimeout(() => {
          justOpenedRef.current = false
        }, 100)
      }, 10)
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (justOpenedRef.current) {
        return
      }

      const target = e.target as HTMLElement
      if (!target.closest("[data-yc-popup]")) {
        setVisible(false)
        lastWordRef.current = ""
        setSearchHistory([]) // 清空历史记录
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setVisible(false)
        lastWordRef.current = ""
      }
    }

    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("dblclick", handleDoubleClick)
    document.addEventListener("click", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("dblclick", handleDoubleClick)
      document.removeEventListener("click", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [options])

  if (!visible) return null

  return (
    <div data-yc-popup>
      <PopupContainer position={position}>
        <WordDetail
          currentWord={currentWord}
          result={result}
          loading={loading}
          onSearch={search}
          onOpenLink={handleOpenLink}
          onAddWord={handleAddWord}
          showNotebook={options?.showNotebook ?? true}
          searchHistory={searchHistory}
          onBack={handleBack}
          loadingWord={loadingWord}
        />
      </PopupContainer>
    </div>
  )
}

export default TranslatorOverlay
