import { Button } from "react-bootstrap";
import { TargetDirection } from "types";


type Args = {
  direction?: TargetDirection;
  onTargetEqualSourceClick?: (arg?: TargetDirection) => void;
}

export function TargetEqualSource({direction, onTargetEqualSourceClick}: Args) {


  const onClick = () => {
    if (onTargetEqualSourceClick) {
      onTargetEqualSourceClick(direction);
    }
  }

  if (!direction) {
    return <div />
  }

  if (direction == "right") {
    return <Button variant='light' onClick={onClick} className='m-1'>
      <i className="bi-arrow-bar-right"></i>
    </Button>
  }

  return <Button variant='light' onClick={onClick} className='m-1'>
    <i className="bi-arrow-bar-left"></i>
  </Button>
}
