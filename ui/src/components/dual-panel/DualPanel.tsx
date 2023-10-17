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
  UUIDList
} from 'types';
import { init_vow, ready_vow } from 'utils/vow';
import useNodes from './useNodes';
import useDoc from './useDoc';

type Args = {
  node: NType;
}


type DualPanelContextType = {
  onOpenSecondary: (local_node: NType) => void;
  onCloseSecondary: () => void;
}


export const DualPanelContext = createContext<DualPanelContextType|null>(null);


function DualPanel({ node }: Args) {

  const [main_node, setMainNode] = useState<NType>(node);
  const [secondary_node, setSecondaryNode] = useState<NType | null>(null);

  // mpagination = main panel pagination
  const [mpagination, setMPagination] = useState<Pagination>({
    page_number: 1, per_page: 15
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
    page_number: 1, per_page: 15
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
  const main_doc = useDoc({node: main_node});
  const secondary_doc = useDoc({node: secondary_node});
  const [mcurDocVer, setMCurDocVer] = useState<Vow<DocumentVersion>>(init_vow());
  const [scurDocVer, setSCurDocVer] = useState<Vow<DocumentVersion>>(init_vow());
  const [mdocVers, setMDocVers] = useState<Vow<DocumentVersion[]>>(init_vow());
  const [sdocVers, setSDocVers] = useState<Vow<DocumentVersion[]>>(init_vow());
  const [mcurPages, setMCurPages] = useState<Vow<PageAndRotOp[]>>(init_vow());
  const [scurPages, setSCurPages] = useState<Vow<PageAndRotOp[]>>(init_vow());
  const [mdoc_breadcrumb, setMDocBreadcrumb] = useState<Vow<BreadcrumbType>>(init_vow());
  const [sdoc_breadcrumb, setSDocBreadcrumb] = useState<Vow<BreadcrumbType>>(init_vow());
  const [selected_mnodes, setSelectedMNodes] = useState<UUIDList>([]);
  const [selected_snodes, setSelectedSNodes] = useState<UUIDList>([]);
  const [dragged_mnodes, setDraggedMNodes] = useState<UUIDList>([]);
  const [dragged_snodes, setDraggedSNodes] = useState<UUIDList>([]);

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
    }

  }, [secondary_doc?.data?.id])

  const onOpenSecondary = (local_node: NType) => {
    if (local_node) {
      setSecondaryNode(local_node);
      setMainNode(local_node);
    }
  }

  const onMainPanelNodeClick = (local_node: NType) => {
    setMainNode(local_node);
  }

  const onSecondaryPanelNodeClick = (local_node: NType) => {
    console.log(`secondary panel node click`, local_node);
    setSecondaryNode(local_node);
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
      const new_nodes = mnodes.data?.nodes.filter(n => {
        const source_ids = args.source.map(i => i.id);
        return source_ids.indexOf(n.id) < 0;
      });

      setMNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = new_nodes || [];
      });
    } else if (source_parent_id == secondary_node?.id) {
      const new_nodes = snodes.data?.nodes.filter(n => {
        const source_ids = args.source.map(i => i.id);
        return source_ids.indexOf(n.id) < 0;
      });

      setSNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = new_nodes || [];
      });
    }

    // add nodes to the target
    if (args.target_id == main_node.id) {
      setMNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = [...mnodes!.data!.nodes, ...args.source];
      });
    } else if (args.target_id == secondary_node?.id) {
      setSNodes((draft: Vow<NodesType>) => {
        draft!.data!.nodes = [...snodes!.data!.nodes, ...args.source];
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

  try {
    if (secondary_node == null) {
      return <DualPanelContext.Provider value={{onOpenSecondary, onCloseSecondary}}>
        <SinglePanel
          parent_node={main_node}
          nodes={mnodes}
          selected_nodes={selected_mnodes}
          dragged_nodes={dragged_mnodes}
          onMovedNodes={onMovedNodes}
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
          onDocVerChange={onMainDocVerChange}
          onDocVersionsChange={onMainDocVersionsChange}
          onPagesChange={onMainPagesChange}
          onDocBreadcrumbChange={onMDocBreadcrumbChange}
          show_dual_button={'split'} />
      </DualPanelContext.Provider>
    } else {
      return <div className='d-flex'>
        <DualPanelContext.Provider value={{onOpenSecondary, onCloseSecondary}}>
        <SinglePanel
          parent_node={main_node}
          nodes={mnodes}
          selected_nodes={selected_mnodes}
          dragged_nodes={dragged_mnodes}
          onMovedNodes={onMovedNodes}
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
          onDocVerChange={onMainDocVerChange}
          onDocVersionsChange={onMainDocVersionsChange}
          onPagesChange={onMainPagesChange}
          onDocBreadcrumbChange={onMDocBreadcrumbChange} />
        <SinglePanel
          parent_node={secondary_node}
          nodes={snodes}
          onMovedNodes={onMovedNodes}
          onSelectNodes={onSelectSNodes}
          selected_nodes={selected_snodes}
          dragged_nodes={dragged_snodes}
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
          onDocVerChange={onSecondaryDocVerChange}
          onDocVersionsChange={onSecondaryDocVersionsChange}
          onPagesChange={onSecondaryPagesChange}
          onDocBreadcrumbChange={onSDocBreadcrumbChange}
          show_dual_button={'close'} />
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

export default DualPanel;
