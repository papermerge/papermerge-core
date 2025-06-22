import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { generatePreviews } from "@/features/document/imageObjectsSlice";
import type { DocumentVersion } from "@/types";
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
  const [isGenerating, setIsGenerating] = useState<boolean>(true)
  const dispatch = useAppDispatch()
  const { firstPage, lastPage } = useAppSelector(s => selectPagesWithoutPreviews(s, docVer, pageSize, pageNumber))

  useEffect(() => {
    const generate = async () => {
      setIsGenerating(true)
      await dispatch(generatePreviews({ docVer, size: "md", firstPage, lastPage }))
      setIsGenerating(false)
    }

    generate()

  }, [firstPage, lastPage])

  return { isGenerating }
}
