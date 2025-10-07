import type {PaginatedArgs} from "@/types"

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

export interface ByUser {
  id: string
  username: string
}

type CustomFieldValueData = {
  raw?: any
  sortable?: boolean
  metadata?: Record<string, any>
}

type CustomField = {
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

type CustomFieldRow = {
  custom_field: CustomField
  custom_field_value: CustomFieldValue
}

export interface DocumentByCategoryItem {
  id: string
  title: string
  custom_fields: CustomFieldRow[]
  created_at: string
  updated_at: string
  created_by: ByUser
  updated_by: ByUser
}
