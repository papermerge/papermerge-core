import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import { fetcher_post } from 'utils/fetcher';
import { uploader } from 'utils/uploader';


import type { FolderType, NodeType } from 'types';


type Args = {
  onCancel: () => void;
  onSubmit: () => void;
  show: boolean;
  source_files: FileList | undefined;
  target_folder: NodeType | null | undefined;
  onCreateDocumentNode: (nodes: NodeType[], target_id: string) => void;
}


const DropFilesModal = ({
  show,
  onCancel,
  onSubmit,
  source_files,
  target_folder,
  onCreateDocumentNode
}: Args) => {
  /*
    Used when user drag and drops files from local files system into the Commander.

    The files upload is performed async and notification (user feedback) is
    accomplished via "toasts" (notification messages in right lower corder of
    the screen). In other words "Upload files" screen closes immediately - it
    does not wait until all files are uploaded. User can go fancy and Upload 200
    files from some folder - it does not make any sense for the upload dialog to
    be open for until all those 200 files get uploaded.
  */
  const handleSubmit = async () => {
    let node_id = target_folder?.id;

    if (node_id) {
      if (source_files) {
        uploader({
          files: source_files,
          node_id: node_id,
          onCreateDocumentNode: onCreateDocumentNode
        });
      } else {
        console.error(`Empty source files list`);
      }
    } else {
      console.error(`Target folder ID is undefined`);
    }

    onSubmit();
  }

  const handleCancel = () => {
    onCancel();
    // recreate new controller for next time
  }

  let source_titles: Array<string> = [];
  let source_files_count = 0;

  if (source_files) {
    source_titles = [...source_files].map(n => n.name);
    source_files_count = [...source_files].length;
  }

  const target_title = target_folder?.title;

  return (
    <Modal
      show={show}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      animation={false}>
      <Modal.Header closeButton onClick={onCancel}>
        <Modal.Title id="contained-modal-title-vcenter">
          Upload {source_files_count} Files(s)
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to upload <span className='text-primary'>
          {source_titles.join(', ')}
        </span> to <span className='text-success'>{target_title}</span>?
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
        <Button variant='primary' onClick={handleSubmit}>Upload</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DropFilesModal;
