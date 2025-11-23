import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Checkbox, Stack} from "@mantine/core"
import {IconUsers} from "@tabler/icons-react"

import {selectCurrentNodeID} from "@/features/ui/panelRegistry"
import {
  commanderSelectionNodeAdded,
  commanderSelectionNodeRemoved,
  dragNodesStarted,
  selectSelectedNodeIds
} from "@/features/ui/uiSlice"

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
  cssClassNames: string[]
}

export default function Document({
  node,
  onClick,
  onDrag,
  onDragStart,
  cssClassNames
}: Args) {
  const {panelId} = usePanel()
  const selectedIds = useAppSelector(s =>
    selectSelectedNodeIds(s, panelId)
  ) as Array<string>

  const currentFolderID = useAppSelector(s => selectCurrentNodeID(s, panelId))

  const dispatch = useAppDispatch()
  const tagNames = node.tags.map(t => t.name)

  const onCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(commanderSelectionNodeAdded({itemID: node.id, mode: panelId}))
    } else {
      dispatch(commanderSelectionNodeRemoved({itemID: node.id, mode: panelId}))
    }
  }

  const onDragStartLocal = (e: React.DragEvent) => {
    const data = {
      nodes: [node.id, ...selectedIds],
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
      <Checkbox onChange={onCheck} checked={selectedIds.includes(node.id)} />
      <a onClick={() => onClick(node)}>
        {node.is_shared && <IconUsers className={classes.iconUsers} />}
        <Thumbnail nodeID={node.id} />
        <Tags names={tagNames} />
        <div className={classes.title}>{node.title}</div>
      </a>
    </Stack>
  )
}
