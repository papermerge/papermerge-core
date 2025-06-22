import { useAppDispatch } from "@/app/hooks";
import usePageRangeWithoutPreview from "@/features/document/hooks/usePageRangeWithoutPreviews";
import { generatePreviews } from "@/features/document/imageObjectsSlice";
import type { DocumentVersion } from "@/features/document/types";
import { useEffect, useState } from "react";

interface State {
  previewsAreAvailable: boolean
}

interface Args {
  docVer?: DocumentVersion
  pageNumber: number
  pageSize: number
}


export default function useGeneratePreviews({ docVer, pageSize, pageNumber }: Args): State {
  const dispatch = useAppDispatch()
  const [previewsAreAvailable, setPreviewsAreAvailable] = useState<boolean>(false)
  const { firstPage, lastPage } = usePageRangeWithoutPreview({
    docVer, pageSize, pageNumber
  })

  useEffect(() => {
    const generate = async () => {

      if (firstPage === null && lastPage == null) {
        setPreviewsAreAvailable(true)
        return
      }

      if (firstPage != null && lastPage != null && docVer) {
        await dispatch(generatePreviews({ docVer, size: "md", firstPage, lastPage }))
        setPreviewsAreAvailable(true)
      }

    }

    if (!docVer) {
      return
    }

    generate()

  }, [firstPage, lastPage])

  return { previewsAreAvailable }
}
