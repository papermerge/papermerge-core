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
  source_nodes: NodeType[];
  target_node: NodeType | undefined;
}

type MoveNodeType = {
  source_ids: string[];
  target_id: string | undefined;
}


async function move_nodes(
  source_nodes: NodeType[],
  target_node: NodeType | undefined,
  signal: AbortSignal
): Promise<string[]> {
  return fetcher_post<MoveNodeType, string[]>(
    '/api/nodes/move', {
      source_ids: source_nodes.map(node => node.id),
      target_id: target_node?.id
    },
    signal
  );
}


const DropNodesModal = ({
  show,
  onCancel,
  onSubmit,
  source_nodes,
  target_node
}: Args) => {
  const [inProgress, setInProgress] = useState(false);
  const [controller, setController] = useState<AbortController>(new AbortController());
  let submit_button: JSX.Element;

  if (!controller) {
    setController(new AbortController());
  }

  const handleSubmit = async () => {
    setInProgress(true);

    let response_data = await move_nodes(
      source_nodes,
      target_node,
      controller.signal
    );

    onSubmit(response_data);
    setInProgress(false);
  }

  const handleCancel = () => {
    controller.abort();
    setInProgress(false);
    onCancel();
    // recreate new controller for next time
    setController(new AbortController());
  }

  const source_titles = source_nodes.map(n => n.title);
  const target_title = target_node?.title;

  if (inProgress) {
    submit_button = <Button variant='primary'><Spinner size="sm" /></Button>;
  } else {
    submit_button = <Button variant='primary' onClick={handleSubmit}>Move</Button>;
  }

  return (
    <Modal
      show={show}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      animation={false}>
      <Modal.Header closeButton onClick={onCancel}>
        <Modal.Title id="contained-modal-title-vcenter">
          Move {source_nodes.length} Item(s)
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to move <span className='text-primary'>
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

export default DropNodesModal;
