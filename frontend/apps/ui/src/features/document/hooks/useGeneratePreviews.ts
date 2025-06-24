import {useAppDispatch} from "@/app/hooks"
import useAreAllPreviewsAvailable from "@/features/document/hooks/useAreAllPreviewsAvailable"
import {generatePreviews} from "@/features/document/imageObjectsSlice"
import type {DocumentVersion} from "@/features/document/types"
import {useEffect, useState} from "react"

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
}: Args): State {
  const dispatch = useAppDispatch()
  const allPreviewsAreAvailable = useAreAllPreviewsAvailable({
    docVer,
    pageSize,
    pageNumber
  })
  const [previewsAreAvailable, setPreviewsAreAvailable] =
    useState<boolean>(false)

  const generate = async () => {
    if (allPreviewsAreAvailable) {
      setPreviewsAreAvailable(true)
    } else {
      setPreviewsAreAvailable(false)
      await dispatch(
        generatePreviews({
          docVer,
          size: "md",
          pageSize,
          pageNumber,
          pageTotal: docVer.pages.length
        })
      )
      setPreviewsAreAvailable(true)
    }
  }

  useEffect(() => {
    generate()
  }, [pageSize, pageNumber, docVer.id])

  return {previewsAreAvailable}
}
