import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useContext, useEffect, useMemo} from "react"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocLastVersionPaginatedQuery} from "@/features/document/apiSlice"
import {
  makeSelectPageList,
  preloadProgressiveImages,
  selectShowMorePages
} from "@/features/document/imageObjectsSlice"
import {
  selectCurrentNodeCType,
  selectCurrentNodeID
} from "@/features/ui/uiSlice"
import usePageImagePolling from "@/hooks/PageImagePolling"
import type {PanelMode} from "@/types"
import type {UUID} from "@/types.d/common"
import type {ProgressiveImageInputType} from "@/types.d/page_image"
import {skipToken} from "@reduxjs/toolkit/query"

interface BasicPage {
  id: string
  number: number
}

type PageStruct = {
  pageID: string
  pageNumber: number
}

interface Args {
  pageNumber: number
  pageSize: number
}

interface PageListState {
  pageCount: number
  pages: Array<PageStruct>
  isLoading: boolean
  showLoadMore: boolean
}

function usePollIDs(pages?: BasicPage[]) {
  const pollPageIDs = useMemo(() => {
    if (!pages) {
      return []
    }
    return pages.map(p => p.id) ?? []
  }, [pages])

  return pollPageIDs
}

function getPageNumber(pages: BasicPage[], pageID: UUID): number | undefined {
  const found = pages.find(p => p.id == pageID)

  if (found) {
    return found.number
  }
}

export default function usePageList({
  pageNumber,
  pageSize
}: Args): PageListState {
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const currentCType = useAppSelector(s => selectCurrentNodeCType(s, mode))
  const isDocument = currentNodeID && currentCType === "document"
  const docID = isDocument ? currentNodeID : null
  const {data} = useGetDocLastVersionPaginatedQuery(
    docID
      ? {
          doc_id: docID,
          page_number: pageNumber,
          page_size: pageSize
        }
      : skipToken
  )
  const showLoadMore = useAppSelector(s =>
    selectShowMorePages(s, data?.doc_ver_id, data?.total_count)
  )
  const selectPageList = useMemo(
    () => makeSelectPageList(data?.doc_ver_id),
    [data?.doc_ver_id]
  )
  const pages = useAppSelector(selectPageList)
  const pollPageIDs = usePollIDs(data?.pages)

  const {previews, isLoading} = usePageImagePolling(pollPageIDs, {
    pollIntervalMs: 4000,
    maxRetries: 10
  })

  useEffect(() => {
    if (!docID || !data?.doc_ver_id) {
      return
    }

    Object.entries(previews).forEach(([pageID, previews]) => {
      const entry: ProgressiveImageInputType = {
        page_id: pageID as UUID,
        previews: previews,
        pageNumber: getPageNumber(data.pages, pageID),
        docID: docID,
        docVerID: data.doc_ver_id
      }
      dispatch(preloadProgressiveImages(entry))
    })
  }, [previews])

  return {
    pageCount: data?.num_pages || 1,
    pages,
    isLoading,
    showLoadMore
  }
}
