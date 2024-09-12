import {useContext} from "react"
import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Checkbox} from "@mantine/core"

import {
  commanderSelectionNodeAdded,
  commanderSelectionNodeRemoved,
  selectSelectedNodeIds
} from "@/features/ui/uiSlice"

import Tags from "@/features/nodes/components/Node/Tags"
import classes from "./Folder.module.scss"
import type {NodeType, PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
}

export default function Folder({node, onClick}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const selectedIds = useAppSelector(s =>
    selectSelectedNodeIds(s, mode)
  ) as Array<string>
  const dispatch = useAppDispatch()
  const tagNames = node.tags.map(t => t.name)

  const onCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(commanderSelectionNodeAdded({itemID: node.id, mode}))
    } else {
      dispatch(commanderSelectionNodeRemoved({itemID: node.id, mode}))
    }
  }

  return (
    <div className={classes.folder}>
      <Checkbox onChange={onCheck} checked={selectedIds.includes(node.id)} />
      <a onClick={() => onClick(node)}>
        <div className={classes.folderIcon}></div>
        <Tags names={tagNames} />
        <div className={classes.title}>{node.title}</div>
      </a>
    </div>
  )
}
