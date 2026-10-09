import {APP_NODE_KEY} from "@/features/nodes/constants"

// set on drags that start inside the folder tree
export const TREE_NODE_KEY = "text/app-tree-node"

function hasType(event: React.DragEvent, type: string): boolean {
  return Array.from(event.dataTransfer.types).includes(type)
}

/** `dataTransfer.types` is readable during dragenter/dragover (data is not) */
export function isNodeDrag(event: React.DragEvent): boolean {
  return hasType(event, APP_NODE_KEY)
}

export function isTreeNodeDrag(event: React.DragEvent): boolean {
  return hasType(event, TREE_NODE_KEY)
}
