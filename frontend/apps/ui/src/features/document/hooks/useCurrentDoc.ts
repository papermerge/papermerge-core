import {useGetDocumentQuery} from "@/features/document/store/apiSlice"
import {selectCurrentDocumentID} from "@/features/ui/uiSlice"
import type {FetchBaseQueryError} from "@reduxjs/toolkit/query"
import {skipToken} from "@reduxjs/toolkit/query"

import {useAppSelector} from "@/app/hooks"
import {DocumentType} from "@/features/document/types"
import {usePanelMode} from "@/hooks"

interface SerializedError {
  name?: string
  message?: string
  stack?: string
  code?: string
}

interface ReturnState {
  isError: boolean
  error: FetchBaseQueryError | SerializedError | undefined
  doc: DocumentType | undefined
}

export default function useCurrentDoc(): ReturnState {
  const mode = usePanelMode()

  const currentDocumentID = useAppSelector(s =>
    selectCurrentDocumentID(s, mode)
  )
  const {
    // should be `currentData` here not `data`, otherwise there will
    // be a flicker previous document when user opens viewer
    currentData: doc,
    isError,
    error
  } = useGetDocumentQuery(currentDocumentID ?? skipToken)

  return {doc, isError, error}
}
