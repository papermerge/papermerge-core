import { useContext } from 'react';
import { Button } from "react-bootstrap";
import { DualPanelContext } from './DualPanel';
import type { ShowDualButtonEnum, NType } from "types"


type Args = {
  show_dual_button?: ShowDualButtonEnum;
  node: NType;
}


export function DualButton({
  show_dual_button,
  node,
}: Args) {

  const context = useContext(DualPanelContext);

  const onLayoutSplitClicked = () => {
    if (context?.onOpenSecondary) {
      context.onOpenSecondary(node);
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
