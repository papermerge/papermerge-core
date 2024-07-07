import {useState} from "react"
import {Group} from "@mantine/core"

import {useSelector, useDispatch} from "react-redux"
import {useNavigate} from "react-router-dom"

import FolderNodeActions from "@/components/FolderNodeActions"
import Node from "@/components/Node"
import {
  selectPanelNodes,
  setCurrentNode,
  fetchPaginatedNodes,
  selectPagination,
  selectLastPageSize,
  selectCurrentFolderID
} from "@/slices/dualPanel"

import type {RootState} from "@/app/types"
import type {NType, NodeType, PanelMode} from "@/types"
import Breadcrumbs from "@/components/Breadcrumbs"
import Pagination from "@/components/Pagination"

type Args = {
  mode: PanelMode
}

export default function Commander({mode}: Args) {
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
  const [pageSize, setPageSize] = useState<number>(lastPageSize)
  const [pageNumber, setPageNumber] = useState<number>(1)

  if (status === "loading") {
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
          folderId: node.id,
          panel: "secondary",
          urlParams: new URLSearchParams("")
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

  const onPageNumberChange = (page: number) => {
    dispatch(
      fetchPaginatedNodes({
        folderId: currentNodeID!,
        panel: mode,
        urlParams: new URLSearchParams(
          `page_number=${page}&page_size=${pageSize}`
        )
      })
    )
    setPageNumber(page)
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      dispatch(
        fetchPaginatedNodes({
          folderId: currentNodeID!,
          panel: mode,
          urlParams: new URLSearchParams(
            `page_number=${pageNumber}&page_size=${value}`
          )
        })
      )
      setPageSize(parseInt(value))
    }
  }

  const nodes = data.map((n: NodeType) => (
    <Node onClick={onClick} key={n.id} node={n} />
  ))

  if (nodes.length > 0) {
    return (
      <div>
        <FolderNodeActions mode={mode} />
        <Breadcrumbs mode={mode} onClick={onClick} />
        <Group>{nodes}</Group>
        <Pagination
          pagination={pagination}
          onPageNumberChange={onPageNumberChange}
          onPageSizeChange={onPageSizeChange}
          lastPageSize={lastPageSize}
        />
      </div>
    )
  }

  return (
    <div>
      <FolderNodeActions mode={mode} />
      <Breadcrumbs mode={mode} onClick={onClick} />
      <Group>Empty</Group>
    </div>
  )
}
