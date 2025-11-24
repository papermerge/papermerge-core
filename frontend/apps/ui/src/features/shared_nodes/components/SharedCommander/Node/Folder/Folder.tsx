import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Checkbox, Stack} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {useContext, useState} from "react"

import {
  selectDraggedNodes,
  selectDraggedNodesSourceFolderID
} from "@/features/ui/uiSlice"

import DropNodesModal from "@/features/nodes/components/Commander/NodesCommander/DropNodesDialog"
import Tags from "@/features/nodes/components/Commander/NodesCommander/Node/Tags"
import type {NodeType, PanelMode} from "@/types"
import classes from "./Folder.module.scss"

import PanelContext from "@/contexts/PanelContext"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
  cssClassNames: string[]
}

export default function Folder({node, onClick, cssClassNames}: Args) {
  const [dropNodesOpened, {open: dropNodesOpen, close: dropNodesClose}] =
    useDisclosure(false)
  const [dragOver, setDragOver] = useState<boolean>(false)
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const tagNames = node.tags.map(t => t.name)
  const draggedNodes = useAppSelector(selectDraggedNodes)
  const draggedNodesSourceFolderID = useAppSelector(
    selectDraggedNodesSourceFolderID
  )

  const onCheck = (e: React.ChangeEvent<HTMLInputElement>) => {}

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
        onDragOver={onLocalDragOver}
        onDragLeave={onLocalDragLeave}
        onDragEnter={onLocalDragEnter}
        onDrop={onLocalDrop}
      >
        <Checkbox onChange={onCheck} checked={false} />
        <a onClick={() => onClick(node)}>
          <div className={classes.folderIcon}></div>
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
