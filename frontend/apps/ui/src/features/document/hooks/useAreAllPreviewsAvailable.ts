import {useAppSelector} from "@/app/hooks"
import {selectAreAllPreviewsAvailable} from "@/features/document/store/imageObjectsSlice"
import type {BasicPage, DocumentVersion} from "@/features/document/types"
import type {ClientDocumentVersion} from "@/types"
import {ImageSize} from "@/types.d/common"
import {useMemo} from "react"

interface Args {
  docVer?: ClientDocumentVersion | DocumentVersion
  pageNumber: number
  pageSize: number
  imageSize: ImageSize
}

function getPagesToCheck(
  pageNumber: number,
  pageSize: number,
  docVer?: ClientDocumentVersion | DocumentVersion
): Array<BasicPage> {
  const result: Array<BasicPage> = []
  const sortedPages = docVer?.pages.slice().sort((a, b) => a.number - b.number)
  const totalPageCount = docVer?.pages.length

  const first = pageSize * (pageNumber - 1) + 1
  let last = pageSize * pageNumber

  if (!sortedPages) {
    return []
  }

  if (!totalPageCount) {
    return []
  }

  if (first > totalPageCount) {
    return []
  }

  if (last > totalPageCount) {
    last = totalPageCount
  }

  for (let i = first; i <= last; i++) {
    result.push(sortedPages[i - 1])
  }

  return result
}

export default function useAreAllPreviewsAvailable({
  docVer,
  pageNumber,
  pageSize,
  imageSize
}: Args): boolean {
  const pagesToCheck = useMemo(
    () => getPagesToCheck(pageNumber, pageSize, docVer),
    [docVer, pageNumber, pageSize]
  )

  return useAppSelector(state =>
    selectAreAllPreviewsAvailable(state, pagesToCheck, imageSize, docVer?.id)
  )
}
