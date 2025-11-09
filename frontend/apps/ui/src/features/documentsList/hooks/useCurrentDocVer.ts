import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useGetDocLastVersionQuery} from "@/features/document/store"
import {selectLatestDocVerByDocID} from "@/features/document/store/docsSlice"
import {
  addDocVersion,
  selectDocVerByID
} from "@/features/document/store/documentVersSlice"
import {clientDVFromDV} from "@/features/document/utils"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelDetailsEntityId} from "@/features/ui/panelRegistry"
import {currentDocVerUpdated} from "@/features/ui/uiSlice"
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
  const {panelId} = usePanel()
  const currentDocumentID = useAppSelector(s =>
    selectPanelDetailsEntityId(s, panelId)
  )
  const latestDocVerID = useAppSelector(s =>
    selectLatestDocVerByDocID(s, currentDocumentID)
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
  } = useGetDocLastVersionQuery(currentDocumentID ?? skipToken)

  useEffect(() => {
    if (currentData) {
      // set current docVer to the value of docVer
      // return docVer as current one

      if (!latestDocVerID) {
        dispatch(addDocVersion(currentData))
      }
      dispatch(currentDocVerUpdated({mode: panelId, docVerID: currentData.id}))
    }
  }, [currentData, latestDocVerID, currentDocumentID])

  const docVer: ClientDocumentVersion | undefined = useMemo(() => {
    if (docVerFromSlice) {
      return docVerFromSlice
    } else if (currentData) {
      return clientDVFromDV(currentData)
    } else {
      return undefined
    }
  }, [currentData, docVerFromSlice, latestDocVerID, latestDocVerID, panelId])

  return {
    error: undefined,
    isError: false,
    docVer: docVer
  }
}
