import type {Group} from "@/types.d/groups"
import {DocumentType} from "./features/document/types"

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
  group_ids: string[]
  role_ids: string[]
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
  roles: Role[]
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
  roles: string[]
}

export type UserUpdate = {
  id: string
  username: string
  email: string
  is_superuser: boolean
  is_active: boolean
  group_ids: string[]
  role_ids: string[]
}

export type ChangePassword = {
  userId: string
  password: string
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
  group_id?: string
  group_name?: string
}

export type ColoredTagUpdate = Pick<
  ColoredTag,
  | "id"
  | "name"
  | "bg_color"
  | "fg_color"
  | "description"
  | "pinned"
  | "group_id"
>

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
  group_id?: string
  group_name?: string
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
  user_id?: string
  group_id?: string
  update_at: string
  ocr_status: OcrStatusEnum
  ocr: boolean
  thumbnail_url: string | null
  thumbnail_preview_error: string | null
  breadcrumb: Array<[string, string]>
  document_type_id?: string
  is_shared: boolean
  // node is top most level shared node
  // i.e. for current user it looks like root
  // this flag is used to determine the root of breadcrumb of the browsed shared nodes
  is_shared_root?: boolean
}

export type EntityWithTags = {
  id: string
  tags: Array<NodeTag>
}

export type BreadcrumbItemType = [string, string]

export type BreadcrumbType = Array<BreadcrumbItemType>

export type FolderType = NodeType & {
  breadcrumb: BreadcrumbType
}

export type NodeSortFieldEnum = "title" | "ctype" | "created_at" | "updated_at"

export type NodeSortOrderEnum = "asc" | "desc"
export type OrderType = "asc" | "desc"

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

export interface EditEntityTitle {
  id: string
  title: string
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

export type NewRole = {
  name: string
  scopes: Array<string>
}

export type Role = NewRole & {
  id: string
}

export type RoleDetails = {
  id: string
  name: string
  scopes: Array<string>
}

export type RoleUpdate = Pick<Role, "id" | "name" | "scopes">

export type CustomFieldDataType =
  | "text"
  | "date"
  | "boolean"
  | "int"
  | "float"
  | "monetary"
  | "yearmonth"

export type NewCustomField = {
  name: string
  type: CustomFieldDataType
  extra_data?: string
  group_id?: string
  group_name?: string
}

export type CustomField = NewCustomField & {
  id: string
}

export type CustomFieldUpdate = Pick<
  CustomField,
  "id" | "name" | "type" | "extra_data"
>

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
  | "kaz"
  | "rus"

export type PageType = {
  id: string
  lang: string
  number: number
}

// page and rotation operation
export type PageAndRotOp = {
  page: PageType
  angle: number // rotation degree, can be positive or negative
}

export type DocVerShort = {
  id: string
  document_id: string
  download_url: string
  file_name: string
  lang: OCRCode
  number: number
  page_count: number
  short_description: string
  size: number
}

export interface ClientPage {
  id: string
  angle: number
  /* Page number as it came from the server*/
  number: number
}

export interface ClientDocumentVersion {
  id: string
  lang: string
  number: number
  file_name: string
  document_id: string
  short_description: string
  size: number
  pages: Array<ClientPage>
  pagination: Pagination
  thumbnailsPagination: Pagination
  /* Page array in same order as received from server side.
  Also angle here is set to 0. `initial_pages` attribute
  is used to restore `pages` attribute to their initial value  */
  initial_pages: Array<ClientPage>
}

export type NodeTag = {
  name: string
  bg_color: string
  fg_color: string
}

export type DocumentTag = NodeTag

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

export type DroppedThumbnailPosition = "before" | "after"
export type ThumbnailPageDroppedArgs = {
  sources: PageType[]
  target: PageType
  position: DroppedThumbnailPosition
}

export type BooleanString = "true" | "false"

export type PaginatedArgs = {
  page_number?: number
  page_size?: number
  sort_by?: string
  filter?: string
}

export type Coord = {
  x: number
  y: number
}

export type TransferStrategyType = "mix" | "replace"

export type ExtractStrategyType = "one-page-per-doc" | "all-pages-in-one-doc"

export interface ServerErrorType {
  status: number
  data: {
    detail: string
  }
}

export interface ExtractPagesResponse {
  source: null | DocumentType
  target: Array<NodeType>
}

export type SortMenuColumn = "title" | "ctype" | "created_at" | "updated_at"
export type SortMenuDirection = "az" | "za"
export type ViewOption = "tile" | "list" | "document-type"

export interface CustomFieldValueType {
  custom_field_id: string
  value: string
}

export interface AddCustomFieldValueType {
  custom_field_id: string
  value: string
}

export interface UpdateCustomFieldValueType {
  custom_field_value_id: string
  value: string
}

export type CFV = {
  custom_field_id: string
  custom_field_value_id?: string
  document_id: string
  document_type_id: string
  name: string
  type: string
  extra_data?: string
  value: string | boolean
}

export type DocumentCFV = {
  id: string
  title: string
  document_type_id: string
  thumbnail_url: string
  custom_fields: Array<[string, string]>
}

export type CurrencyType =
  | "CHF"
  | "CZK"
  | "DKK"
  | "EUR"
  | "GBP"
  | "HUF"
  | "ISK"
  | "NOK"
  | "USD"
  | "RON"
  | "RUB"
  | "SEK"
  | "THB"
  | "TL"

export type ServerNotifType = "document_moved" | "documents_moved"
export type ServerNotifDocumentsMoved = {
  document_id: string
  source_folder_ids: Array<string>
  target_folder_ids: Array<string>
  document_type_id: string
  document_type_name: string
  count: number
}
export type ServerNotifDocumentMoved = {
  source_folder_id: string
  target_folder_id: string
  document_id: string
  old_document_title: string
  new_document_title: string
}
export type ServerNotifPayload =
  | ServerNotifDocumentMoved
  | ServerNotifDocumentsMoved

export type I18nLangType = {
  code: string
  name: string
}
/* Used by tranfer pages (from one document
to another) action */
export type MovePagesType = {
  body: {
    source_page_ids: string[]
    target_page_id: string
    move_strategy: TransferStrategyType
  }
  sourceDocID: string
  targetDocID: string
  sourceDocParentID: string
}

export type MovePagesReturnType = {
  source?: DocumentType
  target: DocumentType
}

/* Used by extract pages (from the document
to commander) action */
export type ExtractPagesType = {
  body: {
    source_page_ids: string[]
    target_folder_id: string
    strategy: ExtractStrategyType
    title_format: string
  }
  sourceDocID: string
  sourceDocParentID: string
}

export type ExtractPagesReturnType = {
  source?: DocumentType
  target: DocumentType
}
