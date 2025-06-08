import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {selectBestImageByPageId} from "@/features/document/selectors"
import {
  selectDocumentCurrentPage,
  selectZoomFactor
} from "@/features/ui/uiSlice"
import {PanelMode} from "@/types"
import {RefObject, useContext, useEffect, useRef} from "react"

interface Args {
  pageNumber: number
  pageID: string
}

interface PageState {
  ref: RefObject<HTMLImageElement | null>
  imageURL: string | undefined
  isLoading: boolean
}

export default function usePage({pageNumber, pageID}: Args): PageState {
  const mode: PanelMode = useContext(PanelContext)
  const currentPage = useAppSelector(s => selectDocumentCurrentPage(s, mode))
  const targetRef = useRef<HTMLImageElement | null>(null)
  const zoomFactor = useAppSelector(s => selectZoomFactor(s, mode))
  const bestImageURL = useAppSelector(s => selectBestImageByPageId(s, pageID))

  useEffect(() => {
    if (currentPage == pageNumber) {
      if (targetRef.current) {
        targetRef.current.scrollIntoView(false)
      }
    }
  }, [currentPage, bestImageURL, pageNumber])

  return {
    ref: targetRef,
    isLoading: !bestImageURL,
    imageURL: bestImageURL
  }
}
