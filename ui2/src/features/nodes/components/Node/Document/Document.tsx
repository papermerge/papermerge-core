import {useContext} from "react"
import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Checkbox} from "@mantine/core"

import {
  commanderSelectionNodeAdded,
  commanderSelectionNodeRemoved,
  selectSelectedNodeIds
} from "@/features/ui/uiSlice"

import Tags from "@/features/nodes/components/Node/Tags"
import type {NodeType, PanelMode} from "@/types"
import classes from "./Document.module.scss"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentThumbnailQuery} from "@/features/nodes/apiSlice"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
}

export default function Document({node, onClick}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const selectedIds = useAppSelector(s =>
    selectSelectedNodeIds(s, mode)
  ) as Array<string>
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

  return (
    <div className={classes.document}>
      <Checkbox onChange={onCheck} checked={selectedIds.includes(node.id)} />
      <a onClick={() => onClick(node)}>
        <img src={data} />
        <Tags names={tagNames} />
        <div className={classes.title}>{node.title}</div>
      </a>
    </div>
  )
}
