import {useGetSharedDocumentQuery} from "@/features/shared_nodes/store/apiSlice"
import {
  selectCurrentSharedNodeID,
  selectCurrentSharedRootID
} from "@/features/ui/uiSlice"
import type {FetchBaseQueryError} from "@reduxjs/toolkit/query"
import {skipToken} from "@reduxjs/toolkit/query"

import {useAppSelector} from "@/app/hooks"
import {DocumentType} from "@/features/document/types"

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

export default function useSharedCurrentDoc(): ReturnState {
  const currentNodeID = useAppSelector(selectCurrentSharedNodeID)
  const currentSharedRootID = useAppSelector(selectCurrentSharedRootID)

  const queryParams = currentNodeID
    ? {
        nodeID: currentNodeID,
        currentSharedRootID: currentSharedRootID
      }
    : skipToken

  const {
    // should be `currentData` here not `data`, otherwise there will
    // be a flicker previous document when user opens viewer
    currentData: doc,
    isError,
    error
  } = useGetSharedDocumentQuery(queryParams)

  return {doc, isError, error}
}
