import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Checkbox, Stack} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {useContext, useState} from "react"

import {
  commanderSelectionNodeAdded,
  commanderSelectionNodeRemoved,
  dragNodesStarted,
  selectCurrentNodeID,
  selectDraggedNodes,
  selectDraggedNodesSourceFolderID,
  selectSelectedNodeIds
} from "@/features/ui/uiSlice"

import DropNodesModal from "@/features/nodes/components/Commander/NodesCommander/DropNodesDialog"
import Tags from "@/features/nodes/components/Commander/NodesCommander/Node/Tags"
import type {NodeType, PanelMode} from "@/types"
import classes from "./Folder.module.scss"

import PanelContext from "@/contexts/PanelContext"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
  onDragStart: (nodeID: string, event: React.DragEvent) => void
  onDrag: (nodeID: string, event: React.DragEvent) => void
  cssClassNames: string[]
}

export default function Folder({
  node,
  onClick,
  onDrag,
  onDragStart,
  cssClassNames
}: Args) {
  const [dropNodesOpened, {open: dropNodesOpen, close: dropNodesClose}] =
    useDisclosure(false)
  const [dragOver, setDragOver] = useState<boolean>(false)
  const mode: PanelMode = useContext(PanelContext)
  const selectedIds = useAppSelector(s =>
    selectSelectedNodeIds(s, mode)
  ) as Array<string>
  const currentFolderID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const dispatch = useAppDispatch()
  const tagNames = node.tags.map(t => t.name)
  const draggedNodes = useAppSelector(selectDraggedNodes)
  const draggedNodesSourceFolderID = useAppSelector(
    selectDraggedNodesSourceFolderID
  )

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

  const onLocalDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const onLocalDragLeave = () => {
    setDragOver(false)
  }

  const onLocalDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(true)
  }

  const onLocalDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation()
    dropNodesOpen()
  }

  return (
    <>
      <Stack
        className={`${classes.folder} ${cssClassNames.join(" ")} ${dragOver ? classes.acceptFolder : ""}`}
        draggable
        onDragStart={onDragStartLocal}
        onDrag={onDragLocal}
        onDragEnd={onDragEnd}
        onDragOver={onLocalDragOver}
        onDragLeave={onLocalDragLeave}
        onDragEnter={onLocalDragEnter}
        onDrop={onLocalDrop}
      >
        <Checkbox onChange={onCheck} checked={selectedIds.includes(node.id)} />
        <a onClick={() => onClick(node)}>
          <div className={classes.folderIcon}></div>
          <Tags names={tagNames} />
          <div className={classes.title}>{node.title}</div>
        </a>
      </Stack>
      {draggedNodesSourceFolderID && (
        <DropNodesModal
          sourceNodes={draggedNodes}
          targetFolder={node}
          sourceFolderID={draggedNodesSourceFolderID}
          opened={dropNodesOpened}
          onSubmit={dropNodesClose}
          onCancel={dropNodesClose}
        />
      )}
    </>
  )
}
