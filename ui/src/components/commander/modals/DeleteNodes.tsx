import { MODALS } from 'cconstants';
import { useState } from 'react';
import { createRoot } from "react-dom/client";

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import SpinnerButton from 'components/SpinnerButton';
import { fetcher_delete } from 'utils/fetcher';


type Args = {
  onCancel: () => void;
  onOK: (node_ids: string[]) => void;
  node_ids: string[];
}


async function api_delete_nodes(node_ids: string[]): Promise<string[]|Response> {
  return fetcher_delete<string[], string[]>('/api/nodes/', node_ids);
}


const DeleteNodesModal = ({onOK, onCancel, node_ids}: Args) => {
  const [show, setShow] = useState<boolean>(true);
  const [controller, setController] = useState<AbortController>(new AbortController());
  const [errorMessage, setErrorMessage] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  if (!controller) {
    setController(new AbortController());
  }

  const handleSubmit = async () => {
    setInProgress(true);
    setIsEnabled(false);

    let response = await api_delete_nodes(node_ids);
    onOK(node_ids);

    setShow(false);
  }

  const handleCancel = () => {
    setErrorMessage('');
    controller.abort();

    onCancel();

    setShow(false);
    setInProgress(false);
    setController(new AbortController());
  }

  return (
    <Modal
      show={show}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      animation={false}>
      <Modal.Header closeButton onClick={onCancel}>
        <Modal.Title id="contained-modal-title-vcenter">
          Delete Selected Nodes
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure?
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
        <SpinnerButton
          variant='danger'
          inProgress={inProgress}
          title={"Delete"}
          onClick={() => handleSubmit()} />
      </Modal.Footer>
    </Modal>
  );
}

function delete_nodes(node_ids: string[]) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<string[]>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <DeleteNodesModal
          node_ids={node_ids}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default delete_nodes;
