import {NodeType, NType} from "@/types"
import {useEffect, useMemo} from "react"
import Node from "./Node"

import {updateAllThumbnails} from "@/actions/thumbnailActions"
import {useAppDispatch} from "@/app/hooks"
import useDocThumbnailPolling from "@/hooks/DocThumbnailPolling"

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
  const dispatch = useAppDispatch()
  const documentIds = useMemo(() => items.map(n => n.id), [items])
  const {previews} = useDocThumbnailPolling(documentIds, {
    pollIntervalMs: 3000,
    maxRetries: 10
  })

  useEffect(() => {
    Object.entries(previews).forEach(([docId, preview]) => {
      dispatch(updateAllThumbnails(docId, preview.url))
    })
  }, [previews])

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
