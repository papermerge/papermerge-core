import Button from 'react-bootstrap/Button';
import { uploader } from '@/utils/uploader';

import type { NodeType } from '@/types';

type Args = {
  node_id: string;
  onCreateDocumentNode: (node: NodeType[]) => void;
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

        <Button variant="light"
          type="button"
          onClick={onClickProxyUpload}>
            <i className="bi bi-upload"></i>
        </Button>
    </>
  );
}

export default UploadButton;