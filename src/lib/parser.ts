import * as cheerio from "cheerio"

import type { CollinsDefinition, QueryResult, WordDefinition } from "./types"

/**
 * 解析有道词典页面，提取单词信息
 */
export function parseYoudaoPage(html: string, word: string): QueryResult {
  const $ = cheerio.load(html)
  const result: QueryResult = { word }

  try {
    // 解析音标
    const phonetic = $(".phonetic").first().text().trim()
    if (phonetic) {
      result.phonetic = phonetic
    }

    // 解析发音 URL
    const audioUrl = $("#phrsListTab .pronounce .dictvoice").attr("data-rel")
    if (audioUrl) {
      result.audioUrl = `https://dict.youdao.com/dictvoice?audio=${audioUrl}`
    }

    // 解析基础释义
    const definitions: WordDefinition[] = []
    $("#phrsListTab .trans-container ul li").each((_, el) => {
      const text = $(el).text().trim()
      // 匹配 "adj. 形容词" 格式
      const match = text.match(/^([a-z]+\.)\s*(.+)$/i)
      if (match) {
        definitions.push({
          pos: match[1],
          meaning: match[2]
        })
      }
    })
    if (definitions.length > 0) {
      result.definitions = definitions
    }

    // 解析柯林斯释义
    const collins: CollinsDefinition[] = []
    $("#collinsResult .ol li").each((_, el) => {
      const $el = $(el)
      const explanation = $el.find(".collinsMajorTrans p").text().trim()
      const examples: string[] = []

      $el.find(".exampleLists .examples p").each((_, exEl) => {
        const example = $(exEl).text().trim()
        if (example) {
          examples.push(example)
        }
      })

      // 获取星级
      const starClass = $el.closest(".wt-container").find(".star").attr("class")
      const starMatch = starClass?.match(/star(\d)/)
      const star = starMatch ? parseInt(starMatch[1], 10) : undefined

      if (explanation) {
        collins.push({
          explanation,
          examples: examples.length > 0 ? examples : undefined,
          star
        })
      }
    })
    if (collins.length > 0) {
      result.collins = collins
    }

    // 如果没有找到任何释义，标记为错误
    if (!result.definitions && !result.collins) {
      result.error = "未找到该单词的释义"
    }
  } catch (error) {
    console.error("解析有道页面失败:", error)
    result.error = "解析失败"
  }

  return result
}
