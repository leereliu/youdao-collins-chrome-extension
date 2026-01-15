/**
 * 有道词典页面解析器
 * 从有道词典 HTML 页面中提取柯林斯释义、词形变化、例句等信息
 */

import * as cheerio from "cheerio"

// ============ 类型定义 ============

export interface MeaningExplain {
  type: string
  typeDesc: string
  engExplain: string
}

export interface MeaningExample {
  ch: string
  eng: string
}

export interface Meaning {
  explain: MeaningExplain
  example: MeaningExample
}

export interface WordInfo {
  word: string
  pronunciation: string
  frequence: number | null
  rank: string
  additionalPattern: string
}

export interface Synonyms {
  type: string
  hrefs: string[]
  words: string[]
}

export interface ExplainResponse {
  wordInfo: WordInfo
  synonyms: Synonyms
  meanings: Meaning[]
}

export interface Choice {
  wordType: string
  words: string[]
}

export interface ChoiceResponse {
  choices: Choice[]
}

export interface NonCollinsExplain {
  type: string
  explain: string
}

export interface NonCollinsExplainsResponse {
  wordInfo: WordInfo
  explains: NonCollinsExplain[]
}

export interface MachineTranslationResponse {
  translation: string
}

export type ResponseType =
  | "explain"
  | "choices"
  | "error"
  | "non_collins_explain"
  | "machine_translation"

export type WordResponse =
  | { type: "explain"; response: ExplainResponse }
  | { type: "choices"; response: ChoiceResponse }
  | { type: "error" }
  | { type: "non_collins_explain"; response: NonCollinsExplainsResponse }
  | { type: "machine_translation"; response: MachineTranslationResponse }

// ============ 工具函数 ============

const LINK_REGEXP = /href="(.+)"/

function replaceJumpLink(content: string | null): string {
  if (typeof content !== "string") {
    return ""
  }
  return content.replace(
    LINK_REGEXP,
    (_match, m1) => `href="http://dict.youdao.com/${m1}"`
  )
}

function getFrequency(className: string | undefined): number | null {
  if (!className) return null
  const res = /star(\d)/.exec(className)
  return res ? parseInt(res[1], 10) : null
}

// ============ 解析函数 ============

function getInfo($container: cheerio.Cheerio<cheerio.Element>): Omit<WordInfo, "pronunciation"> {
  const word = $container.find(".title").text()
  const $star = $container.find(".star")
  const frequence = $star.length > 0 ? getFrequency($star.attr("class")) : null
  const rank = $container.find(".rank").text()
  const additionalPattern = $container.find(".pattern").text().trim()

  return {
    word,
    frequence,
    rank,
    additionalPattern,
  }
}

function getExplain(
  $explain: cheerio.Cheerio<cheerio.Element>
): MeaningExplain {
  const $type = $explain.find(".additional")
  const type = $type.text()
  const typeDesc = $type.attr("title") || ""

  const $p = $explain.find("p")
  $p.find("span").remove()

  const engExplain = replaceJumpLink($p.html()?.trim() || "")

  return {
    type,
    typeDesc,
    engExplain,
  }
}

function getExample(
  $example: cheerio.Cheerio<cheerio.Element>
): MeaningExample {
  const $examples = $example.find(".examples p")
  const eng = $examples.eq(0).text()
  const ch = $examples.eq(1).text()

  return {
    eng,
    ch,
  }
}

function getMeanings(
  $: cheerio.CheerioAPI,
  $items: cheerio.Cheerio<cheerio.Element>
): { meanings: Meaning[] } {
  const meanings: Meaning[] = []

  $items.each((_index, itemEle) => {
    const $item = $(itemEle)
    const $exampleLists = $item.find(".exampleLists")
    const $explain = $item.find(".collinsMajorTrans")

    if ($explain.length === 0) {
      return
    }

    const meaning: Meaning = {
      explain: getExplain($explain),
      example: getExample($exampleLists),
    }

    meanings.push(meaning)
  })

  return { meanings }
}

function getType($: cheerio.CheerioAPI): ResponseType {
  if ($(".collinsToggle").length > 0) {
    return "explain"
  } else if ($("#phrsListTab .wordGroup").length > 0) {
    return "choices"
  } else if ($("#phrsListTab .trans-container").length > 0) {
    return "non_collins_explain"
  } else if ($("#ydTrans .trans-container").length > 0) {
    return "machine_translation"
  }

  return "error"
}

function getChoices($: cheerio.CheerioAPI): ChoiceResponse {
  const $container = $("#phrsListTab")
  const $wordGroup = $container.find(".wordGroup")
  const choices: Choice[] = []

  $wordGroup.each((_index, ele) => {
    const $spans = $(ele).find("span")
    const $firstSpan = $spans.eq(0)

    let wordType = ""

    if (!$firstSpan.hasClass("contentTitle")) {
      wordType = $spans.eq(0).text().trim()
    }

    const $words = $(ele).find(".contentTitle")
    const words: string[] = []

    $words.each((_i, e) => {
      const $ele = $(e)
      words.push($ele.find(".search-js").text().trim())
    })

    choices.push({
      words,
      wordType,
    })
  })

  return { choices }
}

function getSynonyms($: cheerio.Cheerio<cheerio.Element>): Synonyms {
  const $type = $.find(".wt-container>.additional")
  const type = $type.length > 0 ? $type.text() : ""
  const $anchor = $.find(".wt-container>a")
  const hrefs: string[] = []
  const words: string[] = []

  $anchor.each((index) => {
    const $ele = $anchor.eq(index)
    hrefs.push($ele.attr("href") || "")
    words.push($ele.text() || "")
  })

  return { type, hrefs, words }
}

function getExplainResponse($: cheerio.CheerioAPI): ExplainResponse {
  const $collinsContainer = $(".collinsToggle")

  const $title = $(".wordbook-js")
  const pronunciation = $title.find(".pronounce .phonetic").eq(1).text().trim()

  const { meanings } = getMeanings($, $collinsContainer.find("li"))

  return {
    wordInfo: {
      ...getInfo($collinsContainer.find("h4").eq(0)),
      pronunciation,
    },
    synonyms: getSynonyms($collinsContainer),
    meanings,
  }
}

function getTitleInfo($: cheerio.CheerioAPI): WordInfo {
  const $title = $(".wordbook-js")
  const word = $title.find(".keyword").text().trim()
  const pronunciation = $title.find(".pronounce .phonetic").eq(1).text().trim()

  return {
    word,
    pronunciation,
    frequence: null,
    rank: "",
    additionalPattern: "",
  }
}

function getNonCollinsExplain($: cheerio.CheerioAPI): NonCollinsExplainsResponse {
  const explains: NonCollinsExplain[] = []

  $("#phrsListTab .trans-container li").each((_i, ele) => {
    const rawString = $(ele).text()
    const index = rawString.indexOf(". ")

    if (index > -1) {
      const type = rawString.slice(0, index)
      const explain = rawString.slice(index + 2)

      explains.push({ type, explain })
      return
    }

    explains.push({
      type: "",
      explain: rawString,
    })
  })

  return {
    wordInfo: getTitleInfo($),
    explains,
  }
}

function getMachineTranslation($: cheerio.CheerioAPI): MachineTranslationResponse {
  const $container = $("#ydTrans .trans-container p")

  return {
    translation: $container
      .eq(1)
      .text()
      .replace(/<&>/g, "/")
      .replace(/<\$>/g, "%"),
  }
}

// ============ 主解析函数 ============

export function parse(html: string): WordResponse {
  const $ = cheerio.load(html)

  const type = getType($)

  if (type === "explain") {
    return {
      type: "explain",
      response: getExplainResponse($),
    }
  } else if (type === "choices") {
    return {
      type: "choices",
      response: getChoices($),
    }
  } else if (type === "non_collins_explain") {
    return {
      type: "non_collins_explain",
      response: getNonCollinsExplain($),
    }
  } else if (type === "machine_translation") {
    return {
      type: "machine_translation",
      response: getMachineTranslation($),
    }
  }

  return { type: "error" }
}
