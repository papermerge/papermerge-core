import { Button } from "react-bootstrap";
import type { ShowDualButtonEnum, CType } from "types"


type Args = {
  onOpenSecondary: (node_id: string|undefined, node_type: CType) => void;
  onCloseSecondary: () => void;
  show_dual_button?: ShowDualButtonEnum;
  node_id: string | undefined;
  node_type: CType;
}


export function DualButton({
  onOpenSecondary,
  onCloseSecondary,
  show_dual_button,
  node_id,
  node_type
}: Args) {

  const onClick = () => {
    onOpenSecondary(node_id, node_type);
  }

  if (show_dual_button == 'split') {
    return <Button variant='light' className='m-1' onClick={onClick}>
      <i className="bi-layout-split"></i>
    </Button>
  }

  if (show_dual_button == 'close') {
    return <Button variant='light' className='m-1' onClick={() => onCloseSecondary()}>
      <i className="bi-x"></i>
    </Button>
  }

  return <></>; // return a valid JSX.Element
}
