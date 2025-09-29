import type {PaginatedArgs} from "@/types"

export type SortBy = "name" | "created_at" | "created_by"

export interface TagQueryParams extends Partial<PaginatedArgs> {
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
}

export interface ByUser {
  id: string
  username: string
}

export interface TagItem {
  id: string
  name: string
  created_at: string
  updated_at: string
  created_by: ByUser
  updated_by: ByUser
}
