import { useState, useRef, useEffect, ChangeEvent } from 'react';

import Form from 'react-bootstrap/Form';

import DisplayModeDropown from './display_mode';
import SortDropdown from './sort_dropdown';
import Folder from './node/folder';
import Document from './node/document';
import EmptyFolder from './empty_folder';
import Menu from './menu/Menu';
import { DraggingIcon } from 'components/dragging_icon';

import { is_empty } from 'utils/misc';

import create_new_folder from './modals/NewFolder';
import delete_nodes from './modals/DeleteNodes';
import edit_tags from './modals/EditTags';
import drop_files from './modals/DropFiles';
import rename_node from 'components/modals/rename';
import DropNodesModal from 'components/modals/drop_nodes';
import ErrorModal from 'components/modals/error_modal';
import Breadcrumb from 'components/breadcrumb/breadcrumb';
import Paginator from "components/paginator";
import ErrorMessage from 'components/error_message';

import { Rectangle, Point } from 'utils/geometry';

import type {
  ColoredTagType,
  CreatedNodesType,
  FolderType,
  NodeType,
  Pagination,
  ShowDualButtonEnum,
  Sorting
} from 'types';

import type { UUIDList, NodeList, NType } from 'types';
import { NodeClickArgsType } from 'types';
import { DisplayNodesModeEnum } from 'types';
import { Vow, NodeSortFieldEnum, NodeSortOrderEnum, NodesType } from 'types';

import { get_node_attr } from 'utils/nodes';
import { DualButton } from 'components/dual-panel/DualButton';

const DATA_TYPE_NODE = 'node/type';


function node_is_selected(node_id: string, arr: Array<string>): boolean {
  if (arr && arr.length > 0) {
    const found_item = arr.find((uuid: string) => uuid === node_id);

    return found_item != undefined;
  }

  return false;
}


type Args = {
  node_id: string;
  pagination: Pagination;
  sort: Sorting;
  nodes: Vow<NodesType>;
  display_mode: DisplayNodesModeEnum;
  onNodeClick: (node: NType) => void;
  onPageClick: (page_number: number) => void;
  onPageSizeChange: (page_size: number) => void;
  onSortChange: (sort: Sorting) => void;
  onNodesDisplayModeList: () => void;
  onNodesDisplayModeTiles: () => void;
  onNodesListChange: (nodes_list: NodeType[]) => void;
  show_dual_button?: ShowDualButtonEnum;
}


const ACCEPT_DROPPED_NODES_CSS = "accept-dropped-nodes";


function Commander({
  node_id,
  pagination,
  sort,
  nodes,
  display_mode,
  onNodeClick,
  onPageClick,
  onPageSizeChange,
  onSortChange,
  onNodesDisplayModeList,
  onNodesDisplayModeTiles,
  onNodesListChange,
  show_dual_button
}: Args) {
  const [ errorModalShow, setErrorModalShow ] = useState(false);
  // for papermerge nodes dropping
  const [ dropNodesModalShow, setDropNodesModalShow ] = useState(false);
  const [ filesList, setFilesList ] = useState<FileList>()
  // target folder where drop in (using drag 'n drop) files will be uploaded
  const [ targetDropFile, setTargetDropFile ] = useState<NodeType | FolderType | null | undefined>(null);
  const [ selectedNodes, setSelectedNodes ] = useState<UUIDList>([]);
  // sourceDropNodes = selectedNodes + one_being_fragged
  const [ sourceDropNodes, setSourceDropNodes] = useState<NodeType[]>([]);
  // css class name will be set to "accept-files" when user drags
  // over commander with files from local fs
  const [ cssAcceptFiles, setCssAcceptFiles ] = useState<string>("");

  const nodesRef = useRef(null);
  let canvasRef = useRef<HTMLCanvasElement | null>(null);
  let nodesElement: JSX.Element[] | JSX.Element;

  const get_node = (node_id: string): NodeType | undefined => {
    return nodes!.data!.nodes.find((n: NodeType) => n.id == node_id);
  }

  const get_nodes = (node_ids: UUIDList): NodeType[] => {
    return nodes!.data!.nodes.filter((n: NodeType) => node_ids.includes(n.id));
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

  const onCreateDocumentModel = (new_nodes: NodeType[], target_id: string) => {
    /* Invoked when new document node(s) was/were added.
    Will add new documents to the current list of nodes ONLY if target_id is
    same as node id.

    Say user currently has opened commander on ".home / My Documents" in other
    words he/she sees the content of My Documents folder. We will call "My
    Documents" folder "current folder". Current folder's id is `node_id`. Inside
    current folder, say we have folder "Bills" and folder "Payments".

    If user drags couple of documents from his/her local filesystem into the "My
    Documents", then `target_id` will be set to UUID of "My Documents" i.e.
    `target_id` == `node_id`. In this case we want to refresh node's list
    because there are new entries (document which user dropped in).

    if user drag'n drops file/document over folder "Bills", then there is
    nothing to refresh, because newly dropped documents will be added inside
    another folder, content of which is not visible to the user anyway; this
    fact is signaled by the fact that `target_id` != `node_id`, in other words
    `target_id` will be set to the UUID of "Bills" which is different than UUID
    of the current node (`node_id`) (current folder is "My Documents" and it has
    UUID = `node_id`).
     */
    //if (target_id == node_id) {
    //  setNodesList(nodesList.concat(new_nodes));
    //}
  }

  const onNodeSelect = (node_id: string, selected: boolean) => {
    if (selected) {
      setSelectedNodes(
        [...selectedNodes, node_id]
      );
    } else {
      setSelectedNodes(
        selectedNodes.filter((uuid: string) => uuid !== node_id)
      );
    }
  }

  const onPerPageValueChange = (event: ChangeEvent<HTMLSelectElement>) => {
    let new_value: number = parseInt(event.target.value);
    onPageSizeChange(new_value);
  }

  const onPerformDropNodes = (moved_node_ids: string[]) => {
    /*
    nodesList.forEach((node: NodeType) => {
      node.accept_dropped_nodes = false;
      node.is_currently_dragged = false;
    });

    let new_nodes = nodesList.filter(
      (node: NodeType) => !moved_node_ids.includes(node.id)
    );

    setNodesList(new_nodes);
    setSelectedNodes([]);
    setDropNodesModalShow(false);
    setSourceDropNodes([]);
    */
  }

  const onCancelDropNodes = () => {
    /*
    nodesList.forEach((node: NodeType) => {
      node.accept_dropped_nodes = false;
      node.is_currently_dragged = false;
    });
    setSelectedNodes([]);
    setSourceDropNodes([]);
    setDropNodesModalShow(false);
    */
  }

  const onOKErrorModal = () => {
    setErrorModalShow(false);
  }

  const onCancelErrorModal = () => {
    setErrorModalShow(false);
  }

  const onDragStart = (node_id: string, event: React.DragEvent) => {
    /*
    let image = <DraggingIcon node_id={node_id}
          selectedNodes={selectedNodes}
          nodesList={nodesList} />;
    let ghost = document.createElement('div');
    const all_transfered_nodes = [...selectedNodes, node_id] as UUIDList;


    event.dataTransfer.setData(
      DATA_TYPE_NODE,
      JSON.stringify(
        get_nodes(all_transfered_nodes)
      )
    );

    ghost.style.transform = "translate(-10000px, -10000px)";
    ghost.style.position = "absolute";
    document.body.appendChild(ghost);
    event.dataTransfer.setDragImage(ghost, 0, -10);

    let root = createRoot(ghost);

    root.render(image);
    */
  }

  const onDrag = (node_id: string, event: React.DragEvent) => {
    /*
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
    */
    // setNodesList(new_nodes);
    updateSourceDropNodes(node_id);
  }

  const onDragEnter = () => {
    setCssAcceptFiles(ACCEPT_DROPPED_NODES_CSS);
  }

  const onDragLeave = () => {
    setCssAcceptFiles("");
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    /* Highlight commander (i.e. change its CSS class) to provide user feedback that
      commander can accept dragged document (drop in from local filesystem).
    */

    event.preventDefault();

    // @ts-ignore
    if (event.target && event.target.classList) {
      // @ts-ignore
      if (event.target.classList.contains("folder")) {
        // Do not highlight commander when user drags over a folder node
        setCssAcceptFiles("");
        return;
      }
    }

    if (event.dataTransfer.files.length == 0 && event.dataTransfer.items.length == 0) {
      setCssAcceptFiles("");
      return;
    }

    setCssAcceptFiles(ACCEPT_DROPPED_NODES_CSS);
  }

  const onCancelDropFiles = () => {
    //setDropFilesModalShow(false);
  }

  const onPerformDropFiles = () => {
    /* triggered when user clicked "Upload" button in
     "upload dialog for drop in files"
     The files upload is performed async and notification
     (user feedback) is accomplished via "toasts" (notification messages
      in right lower corder of the screen). In other words
      "Upload files" screen closes immediately - it does not wait
      until all files are uploaded. User can go fancy and Upload
      200 files from some folder - it does not make any sense
      for the upload dialog to be open for until all those 200 files
      get uploaded.
    */

    //setDropFilesModalShow(false);
  }

  const onSetAsDropTarget = (target_folder: NodeType | null) => {
    setTargetDropFile(target_folder)
  }

  const list_nodes_css_class_name = () => {
    if (display_mode === DisplayNodesModeEnum.List) {
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

  const onNewFolderClick = () => {
    create_new_folder(node_id)
    .then(
      (new_node: NodeType) => {
        onNodesListChange([new_node, ...nodes!.data!.nodes]);
      }
    );
  }

  const onRenameClick = () => {
    let initial_title = get_node_attr<string>(
      selectedNodes, 'title', nodes!.data!.nodes
    );

    rename_node(selectedNodes[0], initial_title)
    .then(
      (node: NodeType) => {
        let new_nodes_list = nodes!.data!.nodes.map((item: NodeType) => {
          if (item.id === node.id) {
            return node;
          } else {
            return item;
          }
        });
        onNodesListChange(new_nodes_list);
        setSelectedNodes([]);
      }
    );
  }

  const onDeleteNodesClick = () => {
    delete_nodes(selectedNodes).then(
      (node_ids: string[]) => {
        /* Remove remove nodes from the commander list */
        let new_nodes = nodes!.data!.nodes.filter(
          (node: NodeType) => node_ids.indexOf(node.id) == -1
        );
        onNodesListChange(new_nodes);
        setSelectedNodes([]);
      }
    );
  }

  const onEditTagsClick = () => {
    let initial_tags = get_node_attr<Array<ColoredTagType>>(
      selectedNodes,'tags', nodes!.data!.nodes
    );

    edit_tags(selectedNodes[0], initial_tags).then(
      (node: NodeType) => {
        let new_nodes_list = nodes!.data!.nodes.map((item: NodeType) => {
          if (item.id === node.id) {
            return node;
          } else {
            return item;
          }
        });

        onNodesListChange(new_nodes_list);
        setSelectedNodes([]);
      }
    );
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.dataTransfer.files.length > 0) {
      // only show dialog if event.dataTransfer contains at least one file
      drop_files({
        source_files: event.dataTransfer.files,
        target: nodes!.data!.parent
      })
      .then(
        (created_nodes: CreatedNodesType) => {
          onNodesListChange(
            [...nodes!.data!.nodes, ...created_nodes.nodes]
          );
          setCssAcceptFiles("");
      });
    }
  }

  const onCreatedNodesByUpload = (created_nodes: CreatedNodesType) => {
    onNodesListChange(
      [...nodes!.data!.nodes, ...created_nodes.nodes]
    );
  }

  if (nodes.data) {
    let items = nodes.data.nodes;

    if (is_empty(items)) {
      nodesElement = <EmptyFolder />;
    } else {
      nodesElement = items.map((item: NodeType) => {
        if (item.ctype == 'folder') {
          return <Folder
            key={item.id}
            onClick={onNodeClick}
            onSelect={onNodeSelect}
            onDragStart={onDragStart}
            onDrag={onDrag}
            onSetAsDropTarget={onSetAsDropTarget}
            display_mode={display_mode}
            is_selected={node_is_selected(item.id, selectedNodes)}
            node={item}
            is_loading={nodes.loading_id == item.id}
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
          return <Document key={item.id}
            onClick={onNodeClick}
            onSelect={onNodeSelect}
            onDragStart={onDragStart}
            onDrag={onDrag}
            display_mode={display_mode}
            is_selected={node_is_selected(item.id, selectedNodes)}
            node={item}
            is_loading={nodes.loading_id == item.id}
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
        }
      });
    }

    return (
      <div
        className={`commander w-100 m-1 ${cssAcceptFiles}`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}>
        <div className='top-bar'>
          <Menu
            onNewFolderClick={onNewFolderClick}
            onRenameClick={onRenameClick}
            onDeleteNodesClick={onDeleteNodesClick}
            onEditTagsClick={onEditTagsClick}
            onCreatedNodesByUpload={onCreatedNodesByUpload}
            selected_nodes={selectedNodes}
            node_id={node_id} />

            <div className="d-flex align-items-center">
              <SortDropdown
                sort={sort}
                onChange={onSortChange} />

              <DisplayModeDropown value={display_mode}
                onNodesDisplayModeList={onNodesDisplayModeList}
                onNodesDisplayModeTiles={onNodesDisplayModeTiles} />

              <Form.Select onChange={onPerPageValueChange} defaultValue={nodes.data?.per_page}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Form.Select>
              <DualButton
                node={{id: node_id, ctype: 'folder'}}
                show_dual_button={show_dual_button} />
            </div>
        </div>
        {
          <Breadcrumb
            path={nodes.data.breadcrumb}
            onClick={onNodeClick}
            is_loading={nodes.is_pending} />
        }
        <div className={list_nodes_css_class_name()}>
          {nodesElement}
        </div>

        <Paginator
          num_pages={nodes.data.num_pages}
          active={nodes.data.page_number}
          onPageClick={onPageClick} />
        <div>

        </div>
      </div>
    )
  }

  return <div className='p-2 m-2'>
    {nodes.error}
  </div>;
}

export default Commander;
