import {useContext} from "react"
import {useDispatch, useSelector} from "react-redux"
import {Checkbox} from "@mantine/core"

import {
  selectSelectedNodeIds,
  selectionAddNode,
  selectionRemoveNode
} from "@/slices/dualPanel"

import type {NodeType, PanelMode} from "@/types"
import classes from "./Folder.module.css"
import {RootState} from "@/app/types"

import PanelContext from "@/contexts/PanelContext"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
}

export default function Folder({node, onClick}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const selectedIds = useSelector((state: RootState) =>
    selectSelectedNodeIds(state, mode)
  ) as Array<string>
  const dispatch = useDispatch()

  const onCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(selectionAddNode({selectionId: node.id, mode}))
    } else {
      dispatch(selectionRemoveNode({selectionId: node.id, mode}))
    }
  }

  return (
    <div className={classes.folder}>
      <Checkbox onChange={onCheck} checked={selectedIds.includes(node.id)} />
      <a onClick={() => onClick(node)}>
        <div className={classes.folderIcon}></div>
        <div>{node.title}</div>
      </a>
    </div>
  )
}
