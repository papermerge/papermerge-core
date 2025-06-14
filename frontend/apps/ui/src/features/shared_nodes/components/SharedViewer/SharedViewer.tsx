import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {Flex, Group} from "@mantine/core"
import {useContext, useEffect, useRef} from "react"
import {useNavigate} from "react-router-dom"

import {
  currentDocVerUpdated,
  currentSharedNodeRootChanged,
  selectContentHeight,
  selectCurrentSharedNodeID,
  selectCurrentSharedRootID,
  selectLastPageSize
} from "@/features/ui/uiSlice"

import SharedBreadcrumbs from "@/components/SharedBreadcrumb"
import PanelContext from "@/contexts/PanelContext"
import {useGetSharedDocumentQuery} from "@/features/shared_nodes/apiSlice"
import {skipToken} from "@reduxjs/toolkit/query"

import {store} from "@/app/store"
import {SHARED_FOLDER_ROOT_ID} from "@/cconstants"
import DocumentDetails from "@/components/document/DocumentDetails/DocumentDetails"
import DocumentDetailsToggle from "@/components/document/DocumentDetailsToggle"
import ThumbnailsToggle from "@/components/document/ThumbnailsToggle"
import classes from "@/components/document/Viewer.module.css"
import Pages from "@/features/document/components/PageList"
import Thumbnails from "@/features/document/components/ThumbnailList"

import type {NType, PanelMode} from "@/types"
import ActionButtons from "./ActionButtons"

export default function SharedViewer() {
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const height = useAppSelector(s => selectContentHeight(s, mode))
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const lastPageSize = useAppSelector(s => selectLastPageSize(s, mode))

  const currentNodeID = useAppSelector(selectCurrentSharedNodeID)
  const currentSharedRootID = useAppSelector(selectCurrentSharedRootID)

  const queryParams = currentNodeID
    ? {
        nodeID: currentNodeID,
        currentSharedRootID: currentSharedRootID
      }
    : skipToken

  const {
    currentData: doc,
    isSuccess,
    isError,
    isFetching,
    isLoading
  } = useGetSharedDocumentQuery(queryParams)

  const onClick = (node: NType) => {
    if (node.ctype == "folder") {
      if (node.id == SHARED_FOLDER_ROOT_ID) {
        dispatch(currentSharedNodeRootChanged(undefined))
        navigate(`/shared`)
        return
      }
    }

    if (mode == "main" && node.ctype == "folder") {
      const state = store.getState()
      const sharedNode = state.sharedNodes.entities[node.id]
      if (sharedNode.is_shared_root) {
        dispatch(currentSharedNodeRootChanged(node.id))
      }
      dispatch(currentDocVerUpdated({mode: mode, docVerID: undefined}))
      navigate(`/shared/folder/${node.id}?page_size=${lastPageSize}`)
    }
  }

  useEffect(() => {
    if (doc) {
      const maxVerNum = Math.max(...doc.versions.map(v => v.number))
      const docVer = doc.versions.find(v => v.number == maxVerNum)
      if (docVer) {
        dispatch(currentDocVerUpdated({mode: mode, docVerID: docVer.id}))
      }
    }
  }, [isSuccess, doc])

  return (
    <div>
      <ActionButtons doc={doc} isFetching={isFetching} isError={isError} />
      <Group justify="space-between">
        <SharedBreadcrumbs breadcrumb={doc?.breadcrumb} onClick={onClick} />
        <DocumentDetailsToggle />
      </Group>
      <Flex ref={ref} className={classes.inner} style={{height: `${height}px`}}>
        <Thumbnails isFetching={isFetching} />
        <ThumbnailsToggle />
        <Pages isFetching={isFetching} />
        <DocumentDetails
          doc={doc}
          docID={currentNodeID}
          isLoading={isLoading}
        />
      </Flex>
    </div>
  )
}
