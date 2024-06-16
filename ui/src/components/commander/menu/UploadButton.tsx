import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';
import drop_files from '../modals/DropFiles';

import { OverlayTrigger } from 'react-bootstrap';
import { CreatedNodesType, FolderType } from 'types';

type Args = {
  target: FolderType;
  onCreatedNodesByUpload: (created_nodes: CreatedNodesType) => void;
}

function UploadButton({target, onCreatedNodesByUpload}: Args) {

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

    drop_files({
      source_files: files,
      target: target
    }).then(
      (created_nodes: CreatedNodesType) => {
        onCreatedNodesByUpload(created_nodes);
      }
    );
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
