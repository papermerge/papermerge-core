import { useContext } from 'react';
import { Button } from "react-bootstrap";
import { DualPanelContext } from './DualPanel';
import type { ShowDualButtonEnum, CType } from "types"


type Args = {
  show_dual_button?: ShowDualButtonEnum;
  node_id: string | undefined;
  node_type: CType;
}


export function DualButton({
  show_dual_button,
  node_id,
  node_type
}: Args) {

  const context = useContext(DualPanelContext);

  const onLayoutSplitClicked = () => {
    if (context?.onOpenSecondary) {
      context.onOpenSecondary(node_id, node_type);
    } else {
      console.warn("DualButton received null context");
    }
  }

  const onCloseClicked = () => {
    if (context?.onCloseSecondary) {
      context.onCloseSecondary();
    } else {
      console.warn("DualButton received null context");
    }
  }

  if (show_dual_button == 'split') {
    return <Button variant='light' className='m-1' onClick={onLayoutSplitClicked}>
      <i className="bi-layout-split"></i>
    </Button>
  }

  if (show_dual_button == 'close') {
    return <Button variant='light' className='m-1' onClick={onCloseClicked}>
      <i className="bi-x"></i>
    </Button>
  }

  return <></>; // return a valid JSX.Element
}
