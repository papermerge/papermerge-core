import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';

import { OverlayTrigger } from 'react-bootstrap';

type Args = {
  onClick: () => void;
}

function EditTags({onClick}: Args) {

  return(
    <>
        <OverlayTrigger
          placement={'top'}
          overlay={<Tooltip>Edit tags</Tooltip>}>
            <Button variant="light"
              className='m-1'
              type="button"
              onClick={() => onClick()}>
                <i className="bi bi-tag"></i>
            </Button>
        </OverlayTrigger>
    </>
  );
}

export default EditTags;
