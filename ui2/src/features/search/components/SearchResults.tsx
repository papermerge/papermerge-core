import {useAppDispatch, useAppSelector} from "@/app/hooks"
import Pagination from "@/components/Pagination"
import {Center, Loader, Stack} from "@mantine/core"
import {useState} from "react"

import {useGetPaginatedSearchResultsQuery} from "@/features/search/apiSlice"
import {
  searchResultsLastPageSizeUpdated,
  selectSearchContentHeight,
  selectSearchLastPageSize,
  selectSearchQuery
} from "@/features/ui/uiSlice"
import ActionButtons from "./ActionButtons"
import SearchResultItems from "./SearchResultItems"
import classes from "./SearchResults.module.css"

export default function SearchResults() {
  const lastPageSize = useAppSelector(selectSearchLastPageSize)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(lastPageSize)

  const dispatch = useAppDispatch()
  const height = useAppSelector(selectSearchContentHeight)
  const query = useAppSelector(selectSearchQuery)
  const {data, isLoading, isFetching} = useGetPaginatedSearchResultsQuery({
    qs: query!,
    page_number: page,
    page_size: pageSize
  })

  const onClick = () => {}

  const onPageNumberChange = (page: number) => {
    setPage(page)
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      const pageSize = parseInt(value)

      dispatch(searchResultsLastPageSizeUpdated(pageSize))
      setPageSize(pageSize)
    }
  }

  if (isLoading || !data) {
    return (
      <Stack>
        <ActionButtons />
        <Center>
          <Loader type="bars" />
        </Center>
      </Stack>
    )
  }

  return (
    <div>
      <ActionButtons />
      <Stack
        className={classes.content}
        justify={"space-between"}
        style={{height: `${height}px`}}
      >
        <SearchResultItems onClick={onClick} />

        <Pagination
          pagination={{
            pageNumber: page,
            pageSize: pageSize,
            numPages: data?.num_pages
          }}
          onPageNumberChange={onPageNumberChange}
          onPageSizeChange={onPageSizeChange}
          lastPageSize={lastPageSize}
        />
      </Stack>
    </div>
  )
}
