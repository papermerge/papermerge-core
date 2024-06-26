import {Checkbox} from "@mantine/core"
import {NavLink} from "react-router-dom"

import type {NodeType} from "@/types"
import classes from "./Document.module.css"

type Args = {
  node: NodeType
  onClick: (node: NodeType) => void
}

export default function Document({node, onClick}: Args) {
  return (
    <div className={classes.document}>
      <Checkbox />
      <a onClick={() => onClick(node)}>
        <img className={classes.documentIcon} src={node.thumbnail_url!}></img>
        <div className="title">{node.title}</div>
      </a>
    </div>
  )
}
