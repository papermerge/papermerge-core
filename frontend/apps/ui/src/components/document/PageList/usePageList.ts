import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useContext, useEffect, useMemo} from "react"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocLastVersionPaginatedQuery} from "@/features/document/apiSlice"
import {preloadProgressiveImages} from "@/features/document/imageObjectsSlice"
import {
  selectCurrentNodeCType,
  selectCurrentNodeID
} from "@/features/ui/uiSlice"
import usePageImagePolling from "@/hooks/PageImagePolling"
import type {PanelMode} from "@/types"
import type {ProgressiveImageInputType} from "@/types.d/page_image"
import {skipToken} from "@reduxjs/toolkit/query"

type PageStruct = {
  pageID: string
  pageNumber: number
}

interface PageListState {
  pageSize: number
  pageNumber: number
  pages: Array<PageStruct>
}

export default function usePageList(): PageListState {
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const currentCType = useAppSelector(s => selectCurrentNodeCType(s, mode))
  const getDocID = () => {
    if (!currentNodeID) {
      return null
    }

    if (!currentCType) {
      return null
    }

    if (currentCType != "document") {
      return null
    }

    // i.e. documentID = non empty node ID of ctype 'document'
    return currentNodeID
  }
  const docID = getDocID()

  const {data} = useGetDocLastVersionPaginatedQuery(
    docID
      ? {
          doc_id: docID,
          page_number: 1,
          page_size: 5
        }
      : skipToken
  )
  //const pages = useAppSelector(s => selectAllPages(s, mode)) || []
  const pageIDs = useMemo(
    () => (data?.pages ? data.pages.map(p => p.id) : []),
    [data?.pages]
  )
  const pages = useMemo(
    () =>
      data?.pages
        ? data.pages.map(p => {
            return {pageID: p.id, pageNumber: p.number}
          })
        : [],
    [data?.pages]
  )
  const {previews} = usePageImagePolling(pageIDs, {
    pollIntervalMs: 4000,
    maxRetries: 10
  })

  useEffect(() => {
    Object.entries(previews).forEach(([pageID, previews]) => {
      const entry: ProgressiveImageInputType = {
        page_id: pageID,
        previews: previews
      }
      dispatch(preloadProgressiveImages(entry))
    })
  }, [previews])

  return {
    pageNumber: 1,
    pageSize: 5,
    pages: pages
  }
}
