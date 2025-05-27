import {NodeType, NType} from "@/types"
import {useEffect, useMemo} from "react"
import Node from "./Node"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {selectNodesWithoutExistingThumbnails} from "@/features/nodes/selectors"
import {loadThumbnail} from "@/features/nodes/thumbnailObjectsSlice"
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
  const documentIds = useMemo(
    () => items.filter(n => n.ctype == "document").map(n => n.id),
    [items]
  )
  const nodesWithoutThumbnails = useAppSelector(
    selectNodesWithoutExistingThumbnails(documentIds)
  )
  const {previews} = useDocThumbnailPolling(nodesWithoutThumbnails, {
    pollIntervalMs: 3000,
    maxRetries: 6
  })

  useEffect(() => {
    Object.entries(previews).forEach(([docId, preview]) => {
      dispatch(
        loadThumbnail({
          node_id: docId,
          status: preview.status,
          url: preview.url
        })
      )
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
