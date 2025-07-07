import {useAppSelector} from "@/app/hooks"
import type {ImageSize} from "@/types.d/common"
import {RefObject} from "react"

import usePageLoader from "@/features/document/hooks/usePageLoader"
import {selectClientPagesWithPreviews} from "@/features/document/store/imageObjectsSlice"
import type {ClientPage} from "@/types"
import type {UUID} from "@/types.d/common"
import useCurrentPageNumber from "../../hooks/useCurrentPageNumber"

interface Args {
  docVerID?: UUID
  totalCount?: number
  containerRef: RefObject<HTMLDivElement | null>
  size?: ImageSize
  cssSelector?: string
}

interface PageListState {
  pages: Array<ClientPage>
  loadMore: boolean
  currentPageNumber: number
  docVerID?: UUID
}

export default function usePageList({
  docVerID,
  totalCount,
  containerRef,
  size = "md",
  cssSelector = ".page"
}: Args): PageListState {
  const {loadMore} = usePageLoader({
    containerRef,
    cssSelector,
    totalPageCount: totalCount
  })
  const {currentPageNumber} = useCurrentPageNumber({
    containerRef,
    cssSelector,
    initialPageNumber: 1
  })
  const pages = useAppSelector(s =>
    selectClientPagesWithPreviews(s, size, docVerID)
  )

  return {
    pages,
    loadMore,
    docVerID: docVerID,
    currentPageNumber
  }
}
