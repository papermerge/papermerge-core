import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useCurrentDoc} from "@/features/document/hooks"
import {Flex, Group, Loader} from "@mantine/core"
import {useContext, useEffect} from "react"
import {useNavigate} from "react-router-dom"

import Breadcrumbs from "@/components/Breadcrumbs"
import PanelContext from "@/contexts/PanelContext"

import useGeneratePreviews from "@/features/document/hooks/useGeneratePreviews"
import {useRef, useState} from "react"

import {HIDDEN} from "@/cconstants"
import ActionButtons from "@/components/document/ActionButtons"
import ContextMenu from "@/components/document/Contextmenu"
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
import type {Coord, NType, PanelMode} from "@/types"
import {useDisclosure} from "@mantine/hooks"
import {DOC_VER_PAGINATION_PAGE_BATCH_SIZE} from "../constants"

import PagesHaveChangedDialog from "./PageHaveChangedDialog"
import PageList from "./PageList"
import ThumbnailList from "./ThumbnailList"

export default function Viewer() {
  const ref = useRef<HTMLDivElement>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<Coord>(HIDDEN)
  const [opened, {open, close}] = useDisclosure()
  const mode: PanelMode = useContext(PanelContext)
  const height = useAppSelector(s => selectContentHeight(s, mode))

  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const thumbnailsIsOpen = useAppSelector(s =>
    selectThumbnailsPanelOpen(s, mode)
  )
  const {doc} = useCurrentDoc()
  const {docVer} = useCurrentDocVer()
  /* generate first batch of previews: for pages and for their thumbnails */
  const allPreviewsAreAvailable = useGeneratePreviews({
    docVer: docVer,
    pageNumber: 1,
    pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
    imageSize: "md"
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

  if (!doc) {
    return <Loader type="oval" />
  }

  if (!docVer) {
    return <Loader type="dots" />
  }

  if (!allPreviewsAreAvailable) {
    return <Loader type="bars" />
  }

  return (
    <div>
      <ActionButtons doc={doc} isFetching={false} isError={false} />
      <Group justify="space-between">
        <Breadcrumbs breadcrumb={doc?.breadcrumb} onClick={onClick} />
        <DocumentDetailsToggle />
      </Group>
      <Flex ref={ref} className={classes.inner} style={{height: `${height}px`}}>
        {thumbnailsIsOpen && <ThumbnailList />}
        <ThumbnailsToggle />
        <PageList />
        <DocumentDetails doc={doc} docID={doc?.id} isLoading={false} />
        <PagesHaveChangedDialog docID={doc.id} />
        <ContextMenu
          isFetching={false}
          isError={false}
          opened={opened}
          position={contextMenuPosition}
          onChange={onContextMenuChange}
        />
      </Flex>
    </div>
  )
}
