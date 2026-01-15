/**
 * Popup 页面
 * 提供单词搜索和结果展示
 */

import { useState, useEffect, useRef } from "react"
import { searchWord, openLink, addNotebookWord } from "./lib/message"
import { getOptions, setOptions } from "./lib/storage"
import type { WordResponse, Options } from "./lib/types"
import { WordDetail } from "./components/WordDetail"

import "./styles/globals.css"

// ============ Searcher 组件 ============

interface SearcherProps {
  onSearch: (word: string) => void
  history: WordResponse[]
  onJumpBack: () => void
}

function Searcher({ onSearch, history, onJumpBack }: SearcherProps) {
  const [inputContent, setInputContent] = useState("")
  const [tempDisabled, setTempDisabled] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const optionsRef = useRef<Options | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    getOptions().then((options) => {
      setTempDisabled(options.tempDisabled)
      optionsRef.current = options
    })
  }, [])

  const changeTempDisabled = () => {
    const newDisabled = !tempDisabled
    setTempDisabled(newDisabled)

    if (optionsRef.current) {
      setOptions({ ...optionsRef.current, tempDisabled: newDisabled })
    }

    // 通知所有 content script
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: "ycce",
            tempDisabled: newDisabled,
          })
        }
      })
    })
  }

  const triggerSearch = () => {
    if (!inputContent.trim()) return
    onSearch(inputContent)
    inputRef.current?.setSelectionRange(0, inputContent.length)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      triggerSearch()
    }
  }

  const openOptionsPage = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    } else {
      window.open(chrome.runtime.getURL("options.html"))
    }
  }

  return (
    <div className="flex w-full">
      <input
        ref={inputRef}
        type="text"
        className="min-w-0 flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm outline-none"
        placeholder="请输入单词"
        value={inputContent}
        onChange={(e) => setInputContent(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <div className="flex">
        {history.length > 1 && (
          <button
            onClick={onJumpBack}
            className="-ml-px border border-gray-300 bg-gray-50 px-2.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
            title="返回上一个"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
        )}
        <button
          onClick={triggerSearch}
          className="-ml-px border border-gray-300 bg-gray-50 px-2.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
          title="搜索"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </button>
        <button
          onClick={openOptionsPage}
          className="-ml-px border border-gray-300 bg-gray-50 px-2.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
          title="设置"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
        <button
          onClick={changeTempDisabled}
          className="-ml-px rounded-r-md border border-gray-300 bg-gray-50 px-2.5 transition-colors hover:bg-gray-100"
          title={tempDisabled ? "划词翻译已关闭" : "划词翻译已启用"}
        >
          <span
            className={`inline-block h-3 w-3 rounded-full ${
              tempDisabled ? "bg-gray-400" : "bg-green-500"
            }`}
          />
        </button>
      </div>
    </div>
  )
}

// ============ 主 Popup 组件 ============

interface SearchHistoryItem {
  word: string
  result: WordResponse
}

function shouldPush(
  history: SearchHistoryItem[],
  newWord: string,
  newItem: WordResponse
): boolean {
  if (!Array.isArray(history) || history.length < 1) {
    return true
  }

  const lastItem = history[history.length - 1]

  return !(
    lastItem.result.type === "explain" &&
    newItem.type === "explain" &&
    lastItem.result.response.wordInfo.word === newItem.response.wordInfo.word
  )
}

function IndexPopup() {
  const [explain, setExplain] = useState<WordResponse | null>(null)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [currentWord, setCurrentWord] = useState("")
  const currentWordRef = useRef("")

  // 同步 currentWord 到 ref
  useEffect(() => {
    currentWordRef.current = currentWord
  }, [currentWord])

  // 监听流式翻译消息
  useEffect(() => {
    const handleMessage = (message: {
      eventName?: string
      data?: { text: string; chunk: string; done: boolean; error?: string }
    }) => {
      // 处理流式翻译
      if (message.eventName === "LLM_TRANSLATION_STREAM" && message.data) {
        const { text, chunk, done, error } = message.data

        // 只处理当前正在翻译的文本
        if (text.toLowerCase() !== currentWordRef.current.toLowerCase()) {
          return
        }

        if (error) {
          console.error("Streaming error:", error)
          return
        }

        if (done) {
          // 流式完成
          setExplain((prev) => {
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
          // 实时更新结果
          setExplain((prev) => {
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

  const jumpBack = () => {
    if (history.length <= 1) return

    const newHistory = history.slice(0, -1)
    const previous = newHistory[newHistory.length - 1]

    setHistory(newHistory)
    setCurrentWord(previous.word)
    setExplain(previous.result)
  }

  const search = async (word: string) => {
    if (!word) return

    try {
      const res = await searchWord(word)
      const push = shouldPush(history, word, res)

      let newHistory = history
      if (push) {
        newHistory = [...history, { word, result: res }]
      }

      setCurrentWord(word)
      setExplain(res)
      setHistory(newHistory)
    } catch (error) {
      console.error("Search failed:", error)
    }
  }

  const handleOpenLink = (word: string) => {
    openLink(word)
  }

  const handleAddWord = async (word: string) => {
    return addNotebookWord(word)
  }

  return (
    <div className="relative min-h-[300px] w-[400px] bg-white">
      {/* 固定搜索栏 */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-3">
        <Searcher onSearch={search} history={history} onJumpBack={jumpBack} />
      </div>

      {/* 搜索结果 */}
      {explain ? (
        <div className="p-3">
          <WordDetail
            currentWord={currentWord}
            result={explain}
            onSearch={search}
            onOpenLink={handleOpenLink}
            onAddWord={handleAddWord}
            showNotebook
            searchHistory={history}
            onBack={history.length > 1 ? jumpBack : undefined}
          />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center text-gray-400">
          输入单词开始查询
        </div>
      )}
    </div>
  )
}

export default IndexPopup
