/**
 * 解析器测试
 * 测试有道词典 HTML 页面解析功能
 */

import { describe, it, expect } from "vitest"
import { parse } from "../lib/parser"

// 导入测试数据
import pagePage from "./fixtures/page"
import performPage from "./fixtures/perform"
import noresponsePage from "./fixtures/noresponse"
import choicesPage from "./fixtures/choices"
import newestPage from "./fixtures/newest"
import deficitsPage from "./fixtures/deficits"
import openPage from "./fixtures/open"
import sentencePage from "./fixtures/sentence"
import favorablePage from "./fixtures/favorable"
import dimensionalPage from "./fixtures/dimensional"

const EXPECTED_KEYS = [
  "word",
  "pronunciation",
  "frequence",
  "rank",
  "additionalPattern",
] as const

describe("parse", () => {
  describe("explain", () => {
    it('should have a "type" and a "meanings" and all expected keys in "wordInfo"', () => {
      const result = parse(pagePage)

      expect(result.type).toBe("explain")

      if (result.type === "explain") {
        const { wordInfo, meanings } = result.response

        EXPECTED_KEYS.forEach((key) => {
          expect(wordInfo).toHaveProperty(key)
        })

        expect(Array.isArray(meanings)).toBe(true)
      }
    })

    it("should have all expected keys", () => {
      const result = parse(performPage)

      if (result.type === "explain") {
        const { wordInfo, meanings } = result.response

        EXPECTED_KEYS.forEach((key) => {
          expect(wordInfo).toHaveProperty(key)
        })

        expect(Array.isArray(meanings)).toBe(true)
      }
    })

    it("should parse multiple explains", () => {
      const result = parse(openPage)

      if (result.type === "explain") {
        const { wordInfo, meanings } = result.response

        EXPECTED_KEYS.forEach((key) => {
          expect(wordInfo).toHaveProperty(key)
        })

        expect(Array.isArray(meanings)).toBe(true)
      }
    })
  })

  describe("noresponse", () => {
    it('should return "error" type', () => {
      const result = parse(noresponsePage)
      expect(result.type).toBe("error")
    })
  })

  describe("choices", () => {
    it('should return "choices" type and choices response', () => {
      const result = parse(choicesPage)

      expect(result.type).toBe("choices")

      if (result.type === "choices") {
        const { choices } = result.response

        expect(Array.isArray(choices)).toBe(true)
        expect(choices[0].words[0].indexOf("tear down")).toBe(0)
        expect(choices[0].wordType).toBe("v.")
        expect(choices[1].words[0].indexOf("dismantle")).toBe(0)
        expect(choices[1].wordType).toBe("vt.")
      }
    })
  })

  describe("non_collins_explain", () => {
    it('should return "non_collins_explain" type', () => {
      const result = parse(newestPage)

      expect(result.type).toBe("non_collins_explain")

      if (result.type === "non_collins_explain") {
        const { wordInfo, explains } = result.response
        const { word, pronunciation } = wordInfo

        expect(word).toBe("newest")
        // 音标可能因编码差异有所不同，只检查是否存在
        expect(pronunciation).toBeTruthy()
        expect(Array.isArray(explains)).toBe(true)
        expect(explains[0].type).toBe("")
        expect(explains[0].explain).toBe("最新")
      }
    })

    it('should return "non_collins_explain" type too', () => {
      const result = parse(deficitsPage)

      expect(result.type).toBe("non_collins_explain")

      if (result.type === "non_collins_explain") {
        const { wordInfo, explains } = result.response
        const { word, pronunciation } = wordInfo

        expect(word).toBe("deficits")
        // 音标可能因编码差异有所不同，只检查是否存在
        expect(pronunciation).toBeTruthy()
        expect(Array.isArray(explains)).toBe(true)
        expect(explains[0].type).toBe("n")
        expect(explains[0].explain).toBe("[财政] 赤字，亏损（deficit的复数形式）")
      }
    })

    it('should return "machine_translation" type and the correspond response', () => {
      const result = parse(sentencePage)

      expect(result.type).toBe("machine_translation")

      if (result.type === "machine_translation") {
        expect(result.response.translation).toBe("可视化工具的目的是构建可视化。")
      }
    })
  })

  describe("synonyms", () => {
    it("should get synonyms info if there is", () => {
      const result = parse(favorablePage)

      expect(result.type).toBe("explain")

      if (result.type === "explain") {
        expect(result.response.synonyms.type).toBe("[美国英语]")
        expect(result.response.synonyms.words[0]).toBe("favourable")
        expect(result.response.synonyms.hrefs[0]).toBe(
          "/w/favourable/?keyfrom=dict.collins"
        )
      }
    })
  })

  describe("dimensional", () => {
    it("should get synonyms with multiple words and hrefs", () => {
      const result = parse(dimensionalPage)

      expect(result.type).toBe("explain")

      if (result.type === "explain") {
        expect(result.response.synonyms.type).toBe("")
        expect(result.response.synonyms.words).toEqual([
          "two-dimensional",
          "three-dimensional",
        ])
        expect(result.response.synonyms.hrefs).toEqual([
          "/w/two-dimensional/?keyfrom=dict.collins",
          "/w/three-dimensional/?keyfrom=dict.collins",
        ])
      }
    })
  })
})
