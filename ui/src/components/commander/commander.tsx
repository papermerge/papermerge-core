import { useState, useEffect, ChangeEvent } from 'react';

import Form from 'react-bootstrap/Form';

import Folder from "./folder";
import Document from "./document";
import EmptyFolder from "./empty_folder";
import Breadcrumb from '../breadcrumb/breadcrumb';
import Paginator from "../paginator";
import Menu from "./menu";

import { is_empty } from "@/utils";
import { fetcher } from "@/utils/fetcher";

import type { FolderType, NodeType } from '@/types';
import DeleteNodesModal from '../modals/delete_nodes';
import NewFolderModal from "../modals/new_folder";
import RenameModal from '../modals/rename';


type NodeResultType = {
  items: NodeType[];
  num_pages: number;
  page_number: number;
  per_page: number;
}

type NodeListPlusT = [NodeResultType, FolderType] | [];

type State<T> = {
  is_loading: boolean;
  loading_id: string | null;
  error: unknown;
  data: T;
}

function useNodeListPlus(node_id: string, page_number: number, per_page: number): State<NodeListPlusT>  {
  const initial_state: State<NodeListPlusT> = {
    is_loading: true,
    loading_id: node_id,
    error: null,
    data: []
  };
  let [data, setData] = useState<State<NodeListPlusT>>(initial_state);
  let prom: any;

  if (!node_id) {
    setData(initial_state);
    return initial_state;
  }

  useEffect(() => {

    const loading_state: State<NodeListPlusT> = {
      is_loading: true,
      loading_id: node_id,
      error: null,
      data: data.data
    };
    setData(loading_state);

    try {
      prom = Promise.all([
        fetcher(`/nodes/${node_id}?page_number=${page_number}&per_page=${per_page}`),
        fetcher(`/folders/${node_id}`)
      ]);
    } catch (error) {
      let error_state: State<NodeListPlusT> = {
        is_loading: false,
        loading_id: null,
        error: error,
        data: data.data
      };
      setData(error_state);
    }

    if (node_id) {
      let ignore = false;

      prom
      .then(
        (json: NodeListPlusT) => {
          if (!ignore) {
            let ready_state: State<NodeListPlusT> = {
              is_loading: false,
              loading_id: null,
              error: null,
              data: json
            };
            setData(ready_state);
          }
        })
      .catch(
        (error: unknown) => {
          let error_state: State<NodeListPlusT> = {
            is_loading: false,
            loading_id: null,
            error: error,
            data: data.data
          };
          setData(error_state);
        }
      );

      return () => {
        ignore = true;
      };
    }
  }, [node_id, page_number, per_page]);

  return data;
}

function get_old_title(arr: Array<string>, nodes_list: Array<NodeType>): string {
  if (arr && arr.length > 0) {
    const selected_id = arr[0];
    const first_item = nodes_list.find((item: NodeType) => item.id === selected_id);

    if (first_item) {
      return first_item.title;
    }
  }

  return '';
}

function node_is_selected(node_id: string, arr: Array<string>): boolean {
  if (arr && arr.length > 0) {
    const found_item = arr.find((uuid: string) => uuid === node_id);

    return found_item != undefined;
  }

  return false;
}

type Args = {
  node_id: string;
  page_number: number;
  per_page: number,
  onNodeClick: (node_id: string) => void;
  onPageClick: (page_number: number) => void;
  onPerPageChange: (per_page: number) => void;
}

type UUIDList = Array<string>;
type NodeList = Array<NodeType>;


function Commander({node_id, page_number, per_page, onNodeClick, onPageClick, onPerPageChange}: Args) {
  const [ newFolderModalShow, setNewFolderModalShow ] = useState(false);
  const [ renameModalShow, setRenameModalShow ] = useState(false);
  const [ deleteNodesModalShow, setDeleteNodesModalShow ] = useState(false);
  const [ selectedNodes, setSelectedNodes ] = useState<UUIDList>([]);
  const [ nodesList, setNodesList ] = useState<NodeList>([]);
  let {
    is_loading,
    error,
    loading_id,
    data: [nodes_list, breadcrumb]
  }: State<NodeListPlusT> = useNodeListPlus(node_id, page_number, per_page);
  let nodes;

  const onCreateDocumentModel = (new_nodes: NodeType[]) => {
    /* Invoked when new document node was added */
    setNodesList(nodesList.concat(new_nodes));
  }

  const onNodeSelect = (node_id: string, selected: boolean) => {
    if (selected) {
      setSelectedNodes(
        [...selectedNodes, node_id]
      );
    } else {
      setSelectedNodes(
        selectedNodes.filter(uuid => uuid !== node_id)
      );
    }
  }

  const onPerPageValueChange = (event: ChangeEvent<HTMLSelectElement>) => {
    let new_value: number = parseInt(event.target.value);
    onPerPageChange(new_value);
  }

  const onCreateNewFolder = (new_node: NodeType) => {
    setNodesList([
      new_node,
      ...nodesList
    ]);
    setNewFolderModalShow(false);
  }

  const onRenameNode = (node: NodeType) => {
    let new_nodes_list = nodesList.map((item: NodeType) => {
      if (item.id === node.id) {
        return node;
      } else {
        return item;
      }
    });

    setNodesList(new_nodes_list);
    setRenameModalShow(false);
  }

  const onDeleteNodes = (node_ids: string[]) => {
    let new_nodes = nodesList.filter(
      node => node_ids.indexOf(node.id) == -1
    );
    setNodesList(new_nodes);
    setDeleteNodesModalShow(false);
    setSelectedNodes([]);
  }

  useEffect(() => {
    if (nodes_list) {
      setNodesList(nodes_list.items);
    }
  }, [nodes_list, page_number, per_page]);

  if (nodes_list) {
    let items = nodesList;

    if (is_empty(items)) {
      nodes = <EmptyFolder />;
    } else {
      nodes = items.map((item: any) => {
        if (item.ctype == 'folder') {
          return <Folder
            onClick={onNodeClick}
            onSelect={onNodeSelect}
            is_selected={node_is_selected(item.id, selectedNodes)}
            node={item}
            is_loading={loading_id == item.id}
          />;
        } else {
          return <Document
            onClick={onNodeClick}
            onSelect={onNodeSelect}
            is_selected={node_is_selected(item.id, selectedNodes)}
            node={item}
            is_loading={loading_id == item.id}
          />;
        }
      });
    }

    return (
      <div className="commander">
        <div className='top-bar'>
          <Menu
            onCreateDocumentNode={onCreateDocumentModel}
            onNewFolderClick={() => setNewFolderModalShow(true)}
            onRenameClick={() => setRenameModalShow(true)}
            onDeleteNodesClick={ () => setDeleteNodesModalShow(true) }
            selected_nodes={selectedNodes}
            node_id={node_id} />

            <Form.Select onChange={onPerPageValueChange}>
              <option value="5" selected>5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Form.Select>
        </div>
        {
          breadcrumb
            &&
          <Breadcrumb
            path={breadcrumb.breadcrumb}
            onClick={onNodeClick}
            is_loading={is_loading} />
        }
        {nodes}

        <Paginator
          num_pages={nodes_list.num_pages}
          active={nodes_list.page_number}
          onPageClick={onPageClick} />

        <div>
          <NewFolderModal
            show={newFolderModalShow}
            parent_id={node_id}
            onCancel={() => setNewFolderModalShow(false)}
            onSubmit={onCreateNewFolder} />
        </div>
        <div>
          <RenameModal
            show={renameModalShow}
            node_id={selectedNodes[0]}
            old_title={get_old_title(selectedNodes, nodesList)}
            onCancel={() => setRenameModalShow(false)}
            onSubmit={onRenameNode} />
        </div>
        <div>
          <DeleteNodesModal
            show={deleteNodesModalShow}
            node_ids={selectedNodes}
            onCancel={() => setDeleteNodesModalShow(false)}
            onSubmit={onDeleteNodes} />
        </div>
      </div>
    )
  }

  return <>Skeleton</>;
}

export default Commander;