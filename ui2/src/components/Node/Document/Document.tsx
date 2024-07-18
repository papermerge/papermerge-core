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
import {useProtectedJpg} from "@/hooks/protected_image"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
}

export default function Document({node, onClick}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const selectedIds = useSelector((state: RootState) =>
    selectSelectedNodeIds(state, mode)
  ) as Array<string>
  const protected_image = useProtectedJpg(node.thumbnail_url)
  const dispatch = useDispatch()
  const tagNames = node.tags.map(t => t.name)

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
        <img src={protected_image.data || ""} />
        <Tags names={tagNames} />
        <div className="title">{node.title}</div>
      </a>
    </div>
  )
}
