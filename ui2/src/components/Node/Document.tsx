import type {NodeType} from "@/types"

type Args = {
  node: NodeType
}

export default function Document({node}: Args) {
  return <div>{node.title}</div>
}
