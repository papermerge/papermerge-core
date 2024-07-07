import {Group} from "@mantine/core"

import {useSelector, useDispatch} from "react-redux"
import {useNavigate} from "react-router-dom"

import FolderNodeActions from "@/components/FolderNodeActions"
import Node from "@/components/Node"
import {
  selectPanelNodes,
  setCurrentNode,
  fetchPaginatedNodes
} from "@/slices/dualPanel"

import type {RootState} from "@/app/types"
import type {NType, NodeType, PanelMode} from "@/types"
import Breadcrumbs from "@/components/Breadcrumbs"

type Args = {
  mode: PanelMode
}

export default function Commander({mode}: Args) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const {data, status, error} = useSelector((state: RootState) =>
    selectPanelNodes(state, mode)
  )

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

  const nodes = data.map((n: NodeType) => (
    <Node onClick={onClick} key={n.id} node={n} />
  ))

  if (nodes.length > 0) {
    return (
      <div>
        <FolderNodeActions mode={mode} />
        <Breadcrumbs mode={mode} onClick={onClick} />
        <Group>{nodes}</Group>
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
