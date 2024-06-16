import { useState, useRef, ChangeEvent, useContext, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import Form from 'react-bootstrap/Form';

import DisplayModeDropown from './display_mode';
import SortDropdown from './sort_dropdown';
import Folder from './node/folder';
import Document from './node/document';
import EmptyFolder from './empty_folder';
import Menu from './menu/Menu';
import { DraggingIcon } from 'components/dragging_icon';
import { DualPanelContext } from 'components/dual-panel/DualPanel';
import { TargetEqualSource } from 'components/dual-panel/TargetEqualSource';
import { useContentHeight } from 'hooks/content_height';

import { is_empty } from 'utils/misc';

import create_new_folder from './modals/NewFolder';
import delete_nodes from './modals/DeleteNodes';
import edit_tags from './modals/EditTags';
import drop_files from './modals/DropFiles';
import rename_node from 'components/modals/rename';
import Breadcrumb from 'components/breadcrumb/breadcrumb';
import Paginator from "components/paginator";

import { Rectangle, Point } from 'utils/geometry';
import { overlap } from 'utils/array';

import "./commander.scss";

import type {
  ColoredTagType,
  CreatedNodesType,
  MovedNodesType,
  onMovedNodesType,
  NodeType,
  Pagination,
  ShowDualButtonEnum,
  Sorting,
  ExtractedPagesType,
  DataTransferExtractedPages,
  TargetDirection
} from 'types';

import type { UUIDList, NType } from 'types';
import { DisplayNodesModeEnum } from 'types';
import { Vow, NodesType } from 'types';
import useToast from 'hooks/useToasts';
import { DATA_TYPE_NODES, DATA_TRANSFER_EXTRACTED_PAGES } from 'cconstants';

import { get_node_attr } from 'utils/nodes';
import { DualButton } from 'components/dual-panel/DualButton';
import move_nodes from './modals/MoveNodes';
import extract_pages from 'components/modals/extract-pages/ExtractPages';
import SessionEnd from 'components/SessionEnded';


function in_list(node_id: string, arr: Array<string>): boolean {
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
  onMovedNodes: (args: onMovedNodesType) => void;
  onExtractPages: (args: ExtractedPagesType) => void;
  onSelectNodes: (value: UUIDList) => void;
  onDragNodes: (value: UUIDList) => void;
  display_mode: DisplayNodesModeEnum;
  onNodeClick: (node: NType) => void;
  onPageClick: (page_number: number) => void;
  onPageSizeChange: (page_size: number) => void;
  onSortChange: (sort: Sorting) => void;
  onNodesDisplayModeList: () => void;
  onNodesDisplayModeTiles: () => void;
  onNodesListChange: (nodes_list: NodeType[]) => void;
  show_dual_button?: ShowDualButtonEnum;
  selected_nodes: UUIDList;
  dragged_nodes: UUIDList;
  target_equal_source_direction?: TargetDirection;
  onTargetEqualSourceClick?: (arg?: TargetDirection) => void;
}


const ACCEPT_DROPPED_NODES_CSS = "accept-dropped-nodes";


function Commander({
  node_id,
  pagination,
  sort,
  nodes,
  onMovedNodes,
  onExtractPages,
  selected_nodes,
  dragged_nodes,
  onSelectNodes,
  onDragNodes,
  display_mode,
  onNodeClick,
  onPageClick,
  onPageSizeChange,
  onSortChange,
  onNodesDisplayModeList,
  onNodesDisplayModeTiles,
  onNodesListChange,
  show_dual_button,
  target_equal_source_direction,
  onTargetEqualSourceClick
}: Args) {
  const [ errorModalShow, setErrorModalShow ] = useState(false);
  // css class name will be set to "accept-files" when user drags
  // over commander with files from local fs
  const [ cssAcceptFiles, setCssAcceptFiles ] = useState<string>("");
  const dual_context = useContext(DualPanelContext);
  const toasts = useToast();
  let commander_content_height = useContentHeight();
  const commander_content_ref = useRef<HTMLInputElement>(null);

  const nodesRef = useRef(null);
  let nodesElement: JSX.Element[] | JSX.Element;


  useEffect(() => {
    // set height of the commander content area to remaining
    // visible space (window_height - breadcrumb_height - top_nav_menu_height)
    if (commander_content_ref?.current) {
      commander_content_ref.current.style.height = `${commander_content_height - /* just a guess */ 50}px`;
    }
  }, [commander_content_ref?.current, commander_content_height]);


  const get_node = (node_id: string): NodeType => {
    return nodes!.data!.nodes.find((n: NodeType) => n.id == node_id)!;
  }

  const get_nodes = (node_ids: UUIDList): NodeType[] => {
    return nodes!.data!.nodes.filter((n: NodeType) => node_ids.includes(n.id));
  }

  const onNodeSelect = (node_id: string, selected: boolean) => {
    if (selected) {
      onSelectNodes(
        [...selected_nodes, node_id]
      );
    } else {
      onSelectNodes(
        selected_nodes.filter((uuid: string) => uuid !== node_id)
      );
    }
  }

  const onPerPageValueChange = (event: ChangeEvent<HTMLSelectElement>) => {
    let new_value: number = parseInt(event.target.value);
    onPageSizeChange(new_value);
  }

  const onOKErrorModal = () => {
    setErrorModalShow(false);
  }

  const onCancelErrorModal = () => {
    setErrorModalShow(false);
  }

  const onDragStart = (node_id: string, event: React.DragEvent) => {
    let image = <DraggingIcon node_id={node_id}
          selectedNodes={selected_nodes}
          nodesList={nodes!.data! .nodes} />;
    let ghost = document.createElement('div');
    const all_transfered_nodes = [...selected_nodes, node_id] as UUIDList;
    const transf_nodes = get_nodes(all_transfered_nodes);

    event.dataTransfer.setData(
      DATA_TYPE_NODES,
      JSON.stringify(transf_nodes)
    );

    ghost.style.transform = "translate(-10000px, -10000px)";
    ghost.style.position = "absolute";
    document.body.appendChild(ghost);
    event.dataTransfer.setDragImage(ghost, 0, -10);

    let root = createRoot(ghost);

    root.render(image);
  }

  const onDrag = (node_id: string, event: React.DragEvent) => {
    const map = getNodesRefMap();
    let dragged_nodes_list: UUIDList = [];

    nodes!.data!.nodes.forEach((item => {
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

      // mark all nodes being dragged (in UI they will be faded out)
      // nodes being dragged are node_id + selected ones
      if (item.id === node_id || selected_nodes.find((id: string) => id == item.id)) {
        dragged_nodes_list.push(item.id);
      }
    }));

    onDragNodes(dragged_nodes_list);
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

  const list_nodes_css_class_name = () => {
    if (display_mode === DisplayNodesModeEnum.List) {
      return 'd-flex flex-column mb-3 nodes';
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
    ).catch((error: Error | undefined) => {
      if (error) {
        toasts?.addToast("error", `Error while creating folder: ${error}`);
      }
    });
  }

  const onRenameClick = () => {
    let initial_title = get_node_attr<string>(
      selected_nodes, 'title', nodes!.data!.nodes
    );

    rename_node(selected_nodes[0], initial_title)
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
        onSelectNodes([]);
      }
    ).catch((error?: Error) => {
      if (error) {
        toasts?.addToast('error', `Error while renaming ${error}`);
      }
    });
  }

  const onDeleteNodesClick = () => {
    delete_nodes(selected_nodes).then(
      (node_ids: string[]) => {
        /* Remove remove nodes from the commander list */
        let new_nodes = nodes!.data!.nodes.filter(
          (node: NodeType) => node_ids.indexOf(node.id) == -1
        );
        onNodesListChange(new_nodes);
        onSelectNodes([]);
      }
    ).catch ((error?: Error) => {
      if (error) {
        toasts?.addToast(`error`, `Error while deleting node(s): ${error}`);
      }
    });
  }

  const onEditTagsClick = () => {
    let initial_tags = get_node_attr<Array<ColoredTagType>>(
      selected_nodes,'tags', nodes!.data!.nodes
    );

    edit_tags(selected_nodes[0], initial_tags).then(
      (node: NodeType) => {
        let new_nodes_list = nodes!.data!.nodes.map((item: NodeType) => {
          if (item.id === node.id) {
            return node;
          } else {
            return item;
          }
        });

        onNodesListChange(new_nodes_list);
        onSelectNodes([]);
      }
    ).catch((error?: Error) => {
      if (error) {
        toasts?.addToast(`error`, `Error while saving: ${error}`);
      }
    });
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    // #1 drop files from local FS into the commander
    if (event.dataTransfer.files.length > 0) {
      // workaround for weird bug BEGIN
      if (event.dataTransfer.files.length === 1
          && event.dataTransfer.files[0].name === 'download.jpg') {
          // bug bug
          // really weird one - for some unknown to me reason, event.dataTransfer.files
          // has one entry with (seems to me) completely unrelated file
          // named 'download.jpg'.
          // I was able to reproduce this behavior
          // only in Google Chrome 117.0. For time being let just console
          // message log that it.
          // For this weird "file" we of course skip "drop_files" operation
          console.log('Where is this weird download.jpg is coming from ?')
        // workaround for weird bug END
      } else {
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
        }).catch((error?: Error) => {
          if (error) {
            toasts?.addToast("error", `Error while uploading files ${error}`);
          }
        });
      }
    }

    const data_type_nodes = event.dataTransfer.getData(DATA_TYPE_NODES);
    let all_transferred_nodes: NodeType[] = [];

    // #2 move/drop Nodes (from main or secondary panel)
    if (data_type_nodes) {
      // nodes are moved from one panel root folder to
      // another's panel root folder
      all_transferred_nodes = [...new Set(JSON.parse(data_type_nodes))] as NodeType[];

      move_nodes({
        source_nodes: all_transferred_nodes,
        target_node: nodes!.data!.parent
      }).then((moved_nodes: MovedNodesType) => {
        onMovedNodes({
          target_id: moved_nodes.parent_id,
          source: moved_nodes.nodes
        });
        setCssAcceptFiles("");
      }).catch((error: Error | undefined) => { // catch => dialog was canceled
        if (dual_context?.onResetSelectedNodes) {
          dual_context.onResetSelectedNodes();
        }
        if (dual_context?.onResetDraggedNodes) {
          dual_context.onResetDraggedNodes();
        }
        setCssAcceptFiles("");
        if (error) {
          toasts?.addToast("error", `Error while moving node(s) ${error}`);
        }
      });

      return
    }

    const data_type_pages = event.dataTransfer.getData(DATA_TRANSFER_EXTRACTED_PAGES);

    if (data_type_pages && data_type_pages.length > 0) {
      // means commander is about to receive extracted pages
      const _data = JSON.parse(data_type_pages) as DataTransferExtractedPages;
      const source_page_ids = [...new Set(_data.pages)] as Array<string>;

      extract_pages({
        source_page_ids: source_page_ids,
        target_folder: nodes!.data!.parent,
        document_title: _data.document_title
      }).then((arg: ExtractedPagesType) => {
        onExtractPages(arg);
        setCssAcceptFiles("");
      }).catch((error: Error) => {
        if (error) {
          toasts?.addToast(`error`, `Error while extracting page(s): ${error}`)
        }
      });
    }
  }

  const onDropNodesToSpecificFolder = (node_id: string, event: React.DragEvent) => {
    /**
     * Triggered when user moves one or multiple nodes from
     * one panel into another's panel specific folder i.e. nodes
     * are moved/dropped over some folder in the list.
     */
    const data_raw = event.dataTransfer.getData(DATA_TYPE_NODES);
    let all_transferred_nodes: NodeType[] = [];

    if (data_raw) {
      all_transferred_nodes = [...new Set(JSON.parse(data_raw))] as NodeType[];

      if (overlap<NodeType>(all_transferred_nodes, [get_node(node_id)])) {
        // show error message and return
        toasts?.addToast("error", "One of the source nodes is same as the target. Operation aborted.");
        if (dual_context?.onResetSelectedNodes) {
          dual_context.onResetSelectedNodes();
        }
        if (dual_context?.onResetDraggedNodes) {
          dual_context.onResetDraggedNodes();
        }
        setCssAcceptFiles("");
        return;
      }

      move_nodes({
        source_nodes: all_transferred_nodes,
        target_node: get_node(node_id)
      }).then((moved_nodes: MovedNodesType) => {
        setCssAcceptFiles("");
        onMovedNodes({
          target_id: moved_nodes.parent_id,
          source: moved_nodes.nodes
        });
      }).catch(() => { // catch => dialog was canceled
        // reset selection
        if (dual_context?.onResetSelectedNodes) {
          dual_context.onResetSelectedNodes();
        }
        if (dual_context?.onResetDraggedNodes) {
          dual_context.onResetDraggedNodes();
        }
        setCssAcceptFiles("");
      });
    } else {
      console.warn(`Empty dataTransfer while dropping to ${node_id} folder`);
    }
  }

  const onCreatedNodesByUpload = (created_nodes: CreatedNodesType) => {
    onNodesListChange(
      [...nodes!.data!.nodes, ...created_nodes.nodes]
    );
  }

  if (nodes.error) {
    if (nodes.error.includes("401")) {
      return <div className='text-danger'>Error: 401 Unauthorized</div>
    }
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
            onDropNodesToSpecificFolder={onDropNodesToSpecificFolder}
            display_mode={display_mode}
            is_selected={in_list(item.id, selected_nodes)}
            is_being_dragged={in_list(item.id, dragged_nodes)}
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
            is_selected={in_list(item.id, selected_nodes)}
            is_being_dragged={in_list(item.id, dragged_nodes)}
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
        <div className='top-bar action-panel'>
          <Menu
            onNewFolderClick={onNewFolderClick}
            onRenameClick={onRenameClick}
            onDeleteNodesClick={onDeleteNodesClick}
            onEditTagsClick={onEditTagsClick}
            onCreatedNodesByUpload={onCreatedNodesByUpload}
            selected_nodes={selected_nodes}
            target={nodes!.data!.parent} />

            <div className="d-flex align-items-center">
              <SortDropdown
                sort={sort}
                onChange={onSortChange} />

              <DisplayModeDropown value={display_mode}
                onNodesDisplayModeList={onNodesDisplayModeList}
                onNodesDisplayModeTiles={onNodesDisplayModeTiles} />

              <Form.Select onChange={onPerPageValueChange} defaultValue={pagination.per_page}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Form.Select>

              <TargetEqualSource
                direction={target_equal_source_direction}
                onTargetEqualSourceClick={onTargetEqualSourceClick} />

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
        <div ref={commander_content_ref} className='content'>
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
      </div>
    )
  }

  return <div className='p-2 m-2'>
    {nodes.error}
  </div>;
}

export default Commander;
