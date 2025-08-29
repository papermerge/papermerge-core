import {useAppSelector} from "@/app/hooks"
import {
  selectAuditLogOperationFilterValue,
  selectAuditLogPageNumber,
  selectAuditLogPageSize,
  selectAuditLogSorting,
  selectAuditLogTableNameFilterValue,
  selectAuditLogTimestampFilterValue
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {useGetPaginatedAuditLogsQuery} from "../apiSlice"
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
  const mode = usePanelMode()
  const tableNames = useAppSelector(s =>
    selectAuditLogTableNameFilterValue(s, mode)
  )
  const operations = useAppSelector(s =>
    selectAuditLogOperationFilterValue(s, mode)
  )
  const timestamp = useAppSelector(s =>
    selectAuditLogTimestampFilterValue(s, mode)
  )
  const pageSize = useAppSelector(s => selectAuditLogPageSize(s, mode)) || 10
  const pageNumber = useAppSelector(s => selectAuditLogPageNumber(s, mode)) || 1
  const sorting = useAppSelector(s => selectAuditLogSorting(s, mode))
  const column = sorting?.column as SortBy | undefined

  const queryParams: AuditLogQueryParams = {
    page_size: pageSize,
    page_number: pageNumber,
    sort_by: column,
    sort_direction: sorting?.direction || undefined,
    filter_table_name: tableNames?.join(","),
    filter_operation: operations?.join(","),
    filter_timestamp_from: timestamp?.from || undefined,
    filter_timestamp_to: timestamp?.to || undefined
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
