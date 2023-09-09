import { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Spinner } from 'react-bootstrap';

import { fetcher_post } from 'utils/fetcher';

import type { NodeType } from 'types';


type Args = {
  onCancel: () => void;
  onSubmit: (uuids_list: string[]) => void;
  show: boolean;
  source_files: FileList | undefined;
  target_node: NodeType | undefined;
}


const DropFilesModal = ({
  show,
  onCancel,
  onSubmit,
  source_files,
  target_node
}: Args) => {

  /*
    Used when user drag and drops files from local files system into the Commander
  */

  const [inProgress, setInProgress] = useState(false);
  const [controller, setController] = useState<AbortController>(new AbortController());
  let submit_button: JSX.Element;

  if (!controller) {
    setController(new AbortController());
  }

  const handleSubmit = async () => {
    setInProgress(true);
    // add code here
    setInProgress(false);
  }

  const handleCancel = () => {
    controller.abort();
    setInProgress(false);
    onCancel();
    // recreate new controller for next time
    setController(new AbortController());
  }

  let source_titles: Array<string> = [];
  let source_files_count = 0;

  if (source_files) {
    source_titles = [...source_files].map(n => n.name);
    source_files_count = [...source_files].length;
  }

  const target_title = target_node?.title;

  if (inProgress) {
    submit_button = <Button variant='primary'><Spinner size="sm" /></Button>;
  } else {
    submit_button = <Button variant='primary' onClick={handleSubmit}>Upload</Button>;
  }

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
        {submit_button}
      </Modal.Footer>
    </Modal>
  );
}

export default DropFilesModal;
