import {ImageSize} from "@/types.d/common"
import type {BreadcrumbType} from "@/types/breadcrumb"
import type {OCRCode, OcrStatusEnum} from "@/types/ocr"

export type BasicPage = {
  id: string
  number: number
}

export type DocVersItem = {
  id: string
  number: number
  short_description: string
}

export type DocVersList = Array<DocVersItem>

export type DLVPaginatedArgsOutput = {
  doc_ver_id: string
  lang: string
  number: number
  file_name: string
  pages: Array<BasicPage>
  page_size: number
  page_number: number
  num_pages: number
  total_count: number
}

export interface GeneratePreviewInputType {
  docVer: DocumentVersion
  size: ImageSize
  pageSize: number
  pageNumber: number
  pageTotal: number
}

export type BasicPageType = {
  id: string
  number: number
}

export type PageType = BasicPageType & {
  document_version_id: string
  lang: string
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
  pages: Array<BasicPageType>
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
