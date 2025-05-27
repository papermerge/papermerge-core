import type {BreadcrumbType} from "./breadcrumb"
import type {OCRCode, OcrStatusEnum} from "./ocr"

export type PageType = {
  id: string
  document_version_id: string
  jpg_url: string | null
  svg_url: string | null
  lang: string
  number: number
  text: string
}

export type DocumentVersion = {
  id: string
  document_id: string
  download_url: string
  file_name: string
  lang: OCRCode
  number: number
  page_count: number
  pages: Array<PageType>
  short_description: string
  size: number
}

export type DocumentType = {
  id: string
  ctype: "document"
  title: string
  breadcrumb: BreadcrumbType
  ocr: boolean
  ocr_status: OcrStatusEnum
  thumbnail_url: string
  versions: Array<DocumentVersion>
  parent_id: string | null
  user_id: string
  updated_at: string
}
