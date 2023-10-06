import { Button } from "react-bootstrap";
import type { ShowDualButtonEnum } from "types"


type Args = {
  onOpenSecondary: () => void;
  onCloseSecondary: () => void;
  show_dual_button?: ShowDualButtonEnum;
}


export function DualButton({onOpenSecondary, onCloseSecondary, show_dual_button}: Args) {

  if (show_dual_button == 'split') {
    return <Button variant='light' className='m-1' onClick={() => onOpenSecondary()}>
      <i className="bi-layout-split"></i>
    </Button>
  }

  if (show_dual_button == 'close') {
    return <Button variant='light' className='m-1' onClick={() => onCloseSecondary()}>
      <i className="bi-x"></i>
    </Button>
  }
}
