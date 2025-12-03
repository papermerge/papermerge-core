import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {Flex, Group, Loader} from "@mantine/core"
import {useContext, useRef} from "react"
import {useNavigate} from "react-router-dom"

import {currentDocVerUpdated} from "@/features/ui/uiSlice"

import PanelContext from "@/contexts/PanelContext"

import Breadcrumbs from "@/components/Breadcrumbs"
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
import {
  selectPanelAllCustom,
  setPanelComponent,
  updatePanelCurrentNode
} from "@/features/ui/panelRegistry"

import {getSharedFolderBreadcrumb} from "@/components/Breadcrumbs/utils"
import type {NType, PanelMode} from "@/types"
import PanelToolbar from "./PanelToolbar"

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
    if (node.id == "shared" && mode == "main") {
      navigate("/shared")
      return
    }

    if (node.id == "shared" && mode == "secondary") {
      dispatch(
        updatePanelCurrentNode({
          component: "sharedCommander",
          panelID: "secondary"
        })
      )
      return
    }

    if (mode == "secondary" && node.ctype == "folder") {
      dispatch(
        updatePanelCurrentNode({
          entityID: node.id,
          component: "sharedCommander",
          panelID: "secondary"
        })
      )
      dispatch(
        setPanelComponent({
          panelId: "secondary",
          component: node.ctype == "folder" ? "sharedCommander" : "sharedViewer"
        })
      )
    } else if (mode == "main" && node.ctype == "folder") {
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

  const breadcrumb = getSharedFolderBreadcrumb(doc?.breadcrumb)

  return (
    <div className={classes.viewer}>
      <PanelToolbar />
      <Group justify="space-between" py={"xs"}>
        <Breadcrumbs breadcrumb={breadcrumb} onClick={onClick} />
        <DocumentDetailsToggle />
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
