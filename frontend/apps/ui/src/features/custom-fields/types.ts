import type {ByUser, OwnedBy, PaginatedArgs} from "@/types"

export type SortBy =
  | "name"
  | "created_at"
  | "created_by"
  | "type_handler"
  | "owned_by"

export type CustomFieldType =
  | "date"
  | "text"
  | "boolean"
  | "int"
  | "float"
  | "monetary"
  | "yearmonth"
  | "select"
  | "multiselect"

export interface CustomFieldQueryParams extends Partial<PaginatedArgs> {
  page_number?: number
  page_size?: number

  // Sorting
  sort_by?: SortBy
  sort_direction?: "asc" | "desc"

  // Filters
  filter_name?: string
  filter_created_by?: string
  filter_created_at?: string // ISO string format
  filter_free_text?: string
  filter_types?: string
}

export interface CustomFieldItem {
  id: string
  name: string
  type_handler: CustomFieldType
  config: Record<string, any>
  created_at: string
  updated_at: string
  created_by: ByUser
  updated_by: ByUser
  owned_by: OwnedBy
}
