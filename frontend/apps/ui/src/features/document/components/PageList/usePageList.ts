import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {RefObject, useEffect, useMemo} from "react"

import {docVerPaginationUpdated} from "@/features/document/documentVersSlice"
import usePageLoader from "@/features/document/hooks/usePageLoader"
import {selectClientPagesWithPreviews} from "@/features/document/imageObjectsSlice"
import {useCurrentNode, usePanelMode} from "@/hooks"
import type {ClientPage} from "@/types"
import type {UUID} from "@/types.d/common"

interface BasicPage {
  id: string
  number: number
}

interface Args {
  docVerID: UUID
  totalCount: number
  pageNumber: number
  pageSize: number
  containerRef: RefObject<HTMLDivElement | null>
}

interface PageListState {
  pages: Array<ClientPage>
  isLoading: boolean
  loadMore: boolean
  markLoadingDone: () => void
  markLoadingStart: () => void
  docVerID?: UUID
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
  docVerID,
  pageNumber,
  pageSize,
  totalCount,
  containerRef
}: Args): PageListState {
  const dispatch = useAppDispatch()
  const mode = usePanelMode()
  const {currentNodeID, currentCType} = useCurrentNode()

  const isDocument = currentNodeID && currentCType === "document"
  const docID = isDocument ? currentNodeID : null
  const {shouldLoadMore, isLoading, markLoadingStart, markLoadingDone} =
    usePageLoader(totalCount, containerRef)
  /*
  const showLoadMore = useAppSelector(s =>
    selectShowMorePages(s, docVerID, totalCount)
  )
  */

  const pages = useAppSelector(s => selectClientPagesWithPreviews(s, docVerID))

  useEffect(() => {
    dispatch(
      docVerPaginationUpdated({
        pageNumber,
        pageSize,
        docVerID: docVerID
      })
    )
  }, [pageNumber, pageSize, docVerID])

  return {
    pages,
    isLoading,
    loadMore: shouldLoadMore,
    docVerID: docVerID,
    markLoadingDone,
    markLoadingStart
  }
}
