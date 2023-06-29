import { useState, useEffect } from 'react';

import Layout from './layout';
import Commander from './commander/commander';
import Viewer from './viewer/viewer';

import { NodeClickArgsType, SpecialFolder } from 'types';
import { NodeSortFieldEnum, NodeSortOrderEnum } from 'types';

type Args = {
  special_folder_id: string;
  onSpecialFolderChange: (folder: SpecialFolder) => void;
}


const NODES_PAGE_SIZE = 'nodes-page-size';
const NODES_PAGE_SIZE_DEFAULT = 5;


function get_default_page_size(): number {
  /*
  Retrieves default page_size from local storage

  When user changes page_size in drop down box, that value
  is saved in local storage, so that next time user refreshes the page
  and component is recreated - the page_size from local storage will
  be used.

  In case storage value for page_size was either not found
  or returns an invalid value, then hardcoded constant
  NODES_PAGE_SIZE_DEFAULT will be returned.
  */
  let nodes_page_size = localStorage.getItem(NODES_PAGE_SIZE);

  if (nodes_page_size) {
    return parseInt(nodes_page_size) || NODES_PAGE_SIZE_DEFAULT;
  }

  return NODES_PAGE_SIZE_DEFAULT;
}


function Home({ special_folder_id, onSpecialFolderChange }: Args) {
  const [ node_id, set_node_id ] = useState(special_folder_id);
  const [ node_type, set_node_type ] = useState('folder');
  const [ page_number, set_page_number ] = useState(1);
  const [ page_size, setPageSize ] = useState(get_default_page_size());
  const [ sort_order, set_sort_order ] = useState<NodeSortOrderEnum>(NodeSortOrderEnum.asc);
  const [ sort_field, set_sort_field ] = useState<NodeSortFieldEnum>(NodeSortFieldEnum.title);

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
    localStorage.setItem(NODES_PAGE_SIZE, `${num}`);
  }

  const onSortFieldChange = (sort_field: NodeSortFieldEnum) => {
    set_sort_field(sort_field);
  }

  const onSortOrderChange = (sort_order: NodeSortOrderEnum) => {
    set_sort_order(sort_order);
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
      component = <Commander
        node_id={node_id}
        page_number={page_number}
        page_size={page_size}
        sort_field={sort_field}
        sort_order={sort_order}
        onNodeClick={onNodeClick}
        onPageClick={onPageClick}
        onPageSizeChange={onPageSizeChange}
        onSortFieldChange={onSortFieldChange}
        onSortOrderChange={onSortOrderChange} />
    } else {
      component = <Viewer node_id={node_id} onNodeClick={onNodeClick} />;
    }
  } catch(e) {
    component = <div>Caught exception</div>;
  }

  return (
    <Layout onSpecialFolderChange={onSpecialFolderChange}>
      {component}
    </Layout>
  );
}

export default Home;
