import {NodeType} from "@/types"

export type UploadFileInput = {
  file: File
  target_id: string
  ocr: boolean
  lang: string
}

export type UploadFileOutput = {
  success: boolean
  node?: NodeType
  error?: string
}
