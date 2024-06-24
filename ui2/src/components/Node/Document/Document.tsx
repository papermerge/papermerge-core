import {Checkbox} from "@mantine/core"
import {NavLink} from "react-router-dom"

import type {NodeType} from "@/types"
import classes from "./Document.module.css"

type Args = {
  node: NodeType
}

export default function Document({node}: Args) {
  return (
    <div className={classes.document}>
      <Checkbox />
      <NavLink to={`/document/${node.id}`}>
        <img className={classes.documentIcon} src={node.thumbnail_url!}></img>
        <div>{node.title}</div>
      </NavLink>
    </div>
  )
}
