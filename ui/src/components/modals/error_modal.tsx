import React from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';


type Args = {
  onCancel: () => void;
  onSubmit: () => void;
  show: boolean;
  error: string | null;
}


const ErrorModal = ({show, onCancel, onSubmit, error}: Args) => {

  const handleSubmit = async () => {
    onSubmit();
  }

  const handleCancel = () => {
    onCancel();
  }

  return (
    <Modal
      show={show}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      animation={false}>
      <Modal.Header closeButton onClick={onCancel}>
        <Modal.Title id="contained-modal-title-vcenter" className='text-danger'>
          Error
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error}
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>OK</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ErrorModal;
