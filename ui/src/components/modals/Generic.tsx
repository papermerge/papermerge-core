import { useState } from 'react';
import React from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import LoadingButton from 'components/loading_button';


type Args = {
  children: React.ReactNode;
  modal_title: string;
  submit_button_title?: string;
  onCancel: () => void;
  onSubmit: (signal: AbortSignal) => void;
}


const GenericModal = ({
  children,
  modal_title,
  submit_button_title,
  onCancel,
  onSubmit
}: Args) => {
  const [show, setShow] = useState<boolean>(true);
  const [inProgress, setInProgress] = useState(false);
  const [controller, setController] = useState<AbortController>(new AbortController());

  if (!controller) {
    setController(new AbortController());
  }

  const handleSubmit = async () => {
    setInProgress(true);

    await onSubmit(controller.signal);

    setInProgress(false);
    setShow(false);
  }

  const handleCancel = () => {
    controller.abort();

    onCancel();

    setInProgress(false);
    setShow(false);
    setController(new AbortController());
  }

  return (
    <Modal
      show={show}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      animation={false}>
      <Modal.Header closeButton onClick={handleCancel}>
        <Modal.Title id="contained-modal-title-vcenter">
          {modal_title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {children}
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleCancel}>
            Cancel
        </Button>
        <LoadingButton
          in_progress={inProgress}
          title={submit_button_title}
          onClick={handleSubmit} />
      </Modal.Footer>
    </Modal>
  );
}

export default GenericModal;
