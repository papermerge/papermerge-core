/**
 * Container for one or two <SinglePanel />s
 * which is to say container for either <Commander /> or for <Viewer />
 *
 * */

import { useState, useEffect, createContext } from 'react';
import SinglePanel from './SinglePanel';
import { CType, NType } from 'types';


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
  const [secondary_node, setSecondaryNode] = useState<NType|null>(null);

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
          <SinglePanel parent_node={main_node} show_dual_button={'split'} />
        </DualPanelContext.Provider>
      </div>
    } else {
      return <div className='d-flex'>
        <DualPanelContext.Provider value={{onOpenSecondary, onCloseSecondary}}>
          <SinglePanel parent_node={main_node} />
          <SinglePanel parent_node={secondary_node} show_dual_button={'close'} />
        </DualPanelContext.Provider>
      </div>
    }
  } catch(e) {
    return <div>Caught exception</div>;
  }

}

export default DualPanel;
