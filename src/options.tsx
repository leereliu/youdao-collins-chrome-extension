import { useEffect, useState } from "react"

import "./styles/globals.css"

type TranslateMode = "instant" | "modifier" | "doubleClick" | "disabled"

interface Options {
  translateMode: TranslateMode
  modifierKey: "ctrl" | "meta"
  enableShanbay: boolean
}

const defaultOptions: Options = {
  translateMode: "modifier",
  modifierKey: "ctrl",
  enableShanbay: false
}

function OptionsPage() {
  const [options, setOptions] = useState<Options>(defaultOptions)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // 加载已保存的选项
    chrome.storage.sync.get(defaultOptions, (result) => {
      setOptions(result as Options)
    })
  }, [])

  const handleSave = () => {
    chrome.storage.sync.set(options, () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const updateOption = <K extends keyof Options>(key: K, value: Options[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            柯林斯词典 - 设置
          </h1>
          <p className="text-gray-600 mt-1">自定义扩展的行为</p>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* 划词翻译模式 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              划词翻译模式
            </h2>
            <div className="space-y-3">
              {[
                { value: "instant", label: "划词即翻译", desc: "选中文字后立即显示翻译" },
                { value: "modifier", label: "按住修饰键 + 划词", desc: "按住 Ctrl/Meta 键并选中文字时翻译" },
                { value: "doubleClick", label: "双击划词翻译", desc: "双击选中单词时翻译" },
                { value: "disabled", label: "关闭划词翻译", desc: "仅使用弹出窗口搜索" }
              ].map((mode) => (
                <label
                  key={mode.value}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 
                             hover:border-primary-300 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="translateMode"
                    value={mode.value}
                    checked={options.translateMode === mode.value}
                    onChange={(e) =>
                      updateOption("translateMode", e.target.value as TranslateMode)
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{mode.label}</div>
                    <div className="text-sm text-gray-500">{mode.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* 修饰键选择 */}
          {options.translateMode === "modifier" && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                修饰键
              </h2>
              <select
                value={options.modifierKey}
                onChange={(e) =>
                  updateOption("modifierKey", e.target.value as "ctrl" | "meta")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ctrl">Ctrl 键</option>
                <option value="meta">Meta/Command 键</option>
              </select>
            </section>
          )}

          {/* 扇贝生词本 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              扇贝生词本
            </h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.enableShanbay}
                onChange={(e) => updateOption("enableShanbay", e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 
                           focus:ring-primary-500"
              />
              <span className="text-gray-800">
                启用扇贝生词本（需要登录扇贝账号）
              </span>
            </label>
          </section>
        </div>

        {/* 保存按钮 */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg 
                       hover:bg-primary-700 transition-colors font-medium"
          >
            保存设置
          </button>
          {saved && (
            <span className="text-green-600 animate-fade-in">
              ✓ 设置已保存
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default OptionsPage
