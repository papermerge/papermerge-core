import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';

import { OverlayTrigger } from 'react-bootstrap';

type Args = {
  onClick: () => void;
}

function DeleteNodes({onClick}: Args) {

  return(
    <>
        <OverlayTrigger
          placement={'top'}
          overlay={<Tooltip>Delete nodes</Tooltip>}>
            <Button variant="light"
              type="button"
              onClick={() => onClick()}>
                <i className="bi bi-trash"></i>
            </Button>
        </OverlayTrigger>
    </>
  );
}

export default DeleteNodes;
