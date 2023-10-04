import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';

import { OverlayTrigger } from 'react-bootstrap';

type Args = {
  onClick: () => void;
}

function NewFolder({onClick}: Args) {

  return(
    <>
        <OverlayTrigger
          placement={'top'}
          overlay={<Tooltip>Creates new folder</Tooltip>}>
            <Button variant="light"
              type="button"
              className='m-1'
              onClick={() => onClick()}>
                <i className="bi bi-folder-plus"></i>
            </Button>
        </OverlayTrigger>

    </>
  );
}

export default NewFolder;
