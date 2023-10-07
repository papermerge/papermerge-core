/** Container for one or two <SinglePanel />s */

/** Container for either <Commander /> or for <Viewer /> */

import { useState, useEffect } from 'react';
import SinglePanel from './SinglePanel';
import { CType } from 'types';


type Args = {
  special_folder_id: string;
  special_node_type: CType;
}


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
      return <SinglePanel
              special_folder_id={main_node_id}
              special_node_type={main_node_type}
              onOpenSecondary={onOpenSecondary}
              onCloseSecondary={onCloseSecondary}
              show_dual_button={'split'} />
    } else {
      return <div className='d-flex'>
        <SinglePanel
              special_folder_id={main_node_id}
              special_node_type={main_node_type}
              onOpenSecondary={onOpenSecondary}
              onCloseSecondary={onCloseSecondary} />
        <SinglePanel
              special_folder_id={secondary_node_id}
              special_node_type={secondary_node_type}
              onOpenSecondary={onOpenSecondary}
              onCloseSecondary={onCloseSecondary}
              show_dual_button={'close'} />
      </div>
    }
  } catch(e) {
    return <div>Caught exception</div>;
  }

}

export default DualPanel;
