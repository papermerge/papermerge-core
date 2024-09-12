import type {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import Pagination from "@/components/Pagination"
import {Stack} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"

import {selectSearchContentHeight} from "@/features/ui/uiSlice"
import {
  fetchPaginatedSearchResults,
  selectSearchPageNumber,
  selectSearchPageSize,
  selectSearchPagination,
  selectSearchQuery
} from "@/slices/dualPanel/dualPanel"
import ActionButtons from "./ActionButtons"
import SearchResultItems from "./SearchResultItems"
import classes from "./SearchResults.module.css"

export default function SearchResults() {
  const dispatch = useDispatch()
  const height = useSelector((state: RootState) =>
    selectSearchContentHeight(state)
  )
  const pagination = useSelector((state: RootState) =>
    selectSearchPagination(state)
  )
  const query = useSelector((state: RootState) => selectSearchQuery(state))
  const pageSize = useSelector((state: RootState) =>
    selectSearchPageSize(state)
  )
  const pageNumber = useSelector((state: RootState) =>
    selectSearchPageNumber(state)
  )

  const onClick = () => {}

  const onPageNumberChange = (page: number) => {
    dispatch(
      fetchPaginatedSearchResults({
        query: query || "",
        page_number: page,
        page_size: pageSize || PAGINATION_DEFAULT_ITEMS_PER_PAGES
      })
    )
  }

  const onPageSizeChange = (value: string | null) => {
    let psize = PAGINATION_DEFAULT_ITEMS_PER_PAGES

    if (value) {
      psize = parseInt(value)
    }

    dispatch(
      fetchPaginatedSearchResults({
        query: query || "",
        page_number: pageNumber || 1,
        page_size: psize
      })
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
          pagination={pagination}
          onPageNumberChange={onPageNumberChange}
          onPageSizeChange={onPageSizeChange}
          lastPageSize={PAGINATION_DEFAULT_ITEMS_PER_PAGES}
        />
      </Stack>
    </div>
  )
}
