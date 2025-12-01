import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {Flex, Group, Loader} from "@mantine/core"
import {useContext, useRef} from "react"
import {useNavigate} from "react-router-dom"

import {
  currentDocVerUpdated,
  currentSharedNodeRootChanged
} from "@/features/ui/uiSlice"

import SharedBreadcrumbs from "@/components/SharedBreadcrumb"
import PanelContext from "@/contexts/PanelContext"

import {store} from "@/app/store"
import {SHARED_FOLDER_ROOT_ID} from "@/cconstants"
import DocumentDetails from "@/components/document/DocumentDetails/DocumentDetails"
import DocumentDetailsToggle from "@/components/document/DocumentDetailsToggle"
import ThumbnailsToggle from "@/components/document/ThumbnailsToggle"
import classes from "@/components/document/Viewer.module.css"
import PageList from "@/features/document/components/PageList"
import ThumbnailList from "@/features/document/components/ThumbnailList"
import {DOC_VER_PAGINATION_PAGE_BATCH_SIZE} from "@/features/document/constants"
import {useCurrentDoc, useCurrentDocVer} from "@/features/document/hooks"
import useGeneratePreviews from "@/features/document/hooks/useGeneratePreviews"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelAllCustom} from "@/features/ui/panelRegistry"

import {RootState} from "@/app/types"
import type {NType, PanelMode} from "@/types"
import ActionButtons from "./ActionButtons"

export default function SharedViewer() {
  const {panelId} = usePanel()
  const {doc} = useCurrentDoc()
  const {docVer} = useCurrentDocVer()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const {thumbnailPanelIsOpen: thumbnailsIsOpen} = useAppSelector(s =>
    selectPanelAllCustom(s, panelId)
  )

  /* generate first batch of previews: for pages and for their thumbnails */
  const allPreviewsAreAvailable = useGeneratePreviews({
    docVer: docVer,
    pageNumber: 1,
    pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
    imageSize: "md"
  })

  const onClick = (node: NType) => {
    if (node.ctype == "folder") {
      if (node.id == SHARED_FOLDER_ROOT_ID) {
        dispatch(currentSharedNodeRootChanged(undefined))
        navigate(`/shared`)
        return
      }
    }

    if (mode == "main" && node.ctype == "folder") {
      const state = store.getState() as RootState
      const sharedNode = state.sharedNodes.entities[node.id]
      if (sharedNode.is_shared_root) {
        dispatch(currentSharedNodeRootChanged(node.id))
      }
      dispatch(currentDocVerUpdated({mode: mode, docVerID: undefined}))
      navigate(`/shared/folder/${node.id}`)
    }
  }

  if (!doc) {
    return <Loader />
  }

  if (!docVer) {
    return <Loader />
  }

  if (!allPreviewsAreAvailable) {
    return <Loader />
  }

  return (
    <div className={classes.viewer}>
      <Group className={classes.header}>
        <ActionButtons />
        <Group justify="space-between">
          <SharedBreadcrumbs breadcrumb={doc?.breadcrumb} onClick={onClick} />
          <DocumentDetailsToggle />
        </Group>
      </Group>
      <Flex ref={ref} className={classes.inner}>
        {thumbnailsIsOpen && <ThumbnailList docVer={docVer} />}
        <ThumbnailsToggle />
        <PageList docVer={docVer} />
        <DocumentDetails
          docVer={docVer}
          doc={doc}
          docID={doc?.id}
          isLoading={false}
        />
      </Flex>
    </div>
  )
}
