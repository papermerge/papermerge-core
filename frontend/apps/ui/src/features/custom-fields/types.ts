import type {ByUser, OwnedBy, PaginatedArgs} from "@/types"

export type SortBy = "name" | "created_at" | "created_by"

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
  filter_with_users?: string
  filter_without_users?: string
}

export interface CustomFieldItem {
  id: string
  name: string
  created_at: string
  updated_at: string
  created_by: ByUser
  updated_by: ByUser
  owned_by: OwnedBy
}
