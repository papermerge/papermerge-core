import type {PaginatedArgs} from "@/types"

export type SortBy = "name" | "created_at" | "created_by"

export interface UserQueryParams extends Partial<PaginatedArgs> {
  page_number?: number
  page_size?: number

  // Sorting
  sort_by?: SortBy
  sort_direction?: "asc" | "desc"

  // Filters
  filter_username?: string
  filter_created_by?: string
  filter_created_at?: string // ISO string format
  filter_free_text?: string
  filter_with_roles?: string
  filter_without_roles?: string
  filter_with_groups?: string
  filter_without_groups?: string
  filter_with_scopes?: string
  filter_without_scopes?: string
}

export interface ByUser {
  id: string
  username: string
}

export interface UserItem {
  id: string
  username: string
  email: string
  created_at: string
  updated_at: string
  created_by: ByUser
  updated_by: ByUser
}
