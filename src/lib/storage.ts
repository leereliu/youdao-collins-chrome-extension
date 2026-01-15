/**
 * Chrome Storage 工具模块
 * 管理单词本和选项配置
 */

import { type Options, DEFAULT_OPTIONS } from "./types"

// ============ 常量 ============

const SEARCH_PREFIX = "http://dict.youdao.com/w/eng/"

// ============ URL 工具 ============

/**
 * 获取有道词典单词 URL
 */
export function getWordURL(word: string): string {
  return `${SEARCH_PREFIX}${word}`
}

// ============ 单词本存储 ============

/**
 * 获取所有已保存的单词
 */
export async function getWords(): Promise<string[]> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (data) => {
      let words: string[] = []

      if (Object.hasOwnProperty.call(data, "words")) {
        words = data.words as string[]
      }

      resolve(words)
    })
  })
}

/**
 * 检查单词是否已保存
 */
export async function hasWord(word: string): Promise<boolean> {
  const words = await getWords()
  return words.indexOf(word) > -1
}

/**
 * 保存单词列表
 */
async function setWords(words: string[]): Promise<string[]> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ words }, () => {
      resolve(words)
    })
  })
}

/**
 * 添加单词到单词本
 */
export async function addWord(word: string): Promise<string[]> {
  const words = await getWords()
  
  if (words.indexOf(word) >= 0) {
    return words
  }

  words.push(word)
  return setWords(words)
}

/**
 * 从单词本中移除单词
 */
export async function removeWord(word: string): Promise<string[]> {
  const words = await getWords()
  const index = words.indexOf(word)

  if (index < 0) {
    return words
  }

  const newWords = words.slice(0, index).concat(words.slice(index + 1))
  return setWords(newWords)
}

// ============ 选项配置存储 ============

/**
 * 获取选项配置
 */
export async function getOptions(): Promise<Options> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (data) => {
      let options = { ...DEFAULT_OPTIONS }

      if (Object.hasOwnProperty.call(data, "options")) {
        options = { ...options, ...(data.options as Partial<Options>) }
      }

      resolve(options)
    })
  })
}

/**
 * 保存选项配置
 */
export async function setOptions(options: Options): Promise<Options> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ options }, () => {
      resolve(options)
    })
  })
}
