import type { NodeType, NodeList } from 'types';
import { Rectangle } from 'utils/geometry';
import { Point } from 'utils/geometry';


export function is_empty<T>(value: T[]): boolean {
  if (!value) {
    return true;
  }

  if (value.length === 0) {
    return true;
  }

  return false;
}

export function get_node_under_cursor(
  node_id: string,
  nodesList: NodeList,
  nodesRefMap: Map<string, NodeType>,
  event: React.DragEvent
): NodeType | undefined {

  return nodesList.find((item: NodeType) => {
    // @ts-ignore
    const node = nodesRefMap.get(item.id) as HTMLDivElement;
    const item_rect = new Rectangle();
    const point = new Point();

    if (!node) {
      console.log(`Node ${item.title} not found in refs map`);
      return false;
    }

    item_rect.from_dom_rect(
      node.getBoundingClientRect()
    );

    point.from_drag_event(event);

    if (node_id != item.id && item_rect.contains(point)) {
      return true;
    }

    return false;
  });

}
