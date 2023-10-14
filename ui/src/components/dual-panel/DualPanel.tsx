/**
 * Container for one or two <SinglePanel />s
 * which is to say container for either <Commander /> or for <Viewer />
 *
 * */

import { useState, useEffect, createContext } from 'react';
import SinglePanel from './SinglePanel';
import { DocumentType, DocumentVersion, NType, PageAndRotOp, Pagination, Sorting } from 'types';
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
  const mnodes = useNodes({ // main panel nodes
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
  const snodes = useNodes({ // secondary panel nodes
    node: secondary_node,
    pagination: spagination,
    sort: ssort
  });
  const main_doc = useDoc({node: main_node});
  const secondary_doc = useDoc({node: secondary_node});
  const [mcurDocVer, setMCurDocVer] = useState<DocumentVersion | null>();
  const [scurDocVer, setSCurDocVer] = useState<DocumentVersion | null>();
  const [mdocVers, setMDocVers] = useState<DocumentVersion[]>();
  const [sdocVers, setSDocVers] = useState<DocumentVersion[]>();
  const [mcurPages, setMCurPages] = useState<PageAndRotOp[]>();
  const [scurPages, setSCurPages] = useState<PageAndRotOp[]>();

  useEffect(() => { // for main doc
    if (main_doc?.data) {
      setMDocVers(main_doc.data.versions);
      let last_version = get_last_doc_version(main_doc.data);

      setMCurDocVer(last_version);
      setMCurPages(last_version.pages.map(p => {return {
        page: p, angle: 0
      }}));
    }

  }, [main_doc]);

  useEffect(() => { // for secondary doc
    if (secondary_doc?.data) {
      setSDocVers(secondary_doc.data.versions);
      let last_version = get_last_doc_version(secondary_doc.data);

      setSCurDocVer(last_version);
      setSCurPages(last_version.pages.map(p => {return {
        page: p, angle: 0
      }}));
    }

  }, [secondary_doc])

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

  try {
    if (secondary_node == null) {
      return <DualPanelContext.Provider value={{onOpenSecondary, onCloseSecondary}}>
        <SinglePanel
          parent_node={main_node}
          nodes={mnodes}
          onNodeClick={onMainPanelNodeClick}
          onSortChange={onMainPanelSortChange}
          pagination={mpagination}
          sort={msort}
          show_dual_button={'split'} />
      </DualPanelContext.Provider>
    } else {
      return <div className='d-flex'>
        <DualPanelContext.Provider value={{onOpenSecondary, onCloseSecondary}}>
        <SinglePanel
          parent_node={main_node}
          nodes={mnodes}
          onNodeClick={onMainPanelNodeClick}
          onSortChange={onMainPanelSortChange}
          pagination={mpagination}
          sort={msort} />
        <SinglePanel
          parent_node={secondary_node}
          nodes={snodes}
          onNodeClick={onSecondaryPanelNodeClick}
          onSortChange={onSecondaryPanelSortChange}
          pagination={spagination}
          sort={ssort}
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
