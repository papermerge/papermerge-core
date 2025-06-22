import { useAppDispatch } from "@/app/hooks";
import usePageRangeWithoutPreview from "@/features/document/hooks/usePageRangeWithoutPreviews";
import { generatePreviews } from "@/features/document/imageObjectsSlice";
import type { DocumentVersion } from "@/features/document/types";
import { useEffect, useState } from "react";

interface State {
  isGenerating: boolean
}

interface Args {
  docVer: DocumentVersion
  pageNumber: number
  pageSize: number
}


export default function useGeneratePreviews({ docVer, pageSize, pageNumber }: Args): State {
  const dispatch = useAppDispatch()
  const [isGenerating, setIsGenerating] = useState<boolean>(true)
  const { firstPage, lastPage } = usePageRangeWithoutPreview({
    docVer, pageSize, pageNumber
  })

  useEffect(() => {
    const generate = async () => {
      setIsGenerating(true)
      if (firstPage != null && lastPage != null) {
        await dispatch(generatePreviews({ docVer, size: "md", firstPage, lastPage }))
      }
      setIsGenerating(false)
    }

    generate()

  }, [firstPage, lastPage])

  return { isGenerating }
}
