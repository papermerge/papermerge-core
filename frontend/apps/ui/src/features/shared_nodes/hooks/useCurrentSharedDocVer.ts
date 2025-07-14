import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {selectLatestDocVerByDocID} from "@/features/document/store/docsSlice"
import {
  addDocVersion,
  selectDocVerByID
} from "@/features/document/store/documentVersSlice"
import {clientDVFromDV} from "@/features/document/utils"
import {
  currentDocVerUpdated,
  selectCurrentSharedNodeID
} from "@/features/ui/uiSlice"
import {ClientDocumentVersion} from "@/types"
import type {FetchBaseQueryError} from "@reduxjs/toolkit/query"
import {skipToken} from "@reduxjs/toolkit/query"
import {useEffect, useMemo} from "react"

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
  const currentNodeID = useAppSelector(selectCurrentSharedNodeID)
  const latestDocVerID = useAppSelector(s =>
    selectLatestDocVerByDocID(s, currentNodeID)
  )
  const docVerFromSlice = useAppSelector(s =>
    selectDocVerByID(s, latestDocVerID)
  )
  const {
    // should be `currentData` here not `data`, otherwise there will
    // be a flicker previous document when user opens viewer
    currentData,
    isFetching,
    isSuccess,
    isError,
    error
  } = useGetSharedDocLastVersionQuery(currentNodeID ?? skipToken)

  useEffect(() => {
    if (currentData) {
      // set current docVer to the value of docVer
      // return docVer as current one

      if (!latestDocVerID) {
        dispatch(addDocVersion(currentData))
      }
      dispatch(currentDocVerUpdated({mode: "main", docVerID: currentData.id}))
    }
  }, [currentData, latestDocVerID, currentNodeID])

  const docVer: ClientDocumentVersion | undefined = useMemo(() => {
    if (docVerFromSlice) {
      return docVerFromSlice
    } else if (currentData) {
      return clientDVFromDV(currentData)
    } else {
      return undefined
    }
  }, [currentData, docVerFromSlice, latestDocVerID, latestDocVerID, "main"])

  return {
    error: undefined,
    isError: false,
    docVer: docVer
  }
}
