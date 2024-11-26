import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {Flex, Group} from "@mantine/core"
import {useContext, useEffect} from "react"
import {useNavigate} from "react-router-dom"

import Breadcrumbs from "@/components/Breadcrumbs"
import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentQuery} from "@/features/document/apiSlice"
import {useRef, useState} from "react"

import {HIDDEN} from "@/cconstants"
import {
  currentDocVerUpdated,
  currentNodeChanged,
  secondaryPanelClosed,
  selectContentHeight,
  selectCurrentNodeCType,
  selectCurrentNodeID
} from "@/features/ui/uiSlice"
import type {Coord, NType, PanelMode, ServerErrorType} from "@/types"
import {useDisclosure} from "@mantine/hooks"
import ActionButtons from "./ActionButtons"
import ContextMenu from "./Contextmenu"
import DocumentDetails from "./DocumentDetails/DocumentDetails"
import DocumentDetailsToggle from "./DocumentDetailsToggle"
import PagesHaveChangedDialog from "./PageHaveChangedDialog"
import Pages from "./Pages"
import Thumbnails from "./Thumbnails"
import ThumbnailsToggle from "./ThumbnailsToggle"
import classes from "./Viewer.module.css"

export default function Viewer() {
  const ref = useRef<HTMLDivElement>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<Coord>(HIDDEN)
  const [opened, {open, close}] = useDisclosure()
  const mode: PanelMode = useContext(PanelContext)
  const height = useAppSelector(s => selectContentHeight(s, mode))
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const secondaryPanelNodeID = useAppSelector(s =>
    selectCurrentNodeID(s, "secondary")
  )
  const secondaryPanelNodeCType = useAppSelector(s =>
    selectCurrentNodeCType(s, "secondary")
  )
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {
    currentData: doc,
    isSuccess,
    isError,
    error
  } = useGetDocumentQuery(currentNodeID!)

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
      } else {
        if (secondaryPanelNodeID && secondaryPanelNodeCType) {
          // the 404 is in main panel. In this case, open
          // in main panel whatever was in secondary
          dispatch(
            currentNodeChanged({
              id: secondaryPanelNodeID,
              ctype: secondaryPanelNodeCType,
              panel: "main"
            })
          )
          // and then close secondary panel
          dispatch(secondaryPanelClosed())
        }
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
        <Breadcrumbs breadcrumb={doc?.breadcrumb} onClick={onClick} />
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
