import {useAppSelector} from "@/app/hooks"
import type {ImageSize} from "@/types.d/common"
import {RefObject} from "react"

import usePageLoader from "@/features/document/hooks/usePageLoader"
import {selectClientPagesWithPreviews} from "@/features/document/imageObjectsSlice"
import type {ClientPage} from "@/types"
import type {UUID} from "@/types.d/common"

interface Args {
  docVerID: UUID
  totalCount: number
  containerRef: RefObject<HTMLDivElement | null>
  size?: ImageSize
}

interface PageListState {
  pages: Array<ClientPage>
  loadMore: boolean
  docVerID?: UUID
}

export default function usePageList({
  docVerID,
  totalCount,
  containerRef,
  size = "md"
}: Args): PageListState {
  const {loadMore} = usePageLoader(totalCount, containerRef)

  const pages = useAppSelector(s =>
    selectClientPagesWithPreviews(s, docVerID, size)
  )

  return {
    pages,
    loadMore,
    docVerID: docVerID
  }
}
