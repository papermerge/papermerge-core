import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {Flex, Group, Loader} from "@mantine/core"
import {useContext, useEffect} from "react"
import {useNavigate} from "react-router-dom"

import Breadcrumbs from "@/components/Breadcrumbs"
import PanelContext from "@/contexts/PanelContext"
import useDownloadLastDocVerFile from "@/features/document/hooks/useDownloadLastDocVerFile"
import useGeneratePreviews from "@/features/document/hooks/useGeneratePreviews"
import {useRef, useState} from "react"

import {HIDDEN} from "@/cconstants"
import ActionButtons from "@/components/document/ActionButtons"
import ContextMenu from "@/components/document/Contextmenu"
import DocumentDetails from "@/components/document/DocumentDetails/DocumentDetails"
import DocumentDetailsToggle from "@/components/document/DocumentDetailsToggle"
import PagesHaveChangedDialog from "@/components/document/PageHaveChangedDialog"
import ThumbnailsToggle from "@/components/document/ThumbnailsToggle"
import classes from "@/components/document/Viewer.module.css"
import PageList from "@/features/document/components/PageList"
import ThumbnailList from "@/features/document/components/ThumbnailList"
import useAreAllPreviewsAvailable from "@/features/document/hooks/useAreAllPreviewsAvailable"
import {DocumentType, DocumentVersion} from "@/features/document/types"
import {
  currentDocVerUpdated,
  currentNodeChanged,
  selectContentHeight
} from "@/features/ui/uiSlice"
import type {Coord, NType, PanelMode} from "@/types"
import {useDisclosure} from "@mantine/hooks"

interface Args {
  doc: DocumentType
  docVer: DocumentVersion
}

export default function Viewer({doc, docVer}: Args) {
  const ref = useRef<HTMLDivElement>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<Coord>(HIDDEN)
  const [opened, {open, close}] = useDisclosure()
  const mode: PanelMode = useContext(PanelContext)
  const height = useAppSelector(s => selectContentHeight(s, mode))
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const allPreviewsAreAvailable = useAreAllPreviewsAvailable({
    docVer,
    pageNumber: 1,
    pageSize: 10
  })

  useGeneratePreviews({
    docVer,
    pageNumber: 1,
    pageSize: 10
  })

  useDownloadLastDocVerFile({
    docID: doc.id,
    previewsAreAvailable: allPreviewsAreAvailable
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

  useEffect(() => {
    if (docVer) {
      dispatch(currentDocVerUpdated({mode: mode, docVerID: docVer.id}))
    }
  }, [docVer])

  if (!allPreviewsAreAvailable) {
    console.log(`Not all previews are available!`)
    return <Loader type="dots" />
  }

  return (
    <div>
      <ActionButtons doc={doc} isFetching={false} isError={false} />
      <Group justify="space-between">
        <Breadcrumbs breadcrumb={doc?.breadcrumb} onClick={onClick} />
        <DocumentDetailsToggle />
      </Group>
      <Flex ref={ref} className={classes.inner} style={{height: `${height}px`}}>
        <ThumbnailList docVerID={docVer.id} />
        <ThumbnailsToggle />
        <PageList docVerID={docVer.id} />
        <DocumentDetails doc={doc} docID={doc.id} isLoading={false} />
        <PagesHaveChangedDialog />
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
