import {useState} from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';


type Args = {
  source_ids: Array<string>;
  target_id: string;
  onOK: (value: string) => void;
  onCancel: () => void;
}


const TransferNodesModal = ({source_ids, target_id, onOK, onCancel}: Args) => {
  const [show, setShow] = useState<boolean>(true);

  const onLocalCancel = () => {
    onCancel();
    setShow(false);
  }

  const onLocalOK = () => {
    onOK("Transfer complete!")
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
          Transfer?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure {`You want to transfer ${source_ids} to ${target_id}`}?
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onLocalCancel} variant='secondary'>Cancel</Button>
        <Button onClick={onLocalOK} variant='primary'>Yes, I am sure</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default TransferNodesModal;
