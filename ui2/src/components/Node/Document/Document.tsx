import {useContext} from "react"
import {useDispatch, useSelector} from "react-redux"
import {Checkbox} from "@mantine/core"

import {
  selectSelectedNodeIds,
  selectionAddNode,
  selectionRemoveNode
} from "@/slices/dualPanel/dualPanel"

import Tags from "@/components/Node/Tags"
import type {NodeType, PanelMode} from "@/types"
import classes from "./Document.module.css"
import {RootState} from "@/app/types"
import PanelContext from "@/contexts/PanelContext"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
}

export default function Document({node, onClick}: Args) {
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
    <div className={classes.document}>
      <Checkbox onChange={onCheck} checked={selectedIds.includes(node.id)} />
      <a onClick={() => onClick(node)}>
        <img className={classes.documentIcon} src={node.thumbnail_url!}></img>
        <Tags tags={node.tags} />
        <div className="title">{node.title}</div>
      </a>
    </div>
  )
}
