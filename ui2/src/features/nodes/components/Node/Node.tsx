import type {NodeType} from "@/types"
import Document from "./Document/Document"
import Folder from "./Folder/Folder"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
  onDragStart: (nodeID: string, event: React.DragEvent) => void
  onDrag: (nodeID: string, event: React.DragEvent) => void
}

export default function Node({node, onClick, onDrag, onDragStart}: Args) {
  if (node.ctype == "folder") {
    return (
      <Folder
        onClick={onClick}
        node={node}
        onDrag={onDrag}
        onDragStart={onDragStart}
      />
    )
  }

  return (
    <Document
      onClick={onClick}
      node={node}
      onDrag={onDrag}
      onDragStart={onDragStart}
    />
  )
}
