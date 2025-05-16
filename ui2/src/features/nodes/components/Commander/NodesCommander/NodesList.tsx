import {documentThumbnailUpdated} from "@/features/nodes/nodesSlice"
import {documentThumbnailUpdated as sharedNodesdocumentThumbnailUpdated} from "@/features/shared_nodes/sharedNodesSlice"
import {NodeType, NType} from "@/types"
import {useEffect} from "react"
import Node from "./Node"

import {useAppDispatch} from "@/app/hooks"
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
  const dispatch = useAppDispatch()
  const {updatedPreviews} = usePreviewPolling(
    items.map(n => n.id),
    {
      pollIntervalMs: 3000,
      maxRetries: 10
    }
  )

  useEffect(() => {
    Object.entries(updatedPreviews).forEach(([docId, preview]) => {
      console.log(`🆕 Preview changed for ${docId}: ${preview.url}`)
      // e.g., update document state in parent component or make a backend call
      dispatch(
        documentThumbnailUpdated({
          document_id: docId,
          thumbnail_url: preview.url
        })
      )
      dispatch(
        sharedNodesdocumentThumbnailUpdated({
          document_id: docId,
          thumbnail_url: preview.url
        })
      )
    })
  }, [updatedPreviews])

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
