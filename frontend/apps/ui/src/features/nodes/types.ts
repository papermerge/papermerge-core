import type {PaginatedArgs} from "@/types"

export type SortBy =
  | "title"
  | "ctype"
  | "created_at"
  | "created_by"
  | "updated_by"
  | "updated_at"
  | "owned_by"

export interface NodeQueryParams extends Partial<PaginatedArgs> {
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
