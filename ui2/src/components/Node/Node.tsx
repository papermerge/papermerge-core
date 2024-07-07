import type {NodeType, PanelMode} from "@/types"
import Document from "./Document/Document"
import Folder from "./Folder/Folder"

type Args = {
  node: NodeType
  mode: PanelMode
  onClick: (node: NodeType) => void
}

export default function Node({node, mode, onClick}: Args) {
  if (node.ctype == "folder") {
    return <Folder onClick={onClick} node={node} mode={mode} />
  }

  return <Document onClick={onClick} node={node} mode={mode} />
}
