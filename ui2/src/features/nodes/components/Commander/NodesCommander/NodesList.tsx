import {NodeType, NType} from "@/types"
import {useEffect, useMemo} from "react"
import Node from "./Node"

import {
  updateAllThumbnails,
  updateErrorAllThumbnails
} from "@/actions/thumbnailActions"
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
  const documentIds = useMemo(() => items.map(n => n.id), [items])
  const {previews, previewError} = usePreviewPolling(documentIds, {
    pollIntervalMs: 3000,
    maxRetries: 10
  })

  useEffect(() => {
    Object.entries(previews).forEach(([docId, preview]) => {
      dispatch(updateAllThumbnails(docId, preview.url))
    })
    previewError.map(pe => {
      dispatch(updateErrorAllThumbnails(pe.document_id, pe.error))
    })
  }, [previews, previewError])

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
