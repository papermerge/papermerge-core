import type {CustomField, OwnedBy} from "@/types"

export type NewDocType = {
  name: string
  path_template?: string
  custom_field_ids: Array<string>
  group_id?: string
}

export type DocType = {
  id: string
  name: string
  path_template?: string
  custom_fields: Array<CustomField>
  group_name?: string
  group_id?: string
}

export type DocTypeGroupedItem = {
  id: string
  name: string
}

export type DocTypeGrouped = {
  name: string
  items: Array<DocTypeGroupedItem>
}

export type DocTypeUpdate = {
  id: string
  name: string
  custom_field_ids: Array<string>
  group_id?: string
}

export type DocumentTypeListColumnName = "name" | "group_name"
export type DocumentTypeSortByInput =
  | "name"
  | "-name"
  | "group_name"
  | "-group_name"

import type {PaginatedArgs} from "@/types"

export type SortBy = "name" | "created_at" | "created_by"

export interface DocumentTypeQueryParams extends Partial<PaginatedArgs> {
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
  filter_with_users?: string
  filter_without_users?: string
}

export interface ByUser {
  id: string
  username: string
}

export interface DocumentTypeItem {
  id: string
  name: string
  created_at: string
  updated_at: string
  created_by: ByUser
  updated_by: ByUser
  owned_by: OwnedBy
}

export interface DocumentTypeDetails {
  id: string
  name: string
  path_template: string
  custom_fields: Array<CustomField>
  created_at: string
  updated_at: string
  created_by: ByUser
  updated_by: ByUser
  owned_by: OwnedBy
}
