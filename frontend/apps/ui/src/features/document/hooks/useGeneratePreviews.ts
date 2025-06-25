import {useAppDispatch} from "@/app/hooks"
import useAreAllPreviewsAvailable from "@/features/document/hooks/useAreAllPreviewsAvailable"
import {generatePreviews} from "@/features/document/imageObjectsSlice"
import type {DocumentVersion} from "@/features/document/types"
import {useEffect} from "react"

interface State {
  previewsAreAvailable: boolean
}

interface Args {
  docVer: DocumentVersion
  pageNumber: number
  pageSize: number
}

export default function useGeneratePreviews({
  docVer,
  pageSize,
  pageNumber
}: Args): void {
  const dispatch = useAppDispatch()
  const allPreviewsAreAvailable = useAreAllPreviewsAvailable({
    docVer,
    pageSize,
    pageNumber
  })

  useEffect(() => {
    if (!allPreviewsAreAvailable) {
      console.log(`Generating previews for ${docVer.id}`)
      dispatch(
        generatePreviews({
          docVer,
          size: "md",
          pageSize,
          pageNumber,
          pageTotal: docVer.pages.length
        })
      )
    }
  }, [dispatch, docVer, pageSize, pageNumber, allPreviewsAreAvailable])
}
