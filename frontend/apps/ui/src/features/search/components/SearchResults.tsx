import {useAppDispatch, useAppSelector} from "@/app/hooks"
import Pagination from "@/components/Pagination"
import {Center, Loader, Stack} from "@mantine/core"
import {useEffect, useState} from "react"

import {
  useGetNodesQuery,
  useGetPaginatedSearchResultsQuery
} from "@/features/search/apiSlice"
import {
  currentNodeChanged,
  searchResultsLastPageSizeUpdated,
  selectOpenResultItemInOtherPanel,
  selectSearchContentHeight,
  selectSearchLastPageSize,
  selectSearchQuery,
  viewerCurrentPageUpdated
} from "@/features/ui/uiSlice"
import {NType, SearchResultNode} from "@/types"
import {skipToken} from "@reduxjs/toolkit/query"
import ActionButtons from "./ActionButtons"
import SearchResultItems from "./SearchResultItems"
import classes from "./SearchResults.module.css"

export default function SearchResults() {
  const lastPageSize = useAppSelector(selectSearchLastPageSize)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(lastPageSize)
  const [nodeIDs, setNodeIDs] = useState<string[] | null>(null)

  const dispatch = useAppDispatch()
  const height = useAppSelector(selectSearchContentHeight)
  const query = useAppSelector(selectSearchQuery)
  const openItemInOtherPanel = useAppSelector(selectOpenResultItemInOtherPanel)
  const {data, isLoading} = useGetPaginatedSearchResultsQuery({
    qs: query!,
    page_number: page,
    page_size: pageSize
  })
  /* Nodes details are fetched here, but used
  in different place (in `searchResultItem` via selector) */
  const {data: _extraData} = useGetNodesQuery(nodeIDs ? nodeIDs : skipToken)

  useEffect(() => {
    const nonEmptyItems: SearchResultNode[] = data?.items || []
    if (nonEmptyItems.length > 0) {
      const newNodeIDs = nonEmptyItems.map(n =>
        n.entity_type == "folder" ? n.id : n.document_id
      ) as string[]

      if (newNodeIDs.length > 0) {
        setNodeIDs(newNodeIDs)
      } else {
        setNodeIDs(null)
      }
    }
  }, [data?.items])

  const onClick = (node: NType, page?: number) => {
    if (openItemInOtherPanel) {
      dispatch(
        currentNodeChanged({id: node.id, ctype: node.ctype, panel: "secondary"})
      )
      if (node.ctype == "document" && page) {
        // scroll into page
        dispatch(
          viewerCurrentPageUpdated({
            pageNumber: page,
            panel: "secondary"
          })
        )
      }
    } else {
      dispatch(
        currentNodeChanged({id: node.id, ctype: node.ctype, panel: "main"})
      )
      if (node.ctype == "document" && page) {
        // scroll into page
        dispatch(viewerCurrentPageUpdated({pageNumber: page, panel: "main"}))
      }
    }
  }

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
        <SearchResultItems items={data.items} onClick={onClick} />

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
