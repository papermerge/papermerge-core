import {apiSlice} from "@/features/api/slice"
import type {Paginated, PaginatedArgs} from "@/types"
import type {AuditLog} from "./types"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export const apiSliceWithAuditLogs = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedAuditLogs: builder.query<
      Paginated<AuditLog>,
      PaginatedArgs | void
    >({
      query: ({
        page_number = 1,
        page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES
      }: PaginatedArgs) =>
        `/audit-logs/?page_number=${page_number}&page_size=${page_size}`,
      providesTags: (
        result = {page_number: 1, page_size: 1, num_pages: 1, items: []},
        _error,
        _arg
      ) => [
        "AuditLog",
        ...result.items.map(({id}) => ({type: "AuditLog", id}) as const)
      ]
    }),
    getAuditLog: builder.query<AuditLog, string>({
      query: auditLogID => `/audit-logs/${auditLogID}`,
      providesTags: (_result, _error, arg) => [{type: "AuditLog", id: arg}]
    })
  })
})

export const {useGetPaginatedAuditLogsQuery, useGetAuditLogQuery} =
  apiSliceWithAuditLogs
