import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { useCurrentDoc } from "@/features/document/hooks"
import { setPanelComponent } from "@/features/ui/panelRegistry"
import { Flex, Group, Loader } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useContext } from "react"
import { useNavigate } from "react-router-dom"

import Breadcrumbs from "@/components/Breadcrumbs"
import PanelContext from "@/contexts/PanelContext"

import EditNodeTitleModal from "@/components/EditNodeTitleModal"
import useGeneratePreviews from "@/features/document/hooks/useGeneratePreviews"
import { useRef } from "react"

import DocumentDetails from "@/components/document/DocumentDetails/DocumentDetails"
import DocumentDetailsToggle from "@/components/document/DocumentDetailsToggle"
import ThumbnailsToggle from "@/components/document/ThumbnailsToggle"
import classes from "@/components/document/Viewer.module.css"
import { applyPageChangesThunk } from "@/features/document/actions/applyPageOpChanges"
import ActionButtons from "@/features/document/components/ActionButtons"
import { useCurrentDocVer } from "@/features/document/hooks"
import {
  pagesDeleted,
  pagesReseted,
  pagesRotated,
  selectAllPages
} from "@/features/document/store/documentVersSlice"
import { usePanel } from "@/features/ui/hooks/usePanel"
import {
  clearPanelSelection,
  selectPanelAllCustom,
  updatePanelCurrentNode
} from "@/features/ui/panelRegistry"
import { currentDocVerUpdated } from "@/features/ui/uiSlice"
import { selectCurrentUser } from "@/slices/currentUser"
import type { NType, PanelMode } from "@/types"
import { DOC_VER_PAGINATION_PAGE_BATCH_SIZE } from "../constants"
import ContextMenu from "./ContextMenu"

import { useSelectedPages } from "@/features/document/hooks"
import useContextMenu from "@/features/document/hooks/useContextMenu"
import DeleteEntireDocumentConfirm from "./DeleteEntireDocumentConfirm"
import PagesHaveChangedDialog from "./PageHaveChangedDialog"
import PageList from "./PageList"
import ThumbnailList from "./ThumbnailList"

export default function ViewerContainer() {
  const {doc} = useCurrentDoc()
  const {docVer} = useCurrentDocVer()

  return <Viewer doc={doc} docVer={docVer} />
}

interface Args {
  doc: ReturnType<typeof useCurrentDoc>["doc"]
  docVer: ReturnType<typeof useCurrentDocVer>["docVer"]
}

export function Viewer({doc, docVer}: Args) {
  const user = useAppSelector(selectCurrentUser)
  const {panelId} = usePanel()

  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  /* generate first batch of previews: for pages and for their thumbnails */
  const allPreviewsAreAvailable = useGeneratePreviews({
    docVer: docVer,
    pageNumber: 1,
    pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
    imageSize: "md"
  })
  const selectedPages = useSelectedPages({mode, docVerID: docVer?.id})

  const {
    opened,
    options: {close},
    position
  } = useContextMenu({ref})
  const [
    openedEditNodeTitleModal,
    {open: openEditNodeTitleModal, close: closeEditNodeTitleModal}
  ] = useDisclosure(false)
  const [
    openedDeleteEntireDocumentConfirm,
    {
      open: openDeleteEntireDocumentConfirm,
      close: closeDeleteEntireDocumentConfirm
    }
  ] = useDisclosure(false)

  //const thumbnailsIsOpen = useAppSelector(s =>
  //  selectThumbnailsPanelOpen(s, mode)
  // )
  const {thumbnailPanelIsOpen: thumbnailsIsOpen} = useAppSelector(s =>
    selectPanelAllCustom(s, panelId)
  )
  const pages = useAppSelector(s => selectAllPages(s, docVer?.id)) || []

  const onClick = (node: NType) => {
    if (mode == "secondary" && node.ctype == "folder") {
      dispatch(
        updatePanelCurrentNode({
          entityID: node.id,
          component: "commander",
          panelID: "secondary"
        })
      )
      dispatch(
        setPanelComponent({
          panelId: "secondary",
          component: node.ctype == "folder" ? "commander" : "viewer"
        })
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

  const onEditNodeTitleItem = () => {
    openEditNodeTitleModal()
  }

  const onRotateCWItemClicked = () => {
    dispatch(
      pagesRotated({
        sources: selectedPages,
        angle: 90,
        targetDocVerID: docVer?.id!
      })
    )
  }

  const onResetChangesItemClicked = () => {
    if (docVer?.id) {
      dispatch(pagesReseted(docVer?.id))
    } else {
      console.warn("onResetChangesItemClicked: docVer.id is undefined")
    }
  }

  const onSaveChangesItemClicked = () => {
    if (doc?.id) {
      dispatch(applyPageChangesThunk({docID: doc.id, pages, mode}))
    } else {
      console.warn("onSaveChangesItemClicked: doc.id is undefined")
    }
  }

  const onRotateCCItemClicked = () => {
    dispatch(
      pagesRotated({
        sources: selectedPages,
        angle: -90,
        targetDocVerID: docVer?.id!
      })
    )
  }

  const onDeleteEntireDocumentConfirmCancel = () => {
    closeDeleteEntireDocumentConfirm()
  }

  const onDeleteEntireDocumentConfirmSubmit = () => {
    closeDeleteEntireDocumentConfirm()
    navigate(`/home/${user.home_folder_id}`)
  }

  const onDeletePagesItemClicked = () => {
    if (selectedPages.length == pages.length) {
      /* Confirm that user intends to delete entire document */
      openDeleteEntireDocumentConfirm()
    } else {
      dispatch(
        pagesDeleted({
          sources: selectedPages,
          targetDocVerID: docVer?.id!
        })
      )
       dispatch(clearPanelSelection({panelId}))
    }
  }

  const onDeleteDocumentItemClicked = () => {
    openDeleteEntireDocumentConfirm()
  }

  if (!doc) {
    return <Loader />
  }

  if (!docVer) {
    return <>No Doc Ver</>
  }

  if (!allPreviewsAreAvailable) {
    return <Loader />
  }

  return (
    <div ref={ref} className={classes.viewer}>
      <div className={classes.header}>
        <ActionButtons
          onEditNodeTitleClicked={onEditNodeTitleItem}
          onRotateCWClicked={onRotateCWItemClicked}
          onRotateCCClicked={onRotateCCItemClicked}
          onDeletePagesClicked={onDeletePagesItemClicked}
        />
        <Group justify="space-between">
          <Breadcrumbs breadcrumb={doc?.breadcrumb} onClick={onClick} />
          <DocumentDetailsToggle />
        </Group>
      </div>
      <Flex className={classes.inner}>
        {thumbnailsIsOpen && <ThumbnailList docVer={docVer} />}
        <ThumbnailsToggle />
        <PageList docVer={docVer} />
        <DocumentDetails
          docVer={docVer}
          doc={doc}
          docID={doc?.id}
          isLoading={false}
        />
        <PagesHaveChangedDialog docID={doc.id} />
        <ContextMenu
          opened={opened}
          position={position}
          onEditNodeTitleItemClicked={onEditNodeTitleItem}
          onRotateCCItemClicked={onRotateCCItemClicked}
          onRotateCWItemClicked={onRotateCWItemClicked}
          onResetChangesItemClicked={onResetChangesItemClicked}
          onSaveChangesItemClicked={onSaveChangesItemClicked}
          onDeletePagesItemClicked={onDeletePagesItemClicked}
          onDeleteDocumentItemClicked={onDeleteDocumentItemClicked}
        />
      </Flex>
      <EditNodeTitleModal
        opened={openedEditNodeTitleModal}
        node={{id: doc?.id!, title: doc?.title!}}
        onSubmit={closeEditNodeTitleModal}
        onCancel={closeEditNodeTitleModal}
      />
      <DeleteEntireDocumentConfirm
        opened={openedDeleteEntireDocumentConfirm}
        onCancel={onDeleteEntireDocumentConfirmCancel}
        onSubmit={onDeleteEntireDocumentConfirmSubmit}
      />
    </div>
  )
}
