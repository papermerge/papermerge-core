import type { NodeType } from "types";


function get_node_attr<T>(
  selected_nodes: Array<string>,
  attr: string,
  all_nodes: Array<NodeType>
): T | null {
  /*
    Returns node's tags.

    Pickup first matching (by id) node from nodes_list, and return
    its tags (node.tags). If there is no matching node - return an empty
    list.
  */
  if (selected_nodes && selected_nodes.length > 0) {
    const selected_id = selected_nodes[0];
    const found_node = all_nodes.find((item: NodeType) => item.id === selected_id);

    if (found_node) {
      // @ts-ignore
      return found_node[attr];
    }
  }

  return null;
}


export { get_node_attr };
