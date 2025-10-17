import {useAppSelector} from "@/app/hooks"
import {useGetPaginatedAuditLogsQuery} from "@/features/audit/storage/api"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelFilters,
  selectPanelPageNumber,
  selectPanelPageSize,
  selectPanelSorting
} from "@/features/ui/panelRegistry"
import type {AuditLogQueryParams} from "../types"

type SortBy =
  | "timestamp"
  | "operation"
  | "table_name"
  | "username"
  | "record_id"
  | "user_id"
  | "id"

function useQueryParams(): AuditLogQueryParams {
  const {panelId} = usePanel()

  const pageSize = useAppSelector(s => selectPanelPageSize(s, panelId)) || 10
  const pageNumber = useAppSelector(s => selectPanelPageNumber(s, panelId)) || 1
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))
  const filters = useAppSelector(s => selectPanelFilters(s, panelId))
  const column = sorting?.column as SortBy | undefined

  const tableNames = filters.tableNames
  const operations = filters.operations
  const timestamp = filters.timestamp
  const usernames = filters.usernames
  const free_text = filters.freeText

  const queryParams: AuditLogQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined,
    filter_table_name: tableNames?.join(","),
    filter_operation: operations?.join(","),
    filter_username: usernames?.join(","),
    filter_timestamp_from: timestamp?.from || undefined,
    filter_timestamp_to: timestamp?.to || undefined,
    filter_free_text: free_text
  }

  return queryParams
}

export default function useAuditLogTable() {
  const queryParams = useQueryParams()

  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedAuditLogsQuery(queryParams)

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    queryParams
  }
}
