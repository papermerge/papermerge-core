import {NodeType, NType} from "@/types"
import {useEffect, useMemo} from "react"
import Node from "./Node"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {selectNodesWithoutExistingThumbnails} from "@/features/nodes/storage/selectors"
import {loadThumbnail} from "@/features/nodes/storage/thumbnailObjectsSlice"
import {getBaseURL, getDefaultHeaders} from "@/utils"
import type {ImageResourceStatus} from "hooks"
import {useDocumentThumbnailPolling} from "hooks"

interface Args {
  items: NodeType[]
  onClick: (node: NType) => void
}

export default function NodesList({items, onClick}: Args) {
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

  useEffect(() => {
    if (previews && previews.length > 0) {
      previews.forEach((p: ImageResourceStatus) => {
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
    <Node onClick={onClick} key={n.id} node={n} />
  ))
}
