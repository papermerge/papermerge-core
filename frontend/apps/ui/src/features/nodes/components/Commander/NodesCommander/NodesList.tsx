import {NodeType, NType} from "@/types"
import {useEffect, useMemo} from "react"
import Node from "./Node"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {selectNodesWithoutExistingThumbnails} from "@/features/nodes/storage/selectors"
import {loadThumbnail} from "@/features/nodes/storage/thumbnailObjectsSlice"
import {getBaseURL, getDefaultHeaders} from "@/utils"
import {useDocumentThumbnailPolling} from "hooks"

interface Args {
  items: NodeType[]
  onClick: (node: NType) => void
  onNodeDrag: () => void
  onNodeDragStart: (nodeID: string, event: React.DragEvent) => void
  onSelectionChange: (ids: Set<string>) => void
  selectedItems?: Set<string>
}

export default function NodesList({
  items,
  onClick,
  onSelectionChange,
  onNodeDrag,
  onNodeDragStart,
  selectedItems = new Set()
}: Args) {
  const dispatch = useAppDispatch()
  const documentIds = useMemo(
    () => items.filter(n => n.ctype == "document").map(n => n.id),
    [items]
  )
  const thumbnailSelector = useMemo(
    () => selectNodesWithoutExistingThumbnails(documentIds),
    [documentIds.join(",")]
  )
  const nodesWithoutThumbnails = useAppSelector(thumbnailSelector)

  const {previews} = useDocumentThumbnailPolling({
    url: `${getBaseURL()}/api/documents/thumbnail-img-status/`,
    docIDs: nodesWithoutThumbnails,
    headers: getDefaultHeaders(),
    pollIntervalSeconds: 3,
    maxRetries: 6
  })

  const handleItemSelect = (nodeID: string, checked: boolean) => {
    if (!onSelectionChange) {
      return
    }

    const newSelection = new Set(selectedItems)
    if (checked) {
      newSelection.add(nodeID)
    } else {
      newSelection.delete(nodeID)
    }
    onSelectionChange(newSelection)
  }

  useEffect(() => {
    if (previews && previews.length > 0) {
      previews.forEach(p => {
        dispatch(
          loadThumbnail({
            node_id: p.doc_id,
            status: p.status,
            url: p.url
          })
        )
      })
    }
  }, [previews])

  return items.map((n: NodeType) => (
    <Node
      onClick={onClick}
      key={n.id}
      node={n}
      onSelect={handleItemSelect}
      selectedItems={selectedItems}
      onDrag={onNodeDrag}
      onDragStart={onNodeDragStart}
    />
  ))
}
