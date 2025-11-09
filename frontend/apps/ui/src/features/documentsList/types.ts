import type {ByUser, OwnedBy, PaginatedArgs, TagType} from "@/types"

export type SortBy = "name" | "created_at" | "created_by"

export interface DocumentsByCategoryQueryParams extends Partial<PaginatedArgs> {
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
  filter_include_scopes?: string
  filter_exclude_scopes?: string
}

export interface Category {
  id: string
  name: string
}

export type FlatDocument = {
  id: string
  title: string
  category: Category | null
  tags: TagType[]
  created_by: ByUser | null
  updated_by: ByUser | null
  owned_by: OwnedBy
}

type CustomFieldValueData = {
  raw?: any
  sortable?: boolean
  metadata?: Record<string, any>
}

export type CustomField = {
  id: string
  name: string
  type_handler: string
  config: Record<string, any>
}

type CustomFieldValue = {
  value: CustomFieldValueData
  value_text?: string
  value_numeric?: number
  value_datetime?: string
  value_boolean?: boolean
}

export type CustomFieldRow = {
  custom_field: CustomField
  custom_field_value: CustomFieldValue
}

export interface DocumentListItem {
  id: string
  title: string
  category: Category
  tags: Tag[]
  custom_fields: CustomFieldRow[]
  created_at: string
  updated_at: string
  created_by: ByUser
  updated_by: ByUser
}
