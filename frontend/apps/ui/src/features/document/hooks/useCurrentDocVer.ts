import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useGetDocLastVersionQuery} from "@/features/document/apiSlice"
import {
  addDocVersion,
  selectDocVerByID
} from "@/features/document/documentVersSlice"
import {
  currentDocVerUpdated,
  selectCurrentDocumentID,
  selectCurrentDocVerID
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {ClientDocumentVersion} from "@/types"
import type {FetchBaseQueryError} from "@reduxjs/toolkit/query"
import {skipToken} from "@reduxjs/toolkit/query"
import {useEffect, useMemo} from "react"
import {clientDVFromDV} from "../utils"

interface SerializedError {
  name?: string
  message?: string
  stack?: string
  code?: string
}

interface ReturnState {
  isError: boolean
  error: FetchBaseQueryError | SerializedError | undefined
  docVer: ClientDocumentVersion | undefined
}

export default function useCurrentDocVer(): ReturnState {
  const dispatch = useAppDispatch()
  const mode = usePanelMode()
  const currentDocumentID = useAppSelector(s =>
    selectCurrentDocumentID(s, mode)
  )
  const currentDocVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const docVerFromSlice = useAppSelector(s =>
    selectDocVerByID(s, currentDocVerID)
  )
  const {
    // should be `currentData` here not `data`, otherwise there will
    // be a flicker previous document when user opens viewer
    currentData,
    isFetching,
    isSuccess,
    isError,
    error
  } = useGetDocLastVersionQuery(currentDocumentID ?? skipToken)

  useEffect(() => {
    if (currentData) {
      // set current docVer to the value of docVer
      // return docVer as current one

      if (!currentDocVerID) {
        dispatch(addDocVersion(currentData))
        dispatch(currentDocVerUpdated({mode: mode, docVerID: currentData.id}))
      }
    }
  }, [currentData, currentDocVerID, currentDocumentID])

  const docVer: ClientDocumentVersion | undefined = useMemo(() => {
    if (docVerFromSlice) {
      return docVerFromSlice
    } else if (currentData) {
      return clientDVFromDV(currentData)
    } else {
      return undefined
    }
  }, [currentData, docVerFromSlice, currentDocVerID, currentDocVerID, mode])

  return {
    error: undefined,
    isError: false,
    docVer: docVer
  }
}
