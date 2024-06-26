import {Group} from "@mantine/core"
import {PanelMode} from "@/types"
import {useSelector} from "react-redux"

import FolderNodeActions from "@/components/FolderNodeActions"
import Node from "@/components/Node"
import {selectPanelNodes} from "@/slices/dualPanel"

import type {RootState} from "@/app/types"
import type {NodeType} from "@/types"

type Args = {
  mode: PanelMode
}

export default function Commander({mode}: Args) {
  const {data, status, error} = useSelector((state: RootState) =>
    selectPanelNodes(state, "main")
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

  const nodes = data.map((n: NodeType) => <Node key={n.id} node={n} />)

  if (nodes.length > 0) {
    return (
      <div>
        <FolderNodeActions mode={mode} />
        <Group>{nodes}</Group>
      </div>
    )
  }

  return (
    <div>
      <FolderNodeActions mode={mode} />
      <Group>Empty</Group>
    </div>
  )
}
