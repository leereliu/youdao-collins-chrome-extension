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

  const { activeType, showContainChinese } = options

  return (
    <div className="mx-auto max-w-xl p-6 text-sm">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        划词翻译(柯林斯词典) 设置
      </h1>

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
