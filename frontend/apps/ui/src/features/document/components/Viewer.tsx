import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useCurrentDoc} from "@/features/document/hooks"
import {Flex, Group, Loader} from "@mantine/core"
import {useContext} from "react"
import {useNavigate} from "react-router-dom"

import Breadcrumbs from "@/components/Breadcrumbs"
import PanelContext from "@/contexts/PanelContext"

import useGeneratePreviews from "@/features/document/hooks/useGeneratePreviews"
import {useRef} from "react"

import ActionButtons from "@/components/document/ActionButtons"
import DocumentDetails from "@/components/document/DocumentDetails/DocumentDetails"
import DocumentDetailsToggle from "@/components/document/DocumentDetailsToggle"
import ThumbnailsToggle from "@/components/document/ThumbnailsToggle"
import classes from "@/components/document/Viewer.module.css"
import {useCurrentDocVer} from "@/features/document/hooks"
import {
  currentDocVerUpdated,
  currentNodeChanged,
  selectContentHeight,
  selectThumbnailsPanelOpen
} from "@/features/ui/uiSlice"
import type {NType, PanelMode} from "@/types"
import {DOC_VER_PAGINATION_PAGE_BATCH_SIZE} from "../constants"
import ContextMenu from "./ContextMenu"

import useContextMenu from "@/features/document/hooks/useContextMenu"
import PagesHaveChangedDialog from "./PageHaveChangedDialog"
import PageList from "./PageList"
import ThumbnailList from "./ThumbnailList"

export default function Viewer() {
  const {doc} = useCurrentDoc()
  const {docVer} = useCurrentDocVer()

  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const height = useAppSelector(s => selectContentHeight(s, mode))
  /* generate first batch of previews: for pages and for their thumbnails */
  const allPreviewsAreAvailable = useGeneratePreviews({
    docVer: docVer,
    pageNumber: 1,
    pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
    imageSize: "md"
  })
  const {
    opened,
    options: {close},
    position
  } = useContextMenu({ref})

  const thumbnailsIsOpen = useAppSelector(s =>
    selectThumbnailsPanelOpen(s, mode)
  )

  const onClick = (node: NType) => {
    if (mode == "secondary" && node.ctype == "folder") {
      dispatch(
        currentNodeChanged({id: node.id, ctype: "folder", panel: "secondary"})
      )
    } else if (mode == "main" && node.ctype == "folder") {
      dispatch(currentDocVerUpdated({mode: mode, docVerID: undefined}))
      navigate(`/folder/${node.id}`)
    }
  }

  const onContextMenuChange = (cmOpened: boolean) => {
    if (!cmOpened) {
      close()
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
    <div ref={ref}>
      <ActionButtons doc={doc} isFetching={false} isError={false} />
      <Group justify="space-between">
        <Breadcrumbs breadcrumb={doc?.breadcrumb} onClick={onClick} />
        <DocumentDetailsToggle />
      </Group>
      <Flex className={classes.inner} style={{height: `${height}px`}}>
        {thumbnailsIsOpen && <ThumbnailList />}
        <ThumbnailsToggle />
        <PageList />
        <DocumentDetails
          docVer={docVer}
          doc={doc}
          docID={doc?.id}
          isLoading={false}
        />
        <PagesHaveChangedDialog docID={doc.id} />
        <ContextMenu opened={opened} position={position} />
      </Flex>
    </div>
  )
}
