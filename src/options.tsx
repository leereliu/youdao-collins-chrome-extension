/**
 * Options 设置页面
 * 管理划词翻译和扇贝生词本设置
 */

import { useState, useEffect } from "react"
import { getOptions, setOptions } from "./lib/storage"
import { clearShanbayToken } from "./lib/message"
import { ACTIVE_TYPES, type ActiveType, type Options } from "./lib/types"

import "./styles/globals.css"

function OptionsApp() {
  const [saveTips, setSaveTips] = useState(false)
  const [hasClearToken, setHasClearToken] = useState(false)
  const [inited, setInited] = useState(false)
  const [options, setOptionsState] = useState<Options | null>(null)

  useEffect(() => {
    getOptions().then((opts) => {
      setInited(true)
      setOptionsState(opts)
    })
  }, [])

  const saveOptionsHandler = async () => {
    if (!options) return

    setSaveTips(false)
    await setOptions(options)
    setSaveTips(true)
  }

  const changeOptions = <K extends keyof Options>(type: K, value: Options[K]) => {
    if (!options) return

    setOptionsState({
      ...options,
      [type]: value,
    })
  }

  const handleClearToken = async () => {
    setHasClearToken(false)
    await clearShanbayToken()
    setHasClearToken(true)
  }

  if (!inited || !options) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  const { activeType, showContainChinese, aiApiKey } = options

  return (
    <div className="mx-auto max-w-xl p-6 text-sm">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        划词翻译(柯林斯词典) 设置
      </h1>

      {/* AI 翻译设置 */}
      <section className="mb-6 rounded-lg border border-gray-200 p-4">
        <div className="mb-3 flex items-start justify-between">
          <h2 className="font-semibold text-gray-700">AI 增强翻译</h2>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
            可选功能
          </span>
        </div>
        <div className="space-y-3">
          <div className="rounded bg-blue-50 p-3 text-xs text-blue-800">
            <p className="mb-1 font-medium">✨ 配置后可获得：</p>
            <ul className="ml-4 list-disc space-y-0.5">
              <li>长文本 AI 流式翻译（逐字显示，更自然）</li>
              <li>更准确的上下文理解</li>
              <li>保留有道机翻作为对比参考</li>
            </ul>
            <p className="mt-2 text-gray-600">
              💡 不配置则所有文本都使用有道翻译
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">
              OpenRouter API Key (可选)
            </span>
            <input
              type="password"
              placeholder="留空则仅使用有道翻译"
              value={aiApiKey || ""}
              onChange={(e) => changeOptions("aiApiKey", e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <div className="space-y-1 text-xs text-gray-600">
            <p>
              获取免费 API Key：
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 hover:underline"
              >
                openrouter.ai/keys
              </a>
            </p>
            <p className="text-gray-500">
              推荐模型：xiaomi/mimo-v2-flash:free (完全免费)
            </p>
          </div>
        </div>
      </section>

      {/* 扇贝设置 */}
      <section className="mb-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-gray-700">扇贝单词本设置</h2>
        {hasClearToken && (
          <div className="mb-2 text-sm text-green-600">清除成功</div>
        )}
        <button
          onClick={handleClearToken}
          className="rounded bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
        >
          清除登录信息
        </button>
      </section>

      {/* 划词翻译设置 */}
      <section className="mb-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-gray-700">划词翻译设置</h2>
        <div className="space-y-2">
          {(Object.keys(ACTIVE_TYPES) as ActiveType[]).map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                name="activeType"
                type="radio"
                className="h-4 w-4 text-blue-600"
                checked={activeType === type}
                onChange={() => changeOptions("activeType", type)}
              />
              <span>{ACTIVE_TYPES[type]}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 中文翻译设置 */}
      <section className="mb-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-gray-700">中文翻译设置</h2>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            name="showContainChinese"
            type="checkbox"
            className="h-4 w-4 text-blue-600"
            checked={showContainChinese || false}
            onChange={() =>
              changeOptions("showContainChinese", !showContainChinese)
            }
          />
          <span>包含中文时显示翻译</span>
        </label>
      </section>

      {/* 保存按钮 */}
      <div className="flex items-center gap-4">
        <button
          onClick={saveOptionsHandler}
          className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          保存设置
        </button>
        {saveTips && <span className="text-sm text-green-600">保存成功</span>}
      </div>

      <p className="mt-4 text-xs text-gray-500">保存后重新刷新页面生效</p>

      {/* 反馈链接 */}
      <div className="mt-6 text-right">
        <a
          href="https://github.com/oyyd/youdao-collins-chrome-extension/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          意见/bug反馈
        </a>
      </div>
    </div>
  )
}

export default OptionsApp
