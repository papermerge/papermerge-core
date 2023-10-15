import { useEffect } from "react";
import { NType, NodeType, NodesType, Pagination, Sorting, Vow, FolderType } from "types";
import { fetcher } from "utils/fetcher";
import { Updater, useImmer } from 'use-immer';


type NodeResultType = {
  items: NodeType[];
  num_pages: number;
  page_number: number;
  per_page: number;
}

type ResponseDataType = [NodeResultType, FolderType] | [];


type Args = {
  node: NType | null;
  pagination: Pagination;
  sort: Sorting;
}

type Setter<T> = Updater<Vow<T>>;


function useNodes({node, pagination, sort}: Args): [Vow<NodesType>, Setter<NodesType>] {
  let [data, setData] = useImmer<Vow<NodesType>>({
    is_pending: true,
    loading_id: node?.id,
    error: null,
    data: null
  });

  let url_params: string = build_params({pagination, sort});

  useEffect(() => {

    if (!node) {
      return;
    }

    if (node.ctype == 'document') {
      return;
    }

    const loading_state: Vow<NodesType> = {
      is_pending: true,
      loading_id: node?.id,
      error: null,
      data: data.data
    };
    setData(loading_state);

    let prom = Promise.all([
      fetcher(`/api/nodes/${node.id}?${url_params}`),
      fetcher(`/api/folders/${node.id}`)
    ]);

    let ignore = false;

    prom.then(
      (response_data: ResponseDataType) => {
        let _data: NodesType;

        if (response_data[0] && response_data[1]) {
          _data = {
            nodes: response_data[0].items,
            parent: response_data[1],
            breadcrumb: response_data[1].breadcrumb,
            per_page: response_data[0].per_page,
            num_pages: response_data[0].num_pages,
            page_number: response_data[0].page_number,
          };

          if (!ignore) {
            let ready_state: Vow<NodesType> = {
              is_pending: false,
              loading_id: null,
              error: null,
              data: _data
            };
            setData(ready_state);
          }
        }
      }).catch((error: Error) => {
        setData({
          is_pending: false,
          loading_id: null,
          error: error.toString(),
          data: null
        });
      }
    );

    return () => {
      ignore = true;
    };
  }, [
    node?.id,
    pagination.page_number,
    pagination.per_page,
    sort.sort_field,
    sort.sort_order
  ]);


  return [data, setData];
};


type BuildParamsArgs = {
  pagination: Pagination;
  sort: Sorting;
}


function build_params({pagination, sort}: BuildParamsArgs): string {

  let result: string = `page_number=${pagination.page_number}&page_size=${pagination.per_page}`;
  let order_by: string = sort.sort_field;

  if (sort.sort_order == 'desc') {
    order_by = `-${sort.sort_field}`;
  }

  result = `${result}&order_by=${order_by}`

  return result;
}

export default useNodes;
