import { useState } from 'react';
import React from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import SubmitButton from 'components/submit_button';

type Args = {
  children: React.ReactNode;
  modal_title: string;
  submit_button_title?: string;
  onCancel: () => void;
  onSubmit: () => void;
}


const GenericModal = ({
  children,
  modal_title,
  submit_button_title,
  onCancel,
  onSubmit
}: Args) => {

  const [inProgress, setInProgress] = useState(false);

  const handleSubmit = async () => {
    setInProgress(true);
    await onSubmit();
    setInProgress(false);
  }

  const handleCancel = () => {
    onCancel();
    setInProgress(false);
  }

  return (
    <Modal
      show={true}
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
        <SubmitButton
          in_progress={inProgress}
          title={submit_button_title}
          onClick={handleSubmit} />
      </Modal.Footer>
    </Modal>
  );
}

export default GenericModal;
