import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Checkbox, Stack} from "@mantine/core"
import {IconUsers} from "@tabler/icons-react"

import {selectCurrentNodeID} from "@/features/ui/panelRegistry"
import {dragNodesStarted} from "@/features/ui/uiSlice"

import Thumbnail from "@/components/NodeThumbnail/Thumbnail"
import Tags from "@/features/nodes/components/Commander/NodesCommander/Node/Tags"
import type {NodeType} from "@/types"
import classes from "./Document.module.scss"

import {usePanel} from "@/features/ui/hooks/usePanel"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
  onDragStart: (nodeID: string, event: React.DragEvent) => void
  onDrag: (nodeID: string, event: React.DragEvent) => void
  onSelect: (nodeID: string, checked: boolean) => void
  cssClassNames: string[]
  selectedItems?: Set<string>
}

export default function Document({
  node,
  onClick,
  onDrag,
  onDragStart,
  onSelect,
  cssClassNames,
  selectedItems = new Set()
}: Args) {
  const {panelId} = usePanel()

  const currentFolderID = useAppSelector(s => selectCurrentNodeID(s, panelId))

  const dispatch = useAppDispatch()
  const tagNames = node.tags.map(t => t.name)

  const onDragStartLocal = (e: React.DragEvent) => {
    const data = {
      nodes: [node.id, ...selectedItems],
      sourceFolderID: currentFolderID!
    }
    dispatch(dragNodesStarted(data))
    onDragStart(node.id, e)
  }

  const onDragEnd = () => {}

  const onDragLocal = (e: React.DragEvent) => {
    onDrag(node.id, e)
  }

  return (
    <Stack
      className={`${classes.document} ${cssClassNames.join(" ")}`}
      draggable
      onDragStart={onDragStartLocal}
      onDrag={onDragLocal}
      onDragEnd={onDragEnd}
    >
      <Checkbox
        onChange={event => onSelect(node.id, event.currentTarget.checked)}
        checked={selectedItems.has(node.id)}
      />
      <a onClick={() => onClick(node)}>
        {node.is_shared && <IconUsers className={classes.iconUsers} />}
        <Thumbnail nodeID={node.id} />
        <Tags names={tagNames} />
        <div className={classes.title}>{node.title}</div>
      </a>
    </Stack>
  )
}
