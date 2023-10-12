/**
 * Container for one or two <SinglePanel />s
 * which is to say container for either <Commander /> or for <Viewer />
 *
 * */

import { useState, useEffect, createContext } from 'react';
import SinglePanel from './SinglePanel';
import { CType, NType, Pagination, Sorting } from 'types';
import useNodes from './hooks';

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
  })
  const [spagination, setSPagination] = useState<Pagination>({
    page_number: 1, per_page: 15
  });
  const [ssort, setSSort] = useState<Sorting>({
    sort_field: 'title', sort_order: 'desc'
  })
  const snodes = useNodes({ // secondary panel nodes
    node: secondary_node,
    pagination: spagination,
    sort: ssort
  });

  const onOpenSecondary = (local_node: NType) => {
    if (local_node) {
      setSecondaryNode(local_node);
      setMainNode(local_node);
    }
  }

  useEffect(() => {
    // when user switches special folders (inbox, home) then
    // main panel should react accordingly i.e. change to
    // the new special folder
    setMainNode(node);
  }, [node])


  const onCloseSecondary = () => {
    setSecondaryNode(null);
  }

  try {
    if (secondary_node == null) {
      return <div>
        <DualPanelContext.Provider value={{onOpenSecondary, onCloseSecondary}}>
          <SinglePanel
            parent_node={main_node}
            nodes={mnodes}
            pagination={mpagination}
            sort={msort}
            show_dual_button={'split'} />
        </DualPanelContext.Provider>
      </div>
    } else {
      return <div className='d-flex'>
        <DualPanelContext.Provider value={{onOpenSecondary, onCloseSecondary}}>
          <SinglePanel
            parent_node={main_node}
            nodes={mnodes}
            pagination={mpagination}
            sort={msort} />
          <SinglePanel
            parent_node={secondary_node}
            nodes={snodes}
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

export default DualPanel;
