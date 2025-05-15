import {NodeType, NType} from "@/types"
import Node from "./Node"

import usePreviewPolling from "@/hooks/PrevewPolling"

interface Args {
  items: NodeType[]
  onClick: (node: NType) => void
  onNodeDrag: () => void
  onNodeDragStart: (nodeID: string, event: React.DragEvent) => void
}

export default function NodesList({
  items,
  onClick,
  onNodeDrag,
  onNodeDragStart
}: Args) {
  usePreviewPolling(
    items.map(n => n.id),
    {
      pollIntervalMs: 3000,
      maxRetries: 10
    }
  )

  return items.map((n: NodeType) => (
    <Node
      onClick={onClick}
      key={n.id}
      node={n}
      onDrag={onNodeDrag}
      onDragStart={onNodeDragStart}
    />
  ))
}
