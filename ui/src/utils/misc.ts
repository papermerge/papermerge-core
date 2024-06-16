import type { NodeType, NodeList, DocumentVersion } from 'types';
import { Rectangle } from 'utils/geometry';
import { Point } from 'utils/geometry';
import { NodeSortFieldEnum, NodeSortOrderEnum } from 'types';
import type { SelectItem } from 'types';

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

type BuildNodesListParamArgs = {
  page_size: number;
  page_number: number;
  sort_field: NodeSortFieldEnum;
  sort_order: NodeSortOrderEnum;
}

export function build_nodes_list_params({
  page_size,
  page_number,
  sort_field,
  sort_order
}: BuildNodesListParamArgs): string {

  let result: string = `page_number=${page_number}&page_size=${page_size}`;
  let order_by: string = sort_field;

  if (sort_order == 'desc') {
    order_by = `-${sort_field}`;
  }

  result = `${result}&order_by=${order_by}`

  return result;
}



export function last_version(versions: Array<DocumentVersion>): DocumentVersion {
  /**
   * Returns last version of the document i.e. DocumentVersion
   * with biggest doc_ver.number
   * */
  const ver = versions.reduce((prevValue, curValue) => {
    if (prevValue.number > curValue.number) {
      return prevValue;
    }

    return curValue;
  }, versions[0])

  return ver;
}

export function sortItemsFn(a: SelectItem, b: SelectItem) {
  if (a.key < b.key) {
    return -1;
  } else if (a.key > b.key) {
    return 1;
  }
  return 0;
}
