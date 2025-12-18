import {
  CategoryOperator,
  CreatedAtFilter,
  TagOperator,
  UpdatedAtFilter
} from "./microcomp/types"

export type DateTypeOperator = ">=" | ">" | "<" | "<=" | "!=" | "="
export type NumericTypeOperator = ">=" | ">" | "<" | "<=" | "!=" | "="

export type StringTypeOperator =
  | "contains"
  | "icontains"
  | "eq"
  | "="
  | "not"
  | "!="
  | "startsWith"
  | "endsWith"
export type CFListTypeOperator = "any" | "not" | "all" | "eq" | "=" | "!="

export type CustomFieldOperatorType =
  | DateTypeOperator
  | NumericTypeOperator
  | StringTypeOperator

export interface FullTextSearchFilter {
  terms: string[]
}

export interface CategoryFilter {
  values: string[]
  operator: CategoryOperator
}

export interface TagFilter {
  values: string[]
  operator: TagOperator
}

export interface CustomFieldFilter {
  field_name: string
  operator: CustomFieldOperatorType
  value: string | number | boolean
}

export interface SearchFilters {
  fts?: FullTextSearchFilter
  categories?: CategoryFilter[]
  tags?: TagFilter[]
  custom_fields?: CustomFieldFilter[]
  created_at?: CreatedAtFilter[]
  updated_at?: UpdatedAtFilter[]
}

export interface SearchQueryParams {
  filters: SearchFilters
  lang?: string
  document_type_id?: string
  page_size?: number
  page_number?: number
  sort_by?: string
  sort_direction?: "asc" | "desc"
}
