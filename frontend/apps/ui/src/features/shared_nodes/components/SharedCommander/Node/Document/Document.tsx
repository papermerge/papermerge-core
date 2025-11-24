import {useAppDispatch} from "@/app/hooks"
import {Checkbox, Stack} from "@mantine/core"
import {useContext} from "react"

import Tags from "@/features/nodes/components/Commander/NodesCommander/Node/Tags"
import type {NodeType, PanelMode} from "@/types"
import classes from "./Document.module.scss"

import Thumbnail from "@/components/NodeThumbnail/Thumbnail"
import PanelContext from "@/contexts/PanelContext"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
  cssClassNames: string[]
}

export default function Document({node, onClick, cssClassNames}: Args) {
  const mode: PanelMode = useContext(PanelContext)

  const dispatch = useAppDispatch()
  const tagNames = node.tags.map(t => t.name)

  const onCheck = (e: React.ChangeEvent<HTMLInputElement>) => {}

  return (
    <Stack
      className={`${classes.document} ${cssClassNames.join(" ")}`}
      draggable
    >
      <Checkbox onChange={onCheck} checked={false} />
      <a onClick={() => onClick(node)}>
        <Thumbnail nodeID={node.id} />
        <Tags names={tagNames} />
        <div className={classes.title}>{node.title}</div>
      </a>
    </Stack>
  )
}
