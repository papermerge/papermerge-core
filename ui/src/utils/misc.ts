import type { NodeType, NodeList, PageAndRotOp, PageType, DroppedThumbnailPosition } from 'types';
import { Rectangle } from 'utils/geometry';
import { Point } from 'utils/geometry';
import { NodeSortFieldEnum, NodeSortOrderEnum } from 'types';

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

type ReorderPagesArgs = {
  arr: PageAndRotOp[];
  source_ids: Array<string>;
  target_id: string;
  position: DroppedThumbnailPosition;
}

export function reorder_pages({
  arr,
  source_ids,
  target_id,
  position
}: ReorderPagesArgs): PageAndRotOp[] {
  /*
    Returns an array with reordered pages.

    Items are reordered as follows: source_ids will be positioned
    before or after target_id (depending on positioned arg).
    Couple of examples.
    Example 1:

      arr = [ 1, 2, 3, 4 ]
      source_ids = [2]
      target_id = 4
      position = 'after'

    In other words, item 2 will be positioned after item 4.
    Result will be:

      result = [1, 3, 4, 2]

    Example 2:

      arr = [ 1, 2, 3, 4 ]
      source_ids = [2]
      target_id = 4
      position = 'before'

    Result will be (element 2 will be positioned before element 4):

      result = [1, 3, 2, 4]

    Example 3:
      arr = [1, 2]
      source_ids = [2]
      target_id = 1
      position = 'before'

      Result will be:

      result = [2, 1]

    Example 4:

      arr = [1, 2]
      source_ids = [2]
      target_id = 1
      position = 'after'

      Result will be:

      result = [1, 2]

    i.e. same as input because source was already after target

    Example 5:

     arr = [1, 2, 3, 4, 5, 6]
     source_ids = [1, 3]
     target = 5

     result: [2, 4, 5, 1, 3, 6]
  */
  let result: PageAndRotOp[] = [];
  let insert_now = false;
  const source: PageAndRotOp[] = arr.filter(i => source_ids.includes(i.page.id));

  if (source.length == 0) {
    throw new Error("Source list is empty. Cannot reorder.");
  }

  arr.forEach((item: PageAndRotOp) => {
    if (insert_now) {
      result.push(...source);
      insert_now = false;
    }

    if (!source_ids.includes(item.page.id) && item.page.id !== target_id) {
      result.push(item);
    } else if (item.page.id === target_id) {
      if (position == 'before') {
        result.push(...source);
        if (!source_ids.includes(item.page.id)) {
          result.push(item);
        }
      } else {
        insert_now = true; // will insert source on next iteration
        if (!source_ids.includes(item.page.id)) {
          result.push(item);
        }
      }
    }
  });

  return result;
}
