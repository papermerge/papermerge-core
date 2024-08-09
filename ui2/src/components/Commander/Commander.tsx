import {useContext} from "react"
import {Group, Stack} from "@mantine/core"

import {useSelector, useDispatch} from "react-redux"
import {useNavigate} from "react-router-dom"

import FolderNodeActions from "@/components/Commander/FolderNodeActions"
import Node from "@/components/Node"
import {
  selectPanelNodes,
  setCurrentNode,
  fetchPaginatedNodes,
  selectPagination,
  selectLastPageSize,
  selectCurrentFolderID,
  selectCommanderPageSize,
  selectCommanderPageNumber,
  fetchPaginatedDocument
} from "@/slices/dualPanel/dualPanel"

import type {RootState} from "@/app/types"
import type {NType, NodeType, PanelMode} from "@/types"
import Breadcrumbs from "@/components/Breadcrumbs"
import Pagination from "@/components/Pagination"
import PanelContext from "@/contexts/PanelContext"
import {selectContentHeight} from "@/slices/sizes"
import classes from "./Commander.module.css"

export default function Commander() {
  const mode: PanelMode = useContext(PanelContext)
  const height = useSelector((state: RootState) =>
    selectContentHeight(state, mode)
  )
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {data, status, error} = useSelector((state: RootState) =>
    selectPanelNodes(state, mode)
  )
  const currentNodeID = useSelector((state: RootState) =>
    selectCurrentFolderID(state, mode)
  )
  const pagination = useSelector((state: RootState) =>
    selectPagination(state, mode)
  )
  const lastPageSize = useSelector((state: RootState) =>
    selectLastPageSize(state, mode)
  )
  const pageSize = useSelector((state: RootState) =>
    selectCommanderPageSize(state, mode)
  )
  const pageNumber = useSelector((state: RootState) =>
    selectCommanderPageNumber(state, mode)
  )

  if (status === "loading" && !data) {
    return <div>Loading...</div>
  }

  if (status === "failed") {
    return <div>{error}</div>
  }

  if (!data) {
    return (
      <div>
        Data is null Error: {error}
        Status: {status}
      </div>
    )
  }

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
      navigate(`/folder/${node.id}?page_size=${lastPageSize}`)
    }

    if (mode == "main" && node.ctype == "document") {
      navigate(`/document/${node.id}`)
    } else if (mode == "secondary" && node.ctype == "document") {
      dispatch(
        fetchPaginatedDocument({
          nodeId: node.id,
          panel: "secondary",
          urlParams: new URLSearchParams(`page_size=${lastPageSize}`)
        })
      )
    }
  }

  const onPageNumberChange = (page: number) => {
    dispatch(
      fetchPaginatedNodes({
        nodeId: currentNodeID!,
        panel: mode,
        urlParams: new URLSearchParams(
          `page_number=${page}&page_size=${pageSize}`
        )
      })
    )
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      dispatch(
        fetchPaginatedNodes({
          nodeId: currentNodeID!,
          panel: mode,
          urlParams: new URLSearchParams(
            `page_number=${pageNumber}&page_size=${value}`
          )
        })
      )
    }
  }

  const nodes = data.map((n: NodeType) => (
    <Node onClick={onClick} key={n.id} node={n} />
  ))

  if (nodes.length > 0) {
    return (
      <div>
        <FolderNodeActions />
        <Breadcrumbs onClick={onClick} />
        <Stack
          className={classes.content}
          justify={"space-between"}
          style={{height: `${height}px`}}
        >
          <Group>{nodes}</Group>
          <Pagination
            pagination={pagination}
            onPageNumberChange={onPageNumberChange}
            onPageSizeChange={onPageSizeChange}
            lastPageSize={lastPageSize}
          />
        </Stack>
      </div>
    )
  }

  return (
    <div>
      <FolderNodeActions />
      <Breadcrumbs className={`${mode}-breadcrumb`} onClick={onClick} />
      <Group>Empty</Group>
    </div>
  )
}
