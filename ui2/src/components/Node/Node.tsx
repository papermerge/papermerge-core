import type {NodeType} from "@/types"
import Document from "./Document/Document"
import Folder from "./Folder/Folder"

type Args = {
  node: NodeType
}

export default function Node({node}: Args) {
  if (node.ctype == "folder") {
    return <Folder node={node} />
  }

  return <Document node={node} />
}
