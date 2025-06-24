import {useAppSelector} from "@/app/hooks"
import type {BasicPage, DocumentVersion} from "@/features/document/types"
import {useMemo} from "react"
import {selectAreAllPreviewsAvailable} from "../imageObjectsSlice"

interface Args {
  docVer: DocumentVersion
  pageNumber: number
  pageSize: number
}

function getPagesToCheck(
  docVer: DocumentVersion,
  pageNumber: number,
  pageSize: number
): Array<BasicPage> {
  const result: Array<BasicPage> = []

  const first = pageSize * (pageNumber - 1) + 1
  const totalPageCount = docVer.pages.length
  let last = pageSize * pageNumber

  if (first >= totalPageCount) {
    return []
  }

  if (last > totalPageCount) {
    last = totalPageCount
  }

  for (let i = first; i < last; i++) {
    result.push(docVer.pages[i])
  }

  return result
}

export default function useAreAllPreviewsAvailable({
  docVer,
  pageNumber,
  pageSize
}: Args): boolean {
  const pagesToCheck = useMemo(
    () => getPagesToCheck(docVer, pageNumber, pageSize),
    [docVer, pageNumber, pageSize]
  )
  const areAllPagesLoaded = useAppSelector(
    selectAreAllPreviewsAvailable(pagesToCheck, docVer.id)
  )

  return areAllPagesLoaded
}
