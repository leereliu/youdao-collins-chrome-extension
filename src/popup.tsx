import { useState } from "react"

import "./styles/globals.css"

function IndexPopup() {
  const [query, setQuery] = useState("")

  const handleSearch = () => {
    if (!query.trim()) return
    // TODO: 实现搜索逻辑
    console.log("搜索:", query)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="w-[360px] min-h-[200px] p-4 bg-white">
      <header className="mb-4">
        <h1 className="text-lg font-bold text-gray-800">
          柯林斯词典
        </h1>
        <p className="text-sm text-gray-500">划词翻译 · 扇贝生词本</p>
      </header>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入要查询的单词..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-primary-500 
                     focus:border-transparent text-sm"
          autoFocus
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg 
                     hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          查询
        </button>
      </div>

      <div className="text-center text-gray-400 text-sm py-8">
        输入单词开始查询
      </div>
    </div>
  )
}

export default IndexPopup
