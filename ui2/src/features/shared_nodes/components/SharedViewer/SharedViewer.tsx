import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {Flex, Group} from "@mantine/core"
import {useContext, useEffect} from "react"
import {useNavigate} from "react-router-dom"

import SharedBreadcrumbs from "@/components/SharedBreadcrumb"
import PanelContext from "@/contexts/PanelContext"
import {useGetSharedDocumentQuery} from "@/features/shared_nodes/apiSlice"
import {useRef, useState} from "react"

import {HIDDEN} from "@/cconstants"
import ActionButtons from "@/components/document/ActionButtons"
import ContextMenu from "@/components/document/Contextmenu"
import DocumentDetails from "@/components/document/DocumentDetails/DocumentDetails"
import DocumentDetailsToggle from "@/components/document/DocumentDetailsToggle"
import PagesHaveChangedDialog from "@/components/document/PageHaveChangedDialog"
import Pages from "@/components/document/Pages"
import Thumbnails from "@/components/document/Thumbnails"
import ThumbnailsToggle from "@/components/document/ThumbnailsToggle"
import classes from "@/components/document/Viewer.module.css"
import {
  currentDocVerUpdated,
  currentNodeChanged,
  secondaryPanelClosed,
  selectContentHeight,
  selectCurrentNodeCType,
  selectCurrentSharedNodeID,
  selectCurrentSharedRootID
} from "@/features/ui/uiSlice"
import type {Coord, NType, PanelMode, ServerErrorType} from "@/types"
import {useDisclosure} from "@mantine/hooks"

export default function SharedViewer() {
  const ref = useRef<HTMLDivElement>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<Coord>(HIDDEN)
  const [opened, {open, close}] = useDisclosure()
  const mode: PanelMode = useContext(PanelContext)
  const height = useAppSelector(s => selectContentHeight(s, mode))
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const secondaryPanelNodeCType = useAppSelector(s =>
    selectCurrentNodeCType(s, "secondary")
  )
  const currentNodeID = useAppSelector(selectCurrentSharedNodeID)
  const currentSharedRootID = useAppSelector(selectCurrentSharedRootID)

  const {
    currentData: doc,
    isSuccess,
    isError,
    error
  } = useGetSharedDocumentQuery({
    nodeID: currentNodeID!,
    currentSharedRootID: currentSharedRootID
  })

  const onContextMenu = (ev: MouseEvent) => {
    ev.preventDefault() // prevents default context menu

    let new_y = ev.clientY
    let new_x = ev.clientX
    setContextMenuPosition({y: new_y, x: new_x})
    open()
  }

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

  useEffect(() => {
    /* In case user decides to transfer all source pages,
    the source document will vanish as server will remove it.
    The outcome is that `useGetDocumentQuery` will result in
    error with HTTP status 404. In this case we close
    panel of the delete document.
    */
    if (isError && error && (error as ServerErrorType).status == 404) {
      if (mode == "secondary") {
        // the 404 was in secondary panel. Just close it.
        dispatch(secondaryPanelClosed())
      }
    }
  }, [isError])

  useEffect(() => {
    if (doc) {
      const maxVerNum = Math.max(...doc.versions.map(v => v.number))
      const docVer = doc.versions.find(v => v.number == maxVerNum)
      if (docVer) {
        dispatch(currentDocVerUpdated({mode: mode, docVerID: docVer.id}))
      }
    }
  }, [isSuccess, doc])

  useEffect(() => {
    // detect right click outside
    if (ref.current) {
      ref.current.addEventListener("contextmenu", onContextMenu)
    }

    return () => {
      if (ref.current) {
        ref.current.removeEventListener("contextmenu", onContextMenu)
      }
    }
  }, [])

  return (
    <div>
      <ActionButtons />
      <Group justify="space-between">
        <SharedBreadcrumbs breadcrumb={doc?.breadcrumb} onClick={onClick} />
        <DocumentDetailsToggle />
      </Group>
      <Flex ref={ref} className={classes.inner} style={{height: `${height}px`}}>
        <Thumbnails />
        <ThumbnailsToggle />
        <Pages />
        <DocumentDetails />
        <PagesHaveChangedDialog />
        <ContextMenu
          opened={opened}
          position={contextMenuPosition}
          onChange={onContextMenuChange}
        />
      </Flex>
    </div>
  )
}
