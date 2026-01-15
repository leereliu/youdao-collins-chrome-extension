import type { UserOptions } from "./types"
import { DEFAULT_OPTIONS } from "./types"

/**
 * 获取用户设置
 */
export async function getOptions(): Promise<UserOptions> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_OPTIONS, (result) => {
      resolve(result as UserOptions)
    })
  })
}

/**
 * 保存用户设置
 */
export async function setOptions(options: Partial<UserOptions>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(options, resolve)
  })
}

/**
 * 监听设置变化
 */
export function onOptionsChange(
  callback: (newOptions: UserOptions, oldOptions: UserOptions) => void
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName !== "sync") return

    const optionKeys = Object.keys(DEFAULT_OPTIONS) as (keyof UserOptions)[]
    const hasRelevantChanges = optionKeys.some((key) => key in changes)

    if (hasRelevantChanges) {
      // 构建新旧选项对象
      const newOptions: UserOptions = {
        translateMode: changes.translateMode?.newValue ?? DEFAULT_OPTIONS.translateMode,
        modifierKey: changes.modifierKey?.newValue ?? DEFAULT_OPTIONS.modifierKey,
        enableShanbay: changes.enableShanbay?.newValue ?? DEFAULT_OPTIONS.enableShanbay
      }

      const oldOptions: UserOptions = {
        translateMode: changes.translateMode?.oldValue ?? DEFAULT_OPTIONS.translateMode,
        modifierKey: changes.modifierKey?.oldValue ?? DEFAULT_OPTIONS.modifierKey,
        enableShanbay: changes.enableShanbay?.oldValue ?? DEFAULT_OPTIONS.enableShanbay
      }

      callback(newOptions, oldOptions)
    }
  }

  chrome.storage.onChanged.addListener(listener)

  // 返回取消监听的函数
  return () => {
    chrome.storage.onChanged.removeListener(listener)
  }
}
