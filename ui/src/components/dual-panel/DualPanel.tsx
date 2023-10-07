/**
 * Container for one or two <SinglePanel />s
 * which is to say container for either <Commander /> or for <Viewer />
 *
 * */

import { useState, useEffect, createContext } from 'react';
import SinglePanel from './SinglePanel';
import { CType } from 'types';


type Args = {
  special_folder_id: string;
  special_node_type: CType;
}


type DualPanelContextType = {
  onOpenSecondary: (node_id: string|undefined, node_type: CType) => void;
  onCloseSecondary: () => void;
}


export const DualPanelContext = createContext<DualPanelContextType|null>(null);


function DualPanel({ special_folder_id, special_node_type }: Args) {

  const [main_node_id, setMainNodeId] = useState<string>(special_folder_id);
  const [main_node_type, setMainNodeType] = useState<CType>(special_node_type);
  const [secondary_node_id, setSecondaryNodeId] = useState<string|null>(null);
  const [secondary_node_type, setSecondaryNodeType] = useState<CType>("folder");

  const onOpenSecondary = (node_id: string|undefined, node_type: CType) => {
    if (node_id) {
      setSecondaryNodeId(node_id);
      setMainNodeId(node_id);
    }
    setSecondaryNodeType(node_type);
    setMainNodeType(node_type);
  }

  useEffect(() => {
    // when user switches special folders (inbox, home) then
    // main panel should react accordingly i.e. change to
    // the new special folder
    setMainNodeId(special_folder_id);
    setMainNodeType(special_node_type);
  }, [special_folder_id])


  const onCloseSecondary = () => {
    setSecondaryNodeId(null);
  }

  try {
    if (secondary_node_id == null) {
      return <div>
        <DualPanelContext.Provider value={{onOpenSecondary, onCloseSecondary}}>
          <SinglePanel
                special_folder_id={main_node_id}
                special_node_type={main_node_type}
                show_dual_button={'split'} />
        </DualPanelContext.Provider>
      </div>
    } else {
      return <div className='d-flex'>
        <DualPanelContext.Provider value={{onOpenSecondary, onCloseSecondary}}>
          <SinglePanel
                special_folder_id={main_node_id}
                special_node_type={main_node_type} />
          <SinglePanel
                special_folder_id={secondary_node_id}
                special_node_type={secondary_node_type}
                show_dual_button={'close'} />
        </DualPanelContext.Provider>
      </div>
    }
  } catch(e) {
    return <div>Caught exception</div>;
  }

}

export default DualPanel;
