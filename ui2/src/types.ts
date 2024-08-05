export type State<T> = {
  is_loading: boolean
  error: string | null
  data: T | null
}
export type DefaultHeaderType = Record<string, string>

export type OcrStatusEnum =
  | "UNKNOWN"
  | "RECEIVED"
  | "STARTED"
  | "SUCCESS"
  | "FAILURE"

export type CType = "folder" | "document"

export type CurrentNodeType = {
  id: string
  ctype: CType
  breadcrumb: Array<[string, string]> | null | undefined
}

export type CreateUser = {
  username: string
  email: string
  is_superuser: boolean
  is_active: boolean
  group_ids: number[]
}

export type NewUser = {
  username: string
  email: string
  home_folder_id: string
  inbox_folder_id: string
  scopes: Array<string>
}

export type User = NewUser & {
  id: string
}

export type UserDetails = User & {
  groups: Group[]
  scopes: string[]
  is_superuser: boolean
  is_active: boolean
}

export type UserEditableFields = {
  username: string
  email: string
  is_superuser: boolean
  is_active: boolean
  groups: string[]
}

export type UserFields = UserEditableFields & {
  id: string
}

export type SliceStateStatus = "idle" | "loading" | "succeeded" | "failed"
export type SliceStateError = undefined | string | null

export type SliceState<T> = {
  data: null | T
  status: SliceStateStatus
  error: SliceStateError
}

export type NewColoredTag = {
  name: string
  bg_color: string
  fg_color: string
  pinned: boolean
  description: string
}

export type ColoredTag = NewColoredTag & {
  id: string
}

export type ColoredTagType = {
  id: string
  name: string
  bg_color: string
  fg_color: string
  pinned: boolean
  description: string
}

export type NType = {
  /* Short version of the Node Type */
  id: string
  ctype: CType
}

export type NodeType = NType & {
  /* Full version of Node Type */
  tags: ColoredTagType[]
  accept_dropped_nodes: boolean
  is_currently_dragged: boolean
  parent_id: string | null
  title: string
  user_id: string
  update_at: string
  ocr_status: OcrStatusEnum
  ocr: boolean
  thumbnail_url: string | null
  breadcrumb: Array<[string, string]>
}

export type BreadcrumbItemType = [string, string]

export type BreadcrumbType = Array<BreadcrumbItemType>

export type FolderType = NodeType & {
  breadcrumb: BreadcrumbType
}

export type NodeSortFieldEnum = "title" | "ctype" | "created_at" | "updated_at"

export type NodeSortOrderEnum = "asc" | "desc"

export type Pagination = {
  page_number: number
  per_page: number
}

export type PaginationType = {
  numPages: number
  pageNumber: number
  pageSize: number
}

export type Sorting = {
  sort_field: NodeSortFieldEnum
  sort_order: NodeSortOrderEnum
}

export type Paginated<T> = {
  page_size: number
  page_number: number
  num_pages: number
  items: Array<T>
}

export type NodeLoaderResponseType = {
  nodes: Array<NodeType>
  parent: FolderType
  breadcrumb: BreadcrumbType
  per_page: number
  num_pages: number
  page_number: number
}

export type OCRLangType = {
  [key: string]: string
}

export type PanelMode = "main" | "secondary"
export type PanelType = "main" | "secondary"

export type NewGroup = {
  name: string
  scopes: Array<string>
}

export type Group = NewGroup & {
  id: number
}

export type GroupDetails = {
  id: number
  name: string
  scopes: Array<string>
}

export type FileItemStatus = "uploading" | "success" | "failure"

export type FileItemType = {
  status: FileItemStatus
  error: string | null
  file_name: string
  source: NodeType | null
  target: FolderType
}

export type OCRCode =
  | "ces"
  | "dan"
  | "deu"
  | "ell"
  | "eng"
  | "fin"
  | "fra"
  | "guj"
  | "heb"
  | "hin"
  | "ita"
  | "jpn"
  | "kor"
  | "lit"
  | "nld"
  | "nor"
  | "osd"
  | "pol"
  | "por"
  | "ron"
  | "san"
  | "spa"

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

export type NodeTag = {
  name: string
  bg_color: string
  fg_color: string
}

export type SearchResultNode = {
  id: string
  title: string
  entity_type: CType
  lang: string | null
  page_number: number | null
  document_id: string | null
  breadcrumb: Array<[string, string]> | null | undefined
  tags: Array<NodeTag>
}

export type PaginatedSearchResult = {
  num_pages: number
  page_number: number
  page_size: number
  items: Array<SearchResultNode>
  query: string
}
