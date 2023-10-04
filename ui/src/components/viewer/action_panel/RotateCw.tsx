import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';

import { OverlayTrigger } from 'react-bootstrap';

type Args = {
  onClick: () => void;
}

function RotateCw({onClick}: Args) {

  return(
    <>
        <OverlayTrigger
          placement={'top'}
          overlay={<Tooltip>Rotate Clockwise</Tooltip>}>
            <Button variant="light"
              type="button"
              className='m-1'
              onClick={() => onClick()}>
                <i className="bi bi-arrow-clockwise"></i>
            </Button>
        </OverlayTrigger>
    </>
  );
}

export default RotateCw;
