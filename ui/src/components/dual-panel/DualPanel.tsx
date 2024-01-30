/**
 * Container for one or two <SinglePanel />s
 * which is to say container for either <Commander /> or for <Viewer />
 *
 * */

import { useState, useEffect, createContext } from 'react';
import SinglePanel from './SinglePanel';
import { Vow,
  NodesType,
  NodeType,
  DocumentType,
  DocumentVersion,
  NType,
  PageAndRotOp,
  Pagination,
  Sorting,
  BreadcrumbType,
  onMovedNodesType,
  UUIDList,
  MovePagesBetweenDocsType,
  ExtractedPagesType,
  TargetFolder,
  MovedDocumentType,
  TargetDirection
} from 'types';
import { init_vow, ready_vow } from 'utils/vow'
import useNodes from './useNodes'
import useDoc from './useDoc'
import { uniq_concat, subtract } from 'utils/array'
import {
  PAGINATION_DEFAULT_ITEMS_PER_PAGES,
  STORAGE_KEY_PAGINATION_MITEMS_PER_PAGE,
  STORAGE_KEY_PAGINATION_SITEMS_PER_PAGE
} from 'cconstants';


type Args = {
  node: NType;
}


type DualPanelContextType = {
  onOpenSecondary: (local_node: NType) => void;
  onCloseSecondary: () => void;
  onResetSelectedNodes: () => void;
  onResetDraggedNodes: () => void;
}


export const DualPanelContext = createContext<DualPanelContextType|null>(null);


function DualPanel({ node }: Args) {

  const [main_node, setMainNode] = useState<NType>(node);
  const [secondary_node, setSecondaryNode] = useState<NType | null>(null);

  // mpagination = main panel pagination
  const [mpagination, setMPagination] = useState<Pagination>({
    page_number: 1, per_page: get_mitems_per_page()
  });
  // msort = main panel sort
  const [msort, setMSort] = useState<Sorting>({
    sort_field: 'title', sort_order: 'desc'
  });
  // mnodes = main panel nodes (with their breadcrumb and parent)
  const [mnodes, setMNodes] = useNodes({ // main panel nodes
    node: main_node,
    pagination: mpagination,
    sort: msort
  });
  const [spagination, setSPagination] = useState<Pagination>({
    page_number: 1, per_page: get_sitems_per_page()
  });
  const [ssort, setSSort] = useState<Sorting>({
    sort_field: 'title', sort_order: 'desc'
  });
  // snodes = secondary panel nodes (with their breadcrumb and parent)
  const [snodes, setSNodes] = useNodes({ // secondary panel nodes
    node: secondary_node,
    pagination: spagination,
    sort: ssort
  });
  const [main_doc, setMainDoc] = useDoc({node: main_node});
  const [secondary_doc, setSecondaryDoc] = useDoc({node: secondary_node});
  const [mcurDocVer, setMCurDocVer] = useState<Vow<DocumentVersion>>(init_vow());
  const [scurDocVer, setSCurDocVer] = useState<Vow<DocumentVersion>>(init_vow());
  const [mdocVers, setMDocVers] = useState<Vow<DocumentVersion[]>>(init_vow());
  const [sdocVers, setSDocVers] = useState<Vow<DocumentVersion[]>>(init_vow());
  const [mcurPages, setMCurPages] = useState<Vow<PageAndRotOp[]>>(init_vow());
  const [scurPages, setSCurPages] = useState<Vow<PageAndRotOp[]>>(init_vow());
  const [selectedMPages, setSelectedMPages] = useState<Array<string>>([]);
  const [selectedSPages, setSelectedSPages] = useState<Array<string>>([]);
  const [dragged_mpages, setDraggedMPages] = useState<Array<string>>([]);
  const [dragged_spages, setDraggedSPages] = useState<Array<string>>([]);
  const [mdoc_breadcrumb, setMDocBreadcrumb] = useState<Vow<BreadcrumbType>>(init_vow());
  const [sdoc_breadcrumb, setSDocBreadcrumb] = useState<Vow<BreadcrumbType>>(init_vow());
  const [selected_mnodes, setSelectedMNodes] = useState<UUIDList>([]);
  const [selected_snodes, setSelectedSNodes] = useState<UUIDList>([]);
  const [dragged_mnodes, setDraggedMNodes] = useState<UUIDList>([]);
  const [dragged_snodes, setDraggedSNodes] = useState<UUIDList>([]);
  // target folder for main panel
  const [mtarget_folder, setMTargetFolder] = useState<TargetFolder|null>(null)
  // target folder for secondary panel
  const [starget_folder, setSTargetFolder] = useState<TargetFolder|null>(null)

  useEffect(() => {
    setMainNode(node);
  }, [node.id]);

  useEffect(() => { // for main doc
    if (main_doc?.data) {
      const last_version = get_last_doc_version(main_doc.data);
      const pages: PageAndRotOp[] = last_version.pages.map(p => {return {
        page: p, angle: 0
      }})
      setMDocVers(ready_vow(main_doc.data.versions));
      setMCurDocVer(ready_vow(last_version))
      setMCurPages(ready_vow(pages));
      setMDocBreadcrumb(ready_vow(main_doc.data.breadcrumb));
      setSTargetFolder(null)
    }

  }, [main_doc?.data?.id]);

  useEffect(() => { // for secondary doc
    if (secondary_doc?.data) {
      const last_version = get_last_doc_version(secondary_doc.data);
      const pages: PageAndRotOp[] = last_version.pages.map(p => {return {
        page: p, angle: 0
      }})
      setSDocVers(ready_vow(secondary_doc.data.versions));
      setSCurDocVer(ready_vow(last_version))
      setSCurPages(ready_vow(pages));
      setSDocBreadcrumb(ready_vow(secondary_doc.data.breadcrumb));
      setMTargetFolder(null)
    }

  }, [secondary_doc?.data?.id])

  useEffect(() => {
    if (snodes?.data) {
      const len = snodes.data.breadcrumb.length;
      const last_item = snodes.data.breadcrumb[len - 1]
      const new_target = {
        id: last_item[0],
        title: last_item[1]
      }
      setMTargetFolder(new_target)
    }
  }, [snodes?.data])

  useEffect(() => {
    if (mnodes?.data) {
      const len = mnodes.data.breadcrumb.length;
      const last_item = mnodes.data.breadcrumb[len - 1]
      const new_target = {
        id: last_item[0],
        title: last_item[1]
      }
      setSTargetFolder(new_target)
    }
  }, [mnodes?.data])

  const onOpenSecondary = (local_node: NType) => {
    if (local_node) {
      setSecondaryNode(local_node);
      setMainNode(local_node);
    }
  }

  const onMainPanelNodeClick = (local_node: NType) => {
    setMainNode(local_node);
    // Switching folders resets page number to 1
    setMPagination({
      per_page: mpagination.per_page,
      page_number: 1
    });
  }

  const onSecondaryPanelNodeClick = (local_node: NType) => {
    setSecondaryNode(local_node);
    // Switching folders resets page number to 1
    setSPagination({
      per_page: spagination.per_page,
      page_number: 1
    });
  }

  const onMainPanelSortChange = (new_value: Sorting) => {
    setMSort(new_value);
  }

  const onSecondaryPanelSortChange = (new_value: Sorting) => {
    setSSort(new_value);
  }

  const onCloseSecondary = () => {
    setSecondaryNode(null);
  }

  const onMainDocVersionsChange = (doc_versions: DocumentVersion[]) => {
    setMDocVers(ready_vow(doc_versions));

    // is it happens that both panels have opened same doc
    if (secondary_doc?.data?.id === main_doc?.data?.id) {
      setSDocVers(ready_vow(doc_versions));
    }
  }

  const onMainDocVerChange = (doc_ver: DocumentVersion) => {
  }

  const onMainPagesChange = (pages: PageAndRotOp[]) => {
    setMCurPages(ready_vow(pages));

    // is it happens that both panels have opened same doc
    if (secondary_doc?.data?.id === main_doc?.data?.id) {
      setSCurPages(ready_vow(pages));
    }
  }

  const onSecondaryDocVersionsChange = (doc_versions: DocumentVersion[]) => {
    setSDocVers(ready_vow(doc_versions));

    // is it happens that both panels have opened same doc
    if (secondary_doc?.data?.id === main_doc?.data?.id) {
      setMDocVers(ready_vow(doc_versions));
    }
  }

  const onSecondaryDocVerChange = (doc_ver: DocumentVersion) => {
  }

  const onSecondaryPagesChange = (pages: PageAndRotOp[]) => {
    setSCurPages(ready_vow(pages));

    // is it happens that both panels have opened same doc
    if (secondary_doc?.data?.id === main_doc?.data?.id) {
      setMCurPages(ready_vow(pages));
    }
  }

  const onMDocBreadcrumbChange = (new_breadcrumb: BreadcrumbType) => {
    setMDocBreadcrumb(ready_vow(new_breadcrumb));

    // is it happens that both panels have opened same doc
    if (secondary_doc?.data?.id === main_doc?.data?.id) {
      // then update secondary_doc breadcrumb as well
      setSDocBreadcrumb(ready_vow(new_breadcrumb));
    }
  }

  const onSDocBreadcrumbChange = (new_breadcrumb: BreadcrumbType) => {
    setSDocBreadcrumb(ready_vow(new_breadcrumb));

    // is it happens that both panels have opened same doc
    if (secondary_doc?.data?.id === main_doc?.data?.id) {
      // then update secondary_doc breadcrumb as well
      setMDocBreadcrumb(ready_vow(new_breadcrumb));
    }
  }

  const onMNodesListChange = (new_nodes: NodeType[]) => {
    setMNodes((draft: Vow<NodesType>) => {
      draft!.data!.nodes = new_nodes;
    });

    if (mnodes?.data?.parent?.id == snodes?.data?.parent?.id) {
      setSNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = new_nodes;
      });
    }
  }

  const onSNodesListChange = (new_nodes: NodeType[]) => {
    setSNodes((draft: Vow<NodesType>) => {
      draft!.data!.nodes = new_nodes;
    });

    if (mnodes?.data?.parent?.id == snodes?.data?.parent?.id) {
      setMNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = new_nodes;
      });
    }
  }

  const onMovedNodes = (args: onMovedNodesType) => {

    if (args.source.length == 0) {
      console.warn("onMoveNodes received empty source list");
      return;
    }

    const source_parent_id = args.source[0].parent_id;

    // substract nodes from the source
    if (source_parent_id == main_node.id) {
      const new_nodes = subtract<NodeType>(
        mnodes.data?.nodes!,
        args.source,
        (item: NodeType) => item.id
      );
      setMNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = new_nodes || [];
      });

    } else if (source_parent_id == secondary_node?.id) {
      const new_nodes = subtract<NodeType>(
        snodes.data?.nodes!,
        args.source,
        (item: NodeType) => item.id
      );
      setSNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = new_nodes || [];
      });
    }

    // add nodes to the target
    if (args.target_id == main_node.id) {
      setMNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = uniq_concat<NodeType>(
          mnodes!.data!.nodes, args.source
        );
      });
    } else if (args.target_id == secondary_node?.id) {
      setSNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = uniq_concat<NodeType>(
          snodes!.data!.nodes,
          args.source
        );
      });
    }

    setDraggedMNodes([]);
    setDraggedSNodes([]);
    setSelectedMNodes([]);
    setSelectedSNodes([]);
  }

  const onSelectSNodes = (value: UUIDList) => {
    setSelectedSNodes(value);
  }

  const onSelectMNodes = (value: UUIDList) => {
    setSelectedMNodes(value);
  }

  const onDragMNodes = (value: UUIDList) => {
    setDraggedMNodes(value);
  }

  const onDragSNodes = (value: UUIDList) => {
    setDraggedSNodes(value);
  }

  const onResetSelectedNodes = () => {
    setSelectedMNodes([]);
    setSelectedSNodes([]);
  }

  const onResetDraggedNodes = () => {
    setDraggedMNodes([]);
    setDraggedSNodes([]);
  }

  const onMovePagesBetweenDocs = ({source, target}: MovePagesBetweenDocsType) => {
    const target_doc_ver: DocumentVersion = get_last_doc_version(target);
    const target_pages: PageAndRotOp[] = target_doc_ver.pages.map(
      p => ({page: p, angle: 0})
    );

    if (!source) {
      /* means that source was deleted - which may happen
        when all pages of the document were moved */
      setSecondaryNode(null);
      setSCurPages(ready_vow([]));
      setSDocVers(ready_vow([]));

      setMainNode({id: target.id, ctype: 'document'});
      setMCurPages(ready_vow(target_pages));
      setMDocVers(ready_vow(target.versions));

      setSelectedMPages([]);
      setSelectedSPages([]);

      return
    }

    const source_doc_ver: DocumentVersion = get_last_doc_version(source);
    const source_pages: PageAndRotOp[] = source_doc_ver.pages.map(
      p => ({page: p, angle: 0})
    );

    if (source.id == main_doc.data?.id) {
      // source is on main panel
      setMCurPages(ready_vow(source_pages)); // thumbnails & pages
      setMDocVers(ready_vow(source.versions)); // content of vers. dropdown
      setSCurPages(ready_vow(target_pages)); // thumbnails & pages
      setSDocVers(ready_vow(target.versions)); // content of vers. dropdown
    } else {
      // source is on secondary panel
      setMCurPages(ready_vow(target_pages)); // thumbnails & pages
      setMDocVers(ready_vow(target.versions)); // content of vers. dropdown
      setSCurPages(ready_vow(source_pages)); // thumbnails & pages
      setSDocVers(ready_vow(source.versions)); // content of vers. dropdown
    }
    // reset selections on both sides
    setSelectedMPages([]);
    setSelectedSPages([]);
  } // end of onMovePagesBetweenDocs

  const onSelectedMPages = (sel_pages: Array<string>) => {
    setSelectedMPages(sel_pages);
  }

  const onSelectedSPages = (sel_pages: Array<string>) => {
    setSelectedSPages(sel_pages);
  }

  const onDraggedMPages = (dragged_pages: Array<string>) => {
    setDraggedMPages(dragged_pages);
  }

  const onDraggedSPages = (dragged_pages: Array<string>) => {
    setDraggedMPages(dragged_pages);
  }

  const onExtractPages = (args: ExtractedPagesType) => {
    if (!args.source) {
      // leave just main panel open and add new nodes there
      setSecondaryNode(null);
      setSCurPages(ready_vow([]));
      setSDocVers(ready_vow([]));

      setMainNode({id: args.target_parent.id, ctype: 'folder'});
      setMNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = uniq_concat<NodeType>(
          mnodes!.data!.nodes, args.target
        );
      });

      return;
    }

    const _doc_ver: DocumentVersion = get_last_doc_version(args.source);
    const _pages: PageAndRotOp[] = _doc_ver.pages.map(
      p => ({page: p, angle: 0})
    );

    if (args.target_parent.id == main_node.id) {

      // add nodes to the main panel
      setMNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = uniq_concat<NodeType>(
          mnodes!.data!.nodes, args.target
        );
      });
      // refresh doc on secondary panel
      setSCurPages(ready_vow(_pages));
      setSDocVers(ready_vow(args.source.versions));
      setSelectedSPages([]);

    } else if (args.target_parent.id == secondary_node?.id) {

      // add nodes to the secondary panel
      setSNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = uniq_concat<NodeType>(
          snodes!.data!.nodes, args.target
        );
      });

      // refresh doc on main panel
      setMCurPages(ready_vow(_pages));
      setMDocVers(ready_vow(args.source.versions));
      setSelectedMPages([]);
    }
  }

  const onMPageSizeChange = (page_size: number) => {
    setMPagination({
      per_page: page_size,
      page_number: mpagination.page_number
    });
    // save in local storage
    set_mitems_per_page(page_size);
  }

  const onSPageSizeChange = (page_size: number) => {
    setSPagination({
      per_page: page_size,
      page_number: spagination.page_number
    });
    // save in local storage
    set_sitems_per_page(page_size);
  }

  const onMPageClick = (page: number) => {
    setMPagination({
      per_page: mpagination.per_page,
      page_number: page
    });
  }

  const onSPageClick = (page: number) => {
    setSPagination({
      per_page: spagination.per_page,
      page_number: page
    });
  }

  const onDocumentMoved = ({doc, target_folder}: MovedDocumentType) => {
    /* Triggered when user moves document from inside viewer
    to another panel */
    const new_node = newNodeFrom(doc)

    // update target folder nodes
    if (target_folder.id == main_node.id) {
      setMNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = uniq_concat<NodeType>(
          mnodes!.data!.nodes, [new_node]
        );
      });
    } else {
      setSNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = uniq_concat<NodeType>(
          snodes!.data!.nodes, [new_node]
        );
      });
    }

    // update source doc breadcrumb
    if (doc.id == secondary_doc?.data?.id) {
      setSDocBreadcrumb(ready_vow([
        ...mnodes.data?.breadcrumb!, [doc.id, doc.title]
      ]));
    } else if (doc.id == main_doc?.data?.id) {
      setMDocBreadcrumb(ready_vow([
        ...snodes.data?.breadcrumb!, [doc.id, doc.title]
      ]));
    }
  }

  const onDocumentDelete = (doc: DocumentType) => {
    if (main_node.ctype == 'folder') {
      const new_nodes = subtract<NodeType>(
        mnodes.data?.nodes!,
        [newNodeFrom(doc)],
        (item: NodeType) => item.id
      );
      setMNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = new_nodes || [];
      });
    }

    if (secondary_node?.ctype == 'folder') {
      const new_nodes = subtract<NodeType>(
        snodes.data?.nodes!,
        [newNodeFrom(doc)],
        (item: NodeType) => item.id
      );
      setSNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = new_nodes || [];
      });
    }

    if (doc.id == main_doc?.data?.id) {
      setMainNode({
        id: doc.parent_id!,
        ctype: 'folder'
      })
    } else if (doc.id == secondary_doc?.data?.id) {
      setSecondaryNode({
        id: doc.parent_id!,
        ctype: 'folder'
      })
    }
  }

  const onTargetEqualSourceClick = (direction?: TargetDirection) => {
    if (direction == 'left') {
      /*
        Main panel will become like secondary panel.
        Set all 'M' values to 'S' values
      */
      if (secondary_node?.ctype == 'folder') {
        // secondary node is a folder
        setMainNode(secondary_node)
        setMSort(ssort)
        setMPagination(spagination)
      } else if (secondary_node?.ctype == 'document') {
        setMainNode(secondary_node)
        setMainDoc(secondary_doc)
        setMCurDocVer(scurDocVer)
        setMCurPages(scurPages)
      }
    }

    if (direction == 'right') {
      /* secondary panel will become like main panel
        Set all 'S' values to 'M' values
      */
      if (main_node.ctype == 'folder') {
        // secondary node is a folder
        setSecondaryNode(main_node)
        setSSort(msort)
        setSPagination(mpagination)
      } else if (main_node.ctype == 'document') {
        setSecondaryNode(main_node)
        setSecondaryDoc(main_doc)
        setSCurDocVer(mcurDocVer)
        setSCurPages(mcurPages)
      }
    }
  }

  const dual_context = {
    onOpenSecondary,
    onCloseSecondary,
    onResetSelectedNodes,
    onResetDraggedNodes
  }

  try {
    if (secondary_node == null) {
      return <DualPanelContext.Provider value={dual_context}>
        <SinglePanel
          parent_node={main_node}
          nodes={mnodes}
          selected_nodes={selected_mnodes}
          dragged_nodes={dragged_mnodes}
          onMovedNodes={onMovedNodes}
          onExtractPages={onExtractPages}
          onSelectNodes={onSelectMNodes}
          onDragNodes={onDragMNodes}
          onNodeClick={onMainPanelNodeClick}
          onSortChange={onMainPanelSortChange}
          pagination={mpagination}
          sort={msort}
          onNodesListChange={onMNodesListChange}
          doc={main_doc}
          doc_versions={mdocVers}
          doc_ver={mcurDocVer}
          doc_breadcrumb={mdoc_breadcrumb}
          pages={mcurPages}
          selected_pages={selectedMPages}
          dragged_pages={dragged_mpages}
          onDocVerChange={onMainDocVerChange}
          onDocVersionsChange={onMainDocVersionsChange}
          onPagesChange={onMainPagesChange}
          onDocBreadcrumbChange={onMDocBreadcrumbChange}
          onMovePagesBetweenDocs={onMovePagesBetweenDocs}
          onSelectedPages={onSelectedMPages}
          onDraggedPages={onDraggedMPages}
          onPageSizeChange={onMPageSizeChange}
          onPageClick={onMPageClick}
          onDocumentMoved={onDocumentMoved}
          onDocumentDelete={onDocumentDelete}
          show_dual_button={"split"} />
      </DualPanelContext.Provider>
    } else {
      return <div className='d-flex'>
        <DualPanelContext.Provider value={dual_context}>
        <SinglePanel
          parent_node={main_node}
          nodes={mnodes}
          target_folder={mtarget_folder}
          target_direction={"right"}
          target_equal_source_direction={main_node.id != secondary_node.id ? "right": undefined}
          selected_nodes={selected_mnodes}
          dragged_nodes={dragged_mnodes}
          onMovedNodes={onMovedNodes}
          onExtractPages={onExtractPages}
          onSelectNodes={onSelectMNodes}
          onDragNodes={onDragMNodes}
          onNodeClick={onMainPanelNodeClick}
          onSortChange={onMainPanelSortChange}
          pagination={mpagination}
          sort={msort}
          onNodesListChange={onMNodesListChange}
          doc={main_doc}
          doc_versions={mdocVers}
          doc_ver={mcurDocVer}
          doc_breadcrumb={mdoc_breadcrumb}
          pages={mcurPages}
          selected_pages={selectedMPages}
          dragged_pages={dragged_mpages}
          onDocVerChange={onMainDocVerChange}
          onDocVersionsChange={onMainDocVersionsChange}
          onPagesChange={onMainPagesChange}
          onDocBreadcrumbChange={onMDocBreadcrumbChange}
          onMovePagesBetweenDocs={onMovePagesBetweenDocs}
          onSelectedPages={onSelectedMPages}
          onDraggedPages={onDraggedMPages}
          onPageClick={onMPageClick}
          onPageSizeChange={onMPageSizeChange}
          onDocumentMoved={onDocumentMoved}
          onDocumentDelete={onDocumentDelete}
          onTargetEqualSourceClick={onTargetEqualSourceClick} />
        <SinglePanel
          parent_node={secondary_node}
          nodes={snodes}
          target_folder={starget_folder}
          target_direction={"left"}
          target_equal_source_direction={main_node.id != secondary_node.id ? "left": undefined}
          onMovedNodes={onMovedNodes}
          onSelectNodes={onSelectSNodes}
          selected_nodes={selected_snodes}
          dragged_nodes={dragged_snodes}
          onExtractPages={onExtractPages}
          onDragNodes={onDragSNodes}
          onNodeClick={onSecondaryPanelNodeClick}
          onSortChange={onSecondaryPanelSortChange}
          pagination={spagination}
          sort={ssort}
          onNodesListChange={onSNodesListChange}
          doc={secondary_doc}
          doc_versions={sdocVers}
          doc_ver={scurDocVer}
          doc_breadcrumb={sdoc_breadcrumb}
          pages={scurPages}
          selected_pages={selectedSPages}
          dragged_pages={dragged_spages}
          onDocVerChange={onSecondaryDocVerChange}
          onDocVersionsChange={onSecondaryDocVersionsChange}
          onPagesChange={onSecondaryPagesChange}
          onDocBreadcrumbChange={onSDocBreadcrumbChange}
          onMovePagesBetweenDocs={onMovePagesBetweenDocs}
          onSelectedPages={onSelectedSPages}
          onDraggedPages={onDraggedSPages}
          onPageSizeChange={onSPageSizeChange}
          onPageClick={onSPageClick}
          onDocumentMoved={onDocumentMoved}
          onDocumentDelete={onDocumentDelete}
          show_dual_button={'close'}
          onTargetEqualSourceClick={onTargetEqualSourceClick} />
        </DualPanelContext.Provider>
      </div>
    }
  } catch(e) {
    return <div>Caught exception</div>;
  }

}

function get_last_doc_version(doc: DocumentType): DocumentVersion {
  return doc.versions.reduce((prev: DocumentVersion, cur: DocumentVersion) => {
    if (prev && prev.number > cur.number) {
      return prev;
    }

    return cur;
  });
}

function newNodeFrom(doc: DocumentType): NodeType {
  let new_node: NodeType = {
    id: doc.id,
    ctype: 'document',
    title: doc.title,
    tags: [],
    parent_id: doc.parent_id,
    accept_dropped_nodes: false,
    is_currently_dragged: false,
    update_at: doc.updated_at,
    ocr_status: doc.ocr_status,
    thumbnail_url: '',
    ocr: false,
    user_id: doc.user_id
  }

  return new_node;
}

function get_mitems_per_page(): number {
  let default_value = PAGINATION_DEFAULT_ITEMS_PER_PAGES;
  let value_str = window.localStorage.getItem(
    STORAGE_KEY_PAGINATION_MITEMS_PER_PAGE
  )
  let value: number;

  if (value_str) {
    value = parseInt(value_str);
    if (value && value > 0) {
      return value;
    }
  }

  return default_value;
}


function set_mitems_per_page(value: number): void {
  window.localStorage.setItem(
    STORAGE_KEY_PAGINATION_MITEMS_PER_PAGE, value.toString()
  );
}

function set_sitems_per_page(value: number): void {
  window.localStorage.setItem(
    STORAGE_KEY_PAGINATION_SITEMS_PER_PAGE, value.toString()
  );
}


function get_sitems_per_page(): number {
  let default_value = PAGINATION_DEFAULT_ITEMS_PER_PAGES;
  let value_str = window.localStorage.getItem(
    STORAGE_KEY_PAGINATION_SITEMS_PER_PAGE
  )
  let value: number;

  if (value_str) {
    value = parseInt(value_str);
    if (value && value > 0) {
      return value;
    }
  }

  return default_value;
}

export default DualPanel;
