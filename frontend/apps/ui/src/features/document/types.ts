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
