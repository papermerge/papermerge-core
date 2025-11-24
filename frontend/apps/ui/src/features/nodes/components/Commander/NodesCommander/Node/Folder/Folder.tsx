import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Checkbox, Stack} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconUsers} from "@tabler/icons-react"
import {useState} from "react"

import {selectCurrentNodeID} from "@/features/ui/panelRegistry"
import {
  dragNodesStarted,
  selectDraggedNodes,
  selectDraggedNodesSourceFolderID
} from "@/features/ui/uiSlice"

import DropNodesModal from "@/features/nodes/components/Commander/NodesCommander/DropNodesDialog"
import Tags from "@/features/nodes/components/Commander/NodesCommander/Node/Tags"
import type {NodeType} from "@/types"
import classes from "./Folder.module.scss"

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

export default function Folder({
  node,
  onClick,
  onDrag,
  onDragStart,
  onSelect,
  cssClassNames,
  selectedItems = new Set()
}: Args) {
  const [dropNodesOpened, {open: dropNodesOpen, close: dropNodesClose}] =
    useDisclosure(false)
  const [dragOver, setDragOver] = useState<boolean>(false)
  const {panelId} = usePanel()
  const currentFolderID = useAppSelector(s => selectCurrentNodeID(s, panelId))
  const dispatch = useAppDispatch()
  const tagNames = node.tags.map(t => t.name)
  const draggedNodes = useAppSelector(selectDraggedNodes)
  const draggedNodesSourceFolderID = useAppSelector(
    selectDraggedNodesSourceFolderID
  )

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
        <Checkbox
          onChange={event => onSelect(node.id, event.currentTarget.checked)}
          checked={selectedItems.has(node.id)}
        />
        <a onClick={() => onClick(node)}>
          <div className={classes.folderIcon}></div>
          {node.is_shared && <IconUsers className={classes.iconUsers} />}
          <Tags names={tagNames} node={node} />
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
