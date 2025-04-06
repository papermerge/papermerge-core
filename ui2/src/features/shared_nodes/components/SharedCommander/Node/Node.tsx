import {useAppSelector} from "@/app/hooks"
import {DRAGGED} from "@/cconstants"
import {selectDraggedNodeIDs} from "@/features/ui/uiSlice"
import type {NodeType} from "@/types"
import {useEffect, useState} from "react"
import Document from "./Document/Document"
import Folder from "./Folder/Folder"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
}

export default function Node({node, onClick}: Args) {
  const [cssClassNames, setCssClassNames] = useState<Array<string>>([])
  const draggedNodesIDs = useAppSelector(selectDraggedNodeIDs)

  useEffect(() => {
    const node_is_being_dragged = draggedNodesIDs?.includes(node.id)
    if (node_is_being_dragged) {
      if (cssClassNames.indexOf(DRAGGED) < 0) {
        setCssClassNames([...cssClassNames, DRAGGED])
      }
    } else {
      setCssClassNames(
        // remove css class
        cssClassNames.filter(item => item !== DRAGGED)
      )
    }
  }, [draggedNodesIDs?.length])

  if (node.ctype == "folder") {
    return (
      <Folder onClick={onClick} node={node} cssClassNames={cssClassNames} />
    )
  }

  return (
    <Document onClick={onClick} node={node} cssClassNames={cssClassNames} />
  )
}
