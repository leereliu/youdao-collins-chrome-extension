import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"

// Plasmo Content Script 配置
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

interface TranslationResult {
  word: string
  phonetic?: string
  definitions?: Array<{
    pos: string
    meaning: string
    examples?: string[]
  }>
  collins?: string
  error?: string
}

interface Position {
  x: number
  y: number
}

function TranslatorOverlay() {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleMouseUp = async () => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()

      if (!selectedText || selectedText.length > 50) {
        setVisible(false)
        return
      }

      // 检查是否是英文单词
      if (!/^[a-zA-Z\s-]+$/.test(selectedText)) {
        setVisible(false)
        return
      }

      // 设置弹出位置
      const rect = selection?.getRangeAt(0).getBoundingClientRect()
      if (rect) {
        setPosition({
          x: rect.left + window.scrollX,
          y: rect.bottom + window.scrollY + 8
        })
      }

      // 查询单词
      setLoading(true)
      setVisible(true)
      setResult(null)

      try {
        const response = await chrome.runtime.sendMessage({
          type: "QUERY_WORD",
          word: selectedText.toLowerCase()
        })

        if (response.error) {
          setResult({ word: selectedText, error: response.error })
        } else {
          setResult({
            word: selectedText,
            definitions: [{ pos: "n.", meaning: "加载中..." }]
          })
        }
      } catch {
        setResult({ word: selectedText, error: "查询失败" })
      } finally {
        setLoading(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".youdao-collins-popup")) {
        setVisible(false)
      }
    }

    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="youdao-collins-popup"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 2147483647,
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px"
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          padding: "16px",
          minWidth: "280px",
          maxWidth: "400px"
        }}
      >
        {loading ? (
          <div style={{ color: "#6b7280", textAlign: "center", padding: "12px 0" }}>
            查询中...
          </div>
        ) : result ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937" }}>
              {result.word}
            </div>
            {result.phonetic && (
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                {result.phonetic}
              </div>
            )}
            {result.error ? (
              <div style={{ color: "#dc2626", fontSize: "13px" }}>
                {result.error}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {result.definitions?.map((def, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: "#2563eb", fontSize: "12px", fontWeight: 500, flexShrink: 0 }}>
                      {def.pos}
                    </span>
                    <span style={{ color: "#374151" }}>{def.meaning}</span>
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "8px",
                paddingTop: "12px",
                borderTop: "1px solid #e5e7eb"
              }}
            >
              <button
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
                onClick={() => {
                  chrome.runtime.sendMessage({
                    type: "ADD_TO_SHANBAY",
                    word: result.word
                  })
                }}
              >
                添加到扇贝
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default TranslatorOverlay
