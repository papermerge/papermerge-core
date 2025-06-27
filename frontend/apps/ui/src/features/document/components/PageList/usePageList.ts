import {useAppSelector} from "@/app/hooks"
import {RefObject} from "react"

import usePageLoader from "@/features/document/hooks/usePageLoader"
import {selectClientPagesWithPreviews} from "@/features/document/imageObjectsSlice"
import type {ClientPage} from "@/types"
import type {UUID} from "@/types.d/common"

interface Args {
  docVerID: UUID
  totalCount: number
  containerRef: RefObject<HTMLDivElement | null>
}

interface PageListState {
  pages: Array<ClientPage>
  loadMore: boolean
  docVerID?: UUID
}

export default function usePageList({
  docVerID,
  totalCount,
  containerRef
}: Args): PageListState {
  const {loadMore} = usePageLoader(totalCount, containerRef)

  const pages = useAppSelector(s => selectClientPagesWithPreviews(s, docVerID))

  return {
    pages,
    loadMore,
    docVerID: docVerID
  }
}
