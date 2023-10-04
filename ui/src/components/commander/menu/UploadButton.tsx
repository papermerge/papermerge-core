import Button from 'react-bootstrap/Button';
import { uploader } from 'utils/uploader';
import Tooltip from 'react-bootstrap/Tooltip';

import type { NodeType } from 'types';
import { OverlayTrigger } from 'react-bootstrap';

type Args = {
  node_id: string;
  onCreateDocumentNode: (node: NodeType[], target_id: string) => void;
}

function UploadButton({node_id, onCreateDocumentNode}: Args) {

  const onClickProxyUpload = () => {
    let element: HTMLInputElement | null = document.querySelector('input[type=file]');

    if (element) {
      element.click();
    } else {
      console.error('input[type=file] element not found');
    }
  }

  const onUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let files: FileList | null = event.target.files;

    if (!files) {
      console.error('Empty array for uploaded files');
      return;
    }

    uploader({files, node_id, onCreateDocumentNode});
  }

  return(
    <>
      <input
        type="file"
        multiple={true}
        hidden={true}
        onChange={onUploadChange} />

        <OverlayTrigger
          key={'top'}
          placement={'top'}
          overlay={
            <Tooltip id={'tooltip-top'}>
              Upload documents
            </Tooltip>
          }>
          <Button variant="light"
            type="button"
            className='m-1'
            onClick={onClickProxyUpload}>
              <i className="bi bi-upload"></i>
          </Button>
        </OverlayTrigger>

    </>
  );
}

export default UploadButton;
