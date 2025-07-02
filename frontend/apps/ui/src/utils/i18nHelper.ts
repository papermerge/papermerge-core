// i18nHelper.ts
import i18n from "i18next"

export const t = (key: string, options?: Record<string, any>) => {
  return i18n.t(key, options)
}
