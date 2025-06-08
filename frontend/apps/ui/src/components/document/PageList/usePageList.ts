import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useContext, useEffect, useMemo} from "react"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocLastVersionPaginatedQuery} from "@/features/document/apiSlice"
import {
  preloadProgressiveImages,
  selectPageListIDs
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
  const pollPageIDs = useMemo(
    () => (data?.pages ? data.pages.map(p => p.id) : []),
    [data?.pages]
  )
  const {previews} = usePageImagePolling(pollPageIDs, {
    pollIntervalMs: 4000,
    maxRetries: 10
  })

  const pageIDs = useAppSelector(s => selectPageListIDs(s, data?.doc_ver_id))
  const pages = useMemo(
    () =>
      data?.pages
        ? data.pages
            .filter(p => pageIDs.includes(p.id))
            .map(p => {
              return {pageID: p.id, pageNumber: p.number}
            })
        : [],
    [data?.pages, pageIDs]
  )

  useEffect(() => {
    Object.entries(previews).forEach(([pageID, previews]) => {
      if (docID && data && data.pages.length > 0) {
        const entry: ProgressiveImageInputType = {
          page_id: pageID as UUID,
          previews: previews,
          docID: docID,
          docVerID: data.doc_ver_id
        }
        dispatch(preloadProgressiveImages(entry))
      }
    })
  }, [previews])

  return {
    pageNumber: 1,
    pageSize: 5,
    pages: pages
  }
}
