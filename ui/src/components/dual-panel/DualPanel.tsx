/** Container for one or two <SinglePanel />s */

/** Container for either <Commander /> or for <Viewer /> */

import { useState } from 'react';
import SinglePanel from './SinglePanel';
import { CType } from 'types';


type Args = {
  special_folder_id: string;
  special_node_type: CType;
}


function DualPanel({ special_folder_id, special_node_type }: Args) {
  const [secondary_node_id, setSecondaryNodeId] = useState<string|null>(null);
  const [secondary_node_type, setSecondaryNodeType] = useState<CType>("folder");

  const onOpenSecondary = () => {
    setSecondaryNodeId(special_folder_id);
    setSecondaryNodeType(secondary_node_type);
  }

  const onCloseSecondary = () => {
    setSecondaryNodeId(null);
  }

  try {
    if (secondary_node_id == null) {
      return <SinglePanel
              special_folder_id={special_folder_id}
              special_node_type={special_node_type}
              onOpenSecondary={onOpenSecondary}
              onCloseSecondary={onCloseSecondary} />
    } else {
      return <div className='d-flex'>
        <SinglePanel
              special_folder_id={special_folder_id}
              special_node_type={special_node_type}
              onOpenSecondary={onOpenSecondary}
              onCloseSecondary={onCloseSecondary} />
        <SinglePanel
              special_folder_id={secondary_node_id}
              special_node_type={secondary_node_type}
              onOpenSecondary={onOpenSecondary}
              onCloseSecondary={onCloseSecondary} />
      </div>
    }
  } catch(e) {
    return <div>Caught exception</div>;
  }

}

export default DualPanel;
