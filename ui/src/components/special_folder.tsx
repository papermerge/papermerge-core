import { useState, useEffect } from 'react';

import Commander from './commander/commander';
import Viewer from './viewer/viewer';

import { NodeClickArgsType, SidebarItem } from 'types';
import { NodeSortFieldEnum, NodeSortOrderEnum, DisplayNodesModeEnum } from 'types';


type Args = {
  special_folder_id: string;
  onSidebarItemChange: (item: SidebarItem) => void;
}


type NodeListParams = {
  page_size: number;
  page_number: number;
  sort_field: NodeSortFieldEnum;
  sort_order: NodeSortOrderEnum;
  display_mode: DisplayNodesModeEnum;
}

type NodeListParamsArg = {
  page_size?: number;
  page_number?: number;
  sort_field?: NodeSortFieldEnum;
  sort_order?: NodeSortOrderEnum;
  display_mode?: DisplayNodesModeEnum;
}


const NODE_LIST_PARAMS = 'node-list-params';
const NODE_LIST_PARAMS_DEFAULT: NodeListParams = {
  'page_size': 10,
  'page_number': 1,
  'sort_field': NodeSortFieldEnum.title,
  'sort_order': NodeSortOrderEnum.desc,
  'display_mode': DisplayNodesModeEnum.List
};


function get_node_list_params(): NodeListParams {
  let node_list_params_str: string | null = localStorage.getItem(NODE_LIST_PARAMS);
  let result: NodeListParams;

  if (node_list_params_str) {
      // local storage key was found
      try {
        result = JSON.parse(window.atob(node_list_params_str));
        if(result) {
          // local storage key contains meaningfull data
          return result;
        };
        return NODE_LIST_PARAMS_DEFAULT;
      } catch(e) {
        return NODE_LIST_PARAMS_DEFAULT;
      }
  }

  return NODE_LIST_PARAMS_DEFAULT;
}

function save_node_list_params({
  page_size,
  page_number,
  display_mode,
  sort_field,
  sort_order
}: NodeListParamsArg) {

  let nodes_list_params: NodeListParams = get_node_list_params();
  let base64: string;

  if (page_size) {
    nodes_list_params.page_size = page_size;
  }

  if (page_number) {
    nodes_list_params.page_number = page_number;
  }

  if (display_mode) {
    nodes_list_params.display_mode = display_mode;
  }

  if (sort_field) {
    nodes_list_params.sort_field = sort_field;
  }

  if (sort_order) {
    nodes_list_params.sort_order = sort_order;
  }

  base64 = window.btoa(JSON.stringify(nodes_list_params));
  localStorage.setItem(NODE_LIST_PARAMS, base64);
}


function SpecialFolder({ special_folder_id, onSidebarItemChange }: Args) {
  const [ node_id, set_node_id ] = useState(special_folder_id);
  const [ node_type, set_node_type ] = useState('folder');
  const [ page_number, set_page_number ] = useState(1);
  const [ page_size, setPageSize ] = useState(
    get_node_list_params().page_size
  );
  const [ sort_order, set_sort_order ] = useState<NodeSortOrderEnum>(
    get_node_list_params().sort_order
  );
  const [ sort_field, set_sort_field ] = useState<NodeSortFieldEnum>(
    get_node_list_params().sort_field
  );
  const [ display_mode, set_display_mode ] = useState<DisplayNodesModeEnum>(
    get_node_list_params().display_mode
  );

  let component: JSX.Element;

  const onNodeClick = ({node_id, node_type}: NodeClickArgsType) => {
    set_node_id(node_id);
    set_node_type(node_type);
  }

  const onPageClick = (num: number) => {
    set_page_number(num);
  }

  const onPageSizeChange = (num: number) => {
    setPageSize(num);
    save_node_list_params({page_size: num});
  }

  const onSortFieldChange = (sort_field: NodeSortFieldEnum) => {
    set_sort_field(sort_field);
    save_node_list_params({sort_field});
  }

  const onSortOrderChange = (sort_order: NodeSortOrderEnum) => {
    set_sort_order(sort_order);
    save_node_list_params({sort_order});
  }

  const onNodesDisplayModeList = () => {
    set_display_mode(DisplayNodesModeEnum.List);
    save_node_list_params({display_mode: DisplayNodesModeEnum.List});
  }

  const onNodesDisplayModeTiles = () => {
    set_display_mode(DisplayNodesModeEnum.Tiles);
    save_node_list_params({display_mode: DisplayNodesModeEnum.Tiles});
  }

  useEffect(() => {
    set_node_id(special_folder_id);
    set_node_type("folder");
  }, [special_folder_id])

  if (!node_id ) {
    return <div>Loading...</div>;
  }

  try {
    if (node_type == 'folder') {
      return <Commander
        node_id={node_id}
        page_number={page_number}
        page_size={page_size}
        sort_field={sort_field}
        sort_order={sort_order}
        display_mode={display_mode}
        onNodeClick={onNodeClick}
        onPageClick={onPageClick}
        onPageSizeChange={onPageSizeChange}
        onSortFieldChange={onSortFieldChange}
        onSortOrderChange={onSortOrderChange}
        onNodesDisplayModeList={onNodesDisplayModeList}
        onNodesDisplayModeTiles={onNodesDisplayModeTiles} />
    } else {
      return <Viewer node_id={node_id} onNodeClick={onNodeClick} />;
    }
  } catch(e) {
    return <div>Caught exception</div>;
  }

}

export default SpecialFolder;
