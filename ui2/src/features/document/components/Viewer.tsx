import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {Flex} from "@mantine/core"
import {useContext, useEffect} from "react"
import {useNavigate} from "react-router-dom"

import Breadcrumbs from "@/components/Breadcrumbs"
import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentQuery} from "@/features/document/apiSlice"
import {
  currentDocVerUpdated,
  currentNodeChanged,
  selectContentHeight,
  selectCurrentNodeID
} from "@/features/ui/uiSlice"
import type {NType, PanelMode} from "@/types"
import ActionButtons from "./ActionButtons"
import PagesHaveChangedDialog from "./PageHaveChangedDialog"
import Pages from "./Pages"
import Thumbnails from "./Thumbnails"
import ThumbnailsToggle from "./ThumbnailsToggle"
import classes from "./Viewer.module.css"

export default function Viewer() {
  const mode: PanelMode = useContext(PanelContext)
  const height = useAppSelector(s => selectContentHeight(s, mode))
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {currentData: doc, isSuccess} = useGetDocumentQuery(currentNodeID!)

  const onClick = (node: NType) => {
    if (mode == "secondary" && node.ctype == "folder") {
      dispatch(
        currentNodeChanged({id: node.id, ctype: "folder", panel: "secondary"})
      )
    } else if (mode == "main" && node.ctype == "folder") {
      navigate(`/folder/${node.id}`)
    }
  }

  useEffect(() => {
    if (isSuccess && doc) {
      const maxVerNum = Math.max(...doc.versions.map(v => v.number))
      const docVer = doc.versions.find(v => v.number == maxVerNum)
      if (docVer) {
        dispatch(currentDocVerUpdated({mode: mode, docVerID: docVer.id}))
      }
    }
  }, [isSuccess, doc])

  return (
    <div>
      <ActionButtons />
      <Breadcrumbs breadcrumb={doc?.breadcrumb} onClick={onClick} />
      <Flex className={classes.inner} style={{height: `${height}px`}}>
        <Thumbnails />
        <ThumbnailsToggle />
        <Pages />
        <PagesHaveChangedDialog />
      </Flex>
    </div>
  )
}
