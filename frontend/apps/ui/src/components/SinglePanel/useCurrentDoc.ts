import {useAppSelector} from "@/app/hooks"
import {
  useGetDocLastVersionQuery,
  useGetDocumentQuery
} from "@/features/document/apiSlice"
import {DocumentType, DocumentVersion} from "@/features/document/types"
import {FetchBaseQueryError, skipToken} from "@reduxjs/toolkit/query"
import {useEffect, useState} from "react"

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
    data: docData,
    isError: isErrorDoc,
    error: errorDoc,
    isLoading: isLoadingDoc
  } = useGetDocumentQuery(currentDocumentID ?? skipToken)
  const {
    data: docVerData,
    isError: isErrorDocVer,
    error: errorDocVer,
    isLoading: isLoadingDocVer
  } = useGetDocLastVersionQuery(currentDocumentID ?? skipToken)
  const [isLoading, setIsLoading] = useState<boolean>(
    isLoadingDoc || isLoadingDocVer
  )
  const [doc, setDoc] = useState<DocumentType | undefined>(docData)
  const [docVer, setDocVer] = useState<DocumentVersion | undefined>(docVerData)
  const [isError, setIsError] = useState<boolean>(isErrorDoc || isErrorDocVer)
  const [error, setError] = useState<
    FetchBaseQueryError | SerializedError | undefined
  >(errorDoc || errorDocVer)

  useEffect(() => {
    setIsLoading(isLoadingDoc || isLoadingDocVer)
    setDoc(docData)
    setDocVer(docVerData)
    setIsError(isErrorDoc || isErrorDocVer)
    setError(errorDoc || errorDocVer)
  }, [
    isLoadingDoc,
    isLoadingDocVer,
    docData,
    docVerData,
    isErrorDoc,
    isErrorDocVer,
    errorDoc,
    errorDocVer
  ])

  return {
    isLoading,
    doc,
    docVer,
    isError,
    error
  }
}
