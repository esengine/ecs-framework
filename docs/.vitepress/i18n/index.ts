import en from './en.json'
import zh from './zh.json'

export const messages = { en, zh }

export type Locale = 'en' | 'zh'

export function getLocaleMessages(locale: Locale) {
  return messages[locale] || messages.en
}

// Helper to get nested key value
export function t(messages: typeof en, key: string): string {
  const keys = key.split('.')
  let result: any = messages
  for (const k of keys) {
    result = result?.[k]
    if (result === undefined) return key
  }
  return result
}
