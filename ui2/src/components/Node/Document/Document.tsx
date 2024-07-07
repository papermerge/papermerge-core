import {useDispatch, useSelector} from "react-redux"
import {Checkbox} from "@mantine/core"

import {
  selectSelectedNodeIds,
  selectionAddNode,
  selectionRemoveNode
} from "@/slices/dualPanel"

import type {NodeType, PanelMode} from "@/types"
import classes from "./Document.module.css"
import {RootState} from "@/app/types"

type Args = {
  node: NodeType
  mode: PanelMode
  onClick: (node: NodeType) => void
}

export default function Document({node, mode, onClick}: Args) {
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
    <div className={classes.document}>
      <Checkbox onChange={onCheck} checked={selectedIds.includes(node.id)} />
      <a onClick={() => onClick(node)}>
        <img className={classes.documentIcon} src={node.thumbnail_url!}></img>
        <div className="title">{node.title}</div>
      </a>
    </div>
  )
}
