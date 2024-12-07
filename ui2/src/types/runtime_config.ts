import {OCRCode} from "@/types"

export type RuntimeConfig = {
  ocr__lang_codes: string
  ocr__default_lang_code: OCRCode
  ocr__automatic: boolean
}

declare global {
  interface Window {
    __PAPERMERGE_RUNTIME_CONFIG__: RuntimeConfig
  }
}
