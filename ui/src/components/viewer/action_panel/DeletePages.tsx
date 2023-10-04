import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';

import { OverlayTrigger } from 'react-bootstrap';

type Args = {
  onClick: () => void;
}

function DeletePages({onClick}: Args) {

  return(
    <>
        <OverlayTrigger
          placement={'top'}
          overlay={<Tooltip>Delete pages</Tooltip>}>
            <Button variant="danger"
              type="button"
              className='m-1'
              onClick={() => onClick()}>
                <i className="bi bi-trash"></i>
            </Button>
        </OverlayTrigger>
    </>
  );
}

export default DeletePages;
