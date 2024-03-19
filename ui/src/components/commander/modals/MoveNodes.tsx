import { createRoot } from "react-dom/client";
import { get_default_headers } from 'utils/fetcher';

import type { FolderType, MovedNodesType, NodeType } from 'types';
import { MODALS } from 'cconstants';
import GenericModal from 'components/modals/Generic';


type Args = {
  onCancel: (msg?: string) => void;
  onOK: (moved_nodes: MovedNodesType) => void;
  source_nodes: NodeType[];
  target_node: NodeType;
}


async function api_move_nodes(
  source_nodes: NodeType[],
  target_node: NodeType | FolderType | undefined | null,
  signal: AbortSignal
): Promise<Response> {
  return fetch(
    '/api/nodes/move',
    {
      'method': 'POST',
      'headers': get_default_headers(),
      'body': JSON.stringify({
        source_ids: source_nodes.map(node => node.id),
        target_id: target_node?.id
      }),
      'signal': signal
    },
  ).then(res => {
    if (res.status === 401) {
      throw Error(`${res.status} ${res.statusText}`);
    }
    return res;
  });
}


const MoveNodesModal = ({
  onCancel,
  onOK,
  source_nodes,
  target_node
}: Args) => {

  const handleSubmit = async (signal: AbortSignal) => {
    try{
      let response = await api_move_nodes(
        source_nodes,
        target_node,
        signal
      );

      await response.json();

      if (response.status == 200) {
        onOK({
          nodes: source_nodes,
          parent_id: target_node.id
        });
      }
    } catch (error: any) {
      onCancel(error.toString());
    }
  }

  const handleCancel = () => {
    onCancel();
  }

  const source_titles = source_nodes.map(n => n.title);
  const target_title = target_node.title;

  return (
    <GenericModal
      modal_title='Move Item(s)'
      submit_button_title='Upload'
      onSubmit={handleSubmit}
      onCancel={handleCancel}>
        Do you want to move <span className='text-primary'>
          {source_titles.join(', ')}
        </span> to <span className='text-success'>{target_title}</span>?
    </GenericModal>
  );
}

type MoveNodesArgs = {
  source_nodes: NodeType[];
  target_node: NodeType;
}


function move_nodes({source_nodes, target_node}: MoveNodesArgs) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<MovedNodesType>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <MoveNodesModal
          source_nodes={source_nodes}
          target_node={target_node}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default move_nodes;
