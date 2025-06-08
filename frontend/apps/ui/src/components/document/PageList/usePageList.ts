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

interface BasicPage {
  id: string
  number: number
}

type PageStruct = {
  pageID: string
  pageNumber: number
}

interface PageListState {
  pageSize: number
  pageNumber: number
  pages: Array<PageStruct>
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

function usePageStruct(pageIDs: UUID[], pages?: BasicPage[]): PageStruct[] {
  const result = useMemo<PageStruct[]>(() => {
    if (!pages) {
      return []
    }
    const filteredPages = pages.filter((p: BasicPage) => pageIDs.includes(p.id))

    return filteredPages.map((p: BasicPage) => ({
      pageID: p.id,
      pageNumber: p.number
    }))
  }, [pages, pageIDs])

  return result
}

export default function usePageList(): PageListState {
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
          page_number: 1,
          page_size: 5
        }
      : skipToken
  )
  const pageIDs = useAppSelector(s => selectPageListIDs(s, data?.doc_ver_id))
  const pages = usePageStruct(pageIDs, data?.pages)

  const pollPageIDs = usePollIDs(data?.pages)

  const {previews} = usePageImagePolling(pollPageIDs, {
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
        docID: docID,
        docVerID: data.doc_ver_id
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
