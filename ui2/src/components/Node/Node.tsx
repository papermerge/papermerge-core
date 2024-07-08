import type {NodeType} from "@/types"
import Document from "./Document/Document"
import Folder from "./Folder/Folder"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
}

export default function Node({node, onClick}: Args) {
  if (node.ctype == "folder") {
    return <Folder onClick={onClick} node={node} />
  }

  return <Document onClick={onClick} node={node} />
}
