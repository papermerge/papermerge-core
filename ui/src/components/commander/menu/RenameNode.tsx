import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';

import { OverlayTrigger } from 'react-bootstrap';

type Args = {
  onClick: () => void;
}

function RenameNodes({onClick}: Args) {

  return(
    <>
        <OverlayTrigger
          placement={'top'}
          overlay={<Tooltip>Edit title</Tooltip>}>
            <Button variant="light"
              className='m-1'
              type="button"
              onClick={() => onClick()}>
                <i className="bi bi-pencil"></i>
            </Button>
        </OverlayTrigger>
    </>
  );
}

export default RenameNodes;
