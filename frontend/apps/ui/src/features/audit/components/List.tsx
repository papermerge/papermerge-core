import {useState} from "react"
import {useGetPaginatedAuditLogsQuery} from "../apiSlice"

export default function AuditLogsList() {
  const lastPageSize = 15
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(lastPageSize)

  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedAuditLogsQuery({
      page_number: page,
      page_size: pageSize
    })

  console.log(data?.items)
  return <></>
}
