import { Button } from "react-bootstrap";
import { TargetDirection } from "types";


type Args = {
  direction?: TargetDirection;
}

export function TargetEqualSource({direction}: Args) {

  if (!direction) {
    return <div />
  }

  if (direction == "right") {
    return <Button variant='light' className='m-1'>
      <i className="bi-arrow-bar-right"></i>
    </Button>
  }

  return <Button variant='light' className='m-1'>
    <i className="bi-arrow-bar-left"></i>
  </Button>
}
