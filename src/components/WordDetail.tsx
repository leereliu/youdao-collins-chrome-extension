/**
 * WordDetail 组件
 * 共用的单词详情展示组件，用于 popup 和 content script overlay
 */

import { useState, useRef, useCallback } from "react"
import type { WordResponse, Synonyms, WordInfo, Meaning } from "../lib/types"

// ============ 样式常量 ============

const COLORS = {
  danger: "#d9534f",
  muted: "#636c72",
  warning: "#f0ad4e",
  primary: "#0275d8",
  success: "#5cb85c",
  mainBG: "#eff5f8",
  border: "#D4D4D5"
}

const STYLES = {
  info: { marginBottom: 10 },
  infoItem: {
    marginRight: 10,
    display: "inline-block",
    verticalAlign: "middle"
  },
  wordType: { fontSize: 12, marginRight: 4, color: COLORS.muted },
  meaningItem: { marginBottom: 10 },
  explain: {
    padding: "4px 8px",
    backgroundColor: COLORS.mainBG,
    borderRadius: 4
  },
  exampleItem: {
    marginTop: 8,
    paddingLeft: 20,
    color: COLORS.muted,
    fontSize: 13
  },
  choiceItem: {
    backgroundColor: COLORS.mainBG,
    padding: "4px 8px",
    marginBottom: 8,
    borderRadius: 4
  },
  link: { fontSize: 12, color: COLORS.primary, cursor: "pointer" },
  errorP: { fontSize: 12, margin: "8px 0 0 0" },
  synonyms: { marginTop: 4, fontSize: 12 }
}

// ============ 小图标组件 ============

interface AudioIconProps {
  word: string
}

export function AudioIcon({ word }: AudioIconProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const play = () => audioRef.current?.play()
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`

  const iconStyle: React.CSSProperties = {
    width: 14,
    height: 14,
    display: "inline-block",
    verticalAlign: "middle"
  }

  return (
    <span
      style={{
        cursor: "pointer",
        verticalAlign: "middle",
        display: "inline-flex",
        alignItems: "center"
      }}
      onClick={play}
      title="播放发音"
    >
      <svg style={iconStyle} viewBox="0 0 24 24">
        <path
          fill={COLORS.muted}
          d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
        />
      </svg>
      <audio ref={audioRef} src={url} preload="none" />
    </span>
  )
}

const SHANBAY_COLLECTION_URL = "https://web.shanbay.com/wordsweb/#/collection"

interface AddWordIconProps {
  word: string
  onAdd: (word: string) => Promise<{ success: boolean; msg?: string }>
}

export function AddWordIcon({ word, onAdd }: AddWordIconProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showTip, setShowTip] = useState(false)
  const successRef = useRef(false)
  const pendingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showErrorTip = useCallback((msg: string) => {
    setErrorMsg(msg)
    setShowTip(true)
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current)
    tipTimerRef.current = setTimeout(() => setShowTip(false), 3000)
  }, [])

  const doAdd = useCallback(async () => {
    if (successRef.current) return

    try {
      const response = await onAdd(word)
      if (successRef.current) return

      if (response.success) {
        successRef.current = true
        setStatus("success")
      } else {
        setStatus("error")
        // 显示错误提示
        if (response.msg === "Shanbay: Word Not Found!") {
          showErrorTip("扇贝词库中没有此单词")
        } else if (response.msg === "Invalid Token!") {
          showErrorTip("请先登录扇贝")
        } else {
          showErrorTip(response.msg || "添加失败")
        }
      }
    } catch {
      if (!successRef.current) {
        setStatus("error")
        showErrorTip("网络错误")
      }
    }
  }, [word, onAdd, showErrorTip])

  const handleClick = useCallback(() => {
    // 成功后点击跳转到扇贝生词本
    if (successRef.current || status === "success") {
      window.open(SHANBAY_COLLECTION_URL, "_blank")
      return
    }
    if (pendingRef.current) return

    pendingRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      pendingRef.current = false
      doAdd()
    }, 200)
  }, [status, doAdd])

  const getColor = () => {
    if (status === "success") return COLORS.success
    if (status === "error") return COLORS.danger
    return COLORS.primary
  }

  const getSymbol = () => {
    if (status === "success") return "✓"
    if (status === "error") return "!"
    return "+"
  }

  const getTitle = () => {
    if (status === "success") return "已添加，点击查看生词本"
    if (status === "error") return errorMsg || "添加失败，点击重试"
    return "添加到扇贝生词本"
  }

  const iconStyle: React.CSSProperties = {
    width: 14,
    height: 14,
    display: "inline-block",
    verticalAlign: "middle",
    fill: getColor()
  }

  const tipStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    marginTop: 4,
    padding: "4px 8px",
    backgroundColor: COLORS.danger,
    color: "#fff",
    fontSize: 12,
    borderRadius: 4,
    whiteSpace: "nowrap",
    zIndex: 1000,
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
  }

  return (
    <span
      style={{
        cursor: "pointer",
        verticalAlign: "middle",
        color: getColor(),
        display: "inline-flex",
        alignItems: "center",
        position: "relative"
      }}
      onClick={handleClick}
      title={getTitle()}
    >
      <svg style={iconStyle} viewBox="0 0 24 24">
        <path
          fill={getColor()}
          d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"
        />
      </svg>
      <span style={{ fontSize: 10, marginLeft: 1 }}>{getSymbol()}</span>
      {showTip && errorMsg && <span style={tipStyle}>{errorMsg}</span>}
    </span>
  )
}

// ============ 辅助函数 ============

function renderFrequence(frequence: number) {
  return <span style={{ color: COLORS.warning }}>{"★".repeat(frequence)}</span>
}

// 从有道链接中提取单词
function extractWordFromLink(href: string): string | null {
  // 链接格式: http://dict.youdao.com/w/eng/water 或 /w/eng/water
  const match = href.match(/\/w\/(?:eng\/)?([^/?#]+)/)
  if (match) {
    return decodeURIComponent(match[1])
  }
  return null
}

// 可点击内容组件 - 将 <a> 标签替换为可点击的 <span>
interface ClickableContentProps {
  html: string
  onSearch: (word: string) => void
}

function ClickableContent({ html, onSearch }: ClickableContentProps) {
  // 解析 HTML，提取链接并替换为可点击元素
  const parts: Array<{
    type: "text" | "link"
    content: string
    word?: string
  }> = []

  // 匹配 <a href="...">text</a> 格式
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(html)) !== null) {
    // 添加链接前的文本
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: html.slice(lastIndex, match.index) })
    }

    // 添加链接
    const href = match[1]
    const text = match[2]
    const word = extractWordFromLink(href) || text.trim()
    parts.push({ type: "link", content: text, word })

    lastIndex = match.index + match[0].length
  }

  // 添加剩余的文本
  if (lastIndex < html.length) {
    parts.push({ type: "text", content: html.slice(lastIndex) })
  }

  // 如果没有解析出任何链接，直接渲染原始 HTML
  if (parts.length === 0 || (parts.length === 1 && parts[0].type === "text")) {
    return <span dangerouslySetInnerHTML={{ __html: html }} />
  }

  return (
    <span>
      {parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: part.content }}
            />
          )
        }
        return (
          <span
            key={index}
            style={{ color: COLORS.primary, cursor: "pointer" }}
            onClick={() => part.word && onSearch(part.word)}
          >
            {part.content}
          </span>
        )
      })}
    </span>
  )
}

// ============ 子组件 ============

interface WordBasicProps {
  wordInfo: WordInfo
  synonyms?: Synonyms | null
  search?: (word: string) => void
  showNotebook: boolean
  onAddWord: (word: string) => Promise<{ success: boolean; msg?: string }>
}

function WordBasic({
  wordInfo,
  synonyms,
  search,
  showNotebook,
  onAddWord
}: WordBasicProps) {
  const { word, pronunciation, frequence, rank, additionalPattern } = wordInfo

  let synonymsEle = null
  if (synonyms && Array.isArray(synonyms.words) && synonyms.words.length > 0) {
    const { type, words: synonymsWords } = synonyms
    synonymsEle = (
      <div style={STYLES.synonyms}>
        <span>{type || ""} → </span>搜索
        {synonymsWords.map((w) => (
          <span
            key={w}
            style={{ ...STYLES.link, marginLeft: 4 }}
            onClick={() => search?.(w)}
          >
            "{w}"
          </span>
        ))}
      </div>
    )
  }

  return (
    <div style={STYLES.info}>
      <div>
        <span
          style={{ ...STYLES.infoItem, color: COLORS.danger, fontWeight: 600 }}
        >
          {word}
        </span>
        {pronunciation && (
          <span
            style={{
              ...STYLES.infoItem,
              fontStyle: "italic",
              color: COLORS.muted
            }}
          >
            {pronunciation}
          </span>
        )}
        <span style={STYLES.infoItem}>
          <AudioIcon word={word} />
        </span>
        {showNotebook && (
          <span style={STYLES.infoItem}>
            <AddWordIcon word={word} onAdd={onAddWord} />
          </span>
        )}
        {frequence && (
          <span style={STYLES.infoItem}>{renderFrequence(frequence)}</span>
        )}
        {rank && (
          <span
            style={{ ...STYLES.infoItem, fontSize: 12, fontWeight: "bold" }}
          >
            {rank}
          </span>
        )}
      </div>
      {additionalPattern && (
        <div style={{ marginTop: 4, fontSize: 12, color: COLORS.muted }}>
          ( {additionalPattern} )
        </div>
      )}
      {synonymsEle}
    </div>
  )
}

interface MeaningItemProps {
  meaning: Meaning
  onSearch: (word: string) => void
}

function MeaningItem({ meaning, onSearch }: MeaningItemProps) {
  const {
    example: { eng, ch },
    explain: { type, typeDesc, engExplain }
  } = meaning

  return (
    <div style={STYLES.meaningItem}>
      <div style={STYLES.explain}>
        <span style={STYLES.wordType}>{type}</span>
        <span style={{ ...STYLES.wordType, marginRight: 10 }}>{typeDesc}</span>
        <ClickableContent html={engExplain} onSearch={onSearch} />
      </div>
      <div style={STYLES.exampleItem}>
        <div>{eng}</div>
        <div style={{ marginTop: 4 }}>{ch}</div>
      </div>
    </div>
  )
}

// ============ 主组件 ============

interface WordDetailProps {
  /** 当前搜索的单词 */
  currentWord: string
  /** 搜索结果 */
  result: WordResponse | null
  /** 是否加载中 */
  loading?: boolean
  /** 搜索新单词 */
  onSearch: (word: string) => void
  /** 打开有道词典 */
  onOpenLink: (word: string) => void
  /** 添加单词到扇贝 */
  onAddWord: (word: string) => Promise<{ success: boolean; msg?: string }>
  /** 是否显示生词本功能 */
  showNotebook?: boolean
}

export function WordDetail({
  currentWord,
  result,
  loading = false,
  onSearch,
  onOpenLink,
  onAddWord,
  showNotebook = true
}: WordDetailProps) {
  const handleOpenYoudao = () => onOpenLink(currentWord)

  if (loading) {
    return <div>正在加载 "{currentWord}" ...</div>
  }

  if (!result || result.type === "error") {
    return (
      <p style={STYLES.errorP}>
        未找到结果。
        <span style={STYLES.link} onClick={handleOpenYoudao}>
          去有道搜索"{currentWord}"
        </span>
      </p>
    )
  }

  // choices
  if (result.type === "choices") {
    return (
      <div>
        <div style={{ marginBottom: 10 }}>请选择单词:</div>
        {result.response.choices.map((choice) => (
          <div key={choice.words[0]} style={STYLES.choiceItem}>
            <span style={STYLES.wordType}>{choice.wordType}</span>
            <span style={{ cursor: "pointer", color: COLORS.primary }}>
              {choice.words.map((w) => (
                <span
                  key={w}
                  style={{ marginRight: 8 }}
                  onClick={() => onSearch(w)}
                >
                  {w}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // machine_translation
  if (result.type === "machine_translation") {
    return (
      <div style={STYLES.choiceItem}>(机翻) {result.response.translation}</div>
    )
  }

  // explain
  if (result.type === "explain") {
    const { wordInfo, meanings, synonyms } = result.response
    return (
      <div>
        <WordBasic
          wordInfo={wordInfo}
          synonyms={synonyms}
          search={onSearch}
          showNotebook={showNotebook}
          onAddWord={onAddWord}
        />
        {meanings.map((meaning, index) => (
          <MeaningItem key={index} meaning={meaning} onSearch={onSearch} />
        ))}
      </div>
    )
  }

  // non_collins_explain
  if (result.type === "non_collins_explain") {
    const { wordInfo, explains } = result.response
    return (
      <div>
        {wordInfo && (
          <WordBasic
            wordInfo={wordInfo}
            showNotebook={showNotebook}
            onAddWord={onAddWord}
          />
        )}
        {explains.map((item, index) => (
          <div key={index} style={STYLES.choiceItem}>
            {item.type && <span style={STYLES.wordType}>{item.type}.</span>}
            <span>{item.explain}</span>
          </div>
        ))}
        <p style={STYLES.errorP}>
          未搜索到柯林斯释义。
          <span style={STYLES.link} onClick={handleOpenYoudao}>
            去有道搜索"{currentWord}"
          </span>
        </p>
      </div>
    )
  }

  return null
}

export default WordDetail
