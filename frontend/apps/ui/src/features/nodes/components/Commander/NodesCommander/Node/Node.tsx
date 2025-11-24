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
  onSelect: (nodeID: string, checked: boolean) => void
  onDragStart: (nodeID: string, event: React.DragEvent) => void
  onDrag: (nodeID: string, event: React.DragEvent) => void
  selectedItems?: Set<string>
}

export default function Node({
  node,
  onClick,
  onDrag,
  onDragStart,
  onSelect,
  selectedItems
}: Args) {
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
      <Folder
        onClick={onClick}
        node={node}
        selectedItems={selectedItems}
        onDrag={onDrag}
        onSelect={onSelect}
        onDragStart={onDragStart}
        cssClassNames={cssClassNames}
      />
    )
  }

  return (
    <Document
      onClick={onClick}
      node={node}
      onSelect={onSelect}
      selectedItems={selectedItems}
      onDrag={onDrag}
      onDragStart={onDragStart}
      cssClassNames={cssClassNames}
    />
  )
}
