import {useAppSelector} from "@/app/hooks"
import {
  useGetDocLastVersionQuery,
  useGetDocumentQuery
} from "@/features/document/apiSlice"
import {DocumentType, DocumentVersion} from "@/features/document/types"
import {FetchBaseQueryError, skipToken} from "@reduxjs/toolkit/query"

import {selectCurrentNode} from "@/features/ui/uiSlice"

import {usePanelMode} from "@/hooks"
import {SerializedError} from "@reduxjs/toolkit"

interface State {
  isLoading: boolean
  isError: boolean
  error?: FetchBaseQueryError | SerializedError
  doc?: DocumentType
  docVer?: DocumentVersion
}

export default function useCurrentDoc(): State {
  const mode = usePanelMode()
  const currentNode = useAppSelector(s => selectCurrentNode(s, mode))
  const currentDocumentID =
    currentNode?.id && currentNode?.ctype == "document"
      ? currentNode.id
      : undefined
  const {
    currentData: doc,
    isError: isErrorDoc,
    error: errorDoc,
    isLoading: isLoadingDoc
  } = useGetDocumentQuery(currentDocumentID ?? skipToken)
  const {
    data: docVer,
    isError: isErorDocVer,
    error: errorDocVer,
    isLoading: isLoadingDocVer
  } = useGetDocLastVersionQuery(currentDocumentID ?? skipToken)

  return {
    isLoading: isLoadingDoc || isLoadingDocVer,
    doc,
    docVer,
    isError: isErrorDoc || isErorDocVer,
    error: errorDoc || errorDocVer
  }
}
