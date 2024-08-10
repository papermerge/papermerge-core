import {Flex} from "@mantine/core"
import {useContext} from "react"
import {useDispatch, useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"

import {
  fetchPaginatedNodes,
  setCurrentNode,
  selectLastPageSize
} from "@/slices/dualPanel/dualPanel"
import type {RootState} from "@/app/types"
import type {PanelMode, NType} from "@/types"
import Breadcrumbs from "@/components/Breadcrumbs"
import PanelContext from "@/contexts/PanelContext"
import {selectContentHeight} from "@/slices/sizes"
import ActionButtons from "./ActionButtons"
import ThumbnailsToggle from "./ThumbnailsToggle"
import Pages from "./Pages"
import Thumbnails from "./Thumbnails"
import classes from "./Viewer.module.css"

export default function Viewer() {
  const mode: PanelMode = useContext(PanelContext)
  const height = useSelector((state: RootState) =>
    selectContentHeight(state, mode)
  )
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const lastPageSize = useSelector((state: RootState) =>
    selectLastPageSize(state, mode)
  )

  const onClick = (node: NType) => {
    if (mode == "secondary" && node.ctype == "folder") {
      dispatch(
        fetchPaginatedNodes({
          nodeId: node.id,
          panel: "secondary",
          urlParams: new URLSearchParams(`page_size=${lastPageSize}`)
        })
      )
      dispatch(
        setCurrentNode({
          node: {id: node.id, ctype: "folder", breadcrumb: null},
          panel: "secondary"
        })
      )
    } else if (mode == "main" && node.ctype == "folder") {
      navigate(`/folder/${node.id}`)
    }
  }

  return (
    <div>
      <ActionButtons />
      <Breadcrumbs onClick={onClick} />
      <Flex className={classes.inner} style={{height: `${height}px`}}>
        <Thumbnails />
        <ThumbnailsToggle />
        <Pages />
      </Flex>
    </div>
  )
}
