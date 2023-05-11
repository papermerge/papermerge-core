import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { createRoot } from 'react-dom/client';

import Form from 'react-bootstrap/Form';

import DisplayModeDropown from './display_mode';
import Folder from "./folder";
import Document from "./document";
import EmptyFolder from "./empty_folder";
import Breadcrumb from '../breadcrumb/breadcrumb';
import Paginator from "../paginator";
import Menu from "./menu";
import { DraggingIcon } from '../dragging_icon';

import { is_empty } from "../../utils";
import { get_node_under_cursor } from '../../utils';
import { fetcher } from "../../utils/fetcher";

import type { FolderType, NodeType} from '@/types';
import type { UUIDList, NodeList } from '@/types';
import { NodeClickArgsType } from '../../types';
import { DisplayNodesModeEnum } from '../../types';
import DeleteNodesModal from '../modals/delete_nodes';
import NewFolderModal from "../modals/new_folder";
import RenameModal from '../modals/rename';
import DropNodesModal from '../modals/drop_nodes';

import { Rectangle, Point } from '../../utils/geometry';


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
        fetcher(`/api/nodes/${node_id}?page_number=${page_number}&per_page=${per_page}`),
        fetcher(`/api/folders/${node_id}`)
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
  onNodeClick: ({node_id, node_type}: NodeClickArgsType) => void;
  onPageClick: (page_number: number) => void;
  onPerPageChange: (per_page: number) => void;
}


function Commander({
  node_id,
  page_number,
  per_page,
  onNodeClick,
  onPageClick,
  onPerPageChange
}: Args) {
  const [ newFolderModalShow, setNewFolderModalShow ] = useState(false);
  const [ renameModalShow, setRenameModalShow ] = useState(false);
  const [ deleteNodesModalShow, setDeleteNodesModalShow ] = useState(false);
  const [ dropNodesModalShow, setDropNodesModalShow ] = useState(false);
  const [ selectedNodes, setSelectedNodes ] = useState<UUIDList>([]);
  // sourceDropNodes = selectedNodes + one_being_fragged
  const [ sourceDropNodes, setSourceDropNodes] = useState<NodeType[]>([]);
  const [ targetDropNode, setTargetDropNode ] = useState<NodeType>();
  const [ nodesList, setNodesList ] = useState<NodeList>([]);
  const [ nodesDisplayMode, setNodesDisplayMode ] = useState<DisplayNodesModeEnum>(DisplayNodesModeEnum.List);
  const nodesRef = useRef(null);
  let canvasRef = useRef<HTMLCanvasElement | null>(null);

  let {
    is_loading,
    error,
    loading_id,
    data: [nodes_list, breadcrumb]
  }: State<NodeListPlusT> = useNodeListPlus(node_id, page_number, per_page);
  let nodes;

  const get_node = (node_id: string): NodeType | undefined => {
    return nodesList.find((n: NodeType) => n.id == node_id);
  }

  const get_nodes = (node_ids: UUIDList): NodeType[] => {
    return nodesList.filter((n: NodeType) => node_ids.includes(n.id));
  }

  const updateSourceDropNodes = (node_id: string) => {
    /*
      node_id: ID of the node currently being dragged
      sourceDropNodes = dragged node + current selection of nodes
    */

    // Is the node being dragged also one of the selected nodes?
    if (selectedNodes.find((id: string) => id == node_id)) {
      // then just set sourceDropNodes to the current selection of nodes
      setSourceDropNodes(get_nodes(selectedNodes));
    } else {
      let nodes = get_nodes(selectedNodes), node = get_node(node_id);
      let new_array = nodes;

      if (node) {
        new_array.push(node);
      }
      // selected nodes + dragged node
      setSourceDropNodes(new_array);
    }
  }

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

  const onPerformDropNodes = (moved_node_ids: string[]) => {

    nodesList.forEach(node => {
      node.accept_dropped_nodes = false;
      node.is_currently_dragged = false;
    });

    let new_nodes = nodesList.filter(
      node => !moved_node_ids.includes(node.id)
    );

    setNodesList(new_nodes);
    setSelectedNodes([]);
    setDropNodesModalShow(false);
  }

  const onCancelDropNodes = () => {
    nodesList.forEach(node => {
      node.accept_dropped_nodes = false;
      node.is_currently_dragged = false;
    });
    setSelectedNodes([]);
    setDropNodesModalShow(false);
  }

  const onDragStart = (node_id: string, event: React.DragEvent) => {

    let image = <DraggingIcon node_id={node_id}
          selectedNodes={selectedNodes}
          nodesList={nodesList} />;
    let ghost = document.createElement('div');

    ghost.style.transform = "translate(-10000px, -10000px)";
    ghost.style.position = "absolute";
    document.body.appendChild(ghost);
    event.dataTransfer.setDragImage(ghost, 0, -10);

    let root = createRoot(ghost);

    root.render(image);
  }

  const onDrag = (node_id: string, event: React.DragEvent) => {
    const map = getNodesRefMap();
    const new_nodes = nodesList.map((item => {
      // @ts-ignore
      const node = map.get(item.id) as HTMLDivElement;
      const item_rect = new Rectangle();
      const point = new Point();

      if (!node) {
        return item;
      }

      item_rect.from_dom_rect(
        node.getBoundingClientRect()
      );

      point.from_drag_event(event);

      if (node_id != item.id && item_rect.contains(point)) {
        console.log(`Dragging over ${item.title}`);
        item.accept_dropped_nodes = true;
        setTargetDropNode(item);
      }
      else {
        item.accept_dropped_nodes = false;
      }

      // mark all nodes being dragged (in UI they will be faded out)
      // nodes being dragged are node_id + selected ones
      if (item.id === node_id || selectedNodes.find((id: string) => id == item.id)) {
        item.is_currently_dragged = true;
      }

      return item;
    }));

    setNodesList(new_nodes);
    updateSourceDropNodes(node_id);
  }

  const onDragEnd = (node_id: string, event: React.DragEvent) => {
    let target: NodeType | undefined = get_node_under_cursor(
      node_id,
      nodesList,
      // @ts-ignore
      getNodesRefMap(),
      event
    );

    if (target) {
      console.log(`target node ${target.title}`);
    } else {
      console.log(`No target found :(`);
    }

    setDropNodesModalShow(true)

    /*
    const new_nodes = nodesList.map(item => {
      item.accept_dropped_nodes = false;
      item.is_currently_dragged = false;

      return item;
    });

    setNodesList(new_nodes);

    if (canvasRef.current) {
      canvasRef.current.width = 0;
      canvasRef.current.height = 0;
    }
    */
  }

  const onNodesDisplayModeList = () => {
    setNodesDisplayMode(DisplayNodesModeEnum.List);
  }

  const onNodesDisplayModeTiles = () => {
    setNodesDisplayMode(DisplayNodesModeEnum.Tiles);
  }

  const list_nodes_css_class_name = () => {
    if (nodesDisplayMode === DisplayNodesModeEnum.List) {
      return 'd-flex flex-column mb-3';
    }

    return 'd-flex flex-row flex-wrap mb-3';
  }

  const getNodesRefMap = () => {
    if (!nodesRef.current) {
      // @ts-ignore
      nodesRef.current = new Map();
    }
    return nodesRef.current;
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
            key={item.id}
            onClick={onNodeClick}
            onSelect={onNodeSelect}
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            display_mode={nodesDisplayMode}
            is_selected={node_is_selected(item.id, selectedNodes)}
            node={item}
            is_loading={loading_id == item.id}
            ref={(node) => {
                const map = getNodesRefMap();
                if (node) {
                  //@ts-ignore
                  map.set(item.id, node);
                } else {
                  //@ts-ignore
                  map.delete(item.id);
                }
            }}
          />;
        } else {
          return <Document
            onClick={onNodeClick}
            onSelect={onNodeSelect}
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            display_mode={nodesDisplayMode}
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

            <div className="d-flex">

              <DisplayModeDropown value={nodesDisplayMode}
                onNodesDisplayModeList={onNodesDisplayModeList}
                onNodesDisplayModeTiles={onNodesDisplayModeTiles} />

              <Form.Select onChange={onPerPageValueChange} defaultValue={5}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Form.Select>
            </div>
        </div>
        {
          breadcrumb
            &&
          <Breadcrumb
            path={breadcrumb.breadcrumb}
            onClick={onNodeClick}
            is_loading={is_loading} />
        }
        <div className={list_nodes_css_class_name()}>
          {nodes}
        </div>

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
        <div>
          <DropNodesModal
            show={dropNodesModalShow}
            source_nodes={sourceDropNodes}
            target_node={targetDropNode}
            onCancel={onCancelDropNodes}
            onSubmit={onPerformDropNodes} />
        </div>
      </div>
    )
  }

  return <>Skeleton</>;
}

export default Commander;