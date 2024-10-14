import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Checkbox, Stack} from "@mantine/core"
import {useContext} from "react"

import {
  commanderSelectionNodeAdded,
  commanderSelectionNodeRemoved,
  dragNodesStarted,
  selectCurrentNodeID,
  selectSelectedNodeIds
} from "@/features/ui/uiSlice"

import Tags from "@/features/nodes/components/Commander/NodesCommander/Node/Tags"
import type {NodeType, PanelMode} from "@/types"
import classes from "./Document.module.scss"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentThumbnailQuery} from "@/features/nodes/apiSlice"

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
  const mode: PanelMode = useContext(PanelContext)
  const selectedIds = useAppSelector(s =>
    selectSelectedNodeIds(s, mode)
  ) as Array<string>
  const currentFolderID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {data} = useGetDocumentThumbnailQuery(node.id)
  const dispatch = useAppDispatch()
  const tagNames = node.tags.map(t => t.name)

  const onCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(commanderSelectionNodeAdded({itemID: node.id, mode}))
    } else {
      dispatch(commanderSelectionNodeRemoved({itemID: node.id, mode}))
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
        <img src={data} />
        <Tags names={tagNames} />
        <div className={classes.title}>{node.title}</div>
      </a>
    </Stack>
  )
}
