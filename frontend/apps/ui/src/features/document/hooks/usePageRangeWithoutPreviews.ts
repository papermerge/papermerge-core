import { useAppSelector } from "@/app/hooks"
import type { DocumentVersion } from "@/features/document/types"
import { useEffect, useState } from "react"
import { selectExistingPreviewsPageNumbers } from "../imageObjectsSlice"


interface Args {
  docVer?: DocumentVersion
  pageNumber: number
  pageSize: number
}

interface State {
  firstPage: number | null
  lastPage: number | null
}

function getRange(pageNumber: number, pageSize: number, totalPageCount: number): Array<number> {
  const result: Array<number> = []
  const first = pageSize * (pageNumber - 1) + 1;
  let last = pageSize * pageNumber + 1;

  if (last > totalPageCount) {
    last = totalPageCount
  }
  for (let i = first; i < last; i++) {
    result.push(i)
  }

  return result
}


export default function usePageRangeWithoutPreviews({ docVer, pageNumber, pageSize }: Args): State {
  const pageNumbersWithPreviews = useAppSelector(s => selectExistingPreviewsPageNumbers(s, docVer?.id))
  const [firstPage, setFirstPage] = useState<number | null>(null)
  const [lastPage, setLastPage] = useState<number | null>(null)

  useEffect(() => {
    if (!docVer) {
      return
    }
    const range = getRange(pageNumber, pageSize, docVer.pages.length)
    let previewsForRangeAvailable = range.every(num => pageNumbersWithPreviews.includes(num))
    if (!previewsForRangeAvailable) {
      setFirstPage(range[0])
      setLastPage(range[range.length - 1])
    }
  }, [docVer?.id, pageNumber, pageSize])


  return { firstPage, lastPage }
}
