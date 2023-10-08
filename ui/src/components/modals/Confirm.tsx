import {useState} from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';


type Args = {
  onOK: (value: string) => void;
  onCancel: () => void;
}


const ConfirmModal = ({onOK, onCancel}: Args) => {
  const [show, setShow] = useState<boolean>(true);

  const onLocalCancel = () => {
    onCancel();
    setShow(false);
  }

  const onLocalOK = () => {
    onOK("OK was pressed!!!")
    setShow(false);
  }

  return (
    <Modal
      show={show}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      animation={false}>
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Confirm
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure?
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onLocalCancel} variant='secondary'>Cancel</Button>
        <Button onClick={onLocalOK} variant='danger'>Yes, I am sure</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmModal;
