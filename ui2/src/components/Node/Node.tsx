import type {NodeType} from "@/types"

type Args = {
  node: NodeType
}

export default function Node({node}: Args) {
  return <div>{node.title}</div>
}
