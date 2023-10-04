import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';

import { OverlayTrigger } from 'react-bootstrap';

type Args = {
  onClick: () => void;
}

function RotateCcw({onClick}: Args) {

  return(
    <>
        <OverlayTrigger
          placement={'top'}
          overlay={<Tooltip>Rotate counter clockwise</Tooltip>}>
            <Button variant="light"
              type="button"
              className='m-1'
              onClick={() => onClick()}>
                <i className="bi bi-arrow-counterclockwise"></i>
            </Button>
        </OverlayTrigger>
    </>
  );
}

export default RotateCcw;
